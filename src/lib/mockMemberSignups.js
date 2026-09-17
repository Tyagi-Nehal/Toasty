// Real member signups (/signup, no President/ExCom role match -> generic
// pending flow, approved by the VPM). Backed by Supabase
// (supabase/schema.sql, member_signups table) so a real VPM can actually
// see and act on real signups — previously the Approvals page showed
// static placeholder names with no connection to real sign-ups at all.

import { supabase } from './supabaseClient.js'
import { scoreSignupApproval } from './mockPointsStore.js'
import { ensureRosterMember } from './mockRosterStore.js'
import { getApprovedClubs } from './mockClubRegistry.js'

function normalizeEmail(email) {
  return (email ?? '').trim().toLowerCase()
}

// TEMPORARY, Phase 3 removes this — /signup has no club picker yet, so
// a new signup defaults to whichever approved club is first. Safe only
// because exactly one approved club exists today; do not ship Phase 3's
// real signup club picker without deleting this function and its call
// site below.
async function getDefaultClubId() {
  const clubs = await getApprovedClubs()
  return clubs[0]?.id ?? null
}

function toSignup(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    appliedForExcom: row.applied_for_excom,
    status: row.status,
    submittedAt: row.submitted_at,
  }
}

// Called from mockAuth.js on every sign-in for a non-role-matched user.
// Upsert-ignore-duplicates so repeat sign-ins don't create new rows, then
// reads back the row's real status/name — works even for a row just
// inserted this call, since SELECT is permissive for any signed-in user.
export async function getOrCreateSignupStatus({ email, name, appliedForExcom }) {
  const normalizedEmail = normalizeEmail(email)
  const clubId = await getDefaultClubId()

  await supabase
    .from('member_signups')
    .upsert(
      { email: normalizedEmail, name, applied_for_excom: appliedForExcom, club_id: clubId },
      { onConflict: 'email', ignoreDuplicates: true },
    )

  const { data } = await supabase
    .from('member_signups')
    .select('name, status, club_id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  return {
    status: data?.status ?? 'pending',
    name: data?.name ?? name,
    clubId: data?.club_id ?? clubId,
  }
}

export async function getPendingSignups(clubId) {
  const { data } = await supabase
    .from('member_signups')
    .select('*')
    .eq('status', 'pending')
    .eq('club_id', clubId)
    .order('submitted_at', { ascending: true })
  return (data ?? []).map(toSignup)
}

export async function getApprovedSignups(clubId) {
  const { data } = await supabase
    .from('member_signups')
    .select('*')
    .eq('status', 'approved')
    .eq('club_id', clubId)
    .order('submitted_at', { ascending: true })
  return (data ?? []).map(toSignup)
}

export async function approveSignup(id) {
  const { data } = await supabase
    .from('member_signups')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', id)
    .select('name, email, club_id')
    .single()
  // A newly approved member is real now — make sure they exist on the
  // roster, or the Treasurer would have nobody to mark them Paid/active
  // for (see ensureRosterMember).
  if (data?.name && data?.email) await ensureRosterMember(data.name, data.email, data.club_id)
  await scoreSignupApproval(data?.club_id)
}

export async function rejectSignup(id) {
  await supabase.from('member_signups').update({ status: 'rejected' }).eq('id', id)
}

// VPM/President direct pre-registration — for someone who can't create
// their own account (no Google account, technical trouble, etc.).
// Mirrors registerExcomMember()'s "add them directly, no separate
// approval needed" flow: the row is inserted already approved, so when
// that email eventually does sign in, getOrCreateSignupStatus's upsert
// finds it pre-existing and returns status 'approved' immediately — no
// waiting on anyone to review it after the fact. Upsert (not a plain
// insert) so re-registering an email that already has a stale
// pending/rejected row from a half-finished signup attempt just
// promotes that same row to approved instead of failing on the unique
// email constraint.
export async function preregisterMember({ name, email, clubId }) {
  const trimmedName = (name ?? '').trim()
  const normalizedEmail = normalizeEmail(email)
  if (!trimmedName || !normalizedEmail) return { error: 'Name and email are required.' }

  const { error } = await supabase.from('member_signups').upsert(
    {
      name: trimmedName,
      email: normalizedEmail,
      status: 'approved',
      approved_at: new Date().toISOString(),
      club_id: clubId,
    },
    { onConflict: 'email' },
  )
  if (error) return { error: error.message ?? 'Something went wrong. Please try again.' }

  await ensureRosterMember(trimmedName, normalizedEmail, clubId)
  await scoreSignupApproval(clubId)
  return { name: trimmedName, email: normalizedEmail }
}
