-- =============================================================================
-- Seed preset muscle groups and exercises.
-- owner_id = null → global preset, visible to all authenticated users
-- (RLS policy: exercises_select_own_shared_or_global allows owner_id is null)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Additional muscle groups
-- ---------------------------------------------------------------------------
insert into muscle_groups (name, is_preset, sort_order) values
  ('Biceps',        true, 51),
  ('Triceps',       true, 52),
  ('Olympic lifts', true, 83),
  ('Gymnastics',    true, 84),
  ('Conditioning',  true, 86)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Preset exercises
-- Uses a lateral join on muscle_group name so IDs don't need to be hard-coded.
-- The WHERE NOT EXISTS guard makes this migration idempotent.
-- ---------------------------------------------------------------------------
insert into exercises (id, owner_id, name, category, muscle_group_id, is_unilateral, visibility)
select
  gen_random_uuid(),
  null,
  e.name,
  e.cat::exercise_cat,
  mg.id,
  e.uni,
  'shared'::exercise_visibility
from (values
  -- ── Chest ────────────────────────────────────────────────────────────────
  ('Bench press',                'strength', 'Chest',        false),
  ('Incline bench press',        'strength', 'Chest',        false),
  ('Decline bench press',        'strength', 'Chest',        false),
  ('Dumbbell fly',               'strength', 'Chest',        false),
  ('Incline dumbbell press',     'strength', 'Chest',        false),
  ('Cable fly',                  'strength', 'Chest',        false),
  ('Single-arm cable fly',       'strength', 'Chest',        true),
  ('Chest dip',                  'strength', 'Chest',        false),
  ('Push-up',                    'strength', 'Chest',        false),
  ('Diamond push-up',            'strength', 'Chest',        false),
  ('Wide push-up',               'strength', 'Chest',        false),
  ('Narrow push-up',             'strength', 'Chest',        false),
  ('Pec deck',                   'strength', 'Chest',        false),
  ('Machine chest press',        'strength', 'Chest',        false),

  -- ── Back ─────────────────────────────────────────────────────────────────
  ('Deadlift',                   'strength', 'Back',         false),
  ('Pull-up',                    'strength', 'Back',         false),
  ('Lat pulldown',               'strength', 'Back',         false),
  ('Bent-over barbell row',      'strength', 'Back',         false),
  ('Single-arm dumbbell row',    'strength', 'Back',         true),
  ('Seated cable row',           'strength', 'Back',         false),
  ('Face pull',                  'strength', 'Back',         false),
  ('T-bar row',                  'strength', 'Back',         false),
  ('Back extension',             'strength', 'Back',         false),
  ('Barbell shrug',              'strength', 'Back',         false),

  -- ── Shoulders ────────────────────────────────────────────────────────────
  ('Overhead press',             'strength', 'Shoulders',    false),
  ('Dumbbell shoulder press',    'strength', 'Shoulders',    false),
  ('Lateral raise',              'strength', 'Shoulders',    true),
  ('Front raise',                'strength', 'Shoulders',    true),
  ('Rear delt fly',              'strength', 'Shoulders',    true),
  ('Arnold press',               'strength', 'Shoulders',    false),
  ('Cable lateral raise',        'strength', 'Shoulders',    true),
  ('Machine shoulder press',     'strength', 'Shoulders',    false),

  -- ── Biceps ───────────────────────────────────────────────────────────────
  ('Barbell curl',               'strength', 'Biceps',       false),
  ('Dumbbell curl',              'strength', 'Biceps',       true),
  ('Hammer curl',                'strength', 'Biceps',       true),
  ('Preacher curl',              'strength', 'Biceps',       false),
  ('Cable curl',                 'strength', 'Biceps',       true),
  ('Concentration curl',         'strength', 'Biceps',       true),
  ('Incline dumbbell curl',      'strength', 'Biceps',       true),

  -- ── Triceps ──────────────────────────────────────────────────────────────
  ('Tricep pushdown',            'strength', 'Triceps',      false),
  ('Single-arm tricep pushdown', 'strength', 'Triceps',      true),
  ('Skull crusher',              'strength', 'Triceps',      false),
  ('Overhead tricep extension',  'strength', 'Triceps',      false),
  ('Close-grip bench press',     'strength', 'Triceps',      false),
  ('Tricep dip',                 'strength', 'Triceps',      false),

  -- ── Legs ─────────────────────────────────────────────────────────────────
  ('Barbell squat',              'strength', 'Legs',         false),
  ('Goblet squat',               'strength', 'Legs',         false),
  ('Hack squat',                 'strength', 'Legs',         false),
  ('Leg press',                  'strength', 'Legs',         false),
  ('Romanian deadlift',          'strength', 'Legs',         false),
  ('Single-leg Romanian deadlift','strength','Legs',         true),
  ('Leg curl',                   'strength', 'Legs',         false),
  ('Leg extension',              'strength', 'Legs',         false),
  ('Bulgarian split squat',      'strength', 'Legs',         true),
  ('Lunge',                      'strength', 'Legs',         true),
  ('Step-up',                    'strength', 'Legs',         true),
  ('Hip thrust',                 'strength', 'Glutes',       false),
  ('Calf raise',                 'strength', 'Legs',         false),
  ('Seated calf raise',          'strength', 'Legs',         false),
  ('Sumo deadlift',              'strength', 'Legs',         false),

  -- ── Core ─────────────────────────────────────────────────────────────────
  ('Plank',                      'strength', 'Core',         false),
  ('Side plank',                 'strength', 'Core',         true),
  ('Cable crunch',               'strength', 'Core',         false),
  ('Hanging leg raise',          'strength', 'Core',         false),
  ('Russian twist',              'strength', 'Core',         false),
  ('Ab wheel rollout',           'strength', 'Core',         false),
  ('Dead bug',                   'strength', 'Core',         false),
  ('Mountain climber',           'strength', 'Core',         false),

  -- ── CrossFit — Olympic lifts ──────────────────────────────────────────────
  ('Power clean',                'strength', 'Olympic lifts',false),
  ('Clean and jerk',             'strength', 'Olympic lifts',false),
  ('Snatch',                     'strength', 'Olympic lifts',false),
  ('Dumbbell snatch',            'strength', 'Olympic lifts',true),
  ('Push jerk',                  'strength', 'Olympic lifts',false),

  -- ── CrossFit — Barbell (mapped to Olympic lifts group) ───────────────────
  ('Front squat',                'strength', 'Olympic lifts',false),
  ('Overhead squat',             'strength', 'Olympic lifts',false),
  ('Thruster',                   'strength', 'Olympic lifts',false),
  ('Push press',                 'strength', 'Olympic lifts',false),

  -- ── CrossFit — Gymnastics ────────────────────────────────────────────────
  ('Muscle-up',                  'strength', 'Gymnastics',   false),
  ('Kipping pull-up',            'strength', 'Gymnastics',   false),
  ('Toes to bar',                'strength', 'Gymnastics',   false),
  ('Handstand push-up',          'strength', 'Gymnastics',   false),
  ('Rope climb',                 'strength', 'Gymnastics',   false),

  -- ── CrossFit — Conditioning ──────────────────────────────────────────────
  ('Wall ball',                  'strength', 'Conditioning', false),
  ('Kettlebell swing',           'strength', 'Conditioning', false),
  ('Box jump',                   'strength', 'Conditioning', false),
  ('Burpee',                     'strength', 'Conditioning', false),
  ('Double under',               'strength', 'Conditioning', false),
  ('Air squat',                  'strength', 'Conditioning', false),
  ('GHD sit-up',                 'strength', 'Conditioning', false),
  ('Row (erg)',                   'rowing',   'Conditioning', false),
  ('Assault bike',               'strength', 'Conditioning', false),
  ('Ball slam',                  'strength', 'Conditioning', false),
  ('Farmer''s carry',            'strength', 'Conditioning', true),
  ('Turkish get-up',             'strength', 'Conditioning', true),
  ('Sled push',                  'strength', 'Conditioning', false)

) as e(name, cat, muscle_group, uni)
join muscle_groups mg on mg.name = e.muscle_group
where not exists (
  select 1 from exercises ex
  where ex.name = e.name
    and ex.owner_id is null
);
