// Anonymous feedback (supabase/schema.sql: feedback), shared between the
// member Feedback Page (submit + view own past submissions) and the
// President's Feedback Inbox — was localStorage-only, invisible to the
// President signed in on a different device than whoever submitted it.
//
// author_email is stored so a member can filter to "their" submissions,
// but the President-facing inbox view must never read or display it —
// that's what keeps submissions anonymous to the President, per spec.

import { supabase } from './supabaseClient.js'
import { getAccount } from './mockAuth.js'
import { scoreFeedbackResponse } from './mockPointsStore.js'

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
    .eq('club_id', getAccount()?.clubId)
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
    club_id: getAccount()?.clubId,
  })
  if (error) {
    console.error('[mockFeedbackStore] submitFeedback failed:', error.message)
    throw new Error('Could not submit your feedback — please try again.')
  }
}

export async function markRead(id) {
  const { error } = await supabase.from('feedback').update({ read: true }).eq('id', id)
  if (error) console.error('[mockFeedbackStore] markRead failed:', error.message)
}

// Takes the full feedback item (not just id/resolved) — scoring the
// President's response needs its submittedAt, and resolved_at needs to
// be cleared (not just left stale) on an un-resolve so a later
// re-resolve scores against the real new resolve time.
export async function toggleResolved(item) {
  const resolving = !item.resolved
  const resolvedAt = resolving ? new Date().toISOString() : null
  const { error } = await supabase
    .from('feedback')
    .update({ resolved: resolving, resolved_at: resolvedAt })
    .eq('id', item.id)
  if (error) {
    console.error('[mockFeedbackStore] toggleResolved failed:', error.message)
    return
  }
  if (resolving) {
    await scoreFeedbackResponse(item.id, item.submittedAt, resolvedAt, getAccount()?.clubId)
  }
}

export async function setPresidentNote(id, note) {
  const { error } = await supabase.from('feedback').update({ president_note: note }).eq('id', id)
  if (error) console.error('[mockFeedbackStore] setPresidentNote failed:', error.message)
}
