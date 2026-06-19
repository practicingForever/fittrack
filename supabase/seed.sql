-- Seed: global exercise library (owner_id null => readable by all users).
-- Safe to run once on a fresh project. Idempotent on name+category.

insert into exercises (owner_id, name, category, muscle_group, is_unilateral)
values
  (null, 'Bench Press',            'strength', 'chest',     false),
  (null, 'Incline Dumbbell Press', 'strength', 'chest',     false),
  (null, 'Back Squat',             'strength', 'legs',      false),
  (null, 'Front Squat',            'strength', 'legs',      false),
  (null, 'Bulgarian Split Squat',  'strength', 'legs',      true),
  (null, 'Deadlift',               'strength', 'back',      false),
  (null, 'Pull-up',                'strength', 'back',      false),
  (null, 'Bent-over Row',          'strength', 'back',      false),
  (null, 'Single-arm DB Row',      'strength', 'back',      true),
  (null, 'Overhead Press',         'strength', 'shoulders', false),
  (null, 'Lateral Raise',          'strength', 'shoulders', false),
  (null, 'Barbell Curl',           'strength', 'arms',      false),
  (null, 'Tricep Pushdown',        'strength', 'arms',      false),
  (null, 'Walking Lunge',          'strength', 'legs',      true),
  (null, 'Thruster',               'strength', 'legs',      false),
  (null, 'Running',                'running',  null,        false),
  (null, 'Rowing',                 'rowing',   null,        false)
on conflict do nothing;
