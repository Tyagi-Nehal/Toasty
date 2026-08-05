const STORAGE_KEY = 'toasty_submitted_mom'

export function getSubmittedMOM() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSubmittedMOM(mom, meta) {
  const record = { ...mom, ...meta, submittedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  return record
}
