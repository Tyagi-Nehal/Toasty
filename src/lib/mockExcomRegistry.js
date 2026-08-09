// ExCom appointments: a President pre-registers members by role + email
// from /register-excom. Logging in with a pre-registered email grants
// that role's dashboard automatically — this is what replaces the old
// "Prototype: view as" dev shortcut with a real role-assignment flow.
// Backed by Supabase (supabase/schema.sql, excom_appointments table) so
// it works across devices — a President registering someone from their
// laptop needs that person recognized when they sign in from their own
// phone, which a localStorage-only store could never do.
//
// Function names are unchanged from the old localStorage-backed version.

import { supabase } from './supabaseClient.js'

function normalizeEmail(email) {
  return (email ?? '').trim().toLowerCase()
}

function toAppointment(row) {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    appointedByEmail: row.appointed_by_email,
    appointedAt: row.appointed_at,
  }
}

export async function getExcomAppointments() {
  const { data } = await supabase
    .from('excom_appointments')
    .select('*')
    .order('appointed_at', { ascending: true })
  return (data ?? []).map(toAppointment)
}

// No .select() after insert — the caller only needs to know it succeeded,
// and building the result from the already-known input avoids depending
// on being able to read the row straight back (an RLS/permission gap here
// broke club/president submissions earlier this session).
export async function registerExcomMember({ role, name, email, appointedByEmail }) {
  const normalizedEmail = normalizeEmail(email)
  const normalizedAppointer = normalizeEmail(appointedByEmail)

  const { error } = await supabase.from('excom_appointments').insert({
    role,
    name,
    email: normalizedEmail,
    appointed_by_email: normalizedAppointer,
  })
  if (error) return { error: error.message ?? 'Something went wrong. Please try again.' }

  return {
    role,
    name,
    email: normalizedEmail,
    appointedByEmail: normalizedAppointer,
    appointedAt: new Date().toISOString(),
  }
}

export async function removeExcomMember(id) {
  await supabase.from('excom_appointments').delete().eq('id', id)
}

// Returns the role for a pre-registered email, or null if none exists.
// If someone was registered for multiple roles, the most recent wins.
export async function getRoleForEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  const { data } = await supabase
    .from('excom_appointments')
    .select('role')
    .eq('email', normalized)
    .order('appointed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.role ?? null
}

export async function getNameForEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  const { data } = await supabase
    .from('excom_appointments')
    .select('name')
    .eq('email', normalized)
    .order('appointed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.name ?? null
}
