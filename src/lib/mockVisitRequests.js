// "I'm interested in visiting" requests — replaces JoinClubModal's old
// dead-end local state (it claimed to notify the VPM/President but never
// actually persisted or notified anyone). Submitting now: (1) stores the
// request for the VPM to review, (2) pushes a real notification, and
// (3) remembers the submitting browser's own request so the Club Home
// page can show a one-time "VPM acknowledged your visit request" banner
// — there's no real visitor account/session to notify otherwise.

import { pushNotification } from './mockNotificationsStore.js'

const STORAGE_KEY = 'toasty_visit_requests'
const LOG_KEY = 'toasty_visit_requests_log'
const MAX_LOG_ENTRIES = 25
const MY_REQUEST_KEY = 'toasty_my_visit_request_id'

function readRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeRequests(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
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

export function getVisitRequestsLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function submitVisitRequest({ clubId, clubName, name, email, phone, message, visitDate }) {
  const entry = {
    id: crypto.randomUUID(),
    clubId,
    clubName,
    name,
    email,
    phone,
    message,
    visitDate,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    acknowledgedAt: null,
  }
  writeRequests([entry, ...readRequests()])
  logAction(`${name} submitted a visit request for ${clubName}`)
  pushNotification({
    type: 'visit_request',
    message: `${name} is interested in visiting ${clubName}.`,
    link: '/approvals',
  })
  localStorage.setItem(MY_REQUEST_KEY, entry.id)
  return entry
}

export function getVisitRequests() {
  return readRequests()
}

export function acknowledgeVisitRequest(id) {
  const list = readRequests()
  const entry = list.find((r) => r.id === id)
  if (!entry) return
  writeRequests(
    list.map((r) =>
      r.id === id ? { ...r, status: 'acknowledged', acknowledgedAt: new Date().toISOString() } : r,
    ),
  )
  logAction(`VPM acknowledged ${entry.name}'s visit request for ${entry.clubName}`)
}

// For the submitting browser only — returns the acknowledged request once,
// so Club Home can show a banner, then call dismissMyAcknowledgment() so
// it doesn't reappear on every visit.
export function getMyPendingAcknowledgment() {
  const myId = localStorage.getItem(MY_REQUEST_KEY)
  if (!myId) return null
  const entry = readRequests().find((r) => r.id === myId)
  return entry?.status === 'acknowledged' ? entry : null
}

export function dismissMyAcknowledgment() {
  localStorage.removeItem(MY_REQUEST_KEY)
}
