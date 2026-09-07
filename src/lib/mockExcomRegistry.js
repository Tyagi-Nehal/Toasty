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
import { ensureRosterMember } from './mockRosterStore.js'

// Primary roles that have an "Ass. <role>" variant on the Register Your
// EXCOM form — SAA, President, and Associate roles themselves have no
// further associate variant. Shared between mockAuth.js (so an
// associate gets the same page access as their primary role) and
// mockPointsStore.js (so whichever specific person — primary or
// associate — actually did the work is who gets credited).
export const ASSOCIATE_ELIGIBLE_ROLES = ['VPE', 'VPPR', 'VPM', 'Treasurer', 'Secretary']

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

  // A primary role (anything not "Ass. X") only ever has one holder at a
  // time — appointing someone new replaces whoever held it before,
  // instead of stacking up multiple simultaneous appointments where only
  // the most-recently-appointed one would ever actually be used by
  // anything role-specific. Associate roles are exempt on purpose:
  // multiple people can hold "Ass. VPPR" at once, each individually.
  if (!role.startsWith('Ass. ')) {
    await supabase.from('excom_appointments').delete().eq('role', role)
  }

  const { error } = await supabase.from('excom_appointments').insert({
    role,
    name,
    email: normalizedEmail,
    appointed_by_email: normalizedAppointer,
  })
  if (error) return { error: error.message ?? 'Something went wrong. Please try again.' }

  // An ExCom appointee is a real active person in the club — make sure
  // they actually exist on the roster, or the Treasurer would have
  // nobody to mark them Paid/active for (see ensureRosterMember).
  await ensureRosterMember(name, normalizedEmail)
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

// Whether `email` currently holds baseRole itself OR its "Ass. baseRole"
// variant — used by mockPointsStore.js to credit whichever specific
// person (primary or associate) actually performed an action, instead
// of always crediting one canonical "the" role holder via
// getEmailForRole. Returns the exact role string held (e.g. 'VPPR' or
// 'Ass. VPPR') so the caller can tell which one it was, or null if this
// email doesn't currently hold either — including the President, who
// isn't in excom_appointments at all, so acting on a role's behalf
// correctly earns nobody points (see the isSelfAction design this
// replaces).
export async function getHeldRoleForEmailAndBase(email, baseRole) {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  const candidateRoles = ASSOCIATE_ELIGIBLE_ROLES.includes(baseRole)
    ? [baseRole, `Ass. ${baseRole}`]
    : [baseRole]
  const { data } = await supabase
    .from('excom_appointments')
    .select('role')
    .eq('email', normalized)
    .in('role', candidateRoles)
    .limit(1)
    .maybeSingle()
  return data?.role ?? null
}

// Same as getEmailForRole, but returns both name and email — used to
// auto-fill the per-meeting SAA role slot to whoever actually holds the
// SAA appointment (see mockRolesStore.js's resolveFixedRoleAssignee),
// instead of the VPE re-typing a name every meeting.
export async function getNameForRole(role) {
  const { data } = await supabase
    .from('excom_appointments')
    .select('name, email')
    .eq('role', role)
    .order('appointed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? { name: data.name, email: data.email } : null
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
