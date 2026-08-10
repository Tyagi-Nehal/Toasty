// Central member-facing notification feed. The bell icon in MemberLayout
// (every page) and the Notifications panel on the Member Dashboard both
// read this same store, instead of the bell only working on one page.
// Real actions elsewhere in the app push into it via pushNotification()
// rather than keeping a disconnected static list: see the call sites in
// mockAgendaStore.js (agenda sent), mockPollStore.js (poll released),
// and mockRolesStore.js (VPE assigns you a role).

const STORAGE_KEY = 'toasty_notifications'
const MAX_ENTRIES = 30

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString()

const seedNotifications = [
  {
    id: 'seed-1',
    type: 'role_assigned',
    message: "You were auto-assigned the role of Table Topics Master for Thursday's meeting.",
    link: '/roles',
    time: hoursAgo(2),
    read: false,
  },
  {
    id: 'seed-2',
    type: 'agenda_updated',
    message: "The agenda for this week's meeting was updated by the VPE.",
    link: '/agenda',
    time: hoursAgo(5),
    read: false,
  },
  {
    id: 'seed-3',
    type: 'poll_released',
    message: 'Voting poll is now open — cast your vote before the meeting ends.',
    link: '/poll',
    time: hoursAgo(24),
    read: true,
  },
  {
    id: 'seed-4',
    type: 'renewal_confirmed',
    message: 'Your membership renewal was confirmed by the Treasurer.',
    link: '/profile',
    time: hoursAgo(72),
    read: true,
  },
  {
    id: 'seed-5',
    type: 'account_approved',
    message: 'Your account was approved by the VPM. Welcome to the club!',
    link: null,
    time: hoursAgo(168),
    read: true,
  },
]

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : seedNotifications
  } catch {
    return seedNotifications
  }
}

function writeState(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getNotifications() {
  return readState()
}

export function getUnreadCount() {
  return readState().filter((n) => !n.read).length
}

export function markAllRead() {
  writeState(readState().map((n) => ({ ...n, read: true })))
}

export function pushNotification({ type, message, link = null }) {
  const entry = {
    id: crypto.randomUUID(),
    type,
    message,
    link,
    time: new Date().toISOString(),
    read: false,
  }
  writeState([entry, ...readState()].slice(0, MAX_ENTRIES))
  return entry
}
