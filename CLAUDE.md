# CLAUDE.md

Project context for Claude Code. Read `docs/BUILD_SPEC.md` in full before
starting any task — it is the source of truth.

## Quick facts
- FitTrack: a two-user, offline-first, mobile-first fitness PWA.
- Stack: Vite + React + TS, Tailwind, Framer Motion, vite-plugin-pwa (Workbox),
  Dexie (IndexedDB), @supabase/supabase-js, Recharts.
- The database schema is already designed in `supabase/migrations/0001_init.sql`.
  Treat it as fixed unless the task explicitly says to migrate it. If you do
  change it, add a new `000N_*.sql` migration — never edit `0001_init.sql`.

## Hard rules
- Offline-first: logging a set works with no network. Dexie is the local source
  of truth; Supabase is the sync target.
- Client-generated UUIDs for every row.
- Store all weights in kilograms; convert for display only.
- RLS stays enabled. New tables get RLS + policies in the same migration, an
  index on every policy-referenced column, and `(select auth.uid())` wrapping.
- TypeScript strict; pure logic in `src/lib` with Vitest tests; thin UI.
- Sentence case in UI. Dark-mode-first. Bottom nav + bottom-sheet data entry.

## Before you start a feature
1. Re-read the relevant section of `docs/BUILD_SPEC.md`.
2. Follow the build order in that file unless told otherwise.
3. Keep each numbered build-order item to roughly one focused change/PR.

## Commands (once scaffolded)
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run test` — Vitest
- `supabase db push` — apply migrations to the linked project
