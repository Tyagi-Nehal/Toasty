// Self-service ExCom applications (/signup, "I'm applying for an ExCom
// position" -> pick a role from EXCOM_ROLES). Backed by Supabase
// (supabase/schema.sql, excom_applications table). Separate from
// excom_appointments — an application only becomes a real appointment
// once the President approves it here, which calls registerExcomMember
// (the same function the President's manual Register ExCom form uses).

import { supabase } from './supabaseClient.js'

function normalizeEmail(email) {
  return (email ?? '').trim().toLowerCase()
}

function toApplication(row) {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    status: row.status,
    submittedAt: row.submitted_at,
  }
}

// Called once from mockAuth.js right after a fresh Google sign-in, when
// the Sign Up form had the ExCom checkbox ticked. Not upserted — someone
// can apply again (e.g. after a rejection) without being silently
// ignored the way a unique-email upsert would.
export async function submitExcomApplication({ role, name, email }) {
  const normalizedEmail = normalizeEmail(email)
  if (!role || !name?.trim() || !normalizedEmail) return
  const { error } = await supabase
    .from('excom_applications')
    .insert({ role, name: name.trim(), email: normalizedEmail })
  if (error) console.error('[mockExcomApplications] submitExcomApplication failed:', error.message)
}

export async function getPendingExcomApplications() {
  const { data, error } = await supabase
    .from('excom_applications')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
  if (error) console.error('[mockExcomApplications] getPendingExcomApplications failed:', error.message)
  return (data ?? []).map(toApplication)
}

// status: 'approved' | 'rejected'. Only marks the application's own
// record decided — approving still requires the caller to separately
// call registerExcomMember first (see RegisterExComPage.jsx), since
// that's the function that actually grants the role.
export async function decideExcomApplication(id, status, decidedByEmail) {
  const { error } = await supabase
    .from('excom_applications')
    .update({
      status,
      decided_at: new Date().toISOString(),
      decided_by_email: normalizeEmail(decidedByEmail),
    })
    .eq('id', id)
  if (error) console.error('[mockExcomApplications] decideExcomApplication failed:', error.message)
}
