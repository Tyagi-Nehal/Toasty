import { useEffect, useState } from 'react'
import {
  Award,
  CalendarDays,
  CheckCircle2,
  History,
  Image as ImageIcon,
  ImagePlus,
  Images,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  UsersRound,
  X,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import PhotoLightbox from '../components/PhotoLightbox.jsx'
import CancelledMeetingNotice from '../components/CancelledMeetingNotice.jsx'
import { createMeetingForDate, getMeetings, renameMeeting } from '../lib/mockRolesStore.js'
import { currentExcom, pastExcom } from '../data/excom.js'
import { uploadClubPhoto } from '../lib/storage.js'
import {
  addClubPagePhoto,
  addContentBlock,
  addMeetingCertificate,
  addMeetingGroupPhotos,
  getClubPagePhotos,
  getContentBlocks,
  getExcomProfiles,
  getMeetingPhotosView,
  getPhotoUploadLog,
  removeClubPagePhoto,
  removeContentBlock,
  removeMeetingGroupPhoto,
  removeMeetingPoster,
  saveMeetingTheme,
  setMeetingPoster,
  updateContentBlock,
  upsertExcomProfile,
} from '../lib/mockPhotoStore.js'

const CLUB_PAGE_SECTIONS = [
  { id: 'hero', label: 'Main Banner' },
  { id: 'story', label: 'Our Story' },
  { id: 'achievements', label: 'Achievements' },
]

const TABS = [
  { id: 'club', label: "Upload Photos on Club's Page", icon: Images },
  { id: 'meeting', label: 'Upload Meeting Photos & Certificates', icon: CalendarDays },
  { id: 'excom', label: 'ExCom Profiles', icon: UsersRound },
]

const CERT_CATEGORIES = [
  'Best Main Role Taker',
  'Best Auxiliary Role Player',
  'Best Speaker',
  'Best Evaluator',
  'Best Listener',
  'Best Table Topic Speaker',
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

function MainBannerUploader() {
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)

  function refresh() {
    getClubPagePhotos('hero').then(setPhotos)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleFiles(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setUploading(true)
    for (const file of files) {
      await addClubPagePhoto('hero', file)
    }
    setUploading(false)
    refresh()
  }

  async function handleRemove(photo) {
    await removeClubPagePhoto(photo.id, photo.url)
    refresh()
  }

  return (
    <div className="rounded-3xl border border-accent/30 bg-white p-6">
      <label className="mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-accent/40 p-8 text-center transition hover:border-primary">
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
          No photos uploaded yet — the club page's banner will show a plain color background until you add some.
        </p>
      )}
    </div>
  )
}

// Shared editor for "Our Story" / "Achievements" content blocks (photo +
// title + text, repeatable) — same shape and UI for both sections.
function ContentBlocksEditor({ section }) {
  const [blocks, setBlocks] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    getContentBlocks(section).then(setBlocks)
  }

  useEffect(() => {
    refresh()
    setFormOpen(false)
  }, [section])

  function startAdd() {
    setEditingId(null)
    setTitle('')
    setContent('')
    setExistingPhotoUrl(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    setFormOpen(true)
  }

  function startEdit(block) {
    setEditingId(block.id)
    setTitle(block.title)
    setContent(block.content ?? '')
    setExistingPhotoUrl(block.photoUrl)
    setPhotoFile(null)
    setPhotoPreview(null)
    setFormOpen(true)
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    if (editingId) {
      await updateContentBlock(editingId, section, {
        title: title.trim(),
        content: content.trim(),
        photoUrl: existingPhotoUrl,
        file: photoFile,
      })
    } else {
      await addContentBlock(section, { title: title.trim(), content: content.trim(), file: photoFile })
    }
    setSaving(false)
    setFormOpen(false)
    refresh()
  }

  async function handleDelete(block) {
    await removeContentBlock(block.id, block.photoUrl)
    refresh()
  }

  return (
    <div className="space-y-3">
      {blocks.map((block) => (
        <div
          key={block.id}
          className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-white p-4"
        >
          {block.photoUrl ? (
            <img src={block.photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-cream text-ink/30">
              <ImageIcon size={20} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{block.title}</p>
            {block.content && <p className="truncate text-xs text-ink/50">{block.content}</p>}
          </div>
          <button
            type="button"
            onClick={() => startEdit(block)}
            aria-label="Edit block"
            className="rounded-lg p-1.5 text-ink/40 transition hover:bg-cream hover:text-primary"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(block)}
            aria-label="Delete block"
            className="rounded-lg p-1.5 text-ink/40 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      {!formOpen ? (
        <button
          type="button"
          onClick={startAdd}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-accent/50 px-4 py-3 text-sm font-semibold text-ink/60 transition hover:border-primary hover:text-primary"
        >
          <Plus size={15} />
          Add Block
        </button>
      ) : (
        <div className="rounded-3xl border border-accent/30 bg-white p-6">
          <label className="text-xs font-medium text-ink/60">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How We Started"
            className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
          />

          <label className="mt-4 block text-xs font-medium text-ink/60">Content</label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a few paragraphs..."
            className="mt-1.5 w-full resize-none rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
          />

          <label className="mt-4 block text-xs font-medium text-ink/60">
            Photo <span className="text-ink/40">(optional)</span>
          </label>
          {(photoPreview || existingPhotoUrl) && (
            <img
              src={photoPreview ?? existingPhotoUrl}
              alt=""
              className="mt-2 h-32 w-full rounded-xl object-cover"
            />
          )}
          <label className="mt-2 flex w-fit cursor-pointer items-center gap-1.5 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-cream">
            <ImagePlus size={15} />
            Choose photo
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="flex-1 rounded-xl border border-accent/40 px-4 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-cream"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save Block'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ClubPageTab() {
  const [activeSection, setActiveSection] = useState('hero')

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CLUB_PAGE_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeSection === s.id
                ? 'bg-primary text-cream'
                : 'border border-accent/30 bg-white text-ink/70 hover:border-primary/50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeSection === 'hero' && <MainBannerUploader />}
        {activeSection === 'story' && <ContentBlocksEditor section="story" />}
        {activeSection === 'achievements' && <ContentBlocksEditor section="achievements" />}
      </div>
    </div>
  )
}

function MeetingPhotosTab({ log, refreshLog }) {
  const [meetings, setMeetings] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [uploaded, setUploaded] = useState(null)
  const [theme, setTheme] = useState('')
  const [savingTheme, setSavingTheme] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')
  const [savingLabel, setSavingLabel] = useState(false)
  const [addingPhotos, setAddingPhotos] = useState(false)
  const [certCategory, setCertCategory] = useState(CERT_CATEGORIES[0])
  const [certWinner, setCertWinner] = useState('')
  const [certFile, setCertFile] = useState(null)
  const [certPreview, setCertPreview] = useState(null)
  const [addingCert, setAddingCert] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [addingMeeting, setAddingMeeting] = useState(false)
  const [addingPoster, setAddingPoster] = useState(false)

  function refreshMeetings() {
    return getMeetings().then((fetched) => {
      setMeetings(fetched)
      setSelectedDate((prev) => prev || fetched[0]?.date || '')
    })
  }

  useEffect(() => {
    refreshMeetings()
  }, [])

  async function handleAddMeeting() {
    setAddingMeeting(true)
    try {
      await createMeetingForDate(selectedDate)
      await refreshMeetings()
    } catch (err) {
      window.alert(err.message)
    }
    setAddingMeeting(false)
  }

  const activeMeeting = meetings.find((m) => m.date === selectedDate)

  function refresh() {
    if (!activeMeeting) return
    getMeetingPhotosView(activeMeeting).then((view) => {
      setUploaded(view)
      setTheme(view?.theme ?? '')
    })
  }

  useEffect(() => {
    if (activeMeeting) refresh()
    else {
      setUploaded(null)
      setTheme('')
    }
    setLabelDraft(activeMeeting?.label ?? '')
  }, [activeMeeting?.id])

  async function handleLabelBlur() {
    const trimmed = labelDraft.trim()
    if (!activeMeeting || !trimmed || trimmed === activeMeeting.label) {
      setLabelDraft(activeMeeting?.label ?? '')
      return
    }
    setSavingLabel(true)
    try {
      await renameMeeting(activeMeeting.id, trimmed)
      await refreshMeetings()
    } catch (err) {
      window.alert(err.message)
      setLabelDraft(activeMeeting.label)
    }
    setSavingLabel(false)
  }

  function resetCertForm() {
    setCertCategory(CERT_CATEGORIES[0])
    setCertWinner('')
    setCertFile(null)
    setCertPreview(null)
  }

  function handleDateChange(date) {
    setSelectedDate(date)
    resetCertForm()
  }

  async function handleThemeBlur() {
    if (!activeMeeting || theme === (uploaded?.theme ?? '')) return
    setSavingTheme(true)
    const next = await saveMeetingTheme(activeMeeting, theme)
    setUploaded(next)
    setSavingTheme(false)
    refreshLog()
  }

  async function handlePhotoFiles(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setAddingPhotos(true)
    const next = await addMeetingGroupPhotos(activeMeeting, files)
    setUploaded(next)
    setAddingPhotos(false)
    refreshLog()
  }

  async function handleRemovePhoto(photo) {
    const next = await removeMeetingGroupPhoto(activeMeeting, photo.id, photo.src)
    setUploaded(next)
    refreshLog()
  }

  async function handlePosterFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAddingPoster(true)
    const next = await setMeetingPoster(activeMeeting, file)
    setUploaded(next)
    setAddingPoster(false)
    refreshLog()
  }

  async function handleRemovePoster() {
    const next = await removeMeetingPoster(activeMeeting)
    setUploaded(next)
    refreshLog()
  }

  function handleCertFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setCertFile(file)
    setCertPreview(URL.createObjectURL(file))
  }

  function handleEditCertificate(cert) {
    setCertCategory(cert.category)
    setCertWinner(cert.winnerName)
    setCertFile(null)
    setCertPreview(cert.certificateSrc)
  }

  const editingExisting = uploaded?.certificates?.some((c) => c.category === certCategory)

  async function handleAddCertificate() {
    if (!certWinner.trim()) return
    setAddingCert(true)
    const next = await addMeetingCertificate(activeMeeting, {
      category: certCategory,
      winnerName: certWinner.trim(),
      certificateFile: certFile,
    })
    setUploaded(next)
    setAddingCert(false)
    resetCertForm()
    refreshLog()
  }

  return (
    <div className="space-y-6">
      {/* Date picker */}
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-primary" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="rounded-xl border border-accent/40 bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
        />
        {activeMeeting && (
          <input
            type="text"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={handleLabelBlur}
            className="w-28 rounded-xl border border-accent/40 bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
          />
        )}
        {(savingTheme || savingLabel) && (
          <span className="text-xs font-medium text-primary">Saving…</span>
        )}
      </div>

      {!activeMeeting ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-ink/50">No meeting scheduled for this date.</p>
          <button
            type="button"
            onClick={handleAddMeeting}
            disabled={addingMeeting}
            className="flex items-center gap-1.5 rounded-xl border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition enabled:hover:bg-primary enabled:hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={13} />
            {addingMeeting ? 'Adding…' : 'Add this meeting'}
          </button>
        </div>
      ) : activeMeeting.cancelled ? (
        <CancelledMeetingNotice
          dateLabel={activeMeeting.dateLabel}
          reason={activeMeeting.cancelReason}
        />
      ) : (
        <>
          {/* Theme */}
          <div className="rounded-3xl border border-accent/30 bg-white p-6">
            <label className="text-xs font-medium text-ink/60">
              Meeting Theme <span className="text-ink/40">(optional)</span>
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onBlur={handleThemeBlur}
              placeholder="e.g. Turning Points"
              className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Poster */}
          <div className="rounded-3xl border border-accent/30 bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ImageIcon size={16} className="text-primary" />
              Meeting Poster
            </div>
            <p className="mt-1 text-xs text-ink/40">
              One poster per meeting — uploading a new one replaces it.
            </p>

            {uploaded?.posterUrl ? (
              <div className="relative mt-4 w-full max-w-xs">
                <img
                  src={uploaded.posterUrl}
                  alt="Meeting poster"
                  onClick={() => setLightboxUrl(uploaded.posterUrl)}
                  className="w-full cursor-pointer rounded-2xl object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePoster}
                  aria-label="Remove poster"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-cream transition hover:bg-ink/80"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-accent/40 p-8 text-center transition hover:border-primary">
                <UploadCloud size={24} className="text-primary" />
                <span className="text-sm font-medium text-ink">
                  {addingPoster ? 'Uploading…' : 'Click to choose a poster'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={addingPoster}
                  onChange={handlePosterFile}
                  className="hidden"
                />
              </label>
            )}
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
                {addingPhotos ? 'Uploading…' : 'Click to choose photos'}
              </span>
              <span className="text-xs text-ink/50">or drag and drop image files — add as many as you like</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={addingPhotos}
                onChange={handlePhotoFiles}
                className="hidden"
              />
            </label>

            {uploaded?.photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {uploaded.photos.map((photo) => (
                  <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl">
                    <img
                      src={photo.src}
                      alt=""
                      onClick={() => setLightboxUrl(photo.src)}
                      className="h-full w-full cursor-pointer object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo)}
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
            <p className="mt-1 text-xs text-ink/40">
              One winner per award — edit anytime to change the winner or swap the photo.
            </p>

            {uploaded?.certificates.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {uploaded.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className={`relative rounded-xl border bg-cream p-3 ${
                      editingExisting && cert.category === certCategory
                        ? 'border-primary ring-1 ring-primary/40'
                        : 'border-accent/30'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleEditCertificate(cert)}
                      aria-label="Edit award"
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-cream transition hover:bg-ink/80"
                    >
                      <Pencil size={12} />
                    </button>
                    <p className="pr-6 text-xs font-semibold text-ink">{cert.category}</p>
                    <p className="text-xs text-ink/60">{cert.winnerName}</p>
                    <div className="mt-2">
                      {cert.certificateSrc ? (
                        <img
                          src={cert.certificateSrc}
                          alt="Certificate"
                          onClick={() => setLightboxUrl(cert.certificateSrc)}
                          className="h-20 w-full cursor-pointer rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-20 items-center justify-center rounded-lg bg-accent/10 text-[10px] text-ink/40">
                          No certificate photo
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-dashed border-accent/40 p-4">
              {editingExisting && (
                <p className="mb-3 text-xs font-medium text-primary">
                  Editing "{certCategory}" — change the name and/or photo, then save.
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-ink/60">Award</label>
                  <select
                    value={certCategory}
                    onChange={(e) => setCertCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                  >
                    {CERT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink/60">Winner's name</label>
                  <input
                    type="text"
                    value={certWinner}
                    onChange={(e) => setCertWinner(e.target.value)}
                    placeholder="e.g. Vikram"
                    className="mt-1 w-full rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label
                  className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    certWinner.trim()
                      ? 'cursor-pointer border-primary text-primary hover:bg-primary hover:text-cream'
                      : 'cursor-not-allowed border-accent/30 text-ink/30'
                  }`}
                >
                  <ImagePlus size={15} />
                  Certificate photo
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!certWinner.trim()}
                    onChange={handleCertFileChange}
                    className="hidden"
                  />
                </label>
                {certPreview && (
                  <img src={certPreview} alt="" className="mt-2 h-16 w-full rounded-lg object-cover" />
                )}
              </div>

              <button
                type="button"
                onClick={handleAddCertificate}
                disabled={!certWinner.trim() || addingCert}
                className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={15} />
                {addingCert ? 'Saving…' : editingExisting ? 'Update Certificate' : 'Add Certificate'}
              </button>
            </div>
          </div>
        </>
      )}

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

      <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
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
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [posX, setPosX] = useState(50)
  const [posY, setPosY] = useState(50)
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
    setPhone(selectedProfile?.phone ?? '')
    setEmail(selectedProfile?.email ?? '')
    const [px, py] = (selectedProfile?.photoPosition ?? '50% 50%').replace(/%/g, '').split(' ').map(Number)
    setPosX(Number.isFinite(px) ? px : 50)
    setPosY(Number.isFinite(py) ? py : 50)
    setPhotoFile(null)
    setPhotoPreview(null)
  }, [selectedId, selectedProfile?.bio, selectedProfile?.phone, selectedProfile?.email, selectedProfile?.photoPosition])

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
    await upsertExcomProfile(selected.id, selected.name, {
      photoUrl,
      photoPosition: `${posX}% ${posY}%`,
      bio: bioDraft,
      phone,
      email,
    })
    setSaving(false)
    setPhotoFile(null)
    setPhotoPreview(null)
    refresh()
    refreshLog()
  }

  const displayPhoto = photoPreview ?? selectedProfile?.photoUrl

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
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-cream">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt={selected.name}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${posX}% ${posY}%` }}
                />
              ) : (
                <Avatar name={selected.name} size={80} />
              )}
            </div>
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

          {displayPhoto && (
            <div className="mt-4 max-w-xs space-y-3">
              <p className="text-xs font-medium text-ink/60">
                Adjust the photo to fit the circle
              </p>
              <div>
                <label className="text-xs text-ink/50">Horizontal position</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={posX}
                  onChange={(e) => setPosX(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </div>
              <div>
                <label className="text-xs text-ink/50">Vertical position</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={posY}
                  onChange={(e) => setPosY(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </div>
            </div>
          )}

          <label className="mt-5 block text-xs font-medium text-ink/60">Bio / info</label>
          <textarea
            rows={4}
            value={bioDraft}
            onChange={(e) => setBioDraft(e.target.value)}
            placeholder={`A few lines about ${selected.name}...`}
            className="mt-1.5 w-full resize-none rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-ink/60">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/60">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
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
          {tab === 'club' && <ClubPageTab />}
          {tab === 'meeting' && <MeetingPhotosTab log={log} refreshLog={refreshLog} />}
          {tab === 'excom' && <ExcomProfilesTab refreshLog={refreshLog} />}
        </div>
      </div>
    </MemberLayout>
  )
}
