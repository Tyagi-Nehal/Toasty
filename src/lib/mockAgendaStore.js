// Shared source of truth for a meeting's agenda — read by the
// member-facing Agenda page AND written by the VPE-facing Agenda Editor.
// Still localStorage (unlike meetings/roles, which now live in Supabase)
// — the agenda is just a generated/editable view derived from the real
// role assignments, not something that needs its own cross-device sync
// for this pass. Keyed by meetingId, one localStorage record per meeting.
//
// Agenda rows are a free-form ordered list (not fixed 1:1 by roleId) so
// the VPE can add/remove rows — a meeting can have a different number of
// speakers than the last one. Row shape:
//   { id, startTime, endTime, segment, rolePlayer, name }

import { getMeeting } from './mockRolesStore.js'
import { pushNotification } from './mockNotificationsStore.js'

const STORAGE_KEY = 'toasty_agendas'
const LOG_KEY = 'toasty_agenda_history'
const MAX_LOG_ENTRIES = 25

// The club's standing SAA/PO — real people who hold these roles every
// meeting by convention. The agenda defaults to them regardless of what
// the role board shows for saa/po; the VPE can retype the name field any
// time, this only governs what a fresh/regenerated agenda starts with.
const DEFAULT_SAA_NAME = 'TM Durva Sharma'
const DEFAULT_PO_NAME = 'TM Sarvajit Srivatsa'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
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

function timeToMinutes(time) {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return 0
  let [, hours, minutes, meridiem] = match
  hours = Number(hours) % 12
  if (meridiem.toUpperCase() === 'PM') hours += 12
  return hours * 60 + Number(minutes)
}

function minutesToTime(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  let hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  const meridiem = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`
}

export function getAgenda(meetingId) {
  return readAll()[meetingId] ?? null
}

// Builds the agenda's row list matching the club's real weekly format
// (Networking / SAA / PO / TMOD+GE intro / GE+TAGL intro / per-speaker
// blocks / Table Topics / General Evaluation / closing). One speaker
// block is generated per speaker/evaluator pair that already has a real
// assignment on the role board — the VPE adds more via "+ Add Speaker"
// for meetings with a different speaker count.
export async function generateAgenda(meetingId) {
  const meeting = await getMeeting(meetingId)
  const named = (roleId) => {
    const takenBy = meeting.roles[roleId]?.takenBy
    return takenBy ? `TM ${takenBy}` : ''
  }
  const tmod = named('tmod')

  const items = []
  let cursor = timeToMinutes('05:00 PM')
  function addRow(segment, rolePlayer, name, durationMin) {
    const startTime = minutesToTime(cursor)
    cursor += durationMin
    items.push({
      id: crypto.randomUUID(),
      startTime,
      endTime: minutesToTime(cursor),
      segment,
      rolePlayer,
      name,
    })
  }
  function addSpeakerBlock(n) {
    addRow(`Toastmaster of the Day + Evaluator ${n} Introduction`, 'TMOD', tmod, 1)
    addRow('Speech Guidelines', 'Evaluator', named(`evaluator-${n}`), 1)
    addRow('Toastmaster of the Day + Speaker Introduction', 'TMOD', tmod, 1)
    addRow('Speech Delivery', 'Speaker', named(`speaker-${n}`), 15)
  }

  addRow('Networking', 'All', 'All', 15)
  addRow('Sergeant At Arms Address', 'SAA', DEFAULT_SAA_NAME, 3)
  addRow('Presiding Officer Address', 'PO', DEFAULT_PO_NAME, 4)
  addRow(
    'Toastmaster of the Day Address + General Evaluator Introduction',
    'TMOD',
    tmod,
    4,
  )
  addRow(
    'General Evaluator + TAGL Team Introduction',
    'GE\nTIMER\nAH COUNTER\nGRAMMARIAN\nLISTENER',
    [named('ge'), named('timer'), named('ah-counter'), named('grammarian'), named('listener')].join(
      '\n',
    ),
    6,
  )

  const speakerNumbers = ['1', '2', '3'].filter((n) => {
    const status = meeting.roles[`speaker-${n}`]?.status
    return status && status !== 'open'
  })
  for (const n of speakerNumbers) addSpeakerBlock(n)

  addRow('Table Topic Master Introduction by TMOD', 'TMOD', tmod, 1)
  addRow('Table Topics Session', 'TTM', named('ttm'), 15)
  addRow('Toastmaster Of The Day + GE Introduction', 'TMOD', tmod, 6)
  addRow('General Evaluation Session', 'GE', named('ge'), 28)
  addRow('Toastmaster of the Day', 'TMOD', tmod, 5)
  addRow('Presiding Officer Address + Poll Session', 'PO', DEFAULT_PO_NAME, 10)
  const overallStartTime = minutesToTime(timeToMinutes('05:00 PM'))
  addRow('Networking', 'All', 'All', 10)
  const overallEndTime = minutesToTime(cursor)

  const existing = readAll()[meetingId]
  const state = {
    meetingId,
    dateLabel: meeting.dateLabel,
    theme: existing?.theme ?? meeting.theme ?? '',
    wordOfDay: existing?.wordOfDay ?? '',
    meaning: existing?.meaning ?? '',
    venue: existing?.venue ?? '',
    overallStartTime,
    overallEndTime,
    items,
    updatedAt: new Date().toISOString(),
    sentAt: null,
    sentSnapshot: null,
  }
  const all = readAll()
  writeAll({ ...all, [meetingId]: state })
  logAction(`Agenda auto-generated from confirmed roles for ${meeting.dateLabel}`)
  return state
}

// Header fields (theme, word of the day, meaning, venue, overall start/
// end time) — separate from the per-row updater below since they live
// directly on the agenda record, not inside `items`.
export function updateAgendaField(meetingId, field, value) {
  const all = readAll()
  const state = all[meetingId]
  if (!state) return null
  const next = { ...state, [field]: value, updatedAt: new Date().toISOString() }
  writeAll({ ...all, [meetingId]: next })
  return next
}

export function updateAgendaItem(meetingId, itemId, field, value) {
  const all = readAll()
  const state = all[meetingId]
  if (!state) return null
  const next = {
    ...state,
    items: state.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    updatedAt: new Date().toISOString(),
  }
  writeAll({ ...all, [meetingId]: next })
  return next
}

// "+ Add Speaker" — inserts the standard 4-row block (TMOD+Evaluator
// intro, Speech Guidelines, TMOD+Speaker intro, Speech Delivery) for the
// next speaker number, right before Table Topics. Every row it creates
// is independently editable/deletable like any other row afterward.
export function addSpeakerBlock(meetingId) {
  const all = readAll()
  const state = all[meetingId]
  if (!state) return null
  const n = state.items.filter((i) => i.segment === 'Speech Delivery').length + 1
  const newRows = [
    {
      id: crypto.randomUUID(),
      startTime: '',
      endTime: '',
      segment: `Toastmaster of the Day + Evaluator ${n} Introduction`,
      rolePlayer: 'TMOD',
      name: '',
    },
    {
      id: crypto.randomUUID(),
      startTime: '',
      endTime: '',
      segment: 'Speech Guidelines',
      rolePlayer: 'Evaluator',
      name: '',
    },
    {
      id: crypto.randomUUID(),
      startTime: '',
      endTime: '',
      segment: 'Toastmaster of the Day + Speaker Introduction',
      rolePlayer: 'TMOD',
      name: '',
    },
    {
      id: crypto.randomUUID(),
      startTime: '',
      endTime: '',
      segment: 'Speech Delivery',
      rolePlayer: 'Speaker',
      name: '',
    },
  ]
  const insertIndex = state.items.findIndex(
    (i) => i.segment === 'Table Topic Master Introduction by TMOD',
  )
  const items =
    insertIndex === -1
      ? [...state.items, ...newRows]
      : [...state.items.slice(0, insertIndex), ...newRows, ...state.items.slice(insertIndex)]
  const next = { ...state, items, updatedAt: new Date().toISOString() }
  writeAll({ ...all, [meetingId]: next })
  logAction(`VPE added Speaker ${n} to the agenda for ${state.dateLabel}`)
  return next
}

export function removeAgendaRow(meetingId, itemId) {
  const all = readAll()
  const state = all[meetingId]
  if (!state) return null
  const removed = state.items.find((i) => i.id === itemId)
  const next = {
    ...state,
    items: state.items.filter((i) => i.id !== itemId),
    updatedAt: new Date().toISOString(),
  }
  writeAll({ ...all, [meetingId]: next })
  if (removed) logAction(`VPE removed "${removed.segment}" from the agenda for ${state.dateLabel}`)
  return next
}

export function sendAgendaToMembers(meetingId) {
  const all = readAll()
  const state = all[meetingId]
  if (!state) return null
  const next = { ...state, sentAt: new Date().toISOString(), sentSnapshot: state.items }
  writeAll({ ...all, [meetingId]: next })
  logAction(`Agenda sent to members for ${state.dateLabel}`)
  pushNotification({
    type: 'agenda_updated',
    message: `The agenda for ${state.dateLabel} was sent to members.`,
    link: '/agenda',
  })
  return next
}

// Describes what changed since the agenda was last sent, so both the editor
// and the member view can show the same "Agenda Updated" summary. Rows are
// compared by their own id now (segment text can repeat, e.g. multiple
// "TMOD" rows), and added/removed rows are called out too since the row
// list itself can now change shape.
export function getAgendaChangeSummary(state) {
  if (!state?.sentAt || !state.sentSnapshot) return null
  const changes = []
  for (const item of state.items) {
    const before = state.sentSnapshot.find((s) => s.id === item.id)
    if (!before) {
      changes.push(`${item.segment} added`)
      continue
    }
    if (before.name !== item.name) {
      changes.push(
        `${item.segment} changed from ${before.name || 'Unassigned'} to ${item.name || 'Unassigned'}`,
      )
    } else if (before.startTime !== item.startTime || before.endTime !== item.endTime) {
      changes.push(`${item.segment} time updated`)
    }
  }
  const removedCount = state.sentSnapshot.filter(
    (s) => !state.items.some((i) => i.id === s.id),
  ).length
  if (removedCount > 0) changes.push(`${removedCount} row${removedCount > 1 ? 's' : ''} removed`)
  return changes.length > 0 ? changes.join('; ') : null
}
