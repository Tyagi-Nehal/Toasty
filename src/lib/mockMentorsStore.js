// VPPR-managed mentors list (supabase/schema.sql: club_mentors), shown
// on the public /mentors page and the member's own profile. Replaces
// src/data/mentors.js, a hardcoded static file that always stayed empty
// since there was never an admin UI to fill it in.

import { supabase } from './supabaseClient.js'
import { uploadClubPhoto, deleteClubPhoto } from './storage.js'

const LOG_KEY = 'toasty_photo_upload_log'
const MAX_LOG_ENTRIES = 25

function logAction(message) {
  const entry = { id: crypto.randomUUID(), message, time: new Date().toISOString() }
  try {
    const raw = localStorage.getItem(LOG_KEY)
    const existing = raw ? JSON.parse(raw) : []
    localStorage.setItem(
      LOG_KEY,
      JSON.stringify([entry, ...existing].slice(0, MAX_LOG_ENTRIES)),
    )
  } catch {
    localStorage.setItem(LOG_KEY, JSON.stringify([entry]))
  }
}

function toMentor(row) {
  return {
    id: row.id,
    name: row.name,
    designation: row.designation,
    clubName: row.club_name,
    experience: row.experience,
    photoUrl: row.photo_url,
  }
}

// clubId optional — the public /mentors page has no real per-club
// routing yet (same reasoning as getExcomProfiles in mockPhotoStore.js),
// so it calls this unfiltered; the authenticated VPPR editor passes its
// own club.
export async function getMentors(clubId) {
  let query = supabase.from('club_mentors').select('*').order('created_at', { ascending: true })
  if (clubId) query = query.eq('club_id', clubId)
  const { data, error } = await query
  if (error) console.error('[mockMentorsStore] getMentors failed:', error.message)
  return (data ?? []).map(toMentor)
}

export async function addMentor({ name, designation, clubName, experience, photoFile, clubId }) {
  const photoUrl = photoFile ? await uploadClubPhoto(photoFile, 'mentors', clubId) : null
  const { error } = await supabase.from('club_mentors').insert({
    club_id: clubId,
    name,
    designation: designation || null,
    club_name: clubName || null,
    experience: experience || null,
    photo_url: photoUrl,
  })
  if (error) {
    console.error('[mockMentorsStore] addMentor failed:', error.message)
    throw new Error('Could not add this mentor — try again in a moment.')
  }
  logAction(`VPPR added ${name} as a mentor`)
}

export async function updateMentor(
  id,
  { name, designation, clubName, experience, photoFile, existingPhotoUrl, clubId },
) {
  let photoUrl = existingPhotoUrl ?? null
  if (photoFile) {
    photoUrl = await uploadClubPhoto(photoFile, 'mentors', clubId)
    if (existingPhotoUrl) await deleteClubPhoto(existingPhotoUrl)
  }
  const { error } = await supabase
    .from('club_mentors')
    .update({
      name,
      designation: designation || null,
      club_name: clubName || null,
      experience: experience || null,
      photo_url: photoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) {
    console.error('[mockMentorsStore] updateMentor failed:', error.message)
    throw new Error('Could not save this mentor — try again in a moment.')
  }
  logAction(`VPPR updated mentor ${name}`)
}

export async function removeMentor(id, name, photoUrl) {
  const { error } = await supabase.from('club_mentors').delete().eq('id', id)
  if (error) {
    console.error('[mockMentorsStore] removeMentor failed:', error.message)
    return
  }
  if (photoUrl) await deleteClubPhoto(photoUrl)
  logAction(`VPPR removed mentor ${name}`)
}
