import { supabase } from './supabaseClient.js'

// Names verified against Toastmasters' Paths and Projects catalogue, October 2026.
export const PATH_GROUPS = {
  'Current paths': ['Dynamic Leadership', 'Engaging Humor', 'Motivational Strategies', 'Persuasive Influence', 'Presentation Mastery', 'Visionary Communication'],
  'Vintage paths': ['Basic Training for Toastmasters', 'The Communication Series: Entertaining Speaker + Storytelling'],
  'Legacy paths': ['Effective Coaching', 'Innovative Planning', 'Leadership Development', 'Strategic Relationships', 'Team Collaboration'],
}
export const ENTRY_KINDS = { project: 'Project', speech: 'Speech', meeting_role: 'Meeting role', education_presentation: 'Education presentation' }
export const STATUS_LABELS = { planned: 'Planned', in_progress: 'In progress', on_hold: 'On hold', completed: 'Completed' }

export async function getPathwayMembers(clubId) {
  const { data, error } = await supabase.from('members').select('id,name,email,is_active')
    .eq('club_id', clubId).eq('is_test_account', false).order('name')
  if (error) throw error
  return data ?? []
}

export async function getPathways(clubId, memberId, memberEmail) {
  let query = supabase.from('pathway_enrollments').select(memberEmail ? '*,members!inner(email)' : '*').eq('club_id', clubId).order('created_at')
  if (memberId) query = query.eq('member_id', memberId)
  if (memberEmail) query = query.eq('members.email', memberEmail.toLowerCase())
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getPathwayDetails(enrollmentId) {
  const [entries, history] = await Promise.all([
    supabase.from('pathway_entries').select('*').eq('enrollment_id', enrollmentId).order('level').order('created_at'),
    supabase.from('pathway_history').select('*').eq('enrollment_id', enrollmentId).order('changed_at', { ascending: false }).limit(50),
  ])
  if (entries.error || history.error) throw entries.error || history.error
  return { entries: entries.data ?? [], history: history.data ?? [] }
}

export async function getPathwayMeetings(clubId) {
  const { data, error } = await supabase.from('meetings').select('id,label,meeting_date,cancelled')
    .eq('club_id', clubId).order('meeting_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

async function save(table, values, existing) {
  const query = existing
    ? supabase.from(table).update(values).eq('id', existing.id).eq('updated_at', existing.updated_at)
    : supabase.from(table).insert(values)
  const { data, error } = await query.select('*').maybeSingle()
  if (error) throw error
  if (!data) throw new Error('This record changed or you no longer have access. Reload before editing again.')
  return data
}

export function savePathway(values, existing) { return save('pathway_enrollments', values, existing) }
export function savePathwayEntry(values, existing) { return save('pathway_entries', values, existing) }
