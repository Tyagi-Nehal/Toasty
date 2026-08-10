-- One-time seed: a blank member_renewals row for each real member already
-- in the `members` table (same 22 names as seed-roster.sql). Payment
-- status defaults to 'pending' and membership dates are left null (so
-- everyone starts Inactive) — honest "not set up yet," not fabricated.
-- The Treasurer fills in real dates/status from the Renewal Management
-- page. Safe to re-run — existing rows are left untouched.

insert into member_renewals (member_name) values
  ('Advik'),
  ('Ahana'),
  ('Aman'),
  ('Anish'),
  ('Arjun'),
  ('Ayman'),
  ('Chozhan'),
  ('Durva'),
  ('Faizaan'),
  ('Hritvik'),
  ('Isha'),
  ('Namita'),
  ('Nehal'),
  ('Nick'),
  ('Parth'),
  ('Ruhaani'),
  ('Sarvajit'),
  ('Srinidhi'),
  ('Sripad'),
  ('Swetha'),
  ('Thasvin'),
  ('Venkatakrishnan')
on conflict (member_name) do nothing;
