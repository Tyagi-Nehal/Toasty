// Shared source of truth for the current meeting's agenda — read by the
// member-facing Agenda page AND written by the VPE-facing Agenda Editor, so
// a generate/edit/send on one side is reflected on the other. Persisted to
// localStorage like the other shared mock stores (mockRolesStore.js,
// mockMOMStore.js).

import { getMeeting } from './mockRolesStore.js'
import { roleCatalog } from '../data/roleCatalog.js'

const STORAGE_KEY = 'toasty_agenda'
const LOG_KEY = 'toasty_agenda_history'
const MAX_LOG_ENTRIES = 25

const MEETING_ID = 'meeting-1'
const THEME = 'Turning Points'

// Order + time slots the agenda is generated in — independent of the role
// catalog's own ordering.
const TIME_TEMPLATE = [
  ['po', '5:15 – 5:20 PM'],
  ['tmod', '5:20 – 5:25 PM'],
  ['timer', '5:25 – 5:28 PM'],
  ['ah-counter', '5:28 – 5:31 PM'],
  ['grammarian', '5:31 – 5:34 PM'],
  ['listener', '5:34 – 5:37 PM'],
  ['speaker-1', '5:37 – 5:47 PM'],
  ['evaluator-1', '5:47 – 5:57 PM'],
  ['speaker-2', '5:57 – 6:07 PM'],
  ['evaluator-2', '6:07 – 6:17 PM'],
  ['ttm', '6:17 – 6:35 PM'],
  ['ge', '6:35 – 6:50 PM'],
]

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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

export function getAgendaHistory() {
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

function displayName(takenBy) {
  if (!takenBy) return ''
  return takenBy === '__me__' ? 'You' : takenBy
}

export function getAgenda() {
  return readState()
}

export function generateAgenda() {
  const meeting = getMeeting(MEETING_ID)
  const items = TIME_TEMPLATE.map(([roleId, time]) => ({
    roleId,
    time,
    member: displayName(meeting.roles[roleId]?.takenBy),
    notes: '',
  }))
  const state = {
    meetingId: MEETING_ID,
    dateLabel: meeting.dateLabel,
    theme: THEME,
    items,
    updatedAt: new Date().toISOString(),
    sentAt: null,
    sentSnapshot: null,
  }
  writeState(state)
  logAction(`Agenda auto-generated from confirmed roles for ${meeting.dateLabel}`)
  return state
}

export function updateAgendaItem(roleId, field, value) {
  const state = readState()
  if (!state) return null
  const next = {
    ...state,
    items: state.items.map((item) =>
      item.roleId === roleId ? { ...item, [field]: value } : item,
    ),
    updatedAt: new Date().toISOString(),
  }
  writeState(next)
  const fieldLabel = field === 'member' ? 'assigned member' : field
  logAction(`VPE updated ${fieldLabel} for ${roleName(roleId)}`)
  return next
}

export function sendAgendaToMembers() {
  const state = readState()
  if (!state) return null
  const next = { ...state, sentAt: new Date().toISOString(), sentSnapshot: state.items }
  writeState(next)
  logAction(`Agenda sent to members for ${state.dateLabel}`)
  return next
}

// Describes what changed since the agenda was last sent, so both the editor
// and the member view can show the same "Agenda Updated" summary.
export function getAgendaChangeSummary(state) {
  if (!state?.sentAt || !state.sentSnapshot) return null
  const changes = []
  for (const item of state.items) {
    const before = state.sentSnapshot.find((s) => s.roleId === item.roleId)
    if (!before) continue
    if (before.member !== item.member) {
      changes.push(
        `${roleName(item.roleId)} changed from ${before.member || 'Unassigned'} to ${
          item.member || 'Unassigned'
        }`,
      )
    } else if (before.time !== item.time) {
      changes.push(`${roleName(item.roleId)} time updated`)
    } else if (before.notes !== item.notes) {
      changes.push(`${roleName(item.roleId)} notes updated`)
    }
  }
  return changes.length > 0 ? changes.join('; ') : null
}
