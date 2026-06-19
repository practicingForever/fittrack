-- =============================================================================
-- Junction table so an exercise can target multiple muscle groups.
-- The primary group stays in exercises.muscle_group_id (used for library
-- grouping). This table stores ALL associations (including the primary).
-- =============================================================================

create table exercise_muscle_groups (
  exercise_id     uuid not null references exercises(id)      on delete cascade,
  muscle_group_id uuid not null references muscle_groups(id)  on delete cascade,
  primary key (exercise_id, muscle_group_id)
);

create index on exercise_muscle_groups(exercise_id);
create index on exercise_muscle_groups(muscle_group_id);

alter table exercise_muscle_groups enable row level security;

-- Readable if the parent exercise is readable
create policy "emg_select" on exercise_muscle_groups
  for select using (
    exists (
      select 1 from exercises e
      where e.id = exercise_id
        and (
          e.owner_id is null
          or e.owner_id = (select auth.uid())
          or e.visibility = 'shared'
        )
    )
  );

-- Only the exercise owner can add/remove muscle group tags
create policy "emg_insert" on exercise_muscle_groups
  for insert with check (
    exists (
      select 1 from exercises e
      where e.id = exercise_id
        and e.owner_id = (select auth.uid())
    )
  );

create policy "emg_delete" on exercise_muscle_groups
  for delete using (
    exists (
      select 1 from exercises e
      where e.id = exercise_id
        and e.owner_id = (select auth.uid())
    )
  );

-- Migrate existing single muscle_group_id into the junction table
insert into exercise_muscle_groups (exercise_id, muscle_group_id)
select id, muscle_group_id
from exercises
where muscle_group_id is not null
on conflict do nothing;
