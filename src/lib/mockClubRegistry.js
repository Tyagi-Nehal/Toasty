// Club registry: "Find your club" only ever shows clubs that went through
// the real submit -> founder review -> approve flow. No club (including the
// real MAHE Bengaluru club) is pre-approved — it must be registered via
// /register-club and approved at /club-review like any other club, so the
// dropdown starts empty rather than implying clubs exist before they've
// actually registered. Persisted to localStorage like the other mock stores.
//
// Club registration is itself gated behind president verification: a
// president must first be approved via /register-president before their
// email can successfully submit a club registration (see
// isVerifiedPresident / submitPresidentVerification below).

import { sendClubApprovalEmail } from './mockEmailLog.js'

const STORAGE_KEY = 'toasty_club_registrations'
const PRESIDENTS_KEY = 'toasty_president_verifications'

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function normalizeEmail(email) {
  return (email ?? '').trim().toLowerCase()
}

function readRegistrations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeRegistrations(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getApprovedClubs() {
  return readRegistrations().filter((c) => c.status === 'approved')
}

export function getClubById(id) {
  return getApprovedClubs().find((c) => c.id === id) ?? null
}

export function getPendingClubs() {
  return readRegistrations()
    .filter((c) => c.status === 'pending')
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
}

export function submitClubRegistration({
  name,
  presidentEmail,
  clubName,
  clubId,
  district,
  area,
  memberCount,
  foundedYear,
  city,
  country,
  meetingDay,
  meetingTime,
  meetingLocation,
}) {
  if (!isVerifiedPresident(presidentEmail)) {
    return { error: 'You are not a registered president.' }
  }

  const entry = {
    id: slugify(clubName),
    name: clubName,
    clubId,
    district,
    area,
    members: Number(memberCount) || 0,
    foundedYear,
    city,
    country,
    location: `${city}, ${country}`,
    presidentName: name,
    presidentEmail: normalizeEmail(presidentEmail),
    meetingDay,
    meetingTime,
    meetingLocation,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  }
  writeRegistrations([...readRegistrations(), entry])
  sendClubApprovalEmail(entry)
  return entry
}

export function approveClub(id) {
  writeRegistrations(
    readRegistrations().map((c) => (c.id === id ? { ...c, status: 'approved' } : c)),
  )
}

export function rejectClub(id) {
  writeRegistrations(
    readRegistrations().map((c) => (c.id === id ? { ...c, status: 'rejected' } : c)),
  )
}

// --- President verification -------------------------------------------
// A separate approval chain from club registration itself: a would-be
// president submits their details, a founder approves/rejects, and only
// an approved email can then successfully submit a club registration.

function readPresidents() {
  try {
    const raw = localStorage.getItem(PRESIDENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writePresidents(list) {
  localStorage.setItem(PRESIDENTS_KEY, JSON.stringify(list))
}

export function submitPresidentVerification({ name, memberId, clubName, email, phone }) {
  const entry = {
    id: crypto.randomUUID(),
    name,
    memberId,
    clubName,
    email: normalizeEmail(email),
    phone,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  }
  writePresidents([...readPresidents(), entry])
  return entry
}

export function getPendingPresidents() {
  return readPresidents()
    .filter((p) => p.status === 'pending')
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
}

export function approvePresident(id) {
  writePresidents(
    readPresidents().map((p) => (p.id === id ? { ...p, status: 'approved' } : p)),
  )
}

export function rejectPresident(id) {
  writePresidents(
    readPresidents().map((p) => (p.id === id ? { ...p, status: 'rejected' } : p)),
  )
}

export function isVerifiedPresident(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return false
  return readPresidents().some(
    (p) => p.status === 'approved' && p.email === normalized,
  )
}
