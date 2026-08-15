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
import { scoreExcomAppointment } from './mockPointsStore.js'

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

  await scoreExcomAppointment()

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

// Reverse of getRoleForEmail — the email currently holding a given role
// (most recent appointment wins). Used to attribute ExCom points to
// whoever actually holds a role, even when the President performs the
// triggering action on that role's behalf (see mockPointsStore.js) —
// crediting getAccount()'s email directly would wrongly give the
// President points meant for e.g. the VPM.
export async function getEmailForRole(role) {
  const { data } = await supabase
    .from('excom_appointments')
    .select('email')
    .eq('role', role)
    .order('appointed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.email ?? null
}

// Returns every distinct role registered to this email (most-recent
// first), instead of just the single most-recent one — lets one email
// hold multiple ExCom roles at once, e.g. for testing several role
// dashboards without needing a separate real Google account per role.
export async function getRolesForEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return []
  const { data } = await supabase
    .from('excom_appointments')
    .select('role')
    .eq('email', normalized)
    .order('appointed_at', { ascending: false })
  return [...new Set((data ?? []).map((row) => row.role))]
}

// Every { role: name } pair registered for this email — powers
// role-aware display names for accounts holding multiple ExCom roles
// under one shared email (see setActiveRoleOverride in mockAuth.js).
// Without this, an email registered under 3 roles would show whichever
// role's name was appointed most recently for every role, not the name
// that was actually registered for the role currently being acted as.
export async function getNamesByRoleForEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return {}
  const { data } = await supabase
    .from('excom_appointments')
    .select('role, name')
    .eq('email', normalized)
    .order('appointed_at', { ascending: true })
  const names = {}
  for (const row of data ?? []) {
    names[row.role] = row.name // later (more recently appointed) rows win per role
  }
  return names
}
