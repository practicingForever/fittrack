# FitTrack

A mobile-first, offline-first fitness tracking PWA for two users — lifting,
cardio (running + rowing), and CrossFit-style WOD timers — with instant set
effort scores, end-of-workout session grades, a shared activity feed, and a
private leaderboard.

## Stack
- **Frontend:** Vite + React + TypeScript, Tailwind CSS, Framer Motion
- **PWA:** vite-plugin-pwa (Workbox) — installable, offline app shell
- **Offline store:** Dexie.js (IndexedDB) as local source of truth + sync queue
- **Backend:** Supabase (Postgres, Auth, Realtime, Row Level Security)
- **Charts:** Recharts

## Repository layout
```
supabase/
  migrations/0001_init.sql   # schema, RLS, indexes, triggers
  seed.sql                   # global exercise library
docs/
  wod-timers.md              # AMRAP / EMOM / For Time / Tabata spec
```

## Database setup
Using the Supabase CLI:
```bash
supabase db push           # applies migrations/0001_init.sql
psql "$DATABASE_URL" -f supabase/seed.sql   # optional global exercises
```
Or paste the migration into the Supabase dashboard SQL editor.

### Data model at a glance
- `profiles` — one per auth user; unit + pace display prefs.
- `connections` — mutual follow between the two users (powers feed/leaderboard).
- `exercises` — per-user library; `owner_id` null rows are the shared seed set.
- `workouts` — session container; holds the computed `session_grade`.
- `wods` — a timed block inside a workout (timer config only, no own score).
- `strength_sets` / `cardio_sets` — individual logged sets, each with an
  `effort_score`; optionally linked to a `wod_id`.

All weights are stored in **kilograms**; unit is display-only. All ids are
client-generatable uuids so offline rows have stable keys and merge cleanly.

## Scoring
- **Set effort score (0–100):** z-score of this set's volume vs the user's
  rolling history for the *same exercise at the same set index*, squashed to
  0–100 and nudged by set type and rep range.
- **Session grade:** weighted blend of session-volume z, mean working-set
  effort, cardio pace-improvement z, and a consistency bonus → 0–100 + letter.

## Pushing to GitHub
This is already a local git repo with an initial commit. To create the remote
and push (run these yourself — they need your GitHub auth):
```bash
# Option A: GitHub CLI
gh repo create fittrack --private --source=. --remote=origin --push

# Option B: manual — create an empty repo named "fittrack" on github.com first
git remote add origin https://github.com/<your-username>/fittrack.git
git branch -M main
git push -u origin main
```
