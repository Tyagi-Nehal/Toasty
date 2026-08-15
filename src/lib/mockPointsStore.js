// ExCom points, Phase 1 — every point source computable automatically
// from data the app already has (supabase/schema.sql: excom_points).
// This is an append-only event log, not a running total, so every point
// is auditable and a monthly total is just a filtered sum. Points are
// always attributed to whoever actually holds the role (via
// getEmailForRole), not to whichever account triggered the action —
// the President can act on any ExCom role's behalf, and that shouldn't
// redirect points meant for e.g. the VPM onto the President.
//
// Discretionary awards (SAA/President scores, Associate awards) and the
// monthly member poll are later phases — not handled here.

import { supabase } from './supabaseClient.js'
import { getAgenda } from './mockAgendaStore.js'
import { getEmailForRole } from './mockExcomRegistry.js'

function normalizeEmail(email) {
  return (email ?? '').trim().toLowerCase()
}

function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

// "5:15 PM" -> { hours: 17, minutes: 15 }. Falls back to 5pm if the
// stored time doesn't parse — meetings.time is freeform text, not a
// real time column.
function parseTimeToHM(timeStr) {
  const match = (timeStr ?? '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return { hours: 17, minutes: 0 }
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const meridiem = match[3]?.toUpperCase()
  if (meridiem === 'PM' && hours !== 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0
  return { hours, minutes }
}

function timeOnDate(dateStr, timeStr) {
  if (!dateStr) return null
  const { hours, minutes } = parseTimeToHM(timeStr)
  const d = new Date(`${dateStr}T00:00:00`)
  d.setHours(hours, minutes, 0, 0)
  return d
}

// Meeting's scheduled start, as a real Date — treated as the reference
// point for every "within 24h of the meeting" check in this file (there's
// no separate "meeting closure/end" field to be more precise than that).
function getMeetingDateTime(meeting) {
  return timeOnDate(meeting?.date, meeting?.time)
}

function isWithin24HoursAfter(actionTime, referenceDateTime) {
  if (!referenceDateTime) return false
  const diffMs = new Date(actionTime).getTime() - referenceDateTime.getTime()
  return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000
}

// The Tuesday of the same week as the meeting (or the meeting's own date,
// if the meeting itself is on a Tuesday) — the VPE's finalize+agenda
// deadline. getDay(): 0=Sun..6=Sat, Tuesday=2.
function getPrecedingTuesdayDeadline(meetingDateStr) {
  const meetingDate = new Date(`${meetingDateStr}T23:59:59`)
  const diffToTuesday = (meetingDate.getDay() - 2 + 7) % 7
  const tuesday = new Date(meetingDate)
  tuesday.setDate(tuesday.getDate() - diffToTuesday)
  tuesday.setHours(23, 59, 59, 999)
  return tuesday
}

async function awardPoints({ role, email, meetingId, category, points, note, subjectEmail }) {
  const normalized = normalizeEmail(email)
  if (!normalized || !points) return
  const { error } = await supabase.from('excom_points').insert({
    role,
    email: normalized,
    meeting_id: meetingId ?? null,
    category,
    points,
    note: note ?? null,
    subject_email: subjectEmail ? normalizeEmail(subjectEmail) : null,
  })
  // Scoring is a side effect of a real action (submitting a MOM, etc.) —
  // it should never fail or block that action, only log if it does.
  if (error) console.error('[mockPointsStore] awardPoints failed:', error.message)
}

// Skips if this exact (role, email, category, meeting) has already been
// scored — makes every per-meeting category safe to call again on a
// re-submit/edit without double-awarding.
async function awardPointsOncePerMeeting({ role, email, meetingId, category, points, note }) {
  const normalized = normalizeEmail(email)
  if (!normalized || !meetingId) return
  const { data: existing } = await supabase
    .from('excom_points')
    .select('id')
    .eq('category', category)
    .eq('meeting_id', meetingId)
    .eq('email', normalized)
    .limit(1)
    .maybeSingle()
  if (existing) return
  await awardPoints({ role, email: normalized, meetingId, category, points, note })
}

// Caps how many *events* (not points) count per month — e.g. only the
// first 3 new-member registrations in a month earn points, a 4th still
// happens for real but doesn't add more that month.
async function awardPointsWithMonthlyEventCap({ role, email, category, points, note, maxEventsPerMonth }) {
  const normalized = normalizeEmail(email)
  if (!normalized) return
  const { start, end } = getCurrentMonthRange()
  const { count } = await supabase
    .from('excom_points')
    .select('id', { count: 'exact', head: true })
    .eq('role', role)
    .eq('email', normalized)
    .eq('category', category)
    .gte('awarded_at', start)
    .lt('awarded_at', end)
  if ((count ?? 0) >= maxEventsPerMonth) return
  await awardPoints({ role, email: normalized, meetingId: null, category, points, note })
}

// Same monthly event cap, but also deduped per subject (e.g. the member
// being renewed) — skips entirely if this subject was already scored
// under this category this month, *before* checking the cap, so
// repeated edits to the same subject (a payment-status tweak, a date
// correction) never consume a cap slot that a genuinely different
// subject should get.
async function awardPointsWithMonthlySubjectCap({
  role,
  email,
  subjectEmail,
  category,
  points,
  note,
  maxEventsPerMonth,
}) {
  const normalized = normalizeEmail(email)
  const normalizedSubject = normalizeEmail(subjectEmail)
  if (!normalized || !normalizedSubject) return
  const { start, end } = getCurrentMonthRange()

  const { data: alreadyThisSubject } = await supabase
    .from('excom_points')
    .select('id')
    .eq('role', role)
    .eq('category', category)
    .eq('subject_email', normalizedSubject)
    .gte('awarded_at', start)
    .lt('awarded_at', end)
    .limit(1)
    .maybeSingle()
  if (alreadyThisSubject) return

  const { count } = await supabase
    .from('excom_points')
    .select('id', { count: 'exact', head: true })
    .eq('role', role)
    .eq('email', normalized)
    .eq('category', category)
    .gte('awarded_at', start)
    .lt('awarded_at', end)
  if ((count ?? 0) >= maxEventsPerMonth) return

  await awardPoints({
    role,
    email: normalized,
    meetingId: null,
    category,
    points,
    note,
    subjectEmail: normalizedSubject,
  })
}

export async function getMonthlyPoints(role, email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return 0
  const { start, end } = getCurrentMonthRange()
  const { data, error } = await supabase
    .from('excom_points')
    .select('points')
    .eq('role', role)
    .eq('email', normalized)
    .gte('awarded_at', start)
    .lt('awarded_at', end)
  if (error) {
    console.error('[mockPointsStore] getMonthlyPoints failed:', error.message)
    return 0
  }
  return (data ?? []).reduce((sum, row) => sum + row.points, 0)
}

export async function getMonthlyBreakdown(role, email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return []
  const { start, end } = getCurrentMonthRange()
  const { data, error } = await supabase
    .from('excom_points')
    .select('category, points')
    .eq('role', role)
    .eq('email', normalized)
    .gte('awarded_at', start)
    .lt('awarded_at', end)
  if (error) {
    console.error('[mockPointsStore] getMonthlyBreakdown failed:', error.message)
    return []
  }
  const byCategory = new Map()
  for (const row of data ?? []) {
    byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + row.points)
  }
  return [...byCategory.entries()].map(([category, points]) => ({ category, points }))
}

// VPE: finalize+agenda-by-Tuesday, and no-role-repetition. Called from
// finalizeMeeting() with the meeting view (already has .roles and .date)
// fetched just before the finalize write.
export async function scoreVpeFinalize(meeting) {
  const vpeEmail = await getEmailForRole('VPE')
  if (!vpeEmail || !meeting) return

  const takenNames = Object.values(meeting.roles ?? {})
    .map((r) => r.takenBy)
    .filter(Boolean)
  if (takenNames.length > 0 && takenNames.length === new Set(takenNames).size) {
    await awardPointsOncePerMeeting({
      role: 'VPE',
      email: vpeEmail,
      meetingId: meeting.id,
      category: 'no_repetition',
      points: 2,
      note: `No role repetition for ${meeting.dateLabel ?? meeting.date}`,
    })
  }

  if (!meeting.date) return
  const deadline = getPrecedingTuesdayDeadline(meeting.date)
  if (new Date() > deadline) return // finalized itself after the deadline
  const agenda = await getAgenda(meeting.id)
  if (agenda?.sentAt && new Date(agenda.sentAt) <= deadline) {
    await awardPointsOncePerMeeting({
      role: 'VPE',
      email: vpeEmail,
      meetingId: meeting.id,
      category: 'finalize_agenda',
      points: 8,
      note: `Finalized + agenda sent by Tuesday for ${meeting.dateLabel ?? meeting.date}`,
    })
  }
}

// Secretary: MOM submitted within 24h. SAA: meeting started on time, per
// the MOM's own reported startTime. Called from saveSubmittedMOM().
export async function scoreMomSubmission(meeting, mom, submittedAt) {
  if (!meeting) return
  const scheduled = getMeetingDateTime(meeting)

  const secretaryEmail = await getEmailForRole('Secretary')
  if (secretaryEmail && isWithin24HoursAfter(submittedAt, scheduled)) {
    await awardPointsOncePerMeeting({
      role: 'Secretary',
      email: secretaryEmail,
      meetingId: meeting.id,
      category: 'mom_on_time',
      points: 10,
      note: `MOM submitted within 24h for ${meeting.dateLabel ?? meeting.date}`,
    })
  }

  if (mom?.startTime && scheduled) {
    const actualStart = timeOnDate(meeting.date, mom.startTime)
    if (actualStart && actualStart <= scheduled) {
      const saaEmail = await getEmailForRole('SAA')
      if (saaEmail) {
        await awardPointsOncePerMeeting({
          role: 'SAA',
          email: saaEmail,
          meetingId: meeting.id,
          category: 'on_time_start',
          points: 7,
          note: `Meeting started on time for ${meeting.dateLabel ?? meeting.date}`,
        })
      }
    }
  }
}

// Secretary: attendance marked within 24h. Called from submitAttendance().
export async function scoreAttendanceSubmission(meeting, submittedAt) {
  if (!meeting) return
  const secretaryEmail = await getEmailForRole('Secretary')
  if (!secretaryEmail) return
  const scheduled = getMeetingDateTime(meeting)
  if (!isWithin24HoursAfter(submittedAt, scheduled)) return
  await awardPointsOncePerMeeting({
    role: 'Secretary',
    email: secretaryEmail,
    meetingId: meeting.id,
    category: 'attendance_on_time',
    points: 10,
    note: `Attendance marked within 24h for ${meeting.dateLabel ?? meeting.date}`,
  })
}

// VPPR: photos submitted within 24h — up to 11/meeting, capped at
// 45 total for the month (a hybrid of the two cap styles above: once
// per meeting, but also bounded by a running monthly points total).
export async function scorePhotosSubmission(meeting, submittedAt) {
  if (!meeting) return
  const vpprEmail = await getEmailForRole('VPPR')
  if (!vpprEmail) return
  const scheduled = getMeetingDateTime(meeting)
  if (!isWithin24HoursAfter(submittedAt, scheduled)) return

  const normalized = normalizeEmail(vpprEmail)
  const { data: existing } = await supabase
    .from('excom_points')
    .select('id')
    .eq('category', 'photos_on_time')
    .eq('meeting_id', meeting.id)
    .eq('email', normalized)
    .limit(1)
    .maybeSingle()
  if (existing) return

  const { start, end } = getCurrentMonthRange()
  const { data: monthRows } = await supabase
    .from('excom_points')
    .select('points')
    .eq('role', 'VPPR')
    .eq('email', normalized)
    .eq('category', 'photos_on_time')
    .gte('awarded_at', start)
    .lt('awarded_at', end)
  const monthTotal = (monthRows ?? []).reduce((sum, row) => sum + row.points, 0)
  const remaining = Math.max(0, 45 - monthTotal)
  if (remaining === 0) return

  await awardPoints({
    role: 'VPPR',
    email: normalized,
    meetingId: meeting.id,
    category: 'photos_on_time',
    points: Math.min(11, remaining),
    note: `Photos submitted within 24h for ${meeting.dateLabel ?? meeting.date}`,
  })
}

// VPM: new member registered (capped 3/month), then checks the shared
// growth bonus. Called from approveSignup().
export async function scoreSignupApproval() {
  const vpmEmail = await getEmailForRole('VPM')
  if (vpmEmail) {
    await awardPointsWithMonthlyEventCap({
      role: 'VPM',
      email: vpmEmail,
      category: 'new_member_registered',
      points: 15,
      note: 'New member registered',
      maxEventsPerMonth: 3,
    })
  }
  await checkGrowthBonus()
}

// Feeds the same shared growth bonus — an ExCom appointment counts as
// club growth too. Called from registerExcomMember().
export async function scoreExcomAppointment() {
  await checkGrowthBonus()
}

// VPM + VPPR + Treasurer each get 5, once per calendar month, the first
// time any new approval (signup or ExCom appointment) happens that month.
async function checkGrowthBonus() {
  const { start, end } = getCurrentMonthRange()
  const { data: existing } = await supabase
    .from('excom_points')
    .select('id')
    .eq('category', 'growth_bonus')
    .gte('awarded_at', start)
    .lt('awarded_at', end)
    .limit(1)
  if (existing && existing.length > 0) return

  const [vpmEmail, vpprEmail, treasurerEmail] = await Promise.all([
    getEmailForRole('VPM'),
    getEmailForRole('VPPR'),
    getEmailForRole('Treasurer'),
  ])
  const recipients = [
    { role: 'VPM', email: vpmEmail },
    { role: 'VPPR', email: vpprEmail },
    { role: 'Treasurer', email: treasurerEmail },
  ].filter((r) => r.email)
  for (const r of recipients) {
    await awardPoints({
      role: r.role,
      email: r.email,
      meetingId: null,
      category: 'growth_bonus',
      points: 5,
      note: 'Club membership grew this month',
    })
  }
}

// Treasurer: renewal of a new member (no prior member_renewals row,
// capped 3/month) vs. an existing member (capped 10/month). Called from
// updateMemberRenewal() with the member being renewed and whether a row
// already existed *before* the upsert that's about to happen. Deduped
// per member per month (awardPointsWithMonthlySubjectCap) — that same
// store function fires on every field edit (payment status, a single
// date tweak), not just genuine renewals, so without the dedup a
// Treasurer correcting one member's payment status three times in a day
// would burn three of the month's capped slots on one person.
export async function scoreRenewal(memberEmail, hadExistingRow) {
  const treasurerEmail = await getEmailForRole('Treasurer')
  if (!treasurerEmail) return
  if (hadExistingRow) {
    await awardPointsWithMonthlySubjectCap({
      role: 'Treasurer',
      email: treasurerEmail,
      subjectEmail: memberEmail,
      category: 'renewal_existing_member',
      points: 3,
      note: 'Renewal of an existing member',
      maxEventsPerMonth: 10,
    })
  } else {
    await awardPointsWithMonthlySubjectCap({
      role: 'Treasurer',
      email: treasurerEmail,
      subjectEmail: memberEmail,
      category: 'renewal_new_member',
      points: 15,
      note: 'Renewal of a new member',
      maxEventsPerMonth: 3,
    })
  }
}
