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
  const { error } = await supabase.from('clubs').update({ status: 'approved' }).eq('id', id)
  if (error) {
    console.error('[mockClubRegistry] approveClub failed:', error.message)
    throw new Error(`Could not approve this club: ${error.message}`)
  }
}

export async function rejectClub(id) {
  const { error } = await supabase.from('clubs').update({ status: 'rejected' }).eq('id', id)
  if (error) {
    console.error('[mockClubRegistry] rejectClub failed:', error.message)
    throw new Error(`Could not reject this club: ${error.message}`)
  }
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
  const { error } = await supabase
    .from('president_verifications')
    .update({ status: 'approved' })
    .eq('id', id)
  if (error) {
    console.error('[mockClubRegistry] approvePresident failed:', error.message)
    throw new Error(`Could not approve this president: ${error.message}`)
  }
}

export async function rejectPresident(id) {
  const { error } = await supabase
    .from('president_verifications')
    .update({ status: 'rejected' })
    .eq('id', id)
  if (error) {
    console.error('[mockClubRegistry] rejectPresident failed:', error.message)
    throw new Error(`Could not reject this president: ${error.message}`)
  }
}

// This email's own row in user_active_club, if it has one and that
// club is still actually one it's affiliated with — see the matching
// `in (...)` guard on the SQL side (current_club_id() in schema.sql).
// Re-checked here too (not just trusted from the DB round-trip) so a
// stale row pointing at a club this email no longer presides over can't
// leak through client-side.
export async function getActiveClubId(email, validClubIds) {
  const normalizedEmail = (email ?? '').trim().toLowerCase()
  if (!normalizedEmail) return null
  const { data, error } = await supabase
    .from('user_active_club')
    .select('club_id')
    .eq('email', normalizedEmail)
    .maybeSingle()
  if (error) console.error('[mockClubRegistry] getActiveClubId failed:', error.message)
  if (!data) return null
  return validClubIds.includes(data.club_id) ? data.club_id : null
}

// Written by the club-switcher UI (MemberLayout.jsx) when a president of
// more than one club picks which one to act as. Read back by
// current_club_id() on the DB side for every RLS-scoped query from then
// on — so this is a real, server-enforced switch, not just a client-side
// label change.
export async function setActiveClub(email, clubId) {
  const normalizedEmail = (email ?? '').trim().toLowerCase()
  const { error } = await supabase
    .from('user_active_club')
    .upsert({ email: normalizedEmail, club_id: clubId, updated_at: new Date().toISOString() })
  if (error) {
    console.error('[mockClubRegistry] setActiveClub failed:', error.message)
    throw new Error('Could not switch clubs — try again in a moment.')
  }
}

// Single round-trip when a caller needs both pieces at once (e.g. login).
// This runs on every sign-in (see mockAuth.js's syncAccountFromSupabaseUser)
// and its result decides whether a real President gets recognized as one
// at all — a network hiccup here used to be silently indistinguishable
// from "genuinely not a verified president" (the error was never even
// checked), demoting them to the generic pending-member flow with no
// trace of why. Logging it doesn't recover the failed check, but makes a
// transient failure diagnosable instead of looking like a data problem.
// Multi-club: being a verified president (this table) isn't enough on
// its own to grant President dashboard access — they also need to
// actually be the current president of a real approved club (clubs
// table), which is where clubId/clubName (and therefore which club's
// data they administer) actually comes from. A verified-but-clubless
// president has nothing to administer yet, so this now returns
// verified:false for them too — see syncAccountFromSupabaseUser in
// mockAuth.js, which is the only caller.
//
// One email can now preside over several approved clubs at once (a
// founder running more than one chapter), so this returns the full list
// (`clubs`) alongside the single resolved `clubId`/`clubName` most
// callers still just want — that resolved one honors user_active_club
// (the switcher's choice) when set, falling back to the first club
// (ordered by id, matching current_club_id()'s own tie-break) otherwise.
export async function verifyPresident(email) {
  const normalizedEmail = (email ?? '').trim().toLowerCase()
  if (!normalizedEmail) return { verified: false, name: null, clubId: null, clubName: null, clubs: [] }
  const { data, error } = await supabase
    .from('president_verifications')
    .select('name')
    .eq('status', 'approved')
    .eq('email', normalizedEmail)
    .maybeSingle()
  if (error) console.error('[mockClubRegistry] verifyPresident failed:', error.message)
  if (!data) return { verified: false, name: null, clubId: null, clubName: null, clubs: [] }

  const { data: clubRows, error: clubError } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('status', 'approved')
    .eq('president_email', normalizedEmail)
    .order('id', { ascending: true })
  if (clubError) console.error('[mockClubRegistry] verifyPresident club lookup failed:', clubError.message)
  const clubs = clubRows ?? []
  if (clubs.length === 0) return { verified: false, name: data.name, clubId: null, clubName: null, clubs: [] }

  const activeClubId = await getActiveClubId(normalizedEmail, clubs.map((c) => c.id))
  const active = clubs.find((c) => c.id === activeClubId) ?? clubs[0]

  return { verified: true, name: data.name, clubId: active.id, clubName: active.name, clubs }
}

export async function isVerifiedPresident(email) {
  return (await verifyPresident(email)).verified
}

export async function getVerifiedPresidentName(email) {
  return (await verifyPresident(email)).name
}
