// ExCom appointments: a President pre-registers members by role + email
// from /register-excom. Logging in with a pre-registered email grants
// that role's dashboard automatically — this is what replaces the old
// "Prototype: view as" dev shortcut with a real (mocked) role-assignment
// flow. Persisted to localStorage like the other mock stores.

const STORAGE_KEY = 'toasty_excom_appointments'

function normalizeEmail(email) {
  return (email ?? '').trim().toLowerCase()
}

function readAppointments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAppointments(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getExcomAppointments() {
  return readAppointments()
}

export function registerExcomMember({ role, name, email, appointedByEmail }) {
  const entry = {
    id: crypto.randomUUID(),
    role,
    name,
    email: normalizeEmail(email),
    appointedByEmail: normalizeEmail(appointedByEmail),
    appointedAt: new Date().toISOString(),
  }
  writeAppointments([...readAppointments(), entry])
  return entry
}

export function removeExcomMember(id) {
  writeAppointments(readAppointments().filter((a) => a.id !== id))
}

// Returns the role for a pre-registered email, or null if none exists.
// If someone was registered for multiple roles, the most recent wins.
export function getRoleForEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  const matches = readAppointments().filter((a) => a.email === normalized)
  if (matches.length === 0) return null
  return matches[matches.length - 1].role
}
