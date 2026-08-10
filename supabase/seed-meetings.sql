-- One-time seed of real meeting dates + role assignments, from the
-- club's actual meeting roster (same source as seed-roster.sql). Past
-- dates (already decided per the roster) are seeded finalized, with the
-- 11 roles we could confidently transcribe carried over as 'taken'
-- (2026-07-01's Presiding Officer was co-presided -- recorded as one
-- row, "Sarvajit & Faizaan"); the 4 roles we couldn't confidently map to
-- a date (see seed-roster.sql's notes) are left 'open' even on these
-- finalized meetings. Future dates are seeded finalized:false, every
-- role open, ready for the VPE to auto-assign/finalize going forward.
-- Run once, after schema.sql's meetings/meeting_role_assignments exist.

insert into meetings (label, meeting_date, time, finalized) values ('Meeting 14', '2026-07-01', '5:15 PM', true);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 15', '2026-07-08', '5:15 PM', true);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 16', '2026-07-15', '5:15 PM', true);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 17', '2026-07-22', '5:15 PM', true);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 18', '2026-07-30', '5:15 PM', true);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 19', '2026-08-06', '5:15 PM', true);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 20', '2026-08-13', '5:15 PM', true);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 21', '2026-08-20', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 22', '2026-08-27', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 23', '2026-09-03', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 24', '2026-09-10', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 25', '2026-09-17', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 26', '2026-09-24', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 27', '2026-10-01', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 28', '2026-10-08', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 29', '2026-10-15', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 30', '2026-10-22', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 31', '2026-10-29', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 32', '2026-11-05', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 33', '2026-11-12', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 34', '2026-11-19', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 35', '2026-11-26', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 36', '2026-12-03', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 37', '2026-12-10', '5:15 PM', false);
insert into meetings (label, meeting_date, time, finalized) values ('Meeting 38', '2026-12-17', '5:15 PM', false);

-- Role assignments for each meeting, matched back to its id by date.

-- 2026-07-01
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'saa', 'taken', 'Durva' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'po', 'taken', 'Sarvajit & Faizaan' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'tmod', 'taken', 'Swetha' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ttm', 'taken', 'Ruhaani' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'speaker-1', 'taken', 'Namita' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'evaluator-1', 'taken', 'Ahana' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'timer', 'taken', 'Thasvin' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ah-counter', 'taken', 'Aman' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'grammarian', 'taken', 'Isha' from meetings where meeting_date = '2026-07-01';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'listener', 'taken', 'Faizaan' from meetings where meeting_date = '2026-07-01';

-- 2026-07-08
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'saa', 'taken', 'Aman' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'po', 'taken', 'Sarvajit' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'tmod', 'taken', 'Faizaan' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ge', 'taken', 'Anish' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ttm', 'taken', 'Namita' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'speaker-1', 'taken', 'Ahana' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'evaluator-1', 'taken', 'Advik' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'timer', 'taken', 'Parth' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ah-counter', 'taken', 'Swetha' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'grammarian', 'taken', 'Nehal' from meetings where meeting_date = '2026-07-08';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'listener', 'taken', 'Hritvik' from meetings where meeting_date = '2026-07-08';

-- 2026-07-15
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'saa', 'taken', 'Durva' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'po', 'taken', 'Faizaan' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'tmod', 'taken', 'Ahana' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ge', 'taken', 'Nehal' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ttm', 'taken', 'Advik' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'speaker-1', 'taken', 'Hritvik' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'evaluator-1', 'taken', 'Aman' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'timer', 'taken', 'Thasvin' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ah-counter', 'taken', 'Venkatakrishnan' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'grammarian', 'taken', 'Anish' from meetings where meeting_date = '2026-07-15';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'listener', 'taken', 'Nick' from meetings where meeting_date = '2026-07-15';

-- 2026-07-22
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'saa', 'taken', 'Venkatakrishnan' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'po', 'taken', 'Sarvajit' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'tmod', 'taken', 'Nehal' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ge', 'taken', 'Aman' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ttm', 'taken', 'Chozhan' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'speaker-1', 'taken', 'Faizaan' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'evaluator-1', 'taken', 'Ahana' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'timer', 'taken', 'Venkatakrishnan' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ah-counter', 'taken', 'Sarvajit' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'grammarian', 'taken', 'Nick' from meetings where meeting_date = '2026-07-22';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'listener', 'taken', 'Durva' from meetings where meeting_date = '2026-07-22';

-- 2026-07-30
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'saa', 'taken', 'Durva' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'po', 'taken', 'Sarvajit' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'tmod', 'taken', 'Namita' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ge', 'taken', 'Ahana' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ttm', 'taken', 'Nick' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'speaker-1', 'taken', 'Venkatakrishnan' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'evaluator-1', 'taken', 'Aman' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'timer', 'taken', 'Advik' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ah-counter', 'taken', 'Nehal' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'grammarian', 'taken', 'Faizaan' from meetings where meeting_date = '2026-07-30';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'listener', 'taken', 'Hritvik' from meetings where meeting_date = '2026-07-30';

-- 2026-08-06
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'saa', 'taken', 'Durva' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'po', 'taken', 'Faizaan' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'tmod', 'taken', 'Isha' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ge', 'taken', 'Swetha' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ttm', 'taken', 'Nehal' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'speaker-1', 'taken', 'Arjun' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'evaluator-1', 'taken', 'Nick' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'timer', 'taken', 'Namita' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ah-counter', 'taken', 'Sripad' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'grammarian', 'taken', 'Parth' from meetings where meeting_date = '2026-08-06';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'listener', 'taken', 'Chozhan' from meetings where meeting_date = '2026-08-06';

-- 2026-08-13
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'saa', 'taken', 'Durva' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'po', 'taken', 'Sarvajit' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'tmod', 'taken', 'Anish' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ge', 'taken', 'Arjun' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ttm', 'taken', 'Hritvik' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'speaker-1', 'taken', 'Sarvajit' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'evaluator-1', 'taken', 'Faizaan' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'timer', 'taken', 'Sripad' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'ah-counter', 'taken', 'Swetha' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'grammarian', 'taken', 'Ruhaani' from meetings where meeting_date = '2026-08-13';
insert into meeting_role_assignments (meeting_id, role_id, status, taken_by_name) select id, 'listener', 'taken', 'Isha' from meetings where meeting_date = '2026-08-13';

-- 2026-08-20
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-08-20';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-08-20';

-- 2026-08-27
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-08-27';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-08-27';

-- 2026-09-03
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-09-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-09-03';

-- 2026-09-10
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-09-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-09-10';

-- 2026-09-17
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-09-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-09-17';

-- 2026-09-24
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-09-24';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-09-24';

-- 2026-10-01
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-10-01';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-10-01';

-- 2026-10-08
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-10-08';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-10-08';

-- 2026-10-15
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-10-15';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-10-15';

-- 2026-10-22
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-10-22';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-10-22';

-- 2026-10-29
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-10-29';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-10-29';

-- 2026-11-05
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-11-05';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-11-05';

-- 2026-11-12
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-11-12';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-11-12';

-- 2026-11-19
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-11-19';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-11-19';

-- 2026-11-26
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-11-26';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-11-26';

-- 2026-12-03
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-12-03';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-12-03';

-- 2026-12-10
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-12-10';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-12-10';

-- 2026-12-17
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'saa', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'po', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'tmod', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ge', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ttm', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-1', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-2', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'speaker-3', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-1', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-2', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'evaluator-3', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'timer', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'ah-counter', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'grammarian', 'open' from meetings where meeting_date = '2026-12-17';
insert into meeting_role_assignments (meeting_id, role_id, status) select id, 'listener', 'open' from meetings where meeting_date = '2026-12-17';
