# FitTrack — build spec for Claude Code

This file is the source of truth for the project. Read it fully before writing
code. The database schema is already designed and lives in
`supabase/migrations/0001_init.sql` — treat it as fixed unless a task explicitly
says to change it.

## What we're building
A mobile-first, offline-first fitness tracking PWA for **two users** (Kartik and
Nat). It tracks strength lifting, cardio (running + rowing), and CrossFit-style
WOD timers. It gives an instant per-set effort score, an end-of-workout session
grade, a searchable/filterable exercise library, charts, a shared activity feed,
and a private leaderboard.

## Non-negotiable constraints
- **Offline-first.** Logging a set must work with zero connectivity. IndexedDB
  (via Dexie) is the local source of truth; Supabase is the sync target.
- **Client-generated UUIDs** for every row, so offline rows have stable keys and
  merge cleanly. Never rely on DB-generated ids on the client path.
- **All weights stored in kilograms.** Unit (kg/lbs) is a display preference only;
  convert at render time, never in storage.
- **Mobile-native feel.** Bottom nav, swipe-up bottom sheets for data entry,
  large thumb-friendly targets, dark-mode-first, fluid animation.
- **Two weights of type, sentence case, no clutter.** Premium minimal aesthetic.

## Tech stack (use exactly this unless a task says otherwise)
- Vite + React + TypeScript
- Tailwind CSS for styling
- Framer Motion for gestures / bottom sheets / transitions
- `vite-plugin-pwa` (Workbox) for the installable PWA + service worker
- Dexie.js for IndexedDB + a custom sync queue
- `@supabase/supabase-js` for auth, Postgres, Realtime
- Recharts for charts
- TanStack Query is acceptable for server-state caching if helpful

## Data model (already migrated — see supabase/migrations/0001_init.sql)
- `profiles` — one per auth user; `unit_pref`, `pace_pref`.
- `connections` — mutual follow between the two users; powers feed + leaderboard.
- `muscle_groups` — lookup for the category dropdown. Ships with presets
  (Chest, Back, Legs, …); either user can add custom groups visible to both.
  Presets cannot be edited/deleted.
- `exercises` — the library. Categorised by `category`
  (`strength` | `running` | `rowing`) and `muscle_group_id`. Three-way
  `visibility` (`private` | `shared`): a private exercise belongs to one user's
  library (Kartik's or Nat's); a shared exercise appears in the Shared library
  for both. Only the owner may edit/delete, even when shared.
- `workouts` — session container; holds computed `session_grade` + `session_letter`.
- `wods` — a timed block inside a workout. Timer config only; it does NOT compute
  its own score. Movements performed during a WOD are logged as normal
  `strength_sets` / `cardio_sets` linked back via `wod_id`, so they flow into the
  same analytics. Types: AMRAP, EMOM, For Time, Tabata. See `docs/wod-timers.md`.
- `strength_sets` — `weight_kg`, `reps`, `side`
  (`both`|`left`|`right`|`alternating` for unilateral work), `type`
  (`warmup`|`working`|`dropset`|`failure` — analytics ignore warm-ups),
  `set_index`, and an `effort_score`.
- `cardio_sets` — running (distance, duration, pace, route notes) and rowing
  (distance m, duration, split /500m, stroke rate SPM), plus an `effort_score`.

RLS is enabled on every table with granular per-operation policies. Do not
disable RLS. When adding tables, follow the same pattern: enable RLS + add
policies in the same migration, index every policy-referenced column, and wrap
`auth.uid()` as `(select auth.uid())`.

## Scoring (implement in `src/lib/scoring.ts`, pure functions, unit-tested)
### Set effort score (0–100), computed instantly on save
Compare this set's volume against the user's rolling history for the SAME
exercise at the SAME set index (so set 4 is judged vs past set 4s).
```
volume   = weight_kg * reps
hist_avg = mean of volume for (exercise_id, set_index), last N=10 working sets
hist_std = std dev of that same population
z        = (volume - hist_avg) / max(hist_std, epsilon)
raw      = 50 + 18 * z                      // 50 = exactly average
intensity_mult = 1 + 0.05*(type=='failure') + 0.03*(reps in 5..12)
effort   = clamp(raw * intensity_mult, 1, 100)
```
First-ever log of an exercise (no history) => default 50, flagged as baseline.
Warm-up sets are scored but excluded from session aggregation.

### Session grade (0–100 + letter), computed on Finish Workout
Weighted blend of four 0–100 components:
```
V = volume      = clamp(50 + 18*z_session_volume, 0, 100)
E = effort      = mean(effort_score) over WORKING sets only
C = cardio      = clamp(50 + 18*z_pace_improvement, 0, 100)  // faster = higher
K = consistency = 100 - min(|actual_min - planned_min|, 40) * 2.5

cardio session : 0.35*V + 0.35*E + 0.15*C + 0.15*K
lifting only   : 0.45*V + 0.40*E + 0.15*K   // redistribute C's weight
```
Letters: A+ >=95, A >=90, A- >=87, B+ >=83, B >=80, … F <60.
With <10 sessions of history, hide the letter and show "Building baseline…".

## Offline sync strategy
- Dexie mirrors `workouts`, `wods`, `strength_sets`, `cardio_sets`, `exercises`,
  `muscle_groups`. Writes hit Dexie first; UI never blocks on network.
- A `sync_queue` Dexie table records pending mutations (op, table, payload, ts).
- Flush the queue to Supabase on `online` + `visibilitychange`; last-write-wins
  keyed on `updated_at` (single-writer per row makes conflicts near-impossible).
- Service worker: cache-first app shell, stale-while-revalidate for GETs.

## App structure (suggested)
```
src/
  lib/        supabase client, dexie db, sync queue, scoring, unit conversion
  features/
    auth/         sign in / sign up
    library/      exercise picker (searchable + category/library filter) + manager
    workout/      active session, set logger (ghost text), bottom sheets
    wod/          AMRAP / EMOM / For Time / Tabata timers (persistent bottom bar)
    dashboard/    search-to-graph, volume + cardio trends, streak/contribution
    feed/         shared activity feed + private leaderboard
  components/  shared UI (bottom sheet, number pad, nav bar, timer bar)
```

## Build order (do these as discrete tasks, smallest shippable first)
1. Project scaffold: Vite + React + TS + Tailwind + PWA manifest + service worker.
2. Supabase client + Dexie schema + sync queue (no UI yet; prove a round-trip).
3. Auth (two accounts) + profile bootstrap.
4. Exercise library: picker (searchable, filter by category + library tab) and a
   manager screen to add custom exercises + custom muscle groups.
5. Active workout + strength set logger with ghost-text previous-set placeholders.
6. Instant set effort score (wire `scoring.ts`, animate the result in).
7. Cardio logging (running + rowing modes).
8. WOD timers (all four) with a persistent bottom-bar timer.
9. Rest timer (auto-start after a set, local notification at zero).
10. Dashboard: exercise search -> effort/progression graph; volume + cardio trends.
11. Consistency streak / contribution graph.
12. Shared feed + private leaderboard (Realtime), last.

## Coding conventions
- TypeScript strict. No `any` without a comment justifying it.
- Pure logic (scoring, unit conversion, sync) lives in `src/lib` and is unit-tested
  with Vitest. UI components stay thin.
- Keep secrets in `.env` (see `.env.example`); never commit real keys.
- Conventional Commits. Each numbered task above is roughly one PR.
