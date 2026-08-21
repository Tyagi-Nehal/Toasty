-- Backfill attendance for the 7 meetings that already exist in Toasty
-- (2026-07-01 through 2026-08-13), transcribed from "TM Members -
-- Attendance (2).pdf". Run once in the Supabase SQL editor.
--
-- NOTE on Namita: her sheet row has fewer filled columns than everyone
-- else (she appears to have joined partway through), so her July/August
-- values below are inferred by counting backward from the end of her
-- row, not read off an unambiguous fixed column position like everyone
-- else. Worth a quick visual double-check against the PDF for her row
-- specifically before trusting it.

insert into attendance (meeting_id, member_name, present, updated_at)
select m.id, v.member_name, v.present, now()
from (values
  -- 2026-07-01
  ('2026-07-01'::date, 'Advik', true),
  ('2026-07-01'::date, 'Ahana', true),
  ('2026-07-01'::date, 'Aman', true),
  ('2026-07-01'::date, 'Anish', false),
  ('2026-07-01'::date, 'Arjun', false),
  ('2026-07-01'::date, 'Ayman', false),
  ('2026-07-01'::date, 'Chozhan', false),
  ('2026-07-01'::date, 'Durva', true),
  ('2026-07-01'::date, 'Faizaan', true),
  ('2026-07-01'::date, 'Hritvik', false),
  ('2026-07-01'::date, 'Isha', true),
  ('2026-07-01'::date, 'Namita', true),
  ('2026-07-01'::date, 'Nehal', true),
  ('2026-07-01'::date, 'Nick', true),
  ('2026-07-01'::date, 'Parth', true),
  ('2026-07-01'::date, 'Ruhaani', true),
  ('2026-07-01'::date, 'Sarvajit', false),
  ('2026-07-01'::date, 'Srinidhi', false),
  ('2026-07-01'::date, 'Sripad', true),
  ('2026-07-01'::date, 'Swetha', true),
  ('2026-07-01'::date, 'Thasvin', true),
  ('2026-07-01'::date, 'Venkatakrishnan', true),

  -- 2026-07-08
  ('2026-07-08'::date, 'Advik', true),
  ('2026-07-08'::date, 'Ahana', true),
  ('2026-07-08'::date, 'Aman', true),
  ('2026-07-08'::date, 'Anish', true),
  ('2026-07-08'::date, 'Arjun', false),
  ('2026-07-08'::date, 'Ayman', true),
  ('2026-07-08'::date, 'Chozhan', false),
  ('2026-07-08'::date, 'Durva', false),
  ('2026-07-08'::date, 'Faizaan', true),
  ('2026-07-08'::date, 'Hritvik', true),
  ('2026-07-08'::date, 'Isha', false),
  ('2026-07-08'::date, 'Namita', true),
  ('2026-07-08'::date, 'Nehal', true),
  ('2026-07-08'::date, 'Nick', true),
  ('2026-07-08'::date, 'Parth', true),
  ('2026-07-08'::date, 'Ruhaani', true),
  ('2026-07-08'::date, 'Sarvajit', true),
  ('2026-07-08'::date, 'Srinidhi', false),
  ('2026-07-08'::date, 'Sripad', false),
  ('2026-07-08'::date, 'Swetha', false),
  ('2026-07-08'::date, 'Thasvin', false),
  ('2026-07-08'::date, 'Venkatakrishnan', true),

  -- 2026-07-15
  ('2026-07-15'::date, 'Advik', true),
  ('2026-07-15'::date, 'Ahana', true),
  ('2026-07-15'::date, 'Aman', true),
  ('2026-07-15'::date, 'Anish', true),
  ('2026-07-15'::date, 'Arjun', false),
  ('2026-07-15'::date, 'Ayman', false),
  ('2026-07-15'::date, 'Chozhan', false),
  ('2026-07-15'::date, 'Durva', true),
  ('2026-07-15'::date, 'Faizaan', true),
  ('2026-07-15'::date, 'Hritvik', true),
  ('2026-07-15'::date, 'Isha', false),
  ('2026-07-15'::date, 'Namita', true),
  ('2026-07-15'::date, 'Nehal', true),
  ('2026-07-15'::date, 'Nick', false),
  ('2026-07-15'::date, 'Parth', false),
  ('2026-07-15'::date, 'Ruhaani', false),
  ('2026-07-15'::date, 'Sarvajit', false),
  ('2026-07-15'::date, 'Srinidhi', false),
  ('2026-07-15'::date, 'Sripad', true),
  ('2026-07-15'::date, 'Swetha', true),
  ('2026-07-15'::date, 'Thasvin', false),
  ('2026-07-15'::date, 'Venkatakrishnan', true),

  -- 2026-07-22
  ('2026-07-22'::date, 'Advik', true),
  ('2026-07-22'::date, 'Ahana', true),
  ('2026-07-22'::date, 'Aman', true),
  ('2026-07-22'::date, 'Anish', false),
  ('2026-07-22'::date, 'Arjun', false),
  ('2026-07-22'::date, 'Ayman', false),
  ('2026-07-22'::date, 'Chozhan', true),
  ('2026-07-22'::date, 'Durva', true),
  ('2026-07-22'::date, 'Faizaan', true),
  ('2026-07-22'::date, 'Hritvik', false),
  ('2026-07-22'::date, 'Isha', false),
  ('2026-07-22'::date, 'Namita', false),
  ('2026-07-22'::date, 'Nehal', true),
  ('2026-07-22'::date, 'Nick', true),
  ('2026-07-22'::date, 'Parth', false),
  ('2026-07-22'::date, 'Ruhaani', true),
  ('2026-07-22'::date, 'Sarvajit', true),
  ('2026-07-22'::date, 'Srinidhi', false),
  ('2026-07-22'::date, 'Sripad', false),
  ('2026-07-22'::date, 'Swetha', true),
  ('2026-07-22'::date, 'Thasvin', false),
  ('2026-07-22'::date, 'Venkatakrishnan', true),

  -- 2026-07-29
  ('2026-07-29'::date, 'Advik', true),
  ('2026-07-29'::date, 'Ahana', true),
  ('2026-07-29'::date, 'Aman', true),
  ('2026-07-29'::date, 'Anish', true),
  ('2026-07-29'::date, 'Arjun', false),
  ('2026-07-29'::date, 'Ayman', false),
  ('2026-07-29'::date, 'Chozhan', false),
  ('2026-07-29'::date, 'Durva', true),
  ('2026-07-29'::date, 'Faizaan', true),
  ('2026-07-29'::date, 'Hritvik', true),
  ('2026-07-29'::date, 'Isha', true),
  ('2026-07-29'::date, 'Namita', true),
  ('2026-07-29'::date, 'Nehal', true),
  ('2026-07-29'::date, 'Nick', true),
  ('2026-07-29'::date, 'Parth', true),
  ('2026-07-29'::date, 'Ruhaani', false),
  ('2026-07-29'::date, 'Sarvajit', true),
  ('2026-07-29'::date, 'Srinidhi', false),
  ('2026-07-29'::date, 'Sripad', false),
  ('2026-07-29'::date, 'Swetha', true),
  ('2026-07-29'::date, 'Thasvin', false),
  ('2026-07-29'::date, 'Venkatakrishnan', true),

  -- 2026-08-06
  ('2026-08-06'::date, 'Advik', true),
  ('2026-08-06'::date, 'Ahana', true),
  ('2026-08-06'::date, 'Aman', true),
  ('2026-08-06'::date, 'Anish', true),
  ('2026-08-06'::date, 'Arjun', true),
  ('2026-08-06'::date, 'Ayman', false),
  ('2026-08-06'::date, 'Chozhan', true),
  ('2026-08-06'::date, 'Durva', true),
  ('2026-08-06'::date, 'Faizaan', true),
  ('2026-08-06'::date, 'Hritvik', true),
  ('2026-08-06'::date, 'Isha', true),
  ('2026-08-06'::date, 'Namita', true),
  ('2026-08-06'::date, 'Nehal', true),
  ('2026-08-06'::date, 'Nick', true),
  ('2026-08-06'::date, 'Parth', true),
  ('2026-08-06'::date, 'Ruhaani', true),
  ('2026-08-06'::date, 'Sarvajit', false),
  ('2026-08-06'::date, 'Srinidhi', false),
  ('2026-08-06'::date, 'Sripad', true),
  ('2026-08-06'::date, 'Swetha', true),
  ('2026-08-06'::date, 'Thasvin', true),
  ('2026-08-06'::date, 'Venkatakrishnan', true),

  -- 2026-08-13
  ('2026-08-13'::date, 'Advik', true),
  ('2026-08-13'::date, 'Ahana', true),
  ('2026-08-13'::date, 'Aman', true),
  ('2026-08-13'::date, 'Anish', true),
  ('2026-08-13'::date, 'Arjun', true),
  ('2026-08-13'::date, 'Ayman', true),
  ('2026-08-13'::date, 'Chozhan', true),
  ('2026-08-13'::date, 'Durva', true),
  ('2026-08-13'::date, 'Faizaan', true),
  ('2026-08-13'::date, 'Hritvik', true),
  ('2026-08-13'::date, 'Isha', false),
  ('2026-08-13'::date, 'Namita', false),
  ('2026-08-13'::date, 'Nehal', false),
  ('2026-08-13'::date, 'Nick', true),
  ('2026-08-13'::date, 'Parth', true),
  ('2026-08-13'::date, 'Ruhaani', false),
  ('2026-08-13'::date, 'Sarvajit', true),
  ('2026-08-13'::date, 'Srinidhi', false),
  ('2026-08-13'::date, 'Sripad', false),
  ('2026-08-13'::date, 'Swetha', true),
  ('2026-08-13'::date, 'Thasvin', true),
  ('2026-08-13'::date, 'Venkatakrishnan', true)
) as v(meeting_date, member_name, present)
join meetings m on m.meeting_date = v.meeting_date
on conflict (meeting_id, member_name) do update
set present = excluded.present, updated_at = now();

-- Verify: should show 22 rows for each of the 7 dates.
select m.meeting_date, count(*) as rows_inserted
from attendance a
join meetings m on m.id = a.meeting_id
where m.meeting_date between '2026-07-01' and '2026-08-13'
group by m.meeting_date
order by m.meeting_date;
