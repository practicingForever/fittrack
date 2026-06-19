# WOD timers — behavior spec

WODs are **timer + logging containers**. The timer governs the clock; the
actual movements are logged as normal `strength_sets` / `cardio_sets` rows
linked back to the WOD via `wod_id`. The WOD itself does not compute its own
score — the logged sets carry effort scores and flow into existing analytics.

A WOD row stores only timer configuration plus an optional manually-entered
result. The four supported types and the columns they use:

## AMRAP — "As Many Rounds As Possible"
A countdown from a fixed cap; athlete repeats a circuit until time expires.
- `total_seconds` — the cap (e.g. 1200 for a 20-min AMRAP).
- After finishing, the athlete enters `result_rounds` (+ optional partial
  reps in `notes`).
- UI: large countdown, audible/vibration cue at 0. A "round" tap counter is
  convenience only; the authoritative log is the sets entered afterward.

## EMOM — "Every Minute On the Minute"
Repeating intervals; a new round starts each interval boundary.
- `interval_seconds` — usually 60.
- `rounds` — number of intervals (e.g. 10 for a 10-min EMOM).
- UI: per-interval countdown that resets and increments a round badge; a
  distinct beep at each boundary.

## For Time
Count **up** to completion; the elapsed time is the score. Optional cap.
- `total_seconds` — optional cap (stop if exceeded).
- `result_seconds` — the finish time, captured when the athlete taps "Done".
- UI: stopwatch (counts up), big "Done" button that freezes and stores elapsed.

## Tabata
Alternating work/rest intervals for a set number of rounds (classic 20s work
/ 10s rest x 8 = 4 min).
- `work_seconds` (default 20), `rest_seconds` (default 10), `rounds` (default 8).
- UI: two-color phase indicator (work vs rest), countdown within each phase,
  round badge. Distinct tones for work-start and rest-start.

## Client implementation notes
- Drive timers off `performance.now()` deltas against a stored start timestamp,
  not `setInterval` tick-counting — intervals drift and pause when the tab is
  backgrounded. Recompute remaining time from wall-clock on each frame.
- Keep the timer state in a persistent bottom bar (see rest-timer pattern) so
  it survives navigation and app-switching; fire a local notification on phase
  boundaries and at zero.
- All timer config is integer seconds, so it serialises cleanly into the
  offline sync queue alongside the rest of the workout.
