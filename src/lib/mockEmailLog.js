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

// Drafted content only — no real email service is wired up yet (see
// PROJECT_BRIEF addendum). This is what would be sent to a visitor once
// the VPM acknowledges their "I'm visiting" request; logged the same way
// as sendClubApprovalEmail so it's visible via getEmailLog().
export function draftVisitWelcomeEmail(request, club) {
  const meetingLine = [club.meetingDay, club.meetingTime].filter(Boolean).join(', ')
  const email = {
    to: request.email,
    subject: `You're welcome at ${club.name}!`,
    body: `Hi ${request.name},

Thank you for your interest in visiting ${club.name}! The whole team is excited to have you join us.

Here are the details for our next meeting:
${meetingLine ? `When: ${meetingLine}` : ''}
${club.meetingLocation ? `Where: ${club.meetingLocation}` : ''}

Just show up and introduce yourself — we'll take care of the rest. If you have any questions before then, feel free to reply to this email.

See you soon!
${club.name}`,
    sentAt: new Date().toISOString(),
  }
  writeLog([...readLog(), email])
  console.info('[mock email]', email)
  return email
}

export function getEmailLog() {
  return readLog()
}
