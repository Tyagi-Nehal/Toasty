// Real VPPR photo uploads — replaces mockPhotoMemoriesStore.js's
// localStorage/base64 prototype. Backed by Supabase (supabase/schema.sql:
// club_page_photos, excom_profiles, meeting_photos) and the `club-photos`
// Storage bucket (src/lib/storage.js). Covers three distinct upload
// targets: the public Club Home page's photo sections, per-meeting
// photos/certificates (member-only, /photos), and ExCom member profile
// photos + bios (current and past).

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

export function getPhotoUploadLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ---- Club page photos (public Club Home page sections) ----

export async function getClubPagePhotos(section) {
  let query = supabase.from('club_page_photos').select('*').order('uploaded_at', { ascending: false })
  if (section) query = query.eq('section', section)
  const { data, error } = await query
  if (error) console.error('[mockPhotoStore] getClubPagePhotos failed:', error.message)
  return (data ?? []).map((r) => ({ id: r.id, section: r.section, url: r.url }))
}

export async function addClubPagePhoto(section, file) {
  const url = await uploadClubPhoto(file, `club-page/${section}`)
  const { error } = await supabase.from('club_page_photos').insert({ section, url })
  if (error) {
    console.error('[mockPhotoStore] addClubPagePhoto failed:', error.message)
    return
  }
  logAction(`VPPR added a photo to the "${section}" section of the club page`)
}

export async function removeClubPagePhoto(id, url) {
  const { error } = await supabase.from('club_page_photos').delete().eq('id', id)
  if (error) {
    console.error('[mockPhotoStore] removeClubPagePhoto failed:', error.message)
    return
  }
  await deleteClubPhoto(url)
  logAction('VPPR removed a photo from the club page')
}

// ---- ExCom profiles (photo + bio, current and past) ----

export async function getExcomProfiles() {
  const { data, error } = await supabase.from('excom_profiles').select('*')
  if (error) console.error('[mockPhotoStore] getExcomProfiles failed:', error.message)
  return (data ?? []).reduce((acc, r) => {
    acc[r.member_key] = { photoUrl: r.photo_url, bio: r.bio }
    return acc
  }, {})
}

export async function upsertExcomProfile(memberKey, memberName, { photoUrl, bio }) {
  const { error } = await supabase.from('excom_profiles').upsert(
    { member_key: memberKey, photo_url: photoUrl ?? null, bio: bio ?? null, updated_at: new Date().toISOString() },
    { onConflict: 'member_key' },
  )
  if (error) {
    console.error('[mockPhotoStore] upsertExcomProfile failed:', error.message)
    return
  }
  logAction(`VPPR updated the ExCom profile for ${memberName}`)
}

// ---- Meeting photos + certificates ----

function fromMeetingPhotosRow(row, meeting) {
  return {
    meetingId: meeting.id,
    dateLabel: meeting.dateLabel,
    theme: row?.theme ?? meeting.theme ?? '',
    photos: (row?.photos ?? []).map((p) => ({ id: p.id, src: p.url })),
    certificates: (row?.certificates ?? []).map((c) => ({ id: c.id, label: c.label, src: c.url })),
    updatedAt: row?.updated_at ?? null,
  }
}

export async function getMeetingPhotos(meetingId) {
  const { data, error } = await supabase
    .from('meeting_photos')
    .select('*')
    .eq('meeting_id', meetingId)
    .maybeSingle()
  if (error) console.error('[mockPhotoStore] getMeetingPhotos failed:', error.message)
  return data
}

// Merges new photos/certificates onto whatever's already uploaded for
// this meeting, mirroring the old store's "append, don't overwrite" behavior.
export async function addMeetingPhotos(meeting, { theme, newPhotoFiles, newCertificates }) {
  const existing = await getMeetingPhotos(meeting.id)

  const uploadedPhotos = await Promise.all(
    newPhotoFiles.map(async (file) => ({
      id: crypto.randomUUID(),
      url: await uploadClubPhoto(file, `meetings/${meeting.id}`),
    })),
  )
  const uploadedCertificates = await Promise.all(
    newCertificates.map(async ({ label, file }) => ({
      id: crypto.randomUUID(),
      label,
      url: await uploadClubPhoto(file, `meetings/${meeting.id}/certificates`),
    })),
  )

  const row = {
    meeting_id: meeting.id,
    theme: theme || existing?.theme || meeting.theme || '',
    photos: [...(existing?.photos ?? []), ...uploadedPhotos],
    certificates: [...(existing?.certificates ?? []), ...uploadedCertificates],
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('meeting_photos').upsert(row, { onConflict: 'meeting_id' })
  if (error) {
    console.error('[mockPhotoStore] addMeetingPhotos failed:', error.message)
    return null
  }
  logAction(
    `VPPR uploaded ${uploadedPhotos.length} photo${uploadedPhotos.length === 1 ? '' : 's'} and ${
      uploadedCertificates.length
    } certificate${uploadedCertificates.length === 1 ? '' : 's'} for ${meeting.dateLabel}`,
  )
  return fromMeetingPhotosRow(row, meeting)
}

// For the member-facing Photo Memories page — every meeting that has at
// least one uploaded photo or certificate, newest upload first.
export async function getAllMeetingPhotos(meetings) {
  const { data, error } = await supabase.from('meeting_photos').select('*')
  if (error) console.error('[mockPhotoStore] getAllMeetingPhotos failed:', error.message)
  const rows = data ?? []
  return rows
    .map((row) => {
      const meeting = meetings.find((m) => m.id === row.meeting_id)
      return meeting ? fromMeetingPhotosRow(row, meeting) : null
    })
    .filter((m) => m && (m.photos.length > 0 || m.certificates.length > 0))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}
