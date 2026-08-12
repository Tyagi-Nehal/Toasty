// Real meetings + per-meeting role assignments (supabase/schema.sql:
// meetings, meeting_role_assignments — seeded once from the club's real
// meeting roster, see supabase/seed-meetings.sql). Read by the
// member-facing Role Selection page AND the VPE-facing Role Management
// page, so a manual override, auto-assign, or finalize on one side is
// reflected on the other — for real, across devices, since this is no
// longer localStorage.
//
// Function names are unchanged from the old localStorage-backed version.

import { roleCatalog } from '../data/roleCatalog.js'
import { pushNotification } from './mockNotificationsStore.js'
import { getAccount, hasExcomRole } from './mockAuth.js'
import { supabase } from './supabaseClient.js'
import {
  getMembers,
  getRoleHistory,
  recordRoleAssignment,
  scoreMemberForRole,
} from './mockRosterStore.js'
import { getAttendanceStatsByMember } from './mockAttendanceStore.js'

const LOG_KEY = 'toasty_role_notifications'
const MAX_LOG_ENTRIES = 25

function logAction(message) {
  const entry = { id: crypto.randomUUID(), message, time: new Date().toISOString() }
  try {
    const raw = localStorage.getItem(LOG_KEY)
    const existing = raw ? JSON.parse(raw) : []
    localStorage.setItem(
      LOG_KEY,
      JSON.stringify([entry, ...existing].slice(0, MAX_LOG_ENTRIES)),
    )
  } catch {
    localStorage.setItem(LOG_KEY, JSON.stringify([entry]))
  }
}

export function getNotifications() {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function roleName(roleId) {
  return roleCatalog.find((r) => r.id === roleId)?.name ?? roleId
}

function formatDateLabel(meetingDate) {
  if (!meetingDate) return ''
  return new Date(`${meetingDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

// Members self-select freely up to the Saturday before the meeting,
// 9:00 AM; whatever's still open after that is fair game for
// auto-assign. Computed as the most recent Saturday strictly before the
// meeting date — not a fixed "-5 days" offset — so a rescheduled meeting
// on any day of the week still gets a real preceding-Saturday cutoff
// instead of landing on some arbitrary weekday.
function getAutoAssignCutoff(meetingDate) {
  if (!meetingDate) return null
  const meeting = new Date(`${meetingDate}T00:00:00`)
  const day = meeting.getDay() // Sun=0 .. Sat=6
  const daysBack = day === 6 ? 7 : (day + 1) % 7
  const cutoff = new Date(meeting)
  cutoff.setDate(cutoff.getDate() - daysBack)
  cutoff.setHours(9, 0, 0, 0)
  return cutoff
}

function formatCutoffLabel(cutoff) {
  if (!cutoff) return ''
  return cutoff.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Builds the { roleId: { status, takenBy, acceptedAt } } shape every page
// expects, filling in any role from roleCatalog that has no row yet as
// 'open'.
function buildRolesObject(assignments) {
  const roles = {}
  for (const role of roleCatalog) {
    roles[role.id] = { status: 'open' }
  }
  for (const a of assignments) {
    roles[a.role_id] = {
      status: a.status,
      ...(a.taken_by_name ? { takenBy: a.taken_by_name } : {}),
      ...(a.accepted_at ? { acceptedAt: a.accepted_at } : {}),
    }
  }
  return roles
}

// "My role" now matches the signed-in account's real email first (set on
// self-select, or a VPE override that provided one); falls back to
// matching by name for auto-assigned roles, since the real member roster
// (mockRosterStore.js) has no emails — a same-named duplicate could
// false-match here, a known limitation for a small pilot, not bulletproof.
function deriveMyRoleId(assignments, account) {
  if (!account) return null
  const mine = assignments.find(
    (a) =>
      (a.taken_by_email && a.taken_by_email.toLowerCase() === account.email?.toLowerCase()) ||
      (!a.taken_by_email && a.taken_by_name === account.name),
  )
  return mine?.role_id ?? null
}

// No-catch-up, no-recursion fetch — the building block both the public
// getMeetings()/getMeeting() and the internal auto-assign catch-up (below)
// share, so the catch-up can read/write meeting data without looping back
// into getMeetings() and re-triggering itself.
async function fetchRawViews() {
  const [{ data: meetings }, { data: assignments }] = await Promise.all([
    supabase.from('meetings').select('*').order('meeting_date', { ascending: true }),
    supabase.from('meeting_role_assignments').select('*'),
  ])
  const account = getAccount()

  return (meetings ?? []).map((m) => {
    const meetingAssignments = (assignments ?? []).filter((a) => a.meeting_id === m.id)
    const hoursUntilMeeting = m.meeting_date
      ? Math.round((new Date(`${m.meeting_date}T00:00:00`).getTime() - Date.now()) / 3600000)
      : null
    const autoAssignCutoff = getAutoAssignCutoff(m.meeting_date)

    return {
      id: m.id,
      label: m.label,
      date: m.meeting_date,
      dateLabel: formatDateLabel(m.meeting_date),
      time: m.time,
      finalized: m.finalized,
      cancelled: m.cancelled,
      cancelReason: m.cancel_reason,
      hoursUntilMeeting,
      autoAssignCutoff,
      autoAssignCutoffLabel: formatCutoffLabel(autoAssignCutoff),
      pastCutoff: autoAssignCutoff ? Date.now() >= autoAssignCutoff.getTime() : true,
      roles: buildRolesObject(meetingAssignments),
      myRoleId: deriveMyRoleId(meetingAssignments, account),
    }
  })
}

async function getMeetingRaw(meetingId) {
  const views = await fetchRawViews()
  return views.find((m) => m.id === meetingId)
}

// Best-effort catch-up for the "no autoassign till Saturday 9 AM" rule —
// there's no backend/cron in this app, so this runs opportunistically
// whenever a VPE or President's session fetches meetings, instead of at
// the exact cutoff instant. Gating to VPE/President isn't just a design
// choice: the role_history insert inside runAutoAssign is RLS-restricted
// to VPE/President, so anyone else's session couldn't complete it anyway.
async function runDueAutoAssignments(views) {
  const due = views.filter(
    (v) =>
      !v.finalized &&
      !v.cancelled &&
      v.pastCutoff &&
      Object.values(v.roles).some((r) => r.status === 'open'),
  )
  for (const v of due) {
    await runAutoAssign(v.id, 'the Saturday 9 AM cutoff')
  }
  return due.length > 0
}

export async function getMeetings() {
  let views = await fetchRawViews()
  if (hasExcomRole('VPE') && (await runDueAutoAssignments(views))) {
    views = await fetchRawViews()
  }
  return views
}

export async function getMeeting(meetingId) {
  const meetings = await getMeetings()
  return meetings.find((m) => m.id === meetingId)
}

export async function selectRole(meetingId, roleId) {
  const account = getAccount()
  const meeting = await getMeeting(meetingId)
  await supabase
    .from('meeting_role_assignments')
    .update({ status: 'taken', taken_by_name: account?.name, taken_by_email: account?.email })
    .eq('meeting_id', meetingId)
    .eq('role_id', roleId)
  logAction(`You self-selected ${roleName(roleId)} for ${meeting.dateLabel}`)
}

export async function declineMyRole(meetingId) {
  const account = getAccount()
  const meeting = await getMeeting(meetingId)
  const myRoleId = meeting?.myRoleId
  if (!myRoleId) return

  await supabase
    .from('meeting_role_assignments')
    .update({ status: 'open', taken_by_name: null, taken_by_email: null, accepted_at: null })
    .eq('meeting_id', meetingId)
    .eq('role_id', myRoleId)
  logAction(`You declined ${roleName(myRoleId)} for ${meeting.dateLabel}`)
}

// Acknowledges an auto-assigned role — status stays 'auto' (accepting
// doesn't retroactively make it "self-selected", per the rule that only
// a member's own pick counts as that), but also claims taken_by_email
// for the caller, since auto-assign only ever records taken_by_name.
export async function acceptAutoAssignedRole(meetingId) {
  const account = getAccount()
  const meeting = await getMeeting(meetingId)
  const myRoleId = meeting?.myRoleId
  if (!myRoleId) return

  await supabase
    .from('meeting_role_assignments')
    .update({ accepted_at: new Date().toISOString(), taken_by_email: account?.email })
    .eq('meeting_id', meetingId)
    .eq('role_id', myRoleId)
  logAction(`You accepted your auto-assigned ${roleName(myRoleId)} for ${meeting.dateLabel}`)
}

// Status is always system-decided, never chosen by the VPE: a name
// means it's now auto-assigned (whether the system or the VPE put it
// there), no name means it's reopened. Only a member's own self-select
// (selectRole, above) ever produces 'taken'.
export async function overrideRole(meetingId, roleId, { takenBy }) {
  const meeting = await getMeeting(meetingId)
  const { error } = await supabase
    .from('meeting_role_assignments')
    .update({
      status: takenBy ? 'auto' : 'open',
      taken_by_name: takenBy || null,
      taken_by_email: null,
      accepted_at: null,
    })
    .eq('meeting_id', meetingId)
    .eq('role_id', roleId)
  if (error) {
    console.error('[mockRolesStore] overrideRole failed:', error.message)
    throw new Error('Could not save this override — check your VPE permissions and try again.')
  }
  logAction(
    takenBy
      ? `VPE manually assigned ${roleName(roleId)} to ${takenBy} for ${meeting.dateLabel}`
      : `VPE reopened ${roleName(roleId)} for ${meeting.dateLabel}`,
  )
}

// Picks the best-fit real member (by attendance + role rotation/fairness
// — see mockRosterStore.js) for each still-open role in the meeting,
// instead of the old random-placeholder-name shift. Every successful
// pick is also recorded to role_history, so the algorithm's own output
// becomes next time's input. Uses getMeetingRaw (not the public
// getMeeting/getMeetings) so the automatic Saturday-cutoff catch-up in
// getMeetings() can call this without looping back into itself.
async function runAutoAssign(meetingId, trigger) {
  const meeting = await getMeetingRaw(meetingId)
  const usedNames = new Set(
    Object.values(meeting.roles)
      .map((entry) => entry.takenBy)
      .filter(Boolean),
  )

  const [members, roleHistory, attendanceStats] = await Promise.all([
    getMembers(),
    getRoleHistory(),
    getAttendanceStatsByMember(),
  ])

  let filledCount = 0
  const newAssignments = []
  for (const [roleId, entry] of Object.entries(meeting.roles)) {
    if (entry.status !== 'open') continue
    const available = members.filter((m) => !usedNames.has(m.name))
    if (available.length === 0) break
    const [best] = available
      .map((member) => ({
        member,
        score: scoreMemberForRole(member, roleId, roleHistory, attendanceStats),
      }))
      .sort((a, b) => b.score - a.score)
    newAssignments.push({ name: best.member.name, roleId })
    usedNames.add(best.member.name)
    filledCount += 1
  }

  for (const assignment of newAssignments) {
    await supabase
      .from('meeting_role_assignments')
      .update({ status: 'auto', taken_by_name: assignment.name, taken_by_email: null })
      .eq('meeting_id', meetingId)
      .eq('role_id', assignment.roleId)
    await recordRoleAssignment(assignment.name, assignment.roleId)
  }

  logAction(
    filledCount > 0
      ? `Auto-assign triggered by ${trigger} — ${filledCount} role${filledCount > 1 ? 's' : ''} filled for ${meeting.dateLabel}`
      : `Auto-assign triggered by ${trigger} — no open roles left for ${meeting.dateLabel}`,
  )
  return filledCount
}

export async function autoAssignMeeting(meetingId) {
  return runAutoAssign(meetingId, 'VPE')
}

// Locks in the current role assignments and announces them — same
// pushNotification pattern mockAgendaStore.js's sendAgendaToMembers()
// already uses, for consistency rather than inventing a new mechanism.
export async function finalizeMeeting(meetingId) {
  const meeting = await getMeeting(meetingId)
  await supabase.from('meetings').update({ finalized: true }).eq('id', meetingId)
  logAction(`VPE finalized roles for ${meeting.dateLabel}`)
  pushNotification({
    type: 'roles_finalized',
    message: `Roles for ${meeting.dateLabel} are finalized — check your assignment.`,
    link: '/roles',
  })
}

// Reverses finalizeMeeting — re-opens the meeting for VPE edits (override,
// re-run auto-assign) without touching any assignment rows. No
// pushNotification here (unlike finalize) — unlocking isn't something
// members need pushed at them, it just re-enables VPE editing until the
// VPE re-finalizes.
export async function unfinalizeMeeting(meetingId) {
  const meeting = await getMeeting(meetingId)
  await supabase.from('meetings').update({ finalized: false }).eq('id', meetingId)
  logAction(`VPE unlocked roles for ${meeting.dateLabel} for editing`)
}

// The single meeting that's next up: not cancelled, not yet happened.
// Used to restrict Finalize to only ever this one meeting, and to pick
// sane defaults for "next meeting" tabs/widgets across the app.
export function findNextActiveMeeting(meetings) {
  return meetings.find((m) => !m.cancelled && (m.hoursUntilMeeting ?? -1) >= 0) ?? null
}

// Only the literal next upcoming meeting can be finalized — not "any
// meeting whose predecessor has passed," which could let a VPE jump
// ahead and finalize a meeting weeks out. A meeting that's already
// happened stays finalizable (or re-finalizable, after Unlock to Edit)
// regardless, so fixing a past meeting's roles always still works.
export function canFinalizeMeeting(meetings, meetingId) {
  const meeting = meetings.find((m) => m.id === meetingId)
  if (!meeting || meeting.cancelled) return false
  if ((meeting.hoursUntilMeeting ?? -1) < 0) return true
  return findNextActiveMeeting(meetings)?.id === meetingId
}

// Derived fill/phase summary for a meeting — used by the Role Management
// page's status card, each meeting tab's chip, and the finalize-confirm
// gate. Pure — everything it needs is already on the meeting object
// returned by getMeetings(), no extra fetch.
export function getRoleFillSummary(meeting) {
  const entries = Object.values(meeting.roles)
  const filled = entries.filter((r) => r.status !== 'open').length
  const open = entries.length - filled
  const phase = meeting.finalized
    ? open > 0
      ? 'finalized-incomplete'
      : 'finalized'
    : open === 0
      ? 'ready-to-finalize'
      : meeting.pastCutoff
        ? 'past-cutoff'
        : 'self-select'
  return { total: entries.length, filled, open, phase }
}

// Cancelling doesn't touch the meeting's agenda/MOM/attendance/roles/
// photos rows at all — every consuming page checks the `cancelled` flag
// and shows a cancelled notice instead of its normal content, so the
// underlying data stays intact and un-cancelling brings it right back.
export async function cancelMeeting(meetingId, reason) {
  const meeting = await getMeeting(meetingId)
  const { error } = await supabase
    .from('meetings')
    .update({ cancelled: true, cancel_reason: reason || null })
    .eq('id', meetingId)
  if (error) {
    console.error('[mockRolesStore] cancelMeeting failed:', error.message)
    throw new Error('Could not cancel this meeting.')
  }
  logAction(`VPE cancelled ${meeting.dateLabel}${reason ? ` — ${reason}` : ''}`)
  pushNotification({
    type: 'meeting_cancelled',
    message: `${meeting.dateLabel} has been cancelled${reason ? `: ${reason}` : '.'}`,
    link: '/roles',
  })
}

export async function uncancelMeeting(meetingId) {
  const meeting = await getMeeting(meetingId)
  const { error } = await supabase
    .from('meetings')
    .update({ cancelled: false, cancel_reason: null })
    .eq('id', meetingId)
  if (error) {
    console.error('[mockRolesStore] uncancelMeeting failed:', error.message)
    throw new Error('Could not un-cancel this meeting.')
  }
  logAction(`VPE un-cancelled ${meeting.dateLabel}`)
}

// Every other meeting-scoped table (agendas, attendance,
// meeting_role_assignments, meeting_photos, moms) is keyed by meeting_id,
// not by date — so changing meeting_date here is all that's needed for
// everything tied to this meeting to follow it to the new day.
export async function rescheduleMeeting(meetingId, newDate) {
  const meeting = await getMeeting(meetingId)
  const { error } = await supabase
    .from('meetings')
    .update({ meeting_date: newDate })
    .eq('id', meetingId)
  if (error) {
    console.error('[mockRolesStore] rescheduleMeeting failed:', error.message)
    throw new Error('Could not reschedule this meeting.')
  }
  logAction(`VPE rescheduled ${meeting.dateLabel} to a new date`)
  pushNotification({
    type: 'meeting_rescheduled',
    message: `A meeting has moved — check the new date for ${meeting.label}.`,
    link: '/roles',
  })
}
