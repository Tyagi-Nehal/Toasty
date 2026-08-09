// Simulates the "notify the Toasty founder team by email" step for club
// registrations. There's no backend/SendGrid integration yet (see
// PROJECT_BRIEF addendum — frontend-first, backend wired up later), so this
// mirrors the localStorage-mock pattern used for other one-time actions
// (mockPollStore.js, mockMOMStore.js) and gives a single seam
// (sendClubApprovalEmail) to swap in a real email send later.

const STORAGE_KEY = 'toasty_mock_email_log'
export const TOASTY_TEAM_EMAIL = 'jointoasty@gmail.com'

function readLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLog(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function sendClubApprovalEmail(club) {
  const approvalLink = `${window.location.origin}/club-review`
  const email = {
    to: TOASTY_TEAM_EMAIL,
    subject: `New club registration: ${club.name}`,
    body: `${club.presidentName} submitted a registration for "${club.name}" (${club.city}, ${club.country}). Review and approve it at ${approvalLink}`,
    approvalLink,
    sentAt: new Date().toISOString(),
  }
  writeLog([...readLog(), email])
  console.info('[mock email]', email)
  return email
}

export function getEmailLog() {
  return readLog()
}
