-- Seed: global exercise library (owner_id null => readable by all users).
-- Muscle groups are resolved by name from the muscle_groups lookup table,
-- so this must run AFTER 0001_init.sql (which seeds the preset groups).
-- Safe to run once on a fresh project.

insert into exercises (owner_id, name, category, muscle_group_id, is_unilateral, visibility)
select null, v.name, v.category::exercise_cat, mg.id, v.is_unilateral, 'shared'::exercise_visibility
from (values
  ('Bench Press',            'strength', 'Chest',      false),
  ('Incline Dumbbell Press', 'strength', 'Chest',      false),
  ('Back Squat',             'strength', 'Legs',       false),
  ('Front Squat',            'strength', 'Legs',       false),
  ('Bulgarian Split Squat',  'strength', 'Legs',       true),
  ('Deadlift',               'strength', 'Back',       false),
  ('Pull-up',                'strength', 'Back',       false),
  ('Bent-over Row',          'strength', 'Back',       false),
  ('Single-arm DB Row',      'strength', 'Back',       true),
  ('Overhead Press',         'strength', 'Shoulders',  false),
  ('Lateral Raise',          'strength', 'Shoulders',  false),
  ('Barbell Curl',           'strength', 'Arms',       false),
  ('Tricep Pushdown',        'strength', 'Arms',       false),
  ('Walking Lunge',          'strength', 'Legs',       true),
  ('Thruster',               'strength', 'Legs',       false),
  ('Running',                'running',  'Cardio',     false),
  ('Rowing',                 'rowing',   'Cardio',     false)
) as v(name, category, muscle_group_name, is_unilateral)
left join muscle_groups mg on mg.name = v.muscle_group_name
on conflict do nothing;
