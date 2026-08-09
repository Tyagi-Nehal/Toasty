// Real member signups (/signup, no President/ExCom role match -> generic
// pending flow, approved by the VPM). Backed by Supabase
// (supabase/schema.sql, member_signups table) so a real VPM can actually
// see and act on real signups — previously the Approvals page showed
// static placeholder names with no connection to real sign-ups at all.

import { supabase } from './supabaseClient.js'

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
  await supabase.from('member_signups').update({ status: 'approved' }).eq('id', id)
}

export async function rejectSignup(id) {
  await supabase.from('member_signups').update({ status: 'rejected' }).eq('id', id)
}
