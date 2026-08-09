-- One-time seed of the real club roster + role history, from the
-- club's actual attendance sheet and meeting roster (shared 2026-08-09).
-- Run once in the Supabase SQL Editor, after schema.sql's members/
-- role_history tables exist. Not designed to be re-run.
--
-- Notes on how this was transcribed, so it can be corrected later:
-- - "Venkat" in the roster is normalized to "Venkatakrishnan" to match
--   the full name used in the attendance sheet (same person).
-- - "Ruhani" (roster) normalized to "Ruhaani" (attendance sheet spelling).
-- - Presiding Officer on 2026-07-01 was listed as "Sarvajit/Faizaan" —
--   recorded as both, i.e. co-presiding.
-- - General Evaluator on 2026-07-01 was "External GE" (a guest, not a
--   club member) — skipped, not inserted as a member's role history.
-- - "Prepared Speaker 2", "Individual Evaluator 2", "Prepared Speaker 3",
--   "Individual Evaluator 3" rows in the source roster had fewer filled
--   cells than there are dated meetings, with no reliable way to tell
--   which specific dates they belong to from the extracted text alone —
--   these four role rows are NOT seeded here. Worth filling in by hand
--   later (Table Editor -> role_history) if you want that history
--   captured too.

insert into members (name, attendance_percentage) values
  ('Advik', 84.21),
  ('Ahana', 94.74),
  ('Aman', 94.74),
  ('Anish', 78.95),
  ('Arjun', 26.32),
  ('Ayman', 15.79),
  ('Chozhan', 31.58),
  ('Durva', 57.89),
  ('Faizaan', 94.74),
  ('Hritvik', 52.63),
  ('Isha', 78.95),
  ('Namita', 90),
  ('Nehal', 100),
  ('Nick', 63.16),
  ('Parth', 78.95),
  ('Ruhaani', 47.37),
  ('Sarvajit', 57.89),
  ('Srinidhi', 0),
  ('Sripad', 36.84),
  ('Swetha', 52.63),
  ('Thasvin', 21.05),
  ('Venkatakrishnan', 94.74)
on conflict (name) do nothing;

insert into role_history (member_name, role_id, meeting_date) values
  -- Sergeant at Arms
  ('Durva','saa','2026-07-01'),
  ('Aman','saa','2026-07-08'),
  ('Durva','saa','2026-07-15'),
  ('Venkatakrishnan','saa','2026-07-22'),
  ('Durva','saa','2026-07-30'),
  ('Durva','saa','2026-08-06'),
  ('Durva','saa','2026-08-13'),
  -- Presiding Officer (2026-07-01 co-presided)
  ('Sarvajit','po','2026-07-01'),
  ('Faizaan','po','2026-07-01'),
  ('Sarvajit','po','2026-07-08'),
  ('Faizaan','po','2026-07-15'),
  ('Sarvajit','po','2026-07-22'),
  ('Sarvajit','po','2026-07-30'),
  ('Faizaan','po','2026-08-06'),
  ('Sarvajit','po','2026-08-13'),
  -- Toastmaster of the Day
  ('Swetha','tmod','2026-07-01'),
  ('Faizaan','tmod','2026-07-08'),
  ('Ahana','tmod','2026-07-15'),
  ('Nehal','tmod','2026-07-22'),
  ('Namita','tmod','2026-07-30'),
  ('Isha','tmod','2026-08-06'),
  ('Anish','tmod','2026-08-13'),
  -- General Evaluator (2026-07-01 skipped: External GE, not a member)
  ('Anish','ge','2026-07-08'),
  ('Nehal','ge','2026-07-15'),
  ('Aman','ge','2026-07-22'),
  ('Ahana','ge','2026-07-30'),
  ('Swetha','ge','2026-08-06'),
  ('Arjun','ge','2026-08-13'),
  -- Prepared Speaker 1
  ('Namita','speaker-1','2026-07-01'),
  ('Ahana','speaker-1','2026-07-08'),
  ('Hritvik','speaker-1','2026-07-15'),
  ('Faizaan','speaker-1','2026-07-22'),
  ('Venkatakrishnan','speaker-1','2026-07-30'),
  ('Arjun','speaker-1','2026-08-06'),
  ('Sarvajit','speaker-1','2026-08-13'),
  -- Individual Evaluator 1
  ('Ahana','evaluator-1','2026-07-01'),
  ('Advik','evaluator-1','2026-07-08'),
  ('Aman','evaluator-1','2026-07-15'),
  ('Ahana','evaluator-1','2026-07-22'),
  ('Aman','evaluator-1','2026-07-30'),
  ('Nick','evaluator-1','2026-08-06'),
  ('Faizaan','evaluator-1','2026-08-13'),
  -- Table Topics Master
  ('Ruhaani','ttm','2026-07-01'),
  ('Namita','ttm','2026-07-08'),
  ('Advik','ttm','2026-07-15'),
  ('Chozhan','ttm','2026-07-22'),
  ('Nick','ttm','2026-07-30'),
  ('Nehal','ttm','2026-08-06'),
  ('Hritvik','ttm','2026-08-13'),
  -- Timer
  ('Thasvin','timer','2026-07-01'),
  ('Parth','timer','2026-07-08'),
  ('Thasvin','timer','2026-07-15'),
  ('Venkatakrishnan','timer','2026-07-22'),
  ('Advik','timer','2026-07-30'),
  ('Namita','timer','2026-08-06'),
  ('Sripad','timer','2026-08-13'),
  -- Grammarian
  ('Isha','grammarian','2026-07-01'),
  ('Nehal','grammarian','2026-07-08'),
  ('Anish','grammarian','2026-07-15'),
  ('Nick','grammarian','2026-07-22'),
  ('Faizaan','grammarian','2026-07-30'),
  ('Parth','grammarian','2026-08-06'),
  ('Ruhaani','grammarian','2026-08-13'),
  -- Ah-Counter
  ('Aman','ah-counter','2026-07-01'),
  ('Swetha','ah-counter','2026-07-08'),
  ('Venkatakrishnan','ah-counter','2026-07-15'),
  ('Sarvajit','ah-counter','2026-07-22'),
  ('Nehal','ah-counter','2026-07-30'),
  ('Sripad','ah-counter','2026-08-06'),
  ('Swetha','ah-counter','2026-08-13'),
  -- Listener
  ('Faizaan','listener','2026-07-01'),
  ('Hritvik','listener','2026-07-08'),
  ('Nick','listener','2026-07-15'),
  ('Durva','listener','2026-07-22'),
  ('Hritvik','listener','2026-07-30'),
  ('Chozhan','listener','2026-08-06'),
  ('Isha','listener','2026-08-13');
