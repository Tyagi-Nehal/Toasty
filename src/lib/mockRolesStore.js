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
import { getAccount } from './mockAuth.js'
import { supabase } from './supabaseClient.js'
import {
  getMembers,
  getRoleHistory,
  recordRoleAssignment,
  scoreMemberForRole,
} from './mockRosterStore.js'

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

// Builds the { roleId: { status, takenBy } } shape every page expects,
// filling in any role from roleCatalog that has no row yet as 'open'.
function buildRolesObject(assignments) {
  const roles = {}
  for (const role of roleCatalog) {
    roles[role.id] = { status: 'open' }
  }
  for (const a of assignments) {
    roles[a.role_id] = a.taken_by_name
      ? { status: a.status, takenBy: a.taken_by_name }
      : { status: a.status }
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

export async function getMeetings() {
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

    return {
      id: m.id,
      label: m.label,
      dateLabel: formatDateLabel(m.meeting_date),
      time: m.time,
      finalized: m.finalized,
      hoursUntilMeeting,
      roles: buildRolesObject(meetingAssignments),
      myRoleId: deriveMyRoleId(meetingAssignments, account),
    }
  })
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
    .update({ status: 'open', taken_by_name: null, taken_by_email: null })
    .eq('meeting_id', meetingId)
    .eq('role_id', myRoleId)
  logAction(`You declined ${roleName(myRoleId)} for ${meeting.dateLabel}`)
}

export async function overrideRole(meetingId, roleId, { status, takenBy }) {
  const meeting = await getMeeting(meetingId)
  await supabase
    .from('meeting_role_assignments')
    .update({
      status,
      taken_by_name: takenBy || null,
      taken_by_email: null,
    })
    .eq('meeting_id', meetingId)
    .eq('role_id', roleId)
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
// becomes next time's input.
export async function autoAssignMeeting(meetingId) {
  const meeting = await getMeeting(meetingId)
  const usedNames = new Set(
    Object.values(meeting.roles)
      .map((entry) => entry.takenBy)
      .filter(Boolean),
  )

  const [members, roleHistory] = await Promise.all([getMembers(), getRoleHistory()])

  let filledCount = 0
  const newAssignments = []
  for (const [roleId, entry] of Object.entries(meeting.roles)) {
    if (entry.status !== 'open') continue
    const available = members.filter((m) => !usedNames.has(m.name))
    if (available.length === 0) break
    const [best] = available
      .map((member) => ({ member, score: scoreMemberForRole(member, roleId, roleHistory) }))
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
      ? `Auto-assign triggered by VPE — ${filledCount} role${filledCount > 1 ? 's' : ''} filled for ${meeting.dateLabel}`
      : `Auto-assign triggered by VPE — no open roles left for ${meeting.dateLabel}`,
  )
  return filledCount
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
