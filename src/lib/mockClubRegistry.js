// Club registry: "Find your club" only ever shows clubs that went through
// the real submit -> founder review -> approve flow. No club (including the
// real MAHE Bengaluru club) is pre-approved — it must be registered via
// /register-club and approved at /club-review like any other club, so the
// dropdown starts empty rather than implying clubs exist before they've
// actually registered. Persisted to localStorage like the other mock stores.

import { sendClubApprovalEmail } from './mockEmailLog.js'

const STORAGE_KEY = 'toasty_club_registrations'

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
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
  clubName,
  clubId,
  district,
  area,
  memberCount,
  foundedYear,
  city,
  country,
}) {
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
