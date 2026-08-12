// Real VPPR photo uploads — replaces mockPhotoMemoriesStore.js's
// localStorage/base64 prototype. Backed by Supabase (supabase/schema.sql:
// club_page_photos, excom_profiles, meeting_photos) and the `club-photos`
// Storage bucket (src/lib/storage.js). Covers three distinct upload
// targets: the public Club Home page's photo sections, per-meeting
// photos/certificates (member-only, /photos), and ExCom member profile
// photos + bios (current and past).

import { supabase } from './supabaseClient.js'
import { uploadClubPhoto, deleteClubPhoto } from './storage.js'
import { formatFullDate } from './mockRolesStore.js'

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

// ---- "Our Story" / "Achievements" content blocks (photo + title + text) ----

export async function getContentBlocks(section) {
  const { data, error } = await supabase
    .from('club_content_blocks')
    .select('*')
    .eq('section', section)
    .order('created_at', { ascending: true })
  if (error) console.error('[mockPhotoStore] getContentBlocks failed:', error.message)
  return (data ?? []).map((r) => ({
    id: r.id,
    photoUrl: r.photo_url,
    title: r.title,
    content: r.content,
  }))
}

export async function addContentBlock(section, { title, content, file }) {
  const photoUrl = file ? await uploadClubPhoto(file, `club-page/${section}`) : null
  const { error } = await supabase
    .from('club_content_blocks')
    .insert({ section, title, content: content || null, photo_url: photoUrl })
  if (error) {
    console.error('[mockPhotoStore] addContentBlock failed:', error.message)
    return
  }
  logAction(`VPPR added a "${section}" block: "${title}"`)
}

export async function updateContentBlock(id, section, { title, content, photoUrl, file }) {
  const finalPhotoUrl = file ? await uploadClubPhoto(file, `club-page/${section}`) : photoUrl
  const { error } = await supabase
    .from('club_content_blocks')
    .update({ title, content: content || null, photo_url: finalPhotoUrl ?? null })
    .eq('id', id)
  if (error) {
    console.error('[mockPhotoStore] updateContentBlock failed:', error.message)
    return
  }
  logAction(`VPPR updated a "${section}" block: "${title}"`)
}

export async function removeContentBlock(id, url) {
  const { error } = await supabase.from('club_content_blocks').delete().eq('id', id)
  if (error) {
    console.error('[mockPhotoStore] removeContentBlock failed:', error.message)
    return
  }
  if (url) await deleteClubPhoto(url)
  logAction('VPPR removed a content block from the club page')
}

// ---- ExCom profiles (photo + bio + contact, current and past) ----

export async function getExcomProfiles() {
  const { data, error } = await supabase.from('excom_profiles').select('*')
  if (error) console.error('[mockPhotoStore] getExcomProfiles failed:', error.message)
  return (data ?? []).reduce((acc, r) => {
    acc[r.member_key] = {
      photoUrl: r.photo_url,
      photoPosition: r.photo_position || '50% 50%',
      bio: r.bio,
      phone: r.phone,
      email: r.email,
    }
    return acc
  }, {})
}

export async function upsertExcomProfile(memberKey, memberName, { photoUrl, photoPosition, bio, phone, email }) {
  const { error } = await supabase.from('excom_profiles').upsert(
    {
      member_key: memberKey,
      photo_url: photoUrl ?? null,
      photo_position: photoPosition || '50% 50%',
      bio: bio ?? null,
      phone: phone || null,
      email: email || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'member_key' },
  )
  if (error) {
    console.error('[mockPhotoStore] upsertExcomProfile failed:', error.message)
    return
  }
  logAction(`VPPR updated the ExCom profile for ${memberName}`)
}

// ---- Meeting photos + certificates ----

// Certificates are normalized to { id, category, winnerName, certificateSrc }
// for display. Backward-compatible with both earlier shapes — the
// certificate+presentation pair and the original single-photo
// ({ id, label, url }) shape — so certificates uploaded before this change
// still render.
function normalizeCert(c) {
  if (c.certificateUrl !== undefined || c.presentationUrl !== undefined) {
    return {
      id: c.id,
      category: c.category,
      winnerName: c.winnerName,
      certificateSrc: c.certificateUrl ?? null,
    }
  }
  // Old shape: { id, label: "Category — Name", url }.
  const [category, winnerName] = (c.label ?? '').split(' — ')
  return {
    id: c.id,
    category: category ?? c.label ?? '',
    winnerName: winnerName ?? '',
    certificateSrc: c.url ?? null,
  }
}

function fromMeetingPhotosRow(row, meeting) {
  return {
    meetingId: meeting.id,
    label: meeting.label,
    dateLabel: meeting.dateLabel,
    fullDateLabel: formatFullDate(meeting.date),
    theme: row?.theme ?? meeting.theme ?? '',
    posterUrl: row?.poster_url ?? null,
    photos: (row?.photos ?? []).map((p) => ({ id: p.id, src: p.url })),
    certificates: (row?.certificates ?? []).map(normalizeCert),
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

// Display-shape version of getMeetingPhotos — what the VPPR editor and
// the member-facing Photo Memories page both actually render.
export async function getMeetingPhotosView(meeting) {
  const row = await getMeetingPhotos(meeting.id)
  return row ? fromMeetingPhotosRow(row, meeting) : null
}

async function upsertMeetingPhotosRow(meeting, patch) {
  const existing = await getMeetingPhotos(meeting.id)
  const row = {
    meeting_id: meeting.id,
    theme: existing?.theme ?? meeting.theme ?? '',
    poster_url: existing?.poster_url ?? null,
    photos: existing?.photos ?? [],
    certificates: existing?.certificates ?? [],
    ...patch,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('meeting_photos').upsert(row, { onConflict: 'meeting_id' })
  if (error) {
    console.error('[mockPhotoStore] upsertMeetingPhotosRow failed:', error.message)
    throw new Error('Could not save — try again in a moment.')
  }
  return fromMeetingPhotosRow(row, meeting)
}

// Every meeting-photos action below saves immediately (no separate
// "submit" step) — so whatever the VPPR uploaded is always the real,
// editable state, visible and changeable any time they come back to
// this meeting's date, matching every other photo section in this app.

export async function saveMeetingTheme(meeting, theme) {
  const next = await upsertMeetingPhotosRow(meeting, { theme })
  logAction(`VPPR set the theme for ${meeting.dateLabel}`)
  return next
}

// One poster per meeting — uploading a new one replaces (and deletes)
// whichever was there before, same "replace, don't accumulate" pattern
// as the meeting theme.
export async function setMeetingPoster(meeting, file) {
  const posterUrl = await uploadClubPhoto(file, `meetings/${meeting.id}/poster`)
  const existing = await getMeetingPhotos(meeting.id)
  const next = await upsertMeetingPhotosRow(meeting, { poster_url: posterUrl })
  if (existing?.poster_url) await deleteClubPhoto(existing.poster_url)
  logAction(`VPPR uploaded a poster for ${meeting.dateLabel}`)
  return next
}

export async function removeMeetingPoster(meeting) {
  const existing = await getMeetingPhotos(meeting.id)
  const next = await upsertMeetingPhotosRow(meeting, { poster_url: null })
  if (existing?.poster_url) await deleteClubPhoto(existing.poster_url)
  logAction(`VPPR removed the poster for ${meeting.dateLabel}`)
  return next
}

export async function addMeetingGroupPhotos(meeting, files) {
  const uploaded = await Promise.all(
    files.map(async (file) => ({
      id: crypto.randomUUID(),
      url: await uploadClubPhoto(file, `meetings/${meeting.id}`),
    })),
  )
  const existing = await getMeetingPhotos(meeting.id)
  const next = await upsertMeetingPhotosRow(meeting, {
    photos: [...(existing?.photos ?? []), ...uploaded],
  })
  logAction(`VPPR added ${uploaded.length} photo${uploaded.length === 1 ? '' : 's'} for ${meeting.dateLabel}`)
  return next
}

export async function removeMeetingGroupPhoto(meeting, photoId, url) {
  const existing = await getMeetingPhotos(meeting.id)
  const next = await upsertMeetingPhotosRow(meeting, {
    photos: (existing?.photos ?? []).filter((p) => p.id !== photoId),
  })
  await deleteClubPhoto(url)
  logAction(`VPPR removed a photo from ${meeting.dateLabel}`)
  return next
}

// One entry per award category — saving an award that already has an
// entry (the VPPR editing it) swaps that entry out rather than creating a
// duplicate. Editing without choosing a new photo keeps the existing
// photo (e.g. just correcting the winner's name shouldn't wipe it) — a
// new photo is only uploaded, and the old one only deleted, when the
// VPPR actually picks a replacement file.
export async function addMeetingCertificate(meeting, { category, winnerName, certificateFile }) {
  const existing = await getMeetingPhotos(meeting.id)
  const replaced = (existing?.certificates ?? []).find((c) => c.category === category)
  const certificateUrl = certificateFile
    ? await uploadClubPhoto(certificateFile, `meetings/${meeting.id}/certificates`)
    : (replaced?.certificateUrl ?? null)
  const withoutSameCategory = (existing?.certificates ?? []).filter((c) => c.category !== category)
  const next = await upsertMeetingPhotosRow(meeting, {
    certificates: [
      ...withoutSameCategory,
      { id: crypto.randomUUID(), category, winnerName, certificateUrl },
    ],
  })
  if (certificateFile && replaced?.certificateUrl) await deleteClubPhoto(replaced.certificateUrl)
  logAction(`VPPR set "${category}" to ${winnerName} for ${meeting.dateLabel}`)
  return next
}

// For the member-facing Photo Memories page — every meeting that has at
// least a poster, a photo, or a certificate uploaded, newest upload first.
export async function getAllMeetingPhotos(meetings) {
  const { data, error } = await supabase.from('meeting_photos').select('*')
  if (error) console.error('[mockPhotoStore] getAllMeetingPhotos failed:', error.message)
  const rows = data ?? []
  return rows
    .map((row) => {
      const meeting = meetings.find((m) => m.id === row.meeting_id && !m.cancelled)
      return meeting ? fromMeetingPhotosRow(row, meeting) : null
    })
    .filter((m) => m && (m.posterUrl || m.photos.length > 0 || m.certificates.length > 0))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}
