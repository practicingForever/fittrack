-- =============================================================================
-- FitTrack — initial schema
-- Two-user fitness PWA: lifting + cardio + WODs, offline-first, shared feed.
--
-- Conventions (per current Supabase guidance):
--   * RLS enabled on every table, paired with policies in the same migration.
--   * Granular policies: separate select/insert/update/delete, per role.
--   * auth.uid() wrapped as (select auth.uid()) so the optimizer caches it
--     via an initPlan instead of re-evaluating per row.
--   * An index exists on every column referenced by a policy.
--   * All weights stored in kilograms; unit is a display preference only.
--   * All ids are client-generatable uuids so offline rows have stable keys.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type weight_unit  as enum ('kg', 'lbs');
create type pace_unit    as enum ('mile', 'km');
create type exercise_cat as enum ('strength', 'running', 'rowing');
create type set_side     as enum ('both', 'left', 'right', 'alternating');
create type set_type     as enum ('warmup', 'working', 'dropset', 'failure');
create type cardio_mode  as enum ('running', 'rowing');
create type wod_type     as enum ('amrap', 'emom', 'for_time', 'tabata');
create type connection_status as enum ('pending', 'accepted');

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  unit_pref    weight_unit not null default 'kg',
  pace_pref    pace_unit   not null default 'mile',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table profiles enable row level security;

-- Both users may read any profile (needed for the shared feed / leaderboard).
create policy "profiles_select_all"
  on profiles for select to authenticated
  using (true);

create policy "profiles_insert_own"
  on profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- (No delete policy: profiles are removed via auth.users cascade only.)

-- ---------------------------------------------------------------------------
-- connections  (mutual follow between the two users)
-- ---------------------------------------------------------------------------
create table connections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  friend_id  uuid not null references profiles (id) on delete cascade,
  status     connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

create index connections_user_id_idx   on connections (user_id);
create index connections_friend_id_idx on connections (friend_id);

alter table connections enable row level security;

create policy "connections_select_involved"
  on connections for select to authenticated
  using ((select auth.uid()) in (user_id, friend_id));

create policy "connections_insert_own"
  on connections for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "connections_update_involved"
  on connections for update to authenticated
  using ((select auth.uid()) in (user_id, friend_id))
  with check ((select auth.uid()) in (user_id, friend_id));

create policy "connections_delete_own"
  on connections for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- exercises  (per-user library; owner_id null = global seed, read by all)
-- ---------------------------------------------------------------------------
create table exercises (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references profiles (id) on delete cascade,
  name          text not null,
  category      exercise_cat not null,
  muscle_group  text,
  is_unilateral boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index exercises_owner_id_idx on exercises (owner_id);
create index exercises_category_idx on exercises (category);

alter table exercises enable row level security;

-- Read your own exercises plus the global (owner_id is null) seed library.
create policy "exercises_select_own_or_global"
  on exercises for select to authenticated
  using (owner_id is null or (select auth.uid()) = owner_id);

create policy "exercises_insert_own"
  on exercises for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "exercises_update_own"
  on exercises for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "exercises_delete_own"
  on exercises for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------------------------
-- workouts  (session container for lifting, cardio, and WOD work)
-- ---------------------------------------------------------------------------
create table workouts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references profiles (id) on delete cascade,
  title                text not null default '',
  started_at           timestamptz not null default now(),
  ended_at             timestamptz,
  planned_duration_min integer,
  session_grade        numeric(5,2),          -- 0-100, computed on finish
  session_letter       text,                  -- 'A+', 'B', ...
  notes                text,
  is_shared            boolean not null default true,
  updated_at           timestamptz not null default now()
);

create index workouts_user_id_idx    on workouts (user_id);
create index workouts_started_at_idx on workouts (started_at desc);

alter table workouts enable row level security;

-- See your own workouts, plus shared workouts of users you're connected to.
create policy "workouts_select_own_or_shared"
  on workouts for select to authenticated
  using (
    (select auth.uid()) = user_id
    or (
      is_shared
      and exists (
        select 1 from connections c
        where c.status = 'accepted'
          and c.friend_id = (select auth.uid())
          and c.user_id  = workouts.user_id
      )
    )
  );

create policy "workouts_insert_own"
  on workouts for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "workouts_update_own"
  on workouts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "workouts_delete_own"
  on workouts for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- wods  (a timed block inside a workout; timer config only, no own score)
-- Movements done during the WOD are logged as normal strength/cardio sets
-- and linked back via their wod_id, so they flow into existing analytics.
-- ---------------------------------------------------------------------------
create table wods (
  id              uuid primary key default gen_random_uuid(),
  workout_id      uuid not null references workouts (id) on delete cascade,
  type            wod_type not null,
  title           text not null default '',
  -- Generic timer config; meaning depends on type:
  --   amrap     -> total_seconds = cap
  --   for_time  -> total_seconds = cap (optional); records elapsed in result_seconds
  --   emom      -> interval_seconds + rounds
  --   tabata    -> work_seconds + rest_seconds + rounds (classic 20/10 x 8)
  total_seconds   integer,
  interval_seconds integer,
  work_seconds    integer,
  rest_seconds    integer,
  rounds          integer,
  result_seconds  integer,   -- for_time finish time, entered after the timer
  result_rounds   integer,   -- amrap rounds completed, entered after the timer
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index wods_workout_id_idx on wods (workout_id);

alter table wods enable row level security;

-- WOD visibility follows its parent workout's visibility.
create policy "wods_select_via_workout"
  on wods for select to authenticated
  using (exists (
    select 1 from workouts w
    where w.id = wods.workout_id
      and (
        w.user_id = (select auth.uid())
        or (w.is_shared and exists (
          select 1 from connections c
          where c.status = 'accepted'
            and c.friend_id = (select auth.uid())
            and c.user_id  = w.user_id
        ))
      )
  ));

create policy "wods_insert_via_own_workout"
  on wods for insert to authenticated
  with check (exists (
    select 1 from workouts w
    where w.id = wods.workout_id and w.user_id = (select auth.uid())
  ));

create policy "wods_update_via_own_workout"
  on wods for update to authenticated
  using (exists (
    select 1 from workouts w
    where w.id = wods.workout_id and w.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from workouts w
    where w.id = wods.workout_id and w.user_id = (select auth.uid())
  ));

create policy "wods_delete_via_own_workout"
  on wods for delete to authenticated
  using (exists (
    select 1 from workouts w
    where w.id = wods.workout_id and w.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- strength_sets
-- ---------------------------------------------------------------------------
create table strength_sets (
  id           uuid primary key default gen_random_uuid(),
  workout_id   uuid not null references workouts (id) on delete cascade,
  exercise_id  uuid not null references exercises (id),
  wod_id       uuid references wods (id) on delete set null,
  set_index    integer not null,
  weight_kg    numeric(7,2) not null,        -- always stored in kg
  reps         integer not null,
  side         set_side not null default 'both',
  type         set_type not null default 'working',
  effort_score numeric(5,2),                 -- 0-100, computed on save
  logged_at    timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index strength_sets_workout_id_idx  on strength_sets (workout_id);
create index strength_sets_exercise_id_idx on strength_sets (exercise_id);
create index strength_sets_wod_id_idx       on strength_sets (wod_id);
-- Composite supports the "history for this exercise at this set index" query
-- that drives the instant effort score.
create index strength_sets_exercise_setidx_idx
  on strength_sets (exercise_id, set_index, logged_at desc);

alter table strength_sets enable row level security;

create policy "strength_sets_select_via_workout"
  on strength_sets for select to authenticated
  using (exists (
    select 1 from workouts w
    where w.id = strength_sets.workout_id
      and (
        w.user_id = (select auth.uid())
        or (w.is_shared and exists (
          select 1 from connections c
          where c.status = 'accepted'
            and c.friend_id = (select auth.uid())
            and c.user_id  = w.user_id
        ))
      )
  ));

create policy "strength_sets_insert_via_own_workout"
  on strength_sets for insert to authenticated
  with check (exists (
    select 1 from workouts w
    where w.id = strength_sets.workout_id and w.user_id = (select auth.uid())
  ));

create policy "strength_sets_update_via_own_workout"
  on strength_sets for update to authenticated
  using (exists (
    select 1 from workouts w
    where w.id = strength_sets.workout_id and w.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from workouts w
    where w.id = strength_sets.workout_id and w.user_id = (select auth.uid())
  ));

create policy "strength_sets_delete_via_own_workout"
  on strength_sets for delete to authenticated
  using (exists (
    select 1 from workouts w
    where w.id = strength_sets.workout_id and w.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- cardio_sets
-- ---------------------------------------------------------------------------
create table cardio_sets (
  id                uuid primary key default gen_random_uuid(),
  workout_id        uuid not null references workouts (id) on delete cascade,
  exercise_id       uuid references exercises (id),
  wod_id            uuid references wods (id) on delete set null,
  mode              cardio_mode not null,
  distance          numeric(9,2),
  distance_unit     text,                     -- 'mi' | 'km' | 'm'
  duration_sec      integer,
  -- running
  pace_sec_per_unit numeric(7,2),             -- derived, stored for charts
  route_notes       text,
  -- rowing
  split_sec_per_500 numeric(7,2),
  stroke_rate       integer,                  -- SPM
  effort_score      numeric(5,2),
  logged_at         timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index cardio_sets_workout_id_idx  on cardio_sets (workout_id);
create index cardio_sets_exercise_id_idx on cardio_sets (exercise_id);
create index cardio_sets_wod_id_idx       on cardio_sets (wod_id);
create index cardio_sets_mode_logged_idx  on cardio_sets (mode, logged_at desc);

alter table cardio_sets enable row level security;

create policy "cardio_sets_select_via_workout"
  on cardio_sets for select to authenticated
  using (exists (
    select 1 from workouts w
    where w.id = cardio_sets.workout_id
      and (
        w.user_id = (select auth.uid())
        or (w.is_shared and exists (
          select 1 from connections c
          where c.status = 'accepted'
            and c.friend_id = (select auth.uid())
            and c.user_id  = w.user_id
        ))
      )
  ));

create policy "cardio_sets_insert_via_own_workout"
  on cardio_sets for insert to authenticated
  with check (exists (
    select 1 from workouts w
    where w.id = cardio_sets.workout_id and w.user_id = (select auth.uid())
  ));

create policy "cardio_sets_update_via_own_workout"
  on cardio_sets for update to authenticated
  using (exists (
    select 1 from workouts w
    where w.id = cardio_sets.workout_id and w.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from workouts w
    where w.id = cardio_sets.workout_id and w.user_id = (select auth.uid())
  ));

create policy "cardio_sets_delete_via_own_workout"
  on cardio_sets for delete to authenticated
  using (exists (
    select 1 from workouts w
    where w.id = cardio_sets.workout_id and w.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- updated_at maintenance + profile auto-creation
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at      before update on profiles      for each row execute function set_updated_at();
create trigger exercises_set_updated_at     before update on exercises     for each row execute function set_updated_at();
create trigger workouts_set_updated_at      before update on workouts      for each row execute function set_updated_at();
create trigger wods_set_updated_at          before update on wods          for each row execute function set_updated_at();
create trigger strength_sets_set_updated_at before update on strength_sets for each row execute function set_updated_at();
create trigger cardio_sets_set_updated_at   before update on cardio_sets   for each row execute function set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
