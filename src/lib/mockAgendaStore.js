// Per-meeting agenda — backed by Supabase (supabase/schema.sql,
// `agendas` table) so a VPE's edits are visible to members on their own
// devices, not just in the VPE's own browser (the earlier localStorage
// version was invisible cross-device — the exact gap meetings/roles had
// before that migration).
//
// Rows are a free-form ordered list stored as JSONB (not a separate rows
// table) since the VPE can add/remove/reorder them — a meeting can have
// a different number of speakers than the last one. Row shape:
//   { id, startTime, endTime, segment, rolePlayer, name }
//
// Design note: text fields (theme, row names, etc.) are edited live via
// onChange in the UI. Writing to Supabase on every keystroke would be
// both slow and wasteful, so the page keeps the agenda in local React
// state for instant typing and calls `persistAgenda` on a short debounce
// after the user pauses — see AgendaEditorPage.jsx. Discrete actions
// (generate, add speaker, remove row, send) write immediately.

import { supabase } from './supabaseClient.js'
import { getMeeting } from './mockRolesStore.js'
import { pushNotification } from './mockNotificationsStore.js'

const LOG_KEY = 'toasty_agenda_history'
const MAX_LOG_ENTRIES = 25

// The club's standing SAA/PO — real people who hold these roles every
// meeting by convention. The agenda defaults to them regardless of what
// the role board shows for saa/po; the VPE can retype the name field any
// time, this only governs what a fresh/regenerated agenda starts with.
const DEFAULT_SAA_NAME = 'TM Durva Sharma'
const DEFAULT_PO_NAME = 'TM Sarvajit Srivatsa'

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

// snake_case DB row -> camelCase object the pages work with.
function fromRow(row) {
  if (!row) return null
  return {
    meetingId: row.meeting_id,
    dateLabel: row.date_label ?? '',
    theme: row.theme ?? '',
    wordOfDay: row.word_of_day ?? '',
    meaning: row.meaning ?? '',
    venue: row.venue ?? '',
    overallStartTime: row.overall_start_time ?? '',
    overallEndTime: row.overall_end_time ?? '',
    items: row.items ?? [],
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
    sentSnapshot: row.sent_snapshot,
  }
}

// camelCase object -> snake_case row for writes.
function toRow(meetingId, agenda) {
  return {
    meeting_id: meetingId,
    date_label: agenda.dateLabel,
    theme: agenda.theme,
    word_of_day: agenda.wordOfDay,
    meaning: agenda.meaning,
    venue: agenda.venue,
    overall_start_time: agenda.overallStartTime,
    overall_end_time: agenda.overallEndTime,
    items: agenda.items,
    updated_at: new Date().toISOString(),
    sent_at: agenda.sentAt ?? null,
    sent_snapshot: agenda.sentSnapshot ?? null,
  }
}

export async function getAgenda(meetingId) {
  const { data } = await supabase.from('agendas').select('*').eq('meeting_id', meetingId).maybeSingle()
  return fromRow(data)
}

// Silent full-record upsert — no log entry. Used by the debounced
// autosave while the VPE is typing, and internally by the discrete
// actions below (which log separately).
export async function persistAgenda(meetingId, agenda) {
  await supabase.from('agendas').upsert(toRow(meetingId, agenda), { onConflict: 'meeting_id' })
  return agenda
}

// Builds the agenda's row list matching the club's real weekly format
// (Networking / SAA / PO / TMOD+GE intro / GE+TAGL intro / per-speaker
// blocks / Table Topics / General Evaluation / closing). One speaker
// block is generated per speaker/evaluator pair that already has a real
// assignment on the role board — the VPE adds more via "+ Add Speaker"
// for meetings with a different speaker count. Preserves any header
// fields (theme/word of day/meaning/venue) already set by the VPE.
export async function generateAgenda(meetingId, existingAgenda) {
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
  function addSpeakerRows(n) {
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
  for (const n of speakerNumbers) addSpeakerRows(n)

  addRow('Table Topic Master Introduction by TMOD', 'TMOD', tmod, 1)
  addRow('Table Topics Session', 'TTM', named('ttm'), 15)
  addRow('Toastmaster Of The Day + GE Introduction', 'TMOD', tmod, 6)
  addRow('General Evaluation Session', 'GE', named('ge'), 28)
  addRow('Toastmaster of the Day', 'TMOD', tmod, 5)
  addRow('Presiding Officer Address + Poll Session', 'PO', DEFAULT_PO_NAME, 10)
  const overallStartTime = minutesToTime(timeToMinutes('05:00 PM'))
  addRow('Networking', 'All', 'All', 10)
  const overallEndTime = minutesToTime(cursor)

  const agenda = {
    meetingId,
    dateLabel: meeting.dateLabel,
    theme: existingAgenda?.theme ?? meeting.theme ?? '',
    wordOfDay: existingAgenda?.wordOfDay ?? '',
    meaning: existingAgenda?.meaning ?? '',
    venue: existingAgenda?.venue ?? '',
    overallStartTime,
    overallEndTime,
    items,
    updatedAt: new Date().toISOString(),
    sentAt: null,
    sentSnapshot: null,
  }
  await persistAgenda(meetingId, agenda)
  logAction(`Agenda auto-generated from confirmed roles for ${meeting.dateLabel}`)
  return agenda
}

// "+ Add Speaker" — inserts the standard 4-row block (TMOD+Evaluator
// intro, Speech Guidelines, TMOD+Speaker intro, Speech Delivery) for the
// next speaker number, right before Table Topics. Every row it creates
// is independently editable/deletable like any other row afterward.
export async function addSpeakerBlock(meetingId, agenda) {
  const n = agenda.items.filter((i) => i.segment === 'Speech Delivery').length + 1
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
  const insertIndex = agenda.items.findIndex(
    (i) => i.segment === 'Table Topic Master Introduction by TMOD',
  )
  const items =
    insertIndex === -1
      ? [...agenda.items, ...newRows]
      : [...agenda.items.slice(0, insertIndex), ...newRows, ...agenda.items.slice(insertIndex)]
  const next = { ...agenda, items, updatedAt: new Date().toISOString() }
  await persistAgenda(meetingId, next)
  logAction(`VPE added Speaker ${n} to the agenda for ${agenda.dateLabel}`)
  return next
}

export async function removeAgendaRow(meetingId, agenda, itemId) {
  const removed = agenda.items.find((i) => i.id === itemId)
  const next = {
    ...agenda,
    items: agenda.items.filter((i) => i.id !== itemId),
    updatedAt: new Date().toISOString(),
  }
  await persistAgenda(meetingId, next)
  if (removed) logAction(`VPE removed "${removed.segment}" from the agenda for ${agenda.dateLabel}`)
  return next
}

export async function sendAgendaToMembers(meetingId, agenda) {
  const next = { ...agenda, sentAt: new Date().toISOString(), sentSnapshot: agenda.items }
  await persistAgenda(meetingId, next)
  logAction(`Agenda sent to members for ${agenda.dateLabel}`)
  pushNotification({
    type: 'agenda_updated',
    message: `The agenda for ${agenda.dateLabel} was sent to members.`,
    link: '/agenda',
  })
  return next
}

// Describes what changed since the agenda was last sent, so both the editor
// and the member view can show the same "Agenda Updated" summary. Rows are
// compared by their own id (segment text can repeat, e.g. multiple "TMOD"
// rows), and added/removed rows are called out too since the row list
// itself can now change shape.
export function getAgendaChangeSummary(agenda) {
  if (!agenda?.sentAt || !agenda.sentSnapshot) return null
  const changes = []
  for (const item of agenda.items) {
    const before = agenda.sentSnapshot.find((s) => s.id === item.id)
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
  const removedCount = agenda.sentSnapshot.filter(
    (s) => !agenda.items.some((i) => i.id === s.id),
  ).length
  if (removedCount > 0) changes.push(`${removedCount} row${removedCount > 1 ? 's' : ''} removed`)
  return changes.length > 0 ? changes.join('; ') : null
}
