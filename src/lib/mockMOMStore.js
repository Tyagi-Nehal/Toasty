// MOM submissions, keyed by meetingId now that there's more than one
// real meeting (was a single flat record). Still localStorage — this is
// a form/structure fix, not a cross-device sync feature.

const STORAGE_KEY = 'toasty_submitted_moms'

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

export function getSubmittedMOM(meetingId) {
  return readAll()[meetingId] ?? null
}

export function getAllSubmittedMOMs() {
  return readAll()
}

export function saveSubmittedMOM(meetingId, mom, meta) {
  const record = { ...mom, ...meta, submittedAt: new Date().toISOString() }
  const all = readAll()
  writeAll({ ...all, [meetingId]: record })
  return record
}
