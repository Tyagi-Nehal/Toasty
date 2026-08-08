// Club registry — backed by the real MySQL database via server/index.js
// (local dev only, see server/README notes / .env.example). "Find your
// club" only ever shows clubs that went through the real submit -> founder
// review -> approve flow; no club is pre-approved, and club registration
// is itself gated behind president verification (see
// isVerifiedPresident / submitPresidentVerification below).
//
// Function names are unchanged from the old localStorage-backed version —
// only the implementation moved from sync/localStorage to async/HTTP, so
// every caller just needed `await` added.

import { get, post, patch } from './api.js'
import { sendClubApprovalEmail } from './mockEmailLog.js'

export async function getApprovedClubs() {
  const { body } = await get('/clubs?status=approved')
  return body ?? []
}

export async function getClubById(id) {
  const { ok, body } = await get(`/clubs/${id}`)
  return ok ? body : null
}

export async function getPendingClubs() {
  const { body } = await get('/clubs/pending')
  return body ?? []
}

export async function submitClubRegistration(form) {
  const { ok, body } = await post('/clubs', form)
  if (!ok) return { error: body?.error ?? 'Something went wrong. Please try again.' }
  sendClubApprovalEmail(body)
  return body
}

export async function approveClub(id) {
  await patch(`/clubs/${id}/approve`)
}

export async function rejectClub(id) {
  await patch(`/clubs/${id}/reject`)
}

// --- President verification -------------------------------------------
// A separate approval chain from club registration itself: a would-be
// president submits their details, a founder approves/rejects, and only
// an approved email can then successfully submit a club registration.

export async function submitPresidentVerification(form) {
  const { body } = await post('/presidents', form)
  return body
}

export async function getPendingPresidents() {
  const { body } = await get('/presidents/pending')
  return body ?? []
}

export async function approvePresident(id) {
  await patch(`/presidents/${id}/approve`)
}

export async function rejectPresident(id) {
  await patch(`/presidents/${id}/reject`)
}

// Single round-trip when a caller needs both pieces at once (e.g. login).
export async function verifyPresident(email) {
  if (!email) return { verified: false, name: null }
  const { body } = await get(`/presidents/verify?email=${encodeURIComponent(email)}`)
  return { verified: body?.verified ?? false, name: body?.name ?? null }
}

export async function isVerifiedPresident(email) {
  return (await verifyPresident(email)).verified
}

export async function getVerifiedPresidentName(email) {
  return (await verifyPresident(email)).name
}
