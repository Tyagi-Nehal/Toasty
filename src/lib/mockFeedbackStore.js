// Anonymous feedback, shared between the member Feedback Page (submit +
// view own past submissions) and the President's Feedback Inbox.
//
// `authorEmail` is stored so a member can filter to "their" submissions,
// but the President-facing inbox view must never read or display it —
// that's what keeps submissions anonymous to the President, per spec.

const STORAGE_KEY = 'toasty_feedback'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getAllFeedback() {
  return readAll().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
}

export function getMyFeedback(authorEmail) {
  return getAllFeedback().filter((item) => item.authorEmail === authorEmail)
}

export function submitFeedback({ subject, message, authorEmail }) {
  const item = {
    id: crypto.randomUUID(),
    subject,
    message,
    authorEmail,
    submittedAt: new Date().toISOString(),
    read: false,
    resolved: false,
    presidentNote: '',
  }
  writeAll([...readAll(), item])
  return item
}

export function markRead(id) {
  writeAll(readAll().map((item) => (item.id === id ? { ...item, read: true } : item)))
}

export function toggleResolved(id) {
  writeAll(
    readAll().map((item) =>
      item.id === id ? { ...item, resolved: !item.resolved } : item,
    ),
  )
}

export function setPresidentNote(id, note) {
  writeAll(
    readAll().map((item) => (item.id === id ? { ...item, presidentNote: note } : item)),
  )
}
