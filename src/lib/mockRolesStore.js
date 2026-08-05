// Shared source of truth for meeting role assignments — read by the
// member-facing Role Selection page AND the VPE-facing Role Management
// page, so a manual override or auto-assign run on one side is reflected
// on the other. Persisted to localStorage like the other one-time/shared
// mock stores (mockMOMStore.js, mockPollStore.js).
//
// `myRoleId` is derived on read (whichever role has takenBy === '__me__')
// rather than stored, so it can never drift out of sync with `roles`.

import { initialMeetings } from '../data/mockMeetings.js'
import { roleCatalog } from '../data/roleCatalog.js'
import { pushNotification } from './mockNotificationsStore.js'

const MEETINGS_KEY = 'toasty_meetings'
const LOG_KEY = 'toasty_role_notifications'
const MAX_LOG_ENTRIES = 25

// Generic placeholder pool established across the mock data — never real names.
const NAME_POOL = [
  'Riya', 'Kabir', 'Ananya', 'Dev', 'Meera', 'Neha', 'Vikram',
  'Priyanka', 'Rohan', 'Aarav', 'Diya', 'Simran', 'Arjun', 'Tanvi',
]

function readMeetings() {
  try {
    const raw = localStorage.getItem(MEETINGS_KEY)
    return raw ? JSON.parse(raw) : initialMeetings
  } catch {
    return initialMeetings
  }
}

function writeMeetings(meetings) {
  localStorage.setItem(MEETINGS_KEY, JSON.stringify(meetings))
}

function withDerivedMyRoleId(meeting) {
  const myRoleId =
    Object.entries(meeting.roles).find(([, entry]) => entry.takenBy === '__me__')?.[0] ??
    null
  return { ...meeting, myRoleId }
}

export function getMeetings() {
  return readMeetings().map(withDerivedMyRoleId)
}

export function getMeeting(meetingId) {
  return getMeetings().find((m) => m.id === meetingId)
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

export function selectRole(meetingId, roleId) {
  const meetings = readMeetings()
  const meeting = meetings.find((m) => m.id === meetingId)
  writeMeetings(
    meetings.map((m) =>
      m.id !== meetingId
        ? m
        : { ...m, roles: { ...m.roles, [roleId]: { status: 'taken', takenBy: '__me__' } } },
    ),
  )
  logAction(`You self-selected ${roleName(roleId)} for ${meeting.dateLabel}`)
}

export function declineMyRole(meetingId) {
  const meetings = readMeetings()
  const meeting = meetings.find((m) => m.id === meetingId)
  const myRoleId = Object.entries(meeting.roles).find(
    ([, entry]) => entry.takenBy === '__me__',
  )?.[0]
  if (!myRoleId) return

  writeMeetings(
    meetings.map((m) =>
      m.id !== meetingId
        ? m
        : { ...m, roles: { ...m.roles, [myRoleId]: { status: 'open' } } },
    ),
  )
  logAction(`You declined ${roleName(myRoleId)} for ${meeting.dateLabel}`)
}

export function overrideRole(meetingId, roleId, { status, takenBy }) {
  const meetings = readMeetings()
  const meeting = meetings.find((m) => m.id === meetingId)
  writeMeetings(
    meetings.map((m) =>
      m.id !== meetingId
        ? m
        : {
            ...m,
            roles: {
              ...m.roles,
              [roleId]: takenBy ? { status, takenBy } : { status },
            },
          },
    ),
  )
  logAction(
    takenBy
      ? `VPE manually assigned ${roleName(roleId)} to ${takenBy} for ${meeting.dateLabel}`
      : `VPE reopened ${roleName(roleId)} for ${meeting.dateLabel}`,
  )
  if (takenBy === '__me__') {
    pushNotification({
      type: 'role_assigned',
      message: `You were assigned the role of ${roleName(roleId)} for ${meeting.dateLabel} by the VPE.`,
      link: '/roles',
    })
  }
}

export function autoAssignMeeting(meetingId) {
  const meetings = readMeetings()
  const meeting = meetings.find((m) => m.id === meetingId)
  const usedNames = new Set(
    Object.values(meeting.roles)
      .map((entry) => entry.takenBy)
      .filter(Boolean),
  )
  const available = NAME_POOL.filter((name) => !usedNames.has(name))

  let filledCount = 0
  const updatedRoles = { ...meeting.roles }
  for (const [roleId, entry] of Object.entries(meeting.roles)) {
    if (entry.status !== 'open') continue
    const name = available.shift()
    if (!name) break
    updatedRoles[roleId] = { status: 'auto', takenBy: name }
    filledCount += 1
  }

  writeMeetings(
    meetings.map((m) => (m.id !== meetingId ? m : { ...m, roles: updatedRoles })),
  )
  logAction(
    filledCount > 0
      ? `Auto-assign triggered by VPE — ${filledCount} role${filledCount > 1 ? 's' : ''} filled for ${meeting.dateLabel}`
      : `Auto-assign triggered by VPE — no open roles left for ${meeting.dateLabel}`,
  )
  return filledCount
}
