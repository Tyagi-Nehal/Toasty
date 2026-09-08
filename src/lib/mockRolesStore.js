// Real meetings + per-meeting role assignments (supabase/schema.sql:
// meetings, meeting_role_assignments — seeded once from the club's real
// meeting roster, see supabase/seed-meetings.sql). Read by the
// member-facing Role Selection page AND the VPE-facing Role Management
// page, so a manual override, auto-assign, or finalize on one side is
// reflected on the other — for real, across devices, since this is no
// longer localStorage.
//
// Function names are unchanged from the old localStorage-backed version.

import { roleCatalog, DEFAULT_ROLE_IDS } from '../data/roleCatalog.js'
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
import { scoreExternalBooking, scoreVpeFinalize, scoreRoleDecline } from './mockPointsStore.js'
import { getNameForRole } from './mockExcomRegistry.js'
import { getApprovedClubs } from './mockClubRegistry.js'

const LOG_KEY = 'toasty_role_notifications'
const MAX_LOG_ENTRIES = 25

// Presiding Officer and Sergeant at Arms are meeting-conducting roles
// always held by the same real ExCom officers, not roles any member
// picks — only the VPE assigns them (via Override), never self-select
// or auto-assign. Backed by an RLS policy of the same name/intent on
// meeting_role_assignments, not just this client-side gate.
export const VPE_ONLY_ROLE_IDS = ['po', 'saa']

// Who a fixed officer role should resolve to right now — SAA is a real
// appointed ExCom role (excom_appointments), PO isn't a separate
// appointment at all, it's always whoever's President. Used by
// fillFixedOfficerRoles below to auto-fill these two slots instead of
// leaving them for the VPE to type in by hand every meeting (which
// previously meant the per-meeting "SAA" could silently be someone
// other than the actual appointed SAA).
async function resolveFixedRoleAssignee(roleId) {
  if (roleId === 'saa') return getNameForRole('SAA')
  if (roleId === 'po') {
    const clubs = await getApprovedClubs()
    const club = clubs[0]
    return club?.presidentName ? { name: club.presidentName, email: club.presidentEmail } : null
  }
  return null
}

// Speaker/evaluator slots depend on real people committing to a specific
// speech, which often isn't locked in until much closer to the meeting
// than every other role — so finalizing shouldn't be blocked on these
// specifically, unlike every other role. Prefix-based (not a fixed
// speaker-1/2/3 list) so this still holds for any speaker/evaluator
// slot added via Role Management, not just the default 3 — e.g. a
// speech-marathon meeting with speaker-4 through speaker-6.
export function isOptionalForFinalize(roleId) {
  return roleId.startsWith('speaker-') || roleId.startsWith('evaluator-')
}

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

// No weekday, full month name, full year — used where the meeting number
// already gives context (e.g. "Meeting 1 — 4 March 2026" in Photo
// Memories) so the weekday would just be redundant clutter.
export function formatFullDate(meetingDate) {
  if (!meetingDate) return ''
  return new Date(`${meetingDate}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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
// expects — one entry per real meeting_role_assignments row, no more.
// Used to always synthesize every roleCatalog entry as 'open' regardless
// of whether a row backed it, which both hid a real bug (a role with no
// row silently failed every write — see createMeetingForDate) and made
// "this meeting doesn't have Table Topics" impossible to express: a role
// simply not being on a meeting is now itself the way to remove it (see
// addMeetingRole/removeMeetingRole below), not something the read side
// papers over.
function buildRolesObject(assignments) {
  const roles = {}
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
// Scoped to only ever the single next active meeting — members can
// self-select roles up to 3 meetings out, but auto-assign must never
// reach ahead into meeting #2 or #3 just because their own cutoff
// happens to have passed too (e.g. the VPE falling behind on finalizing
// meeting #1). Bounded to a recent window on top of that — otherwise a
// historical meeting VPPR backfills for photos (no role rows at all, so
// every role defaults to 'open', and its cutoff is always long past)
// could get swept in here too, turning one dashboard load into an
// auto-assign run across meetings never meant to have real roles.
const DUE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

async function runDueAutoAssignments(views) {
  const next = findNextActiveMeeting(views)
  const isDue =
    next &&
    !next.finalized &&
    next.pastCutoff &&
    next.autoAssignCutoff &&
    Date.now() - next.autoAssignCutoff.getTime() <= DUE_WINDOW_MS &&
    Object.values(next.roles).some((r) => r.status === 'open')
  if (!isDue) return false
  await runAutoAssign(next.id, 'the Saturday 9 AM cutoff')
  return true
}

// Opportunistic fill for PO/SAA, same shape as the auto-assign catch-up
// above — no backend/cron, so this runs whenever a VPE/President's
// session fetches meetings. Only ever touches a slot that's still
// genuinely 'open' (never overwrites a VPE's deliberate Override for a
// real exception), and only on upcoming, non-cancelled, non-finalized
// meetings — never rewrites history on a past or already-locked-in
// meeting. Self-healing: if the SAA appointment or President changes,
// every still-open slot on the next fetch picks up the new person.
async function fillFixedOfficerRoles(views) {
  const upcoming = views.filter(
    (m) => !m.cancelled && !m.finalized && (m.hoursUntilMeeting ?? -1) >= 0,
  )
  let filledAny = false
  for (const roleId of VPE_ONLY_ROLE_IDS) {
    const openOnes = upcoming.filter((m) => m.roles[roleId]?.status === 'open')
    if (openOnes.length === 0) continue
    const assignee = await resolveFixedRoleAssignee(roleId)
    if (!assignee?.name) continue
    for (const meeting of openOnes) {
      const { error } = await supabase
        .from('meeting_role_assignments')
        .update({
          status: 'auto',
          taken_by_name: assignee.name,
          taken_by_email: assignee.email ?? null,
        })
        .eq('meeting_id', meeting.id)
        .eq('role_id', roleId)
        .eq('status', 'open')
      if (!error) filledAny = true
    }
  }
  return filledAny
}

export async function getMeetings() {
  let views = await fetchRawViews()
  // hasExcomRole('VPE') already covers President too (superuser rule).
  if (hasExcomRole('VPE')) {
    const ranAutoAssign = await runDueAutoAssignments(views)
    const filledOfficers = await fillFixedOfficerRoles(views)
    if (ranAutoAssign || filledOfficers) views = await fetchRawViews()
  }
  return views
}

export async function getMeeting(meetingId) {
  const meetings = await getMeetings()
  return meetings.find((m) => m.id === meetingId)
}

export async function selectRole(meetingId, roleId) {
  if (VPE_ONLY_ROLE_IDS.includes(roleId)) {
    throw new Error('This role is assigned by the VPE, not self-selected.')
  }
  const account = getAccount()
  const meeting = await getMeeting(meetingId)
  // .eq('status', 'open') + .select() aren't just belt-and-braces here —
  // without them a role someone else just claimed (or that RLS silently
  // refuses because it's no longer 'open') updates zero rows with NO
  // error at all: Postgres doesn't treat "your WHERE matched nothing" as
  // a failure, so the old code that didn't check the result looked
  // exactly like success while doing nothing (the real bug behind
  // "Select this Role does nothing, no console error").
  const { data, error } = await supabase
    .from('meeting_role_assignments')
    .update({ status: 'taken', taken_by_name: account?.name, taken_by_email: account?.email })
    .eq('meeting_id', meetingId)
    .eq('role_id', roleId)
    .eq('status', 'open')
    .select()
  if (error) {
    console.error('[mockRolesStore] selectRole failed:', error.message)
    throw new Error('Could not select this role — check your permissions and try again.')
  }
  if (!data || data.length === 0) {
    throw new Error('This role was just taken by someone else — refresh and try another.')
  }
  logAction(`You self-selected ${roleName(roleId)} for ${meeting.dateLabel}`)
}

export async function declineMyRole(meetingId) {
  const account = getAccount()
  const meeting = await getMeeting(meetingId)
  const myRoleId = meeting?.myRoleId
  if (!myRoleId) return
  if (VPE_ONLY_ROLE_IDS.includes(myRoleId)) {
    throw new Error('This role is managed by the VPE — ask them to reassign it.')
  }

  const { data, error } = await supabase
    .from('meeting_role_assignments')
    .update({ status: 'open', taken_by_name: null, taken_by_email: null, accepted_at: null })
    .eq('meeting_id', meetingId)
    .eq('role_id', myRoleId)
    .select()
  if (error) {
    console.error('[mockRolesStore] declineMyRole failed:', error.message)
    throw new Error('Could not decline this role — check your permissions and try again.')
  }
  if (!data || data.length === 0) {
    throw new Error('Could not find your role for this meeting — try refreshing.')
  }
  await scoreRoleDecline(meeting, account)
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

  const { data, error } = await supabase
    .from('meeting_role_assignments')
    .update({ accepted_at: new Date().toISOString(), taken_by_email: account?.email })
    .eq('meeting_id', meetingId)
    .eq('role_id', myRoleId)
    .select()
  if (error) {
    console.error('[mockRolesStore] acceptAutoAssignedRole failed:', error.message)
    throw new Error('Could not accept this role — check your permissions and try again.')
  }
  if (!data || data.length === 0) {
    throw new Error('Could not find your role for this meeting — try refreshing.')
  }
  logAction(`You accepted your auto-assigned ${roleName(myRoleId)} for ${meeting.dateLabel}`)
}

// Status is always system-decided, never chosen by the VPE: a name
// means it's now auto-assigned (whether the system or the VPE put it
// there), no name means it's reopened. Only a member's own self-select
// (selectRole, above) ever produces 'taken'.
export async function overrideRole(meetingId, roleId, { takenBy, takenByEmail }) {
  const meeting = await getMeeting(meetingId)
  const { error } = await supabase
    .from('meeting_role_assignments')
    .update({
      status: takenBy ? 'auto' : 'open',
      taken_by_name: takenBy || null,
      taken_by_email: takenBy ? takenByEmail || null : null,
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
  if (takenBy) await scoreExternalBooking(takenBy, takenByEmail)
}

// Lets the VPE add a role that isn't currently on this meeting at all —
// e.g. a 4th+ speaker/evaluator pair for a speech-marathon meeting. Any
// id from roleCatalog is valid; ignoreDuplicates so accidentally
// re-adding an already-present role is a no-op, not an error.
export async function addMeetingRole(meetingId, roleId) {
  const meeting = await getMeeting(meetingId)
  const { error } = await supabase
    .from('meeting_role_assignments')
    .upsert(
      { meeting_id: meetingId, role_id: roleId, status: 'open' },
      { onConflict: 'meeting_id,role_id', ignoreDuplicates: true },
    )
  if (error) {
    console.error('[mockRolesStore] addMeetingRole failed:', error.message)
    throw new Error('Could not add this role — check your VPE permissions and try again.')
  }
  logAction(`VPE added ${roleName(roleId)} to ${meeting.dateLabel}`)
}

// Removes a role from this meeting entirely — e.g. no Table Topics this
// week. Unlike overrideRole (which reopens a role but keeps it on the
// board), this deletes the row, so it stops showing up at all: on
// Role Selection, on the Agenda's auto-generate, everywhere.
export async function removeMeetingRole(meetingId, roleId) {
  const meeting = await getMeeting(meetingId)
  const { error } = await supabase
    .from('meeting_role_assignments')
    .delete()
    .eq('meeting_id', meetingId)
    .eq('role_id', roleId)
  if (error) {
    console.error('[mockRolesStore] removeMeetingRole failed:', error.message)
    throw new Error('Could not remove this role — check your VPE permissions and try again.')
  }
  logAction(`VPE removed ${roleName(roleId)} from ${meeting.dateLabel}`)
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
    if (entry.status !== 'open' || VPE_ONLY_ROLE_IDS.includes(roleId)) continue
    const available = members.filter((m) => !usedNames.has(m.name))
    if (available.length === 0) break
    const [best] = available
      .map((member) => ({
        member,
        score: scoreMemberForRole(member, roleId, roleHistory, attendanceStats),
      }))
      .sort((a, b) => b.score - a.score)
    newAssignments.push({ name: best.member.name, email: best.member.email, roleId })
    usedNames.add(best.member.name)
    filledCount += 1
  }

  let actuallyFilledCount = 0
  for (const assignment of newAssignments) {
    // .select() so a role with no backing row (or one RLS otherwise
    // refuses) is detectable — an update matching zero rows isn't an
    // error in Postgres, so without checking this, a gap like the one
    // found in createMeetingForDate (some roles missing a row entirely)
    // would make auto-assign silently "fill" roles that never actually
    // changed in the database.
    const { data, error } = await supabase
      .from('meeting_role_assignments')
      .update({
        status: 'auto',
        taken_by_name: assignment.name,
        taken_by_email: assignment.email ?? null,
      })
      .eq('meeting_id', meetingId)
      .eq('role_id', assignment.roleId)
      .select()
    if (error) {
      console.error('[mockRolesStore] runAutoAssign failed for', assignment.roleId, error.message)
      continue
    }
    if (!data || data.length === 0) {
      console.error(
        '[mockRolesStore] runAutoAssign matched no row for',
        assignment.roleId,
        '— it may be missing from meeting_role_assignments entirely',
      )
      continue
    }
    actuallyFilledCount += 1
    await recordRoleAssignment(assignment.name, assignment.email, assignment.roleId)
  }
  filledCount = actuallyFilledCount

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
  await supabase
    .from('meetings')
    .update({ finalized: true, finalized_at: new Date().toISOString() })
    .eq('id', meetingId)
  logAction(`VPE finalized roles for ${meeting.dateLabel}`)
  pushNotification({
    type: 'roles_finalized',
    message: `Roles for ${meeting.dateLabel} are finalized — check your assignment.`,
    link: '/roles',
  })
  await scoreVpeFinalize(meeting)
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
  const requiredOpen = Object.entries(meeting.roles).filter(
    ([roleId, r]) => r.status === 'open' && !isOptionalForFinalize(roleId),
  ).length
  const phase = meeting.finalized
    ? requiredOpen > 0
      ? 'finalized-incomplete'
      : 'finalized'
    : requiredOpen === 0
      ? 'ready-to-finalize'
      : meeting.pastCutoff
        ? 'past-cutoff'
        : 'self-select'
  return { total: entries.length, filled, open, requiredOpen, phase }
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

// Lets the VPPR backfill a real historical meeting that predates the
// seeded meeting history (e.g. the club's actual first meeting on
// 2026-03-04, well before the earliest seeded row). Chronological
// position among existing meetings decides the label — assigned once
// at creation and never recomputed, so it stays stable even as more
// early meetings get backfilled later, possibly out of order.
export async function createMeetingForDate(date, time) {
  const meetings = await getMeetings()
  const position = meetings.filter((m) => m.date && m.date < date).length + 1
  const label = `Meeting ${position}`
  const { data, error } = await supabase
    .from('meetings')
    .insert({ label, meeting_date: date, time: time || '5:15 PM', finalized: false })
    .select('id')
    .single()
  if (error) {
    console.error('[mockRolesStore] createMeetingForDate failed:', error.message)
    throw new Error('Could not add this meeting.')
  }
  logAction(`Added ${label} for ${formatDateLabel(date)}`)

  // Every role in DEFAULT_ROLE_IDS gets a real row from the start — not
  // just PO/SAA, and buildRolesObject no longer synthesizes an 'open'
  // entry for a role with no row (that used to paper over a role
  // missing a row entirely, which broke every write path — selectRole,
  // overrideRole, runAutoAssign all use .update(), which silently
  // matches zero rows and does nothing against a role with no backing
  // row at all). The VPE customizes from this starter set per meeting
  // via addMeetingRole/removeMeetingRole (Role Management). PO/SAA get
  // their real current assignee filled in immediately; every other
  // default role is inserted 'open'.
  const fixedAssignees = {}
  for (const roleId of VPE_ONLY_ROLE_IDS) {
    fixedAssignees[roleId] = await resolveFixedRoleAssignee(roleId)
  }
  const rows = DEFAULT_ROLE_IDS.map((roleId) => {
    const assignee = fixedAssignees[roleId]
    return assignee?.name
      ? {
          meeting_id: data.id,
          role_id: roleId,
          status: 'auto',
          taken_by_name: assignee.name,
          taken_by_email: assignee.email ?? null,
        }
      : { meeting_id: data.id, role_id: roleId, status: 'open' }
  })
  const { error: rowsError } = await supabase.from('meeting_role_assignments').insert(rows)
  if (rowsError) {
    console.error('[mockRolesStore] createMeetingForDate role rows failed:', rowsError.message)
  }

  return label
}

// Lets the VPPR correct a meeting's auto-assigned number by hand (e.g.
// the chronological-position guess was off once more real history got
// backfilled).
export async function renameMeeting(meetingId, newLabel) {
  const trimmed = newLabel.trim()
  if (!trimmed) return
  const { error } = await supabase.from('meetings').update({ label: trimmed }).eq('id', meetingId)
  if (error) {
    console.error('[mockRolesStore] renameMeeting failed:', error.message)
    throw new Error('Could not update the meeting number.')
  }
  logAction(`Renamed a meeting to ${trimmed}`)
}
