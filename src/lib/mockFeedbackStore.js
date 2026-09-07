// Anonymous feedback (supabase/schema.sql: feedback), shared between the
// member Feedback Page (submit + view own past submissions) and the
// President's Feedback Inbox — was localStorage-only, invisible to the
// President signed in on a different device than whoever submitted it.
//
// author_email is stored so a member can filter to "their" submissions,
// but the President-facing inbox view must never read or display it —
// that's what keeps submissions anonymous to the President, per spec.

import { supabase } from './supabaseClient.js'

function normalizeEmail(email) {
  return (email ?? '').trim().toLowerCase()
}

function toFeedback(row) {
  return {
    id: row.id,
    subject: row.subject,
    message: row.message,
    authorEmail: row.author_email,
    submittedAt: row.submitted_at,
    read: row.read,
    resolved: row.resolved,
    presidentNote: row.president_note ?? '',
  }
}

export async function getAllFeedback() {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('submitted_at', { ascending: false })
  if (error) {
    console.error('[mockFeedbackStore] getAllFeedback failed:', error.message)
    return []
  }
  return (data ?? []).map(toFeedback)
}

export async function getMyFeedback(authorEmail) {
  const normalized = normalizeEmail(authorEmail)
  if (!normalized) return []
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('author_email', normalized)
    .order('submitted_at', { ascending: false })
  if (error) {
    console.error('[mockFeedbackStore] getMyFeedback failed:', error.message)
    return []
  }
  return (data ?? []).map(toFeedback)
}

export async function submitFeedback({ subject, message, authorEmail }) {
  const { error } = await supabase.from('feedback').insert({
    subject,
    message,
    author_email: normalizeEmail(authorEmail),
  })
  if (error) console.error('[mockFeedbackStore] submitFeedback failed:', error.message)
}

export async function markRead(id) {
  const { error } = await supabase.from('feedback').update({ read: true }).eq('id', id)
  if (error) console.error('[mockFeedbackStore] markRead failed:', error.message)
}

export async function toggleResolved(id, currentlyResolved) {
  const { error } = await supabase
    .from('feedback')
    .update({ resolved: !currentlyResolved })
    .eq('id', id)
  if (error) console.error('[mockFeedbackStore] toggleResolved failed:', error.message)
}

export async function setPresidentNote(id, note) {
  const { error } = await supabase.from('feedback').update({ president_note: note }).eq('id', id)
  if (error) console.error('[mockFeedbackStore] setPresidentNote failed:', error.message)
}
