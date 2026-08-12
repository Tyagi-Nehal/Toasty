// Real MOM (Minutes of Meeting) submissions (supabase/schema.sql: moms).
// Replaces the earlier localStorage-only prototype — per-browser and
// invisible cross-device, which also meant it couldn't participate in
// the cancelled-meeting notice pattern the way agendas/attendance/roles/
// photos already can. content stores the whole MOM form object as-is,
// same jsonb-blob approach already used by agendas.items.

import { supabase } from './supabaseClient.js'
import { getAccount } from './mockAuth.js'

export async function getSubmittedMOM(meetingId) {
  const { data, error } = await supabase
    .from('moms')
    .select('*')
    .eq('meeting_id', meetingId)
    .maybeSingle()
  if (error) console.error('[mockMOMStore] getSubmittedMOM failed:', error.message)
  return data ? { ...data.content, submittedAt: data.submitted_at } : null
}

export async function getAllSubmittedMOMs() {
  const { data, error } = await supabase.from('moms').select('*')
  if (error) console.error('[mockMOMStore] getAllSubmittedMOMs failed:', error.message)
  return (data ?? []).reduce((acc, row) => {
    acc[row.meeting_id] = { ...row.content, submittedAt: row.submitted_at }
    return acc
  }, {})
}

export async function saveSubmittedMOM(meetingId, mom, meta) {
  const account = getAccount()
  const submittedAt = new Date().toISOString()
  const { error } = await supabase.from('moms').upsert(
    {
      meeting_id: meetingId,
      content: { ...mom, ...meta },
      submitted_at: submittedAt,
      submitted_by_email: account?.email ?? null,
    },
    { onConflict: 'meeting_id' },
  )
  if (error) {
    console.error('[mockMOMStore] saveSubmittedMOM failed:', error.message)
    return null
  }
  return { ...mom, ...meta, submittedAt }
}
