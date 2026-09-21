import { useEffect, useState } from 'react'
import { GraduationCap, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import { addMentor, getMentors, removeMentor, updateMentor } from '../lib/mockMentorsStore.js'
import { getAccount } from '../lib/mockAuth.js'

// Same TM/DTM title convention as the agenda editor (AgendaEditorPage.jsx's
// TITLES) — stored as a "TM Jane Doe" / "DTM Jane Doe" prefix on the name
// itself rather than a separate column, so every reader of mentor.name
// (the public /mentors page, the member profile's "My Mentor" card)
// automatically shows it with no extra plumbing.
const MENTOR_TITLES = ['', 'TM', 'DTM']

// Splits a stored name like "DTM Jane Doe" back into { title, rest } for
// editing. No match (a name saved before this existed, or a title-less
// mentor) falls back to no title rather than guessing 'TM'.
function parseMentorName(fullName) {
  for (const title of MENTOR_TITLES) {
    if (!title) continue
    if (fullName.startsWith(`${title} `)) return { title, rest: fullName.slice(title.length + 1) }
  }
  return { title: '', rest: fullName }
}

// VPPR-only. Was previously a tab inside Photo Upload, which was
// confusing — mentors aren't photos. Its own page instead, reachable
// straight from the ExCom Dashboard's VPPR Tasks.
export default function ManageMentorsPage() {
  const [mentors, setMentors] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [name, setName] = useState('')
  const [achievements, setAchievements] = useState('')
  const [clubName, setClubName] = useState('')
  const [experience, setExperience] = useState('')
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    getMentors(getAccount()?.clubId).then(setMentors)
  }

  useEffect(() => {
    refresh()
  }, [])

  function startAdd() {
    setEditingId(null)
    setTitle('')
    setName('')
    setAchievements('')
    setClubName('')
    setExperience('')
    setExistingPhotoUrl(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    setFormOpen(true)
  }

  function startEdit(mentor) {
    setEditingId(mentor.id)
    const { title: parsedTitle, rest } = parseMentorName(mentor.name)
    setTitle(parsedTitle)
    setName(rest)
    setAchievements(mentor.achievements ?? '')
    setClubName(mentor.clubName ?? '')
    setExperience(mentor.experience ?? '')
    setExistingPhotoUrl(mentor.photoUrl ?? null)
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
    if (!name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: title ? `${title} ${name.trim()}` : name.trim(),
        achievements: achievements.trim(),
        clubName: clubName.trim(),
        experience: experience.trim(),
        photoFile,
        clubId: getAccount()?.clubId,
      }
      if (editingId) {
        await updateMentor(editingId, { ...payload, existingPhotoUrl })
      } else {
        await addMentor(payload)
      }
      setFormOpen(false)
      refresh()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(mentor) {
    await removeMentor(mentor.id, mentor.name, mentor.photoUrl)
    refresh()
  }

  const displayPhoto = photoPreview ?? existingPhotoUrl

  return (
    <MemberLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <GraduationCap size={22} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Manage Mentors</h1>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Add, edit, or remove the mentors shown on the public Mentors page and on members'
          "My Mentor" cards.
        </p>

        <div className="mt-6 space-y-3">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-white p-4"
            >
              {mentor.photoUrl ? (
                <img
                  src={mentor.photoUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <Avatar name={mentor.name} size={56} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{mentor.name}</p>
                {mentor.achievements && (
                  <p className="truncate text-xs text-ink/50">{mentor.achievements}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => startEdit(mentor)}
                aria-label="Edit mentor"
                className="rounded-lg p-1.5 text-ink/40 transition hover:bg-cream hover:text-primary"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(mentor)}
                aria-label="Delete mentor"
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
              Add Mentor
            </button>
          ) : (
            <div className="rounded-3xl border border-accent/30 bg-white p-6">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-cream">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Avatar name={name || 'Mentor'} size={80} />
                  )}
                </div>
                <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-cream">
                  <ImagePlus size={15} />
                  Choose photo
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>

              <label className="mt-5 block text-xs font-medium text-ink/60">Name</label>
              <div className="mt-1.5 flex gap-2">
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-24 shrink-0 rounded-xl border border-accent/40 bg-cream px-2.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                >
                  {MENTOR_TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t || 'No title'}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                />
              </div>

              <label className="mt-4 block text-xs font-medium text-ink/60">
                Toastmasters achievements
              </label>
              <textarea
                rows={3}
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="e.g. Distinguished Toastmaster, 2x Area Director, Club Founder..."
                className="mt-1.5 w-full resize-none rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-ink/60">Home club</label>
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="e.g. Bangalore Toastmasters"
                    className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink/60">Toastmasters experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 8+ years"
                    className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

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
                  disabled={!name.trim() || saving}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save Mentor'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MemberLayout>
  )
}
