// Club registry — backed by Supabase (supabase/schema.sql). "Find your
// club" only ever shows clubs that went through the real submit -> founder
// review -> approve flow; no club is pre-approved, and club registration
// is itself gated behind president verification (see isVerifiedPresident /
// submitPresidentVerification below) — enforced by a Postgres trigger, not
// just client-side, so it can't be bypassed from the browser console.
//
// Function names are unchanged from the old MySQL/Express-backed version —
// only the implementation moved to the Supabase client, so every caller
// keeps working with `await` as before.

import { supabase } from './supabaseClient.js'
import { sendClubApprovalEmail } from './mockEmailLog.js'

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Maps a DB row (snake_case) to the exact shape the frontend already
// expects (camelCase) — matches the old mock object shape one-for-one.
function toClub(row) {
  return {
    id: row.id,
    name: row.name,
    clubId: row.club_id,
    district: row.district,
    area: row.area,
    members: row.members,
    foundedYear: row.founded_year,
    city: row.city,
    country: row.country,
    location: row.location,
    presidentName: row.president_name,
    presidentEmail: row.president_email,
    meetingDay: row.meeting_day,
    meetingTime: row.meeting_time,
    meetingLocation: row.meeting_location,
    status: row.status,
    submittedAt: row.submitted_at,
  }
}

function toPresident(row) {
  return {
    id: row.id,
    name: row.name,
    memberId: row.member_id,
    clubName: row.club_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    submittedAt: row.submitted_at,
  }
}

export async function getApprovedClubs() {
  const { data } = await supabase.from('clubs').select('*').eq('status', 'approved')
  return (data ?? []).map(toClub)
}

export async function getClubById(id) {
  const { data } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()
  return data ? toClub(data) : null
}

export async function getPendingClubs() {
  const { data } = await supabase
    .from('clubs')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
  return (data ?? []).map(toClub)
}

export async function submitClubRegistration(form) {
  const {
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
  } = form

  const normalizedEmail = (presidentEmail ?? '').trim().toLowerCase()
  const id = slugify(clubName)

  // Deliberately not chaining .select() here — the newly inserted row is
  // 'pending', which anon can no longer read back (RLS only exposes
  // approved rows publicly). We already have everything needed to build
  // the confirmation object from `form` itself, so no read-back required.
  const { error } = await supabase.from('clubs').insert({
    id,
    name: clubName,
    club_id: clubId,
    district,
    area,
    members: Number(memberCount) || 0,
    founded_year: foundedYear,
    city,
    country,
    location: `${city}, ${country}`,
    president_name: name,
    president_email: normalizedEmail,
    meeting_day: meetingDay,
    meeting_time: meetingTime,
    meeting_location: meetingLocation,
  })

  if (error) return { error: error.message ?? 'Something went wrong. Please try again.' }

  const club = {
    id,
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
    presidentEmail: normalizedEmail,
    meetingDay,
    meetingTime,
    meetingLocation,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  }
  sendClubApprovalEmail(club)
  return club
}

export async function approveClub(id) {
  await supabase.from('clubs').update({ status: 'approved' }).eq('id', id)
}

export async function rejectClub(id) {
  await supabase.from('clubs').update({ status: 'rejected' }).eq('id', id)
}

// --- President verification -------------------------------------------
// A separate approval chain from club registration itself: a would-be
// president submits their details, a founder approves/rejects, and only
// an approved email can then successfully submit a club registration.

export async function submitPresidentVerification(form) {
  const { name, memberId, clubName, email, phone } = form
  const normalizedEmail = (email ?? '').trim().toLowerCase()

  // No .select() after insert, same reasoning as submitClubRegistration —
  // the row is 'pending' and anon can no longer read it back.
  const { error } = await supabase.from('president_verifications').insert({
    name,
    member_id: memberId,
    club_name: clubName,
    email: normalizedEmail,
    phone,
  })
  if (error) return null

  return {
    name,
    memberId,
    clubName,
    email: normalizedEmail,
    phone,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  }
}

export async function getPendingPresidents() {
  const { data } = await supabase
    .from('president_verifications')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
  return (data ?? []).map(toPresident)
}

export async function approvePresident(id) {
  await supabase.from('president_verifications').update({ status: 'approved' }).eq('id', id)
}

export async function rejectPresident(id) {
  await supabase.from('president_verifications').update({ status: 'rejected' }).eq('id', id)
}

// Single round-trip when a caller needs both pieces at once (e.g. login).
export async function verifyPresident(email) {
  const normalizedEmail = (email ?? '').trim().toLowerCase()
  if (!normalizedEmail) return { verified: false, name: null }
  const { data } = await supabase
    .from('president_verifications')
    .select('name')
    .eq('status', 'approved')
    .eq('email', normalizedEmail)
    .maybeSingle()
  return { verified: !!data, name: data?.name ?? null }
}

export async function isVerifiedPresident(email) {
  return (await verifyPresident(email)).verified
}

export async function getVerifiedPresidentName(email) {
  return (await verifyPresident(email)).name
}
