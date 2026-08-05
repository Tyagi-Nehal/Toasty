import { useState } from 'react'
import {
  Award,
  CalendarDays,
  CheckCircle2,
  History,
  ImagePlus,
  Images,
  Plus,
  UploadCloud,
  X,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import { getMeetings } from '../lib/mockRolesStore.js'
import {
  addPhotoUpload,
  getPhotoUploadLog,
  getUploadForMeeting,
} from '../lib/mockPhotoMemoriesStore.js'
import { imageToDataUrl } from '../lib/imageToDataUrl.js'

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

export default function PhotoUploadPage() {
  const meetings = getMeetings()
  const [meetingId, setMeetingId] = useState(meetings[0].id)
  const [theme, setTheme] = useState('')
  const [photos, setPhotos] = useState([])
  const [certLabel, setCertLabel] = useState('')
  const [certificates, setCertificates] = useState([])
  const [uploaded, setUploaded] = useState(() => getUploadForMeeting(meetings[0].id))
  const [log, setLog] = useState(() => getPhotoUploadLog())
  const [justUploaded, setJustUploaded] = useState(false)

  const activeMeeting = meetings.find((m) => m.id === meetingId)

  function handleMeetingChange(id) {
    setMeetingId(id)
    setUploaded(getUploadForMeeting(id))
    setPhotos([])
    setCertificates([])
    setJustUploaded(false)
  }

  async function handlePhotoFiles(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    const converted = await Promise.all(
      files.map(async (file) => ({
        id: crypto.randomUUID(),
        src: await imageToDataUrl(file),
      })),
    )
    setPhotos((prev) => [...prev, ...converted])
  }

  async function handleCertFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !certLabel.trim()) return
    const src = await imageToDataUrl(file, { maxDimension: 700 })
    setCertificates((prev) => [...prev, { id: crypto.randomUUID(), label: certLabel.trim(), src }])
    setCertLabel('')
  }

  function removePhoto(id) {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  function removeCert(id) {
    setCertificates((prev) => prev.filter((c) => c.id !== id))
  }

  function handleSubmit() {
    const next = addPhotoUpload({
      meetingId,
      dateLabel: activeMeeting.dateLabel,
      theme,
      photos,
      certificates,
    })
    setUploaded(next)
    setPhotos([])
    setCertificates([])
    setTheme('')
    setJustUploaded(true)
    setLog(getPhotoUploadLog())
  }

  const hasNewContent = photos.length > 0 || certificates.length > 0

  return (
    <MemberLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <ImagePlus size={22} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Photo Upload</h1>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Upload group photos and certificates for a meeting.
        </p>

        {/* Meeting selector */}
        <div className="mt-6 flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          <select
            value={meetingId}
            onChange={(e) => handleMeetingChange(e.target.value)}
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
          <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/50">
            <CheckCircle2 size={13} className="text-primary" />
            Already has {uploaded.photos.length} photo
            {uploaded.photos.length === 1 ? '' : 's'} and {uploaded.certificates.length}{' '}
            certificate{uploaded.certificates.length === 1 ? '' : 's'} uploaded.
          </p>
        )}

        {justUploaded && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-primary/10 p-4 text-sm font-medium text-primary">
            <CheckCircle2 size={18} />
            Uploaded — now visible on the Photo Memories page.
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
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
                <span className="text-sm font-medium text-ink">
                  Click to choose photos
                </span>
                <span className="text-xs text-ink/50">or drag and drop image files</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoFiles}
                  className="hidden"
                />
              </label>

              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl">
                      <img src={photo.src} alt="" className="h-full w-full object-cover" />
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
              <p className="mt-1.5 text-xs text-ink/40">
                Type a label first, then choose the certificate image.
              </p>

              {certificates.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="group relative overflow-hidden rounded-xl border border-accent/30 bg-cream"
                    >
                      <img src={cert.src} alt={cert.label} className="h-24 w-full object-cover" />
                      <p className="truncate px-2.5 py-1.5 text-xs font-medium text-ink/70">
                        {cert.label}
                      </p>
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
              disabled={!hasNewContent}
              onClick={handleSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <UploadCloud size={16} />
              Upload for {activeMeeting.dateLabel}
            </button>
          </div>

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
      </div>
    </MemberLayout>
  )
}
