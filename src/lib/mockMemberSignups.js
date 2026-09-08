// Real member signups (/signup, no President/ExCom role match -> generic
// pending flow, approved by the VPM). Backed by Supabase
// (supabase/schema.sql, member_signups table) so a real VPM can actually
// see and act on real signups — previously the Approvals page showed
// static placeholder names with no connection to real sign-ups at all.

import { supabase } from './supabaseClient.js'
import { scoreSignupApproval } from './mockPointsStore.js'
import { ensureRosterMember } from './mockRosterStore.js'

function normalizeEmail(email) {
  return (email ?? '').trim().toLowerCase()
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

  await supabase
    .from('member_signups')
    .upsert(
      { email: normalizedEmail, name, applied_for_excom: appliedForExcom },
      { onConflict: 'email', ignoreDuplicates: true },
    )

  const { data } = await supabase
    .from('member_signups')
    .select('name, status')
    .eq('email', normalizedEmail)
    .maybeSingle()

  return {
    status: data?.status ?? 'pending',
    name: data?.name ?? name,
  }
}

export async function getPendingSignups() {
  const { data } = await supabase
    .from('member_signups')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
  return (data ?? []).map(toSignup)
}

export async function getApprovedSignups() {
  const { data } = await supabase
    .from('member_signups')
    .select('*')
    .eq('status', 'approved')
    .order('submitted_at', { ascending: true })
  return (data ?? []).map(toSignup)
}

export async function approveSignup(id) {
  const { data } = await supabase
    .from('member_signups')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', id)
    .select('name, email')
    .single()
  // A newly approved member is real now — make sure they exist on the
  // roster, or the Treasurer would have nobody to mark them Paid/active
  // for (see ensureRosterMember).
  if (data?.name && data?.email) await ensureRosterMember(data.name, data.email)
  await scoreSignupApproval()
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
export async function preregisterMember({ name, email }) {
  const trimmedName = (name ?? '').trim()
  const normalizedEmail = normalizeEmail(email)
  if (!trimmedName || !normalizedEmail) return { error: 'Name and email are required.' }

  const { error } = await supabase.from('member_signups').upsert(
    {
      name: trimmedName,
      email: normalizedEmail,
      status: 'approved',
      approved_at: new Date().toISOString(),
    },
    { onConflict: 'email' },
  )
  if (error) return { error: error.message ?? 'Something went wrong. Please try again.' }

  await ensureRosterMember(trimmedName, normalizedEmail)
  await scoreSignupApproval()
  return { name: trimmedName, email: normalizedEmail }
}
