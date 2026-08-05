// Prototype-only "founder" access (Isha & Nehal) for reviewing new club
// registrations — no real auth exists yet, same mock pattern as mockAuth.js.

const STORAGE_KEY = 'toasty_is_founder'

export function isFounder() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function setFounder(value) {
  if (value) {
    localStorage.setItem(STORAGE_KEY, 'true')
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}
