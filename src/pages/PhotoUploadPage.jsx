import { useEffect, useState } from 'react'
import {
  Award,
  CalendarDays,
  CheckCircle2,
  History,
  ImagePlus,
  Images,
  Plus,
  Trash2,
  UploadCloud,
  UsersRound,
  X,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import { getMeetings } from '../lib/mockRolesStore.js'
import { currentExcom, pastExcom } from '../data/excom.js'
import { uploadClubPhoto } from '../lib/storage.js'
import {
  addClubPagePhoto,
  addMeetingPhotos,
  getClubPagePhotos,
  getExcomProfiles,
  getMeetingPhotos,
  getPhotoUploadLog,
  removeClubPagePhoto,
  upsertExcomProfile,
} from '../lib/mockPhotoStore.js'

const SECTIONS = [
  { id: 'hero', label: 'Hero (below the login button)' },
  { id: 'gallery', label: 'Photo Gallery' },
  { id: 'story', label: 'Our Story' },
  { id: 'achievements', label: 'Achievements' },
]

const TABS = [
  { id: 'club', label: "Upload Photos on Club's Page", icon: Images },
  { id: 'meeting', label: 'Upload Meeting Photos & Certificates', icon: CalendarDays },
  { id: 'excom', label: 'ExCom Profiles', icon: UsersRound },
]

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function ClubPagePhotosTab() {
  const [section, setSection] = useState('hero')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)

  function refresh(s) {
    getClubPagePhotos(s).then(setPhotos)
  }

  useEffect(() => {
    refresh(section)
  }, [section])

  async function handleFiles(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setUploading(true)
    for (const file of files) {
      await addClubPagePhoto(section, file)
    }
    setUploading(false)
    refresh(section)
  }

  async function handleRemove(photo) {
    await removeClubPagePhoto(photo.id, photo.url)
    refresh(section)
  }

  return (
    <div className="rounded-3xl border border-accent/30 bg-white p-6">
      <label className="text-xs font-medium text-ink/60">Section</label>
      <select
        value={section}
        onChange={(e) => setSection(e.target.value)}
        className="mt-1.5 block w-full max-w-xs rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none sm:w-auto"
      >
        {SECTIONS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-accent/40 p-8 text-center transition hover:border-primary">
        <UploadCloud size={24} className="text-primary" />
        <span className="text-sm font-medium text-ink">
          {uploading ? 'Uploading…' : 'Click to choose photos'}
        </span>
        <span className="text-xs text-ink/50">or drag and drop image files</span>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handleFiles}
          className="hidden"
        />
      </label>

      {photos.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl">
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(photo)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-cream opacity-0 transition group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink/50">
          No photos uploaded yet for this section — it won't show on the club page until you add some.
        </p>
      )}
    </div>
  )
}

function MeetingPhotosTab({ log, refreshLog }) {
  const [meetings, setMeetings] = useState([])
  const [meetingId, setMeetingId] = useState(null)
  const [theme, setTheme] = useState('')
  const [photoFiles, setPhotoFiles] = useState([])
  const [certLabel, setCertLabel] = useState('')
  const [certificates, setCertificates] = useState([])
  const [uploaded, setUploaded] = useState(null)
  const [justUploaded, setJustUploaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getMeetings().then((fetched) => {
      setMeetings(fetched)
      setMeetingId((prev) => prev ?? fetched[0]?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (meetingId) getMeetingPhotos(meetingId).then(setUploaded)
  }, [meetingId])

  const activeMeeting = meetings.find((m) => m.id === meetingId)

  function handleMeetingChange(id) {
    setMeetingId(id)
    setPhotoFiles([])
    setCertificates([])
    setJustUploaded(false)
  }

  function handlePhotoFiles(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    setPhotoFiles((prev) => [
      ...prev,
      ...files.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) })),
    ])
  }

  function handleCertFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !certLabel.trim()) return
    setCertificates((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: certLabel.trim(), file, preview: URL.createObjectURL(file) },
    ])
    setCertLabel('')
  }

  function removePhoto(id) {
    setPhotoFiles((prev) => prev.filter((p) => p.id !== id))
  }

  function removeCert(id) {
    setCertificates((prev) => prev.filter((c) => c.id !== id))
  }

  async function handleSubmit() {
    setSubmitting(true)
    const next = await addMeetingPhotos(activeMeeting, {
      theme,
      newPhotoFiles: photoFiles.map((p) => p.file),
      newCertificates: certificates.map((c) => ({ label: c.label, file: c.file })),
    })
    setSubmitting(false)
    if (next) setUploaded(next)
    setPhotoFiles([])
    setCertificates([])
    setTheme('')
    setJustUploaded(true)
    refreshLog()
  }

  const hasNewContent = photoFiles.length > 0 || certificates.length > 0

  if (!activeMeeting) {
    return <p className="text-sm text-ink/50">Loading meetings...</p>
  }

  return (
    <div className="space-y-6">
      {/* Meeting selector */}
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-primary" />
        <select
          value={meetingId}
          onChange={(e) => handleMeetingChange(Number(e.target.value))}
          className="rounded-xl border border-accent/40 bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
        >
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.dateLabel}
            </option>
          ))}
        </select>
      </div>

      {uploaded && (
        <p className="flex items-center gap-1.5 text-xs text-ink/50">
          <CheckCircle2 size={13} className="text-primary" />
          Already has {uploaded.photos.length} photo
          {uploaded.photos.length === 1 ? '' : 's'} and {uploaded.certificates.length}{' '}
          certificate{uploaded.certificates.length === 1 ? '' : 's'} uploaded.
        </p>
      )}

      {justUploaded && (
        <div className="flex items-center gap-2 rounded-2xl bg-primary/10 p-4 text-sm font-medium text-primary">
          <CheckCircle2 size={18} />
          Uploaded — now visible on the Photo Memories page.
        </div>
      )}

      {/* Theme */}
      <div className="rounded-3xl border border-accent/30 bg-white p-6">
        <label className="text-xs font-medium text-ink/60">
          Meeting Theme <span className="text-ink/40">(optional)</span>
        </label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g. Turning Points"
          className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
        />
      </div>

      {/* Group photos */}
      <div className="rounded-3xl border border-accent/30 bg-white p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Images size={16} className="text-primary" />
          Group Photos
        </div>

        <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-accent/40 p-8 text-center transition hover:border-primary">
          <UploadCloud size={24} className="text-primary" />
          <span className="text-sm font-medium text-ink">Click to choose photos</span>
          <span className="text-xs text-ink/50">or drag and drop image files</span>
          <input type="file" accept="image/*" multiple onChange={handlePhotoFiles} className="hidden" />
        </label>

        {photoFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photoFiles.map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl">
                <img src={photo.preview} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-cream opacity-0 transition group-hover:opacity-100"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates */}
      <div className="rounded-3xl border border-accent/30 bg-white p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Award size={16} className="text-primary" />
          Certificates
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={certLabel}
            onChange={(e) => setCertLabel(e.target.value)}
            placeholder="e.g. Best Speaker — Vikram"
            className="min-w-0 flex-1 rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
          />
          <label
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              certLabel.trim()
                ? 'cursor-pointer border-primary text-primary hover:bg-primary hover:text-cream'
                : 'cursor-not-allowed border-accent/30 text-ink/30'
            }`}
          >
            <Plus size={15} />
            Add certificate
            <input
              type="file"
              accept="image/*"
              disabled={!certLabel.trim()}
              onChange={handleCertFile}
              className="hidden"
            />
          </label>
        </div>
        <p className="mt-1.5 text-xs text-ink/40">Type a label first, then choose the certificate image.</p>

        {certificates.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {certificates.map((cert) => (
              <div key={cert.id} className="group relative overflow-hidden rounded-xl border border-accent/30 bg-cream">
                <img src={cert.preview} alt={cert.label} className="h-24 w-full object-cover" />
                <p className="truncate px-2.5 py-1.5 text-xs font-medium text-ink/70">{cert.label}</p>
                <button
                  type="button"
                  onClick={() => removeCert(cert.id)}
                  aria-label="Remove certificate"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-cream opacity-0 transition group-hover:opacity-100"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!hasNewContent || submitting}
        onClick={handleSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        <UploadCloud size={16} />
        {submitting ? 'Uploading…' : `Upload for ${activeMeeting.dateLabel}`}
      </button>

      {/* Activity log */}
      <div className="rounded-3xl border border-accent/30 bg-white p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <History size={16} className="text-primary" />
          Upload History
        </div>
        {log.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {log.map((entry) => (
              <li key={entry.id} className="border-l-2 border-accent/30 pl-3">
                <p className="text-sm leading-snug text-ink/80">{entry.message}</p>
                <p className="mt-0.5 text-xs text-ink/40">{timeAgo(entry.time)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink/50">No uploads yet.</p>
        )}
      </div>
    </div>
  )
}

function ExcomProfilesTab({ refreshLog }) {
  const allMembers = [
    ...currentExcom.map((m) => ({ ...m, group: 'Current ExCom' })),
    ...pastExcom.map((m) => ({ ...m, group: 'Past ExCom' })),
  ]
  const [profiles, setProfiles] = useState({})
  const [selectedId, setSelectedId] = useState(allMembers[0]?.id ?? null)
  const [bioDraft, setBioDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  function refresh() {
    getExcomProfiles().then(setProfiles)
  }

  useEffect(() => {
    refresh()
  }, [])

  const selected = allMembers.find((m) => m.id === selectedId)
  const selectedProfile = profiles[selectedId]

  useEffect(() => {
    setBioDraft(selectedProfile?.bio ?? '')
    setPhotoFile(null)
    setPhotoPreview(null)
  }, [selectedId, selectedProfile?.bio])

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setSaving(true)
    let photoUrl = selectedProfile?.photoUrl ?? null
    if (photoFile) {
      photoUrl = await uploadClubPhoto(photoFile, 'excom-profiles')
    }
    await upsertExcomProfile(selected.id, selected.name, { photoUrl, bio: bioDraft })
    setSaving(false)
    setPhotoFile(null)
    setPhotoPreview(null)
    refresh()
    refreshLog()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-3xl border border-accent/30 bg-white p-4 lg:col-span-1">
        <div className="max-h-[520px] space-y-1 overflow-y-auto">
          {['Current ExCom', 'Past ExCom'].map((group) => (
            <div key={group}>
              <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink/40">
                {group}
              </p>
              {allMembers
                .filter((m) => m.group === group)
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                      selectedId === m.id ? 'bg-primary/10' : 'hover:bg-cream'
                    }`}
                  >
                    <Avatar name={m.name} size={28} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                      {m.name}
                    </span>
                    <span className="shrink-0 text-xs text-ink/40">{m.role}</span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="rounded-3xl border border-accent/30 bg-white p-6 lg:col-span-2">
          <div className="flex items-center gap-4">
            {photoPreview || selectedProfile?.photoUrl ? (
              <img
                src={photoPreview ?? selectedProfile.photoUrl}
                alt={selected.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <Avatar name={selected.name} size={64} />
            )}
            <div>
              <p className="font-semibold text-ink">{selected.name}</p>
              <p className="text-sm text-ink/60">{selected.role}</p>
            </div>
          </div>

          <label className="mt-5 flex w-fit cursor-pointer items-center gap-1.5 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-cream">
            <ImagePlus size={15} />
            Choose profile photo
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>

          <label className="mt-5 block text-xs font-medium text-ink/60">Bio / info</label>
          <textarea
            rows={4}
            value={bioDraft}
            onChange={(e) => setBioDraft(e.target.value)}
            placeholder={`A few lines about ${selected.name}...`}
            className="mt-1.5 w-full resize-none rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
          />

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 size={16} />
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function PhotoUploadPage() {
  const [tab, setTab] = useState('club')
  const [log, setLog] = useState(() => getPhotoUploadLog())

  function refreshLog() {
    setLog(getPhotoUploadLog())
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <ImagePlus size={22} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Photo Upload</h1>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Manage every photo the club shows — the public club page, meeting memories, and ExCom profiles.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === id
                  ? 'bg-primary text-cream'
                  : 'border border-accent/30 bg-white text-ink/70 hover:border-primary/50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'club' && <ClubPagePhotosTab />}
          {tab === 'meeting' && <MeetingPhotosTab log={log} refreshLog={refreshLog} />}
          {tab === 'excom' && <ExcomProfilesTab refreshLog={refreshLog} />}
        </div>
      </div>
    </MemberLayout>
  )
}
