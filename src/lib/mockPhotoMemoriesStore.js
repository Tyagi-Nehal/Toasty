// Shared source of truth for meeting photos/certificates — the VPPR-facing
// Photo Upload page writes here, and the member-facing Photo Memories page
// reads the same data, so an upload actually shows up rather than living in
// a disconnected mock dataset (same linkage pattern as Roles<->Agenda,
// MOM<->Minutes). Past seed meetings (picsum placeholders) are normalized
// to the same {photos: [{id, src}], certificates: [{id, label, src}]} shape
// as real uploads, so the UI never needs to know which is which.

import { photoMemories as seedMemories } from '../data/mockPhotoMemories.js'

const STORAGE_KEY = 'toasty_photo_uploads'
const LOG_KEY = 'toasty_photo_upload_log'
const MAX_LOG_ENTRIES = 25

function readUploads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeUploads(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

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

function normalizeSeedMeeting(meeting) {
  return {
    id: meeting.id,
    dateLabel: meeting.dateLabel,
    theme: meeting.theme,
    photos: meeting.photoSeeds.map((seed) => ({
      id: seed,
      src: `https://picsum.photos/seed/${seed}/600/600`,
    })),
    certificates: meeting.certificates.map((cert) => ({
      id: cert.seed,
      label: cert.label,
      src: `https://picsum.photos/seed/${cert.seed}/400/300`,
    })),
  }
}

// Uploads are keyed by meetingId; getPhotoMemories() shows the most
// recently-uploaded-to meeting first, ahead of the static seed history.
export function getPhotoMemories() {
  const uploaded = [...readUploads()].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  )
  return [...uploaded, ...seedMemories.map(normalizeSeedMeeting)]
}

export function getUploadForMeeting(meetingId) {
  return readUploads().find((m) => m.id === meetingId) ?? null
}

export function addPhotoUpload({ meetingId, dateLabel, theme, photos, certificates }) {
  const uploads = readUploads()
  const existing = uploads.find((m) => m.id === meetingId)

  const next = existing
    ? {
        ...existing,
        dateLabel,
        theme: theme || existing.theme,
        photos: [...existing.photos, ...photos],
        certificates: [...existing.certificates, ...certificates],
        updatedAt: new Date().toISOString(),
      }
    : {
        id: meetingId,
        dateLabel,
        theme,
        photos,
        certificates,
        updatedAt: new Date().toISOString(),
      }

  writeUploads(existing ? uploads.map((m) => (m.id === meetingId ? next : m)) : [...uploads, next])
  logAction(
    `VPPR uploaded ${photos.length} photo${photos.length === 1 ? '' : 's'} and ${
      certificates.length
    } certificate${certificates.length === 1 ? '' : 's'} for ${dateLabel}`,
  )
  return next
}
