import { useEffect, useState } from 'react'
import { Award, CalendarDays, ImageOff } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import PhotoGalleryModal from '../components/PhotoGalleryModal.jsx'
import { getMeetings } from '../lib/mockRolesStore.js'
import { getAllMeetingPhotos } from '../lib/mockPhotoStore.js'

export default function PhotoMemoriesPage() {
  const [dateFilter, setDateFilter] = useState('all')
  const [activeMeeting, setActiveMeeting] = useState(null)
  const [photoMemories, setPhotoMemories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMeetings().then(async (meetings) => {
      setPhotoMemories(await getAllMeetingPhotos(meetings))
      setLoading(false)
    })
  }, [])

  // dateFilter comes from a <select>, whose values are always strings —
  // meetingId is a number, so this needs a string comparison or every
  // specific-date filter (everything except "all") would match nothing.
  const filteredMemories =
    dateFilter === 'all'
      ? photoMemories
      : photoMemories.filter((m) => String(m.meetingId) === dateFilter)

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-ink/50">Loading...</p>
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
              Photo Memories
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Relive past meetings — photos and certificates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-accent/40 bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            >
              <option value="all">All meetings</option>
              {photoMemories.map((m) => (
                <option key={m.meetingId} value={m.meetingId}>
                  {m.label ? `${m.label} — ` : ''}
                  {m.fullDateLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredMemories.length > 0 ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMemories.map((meeting) => (
              <div
                key={meeting.meetingId}
                className="overflow-hidden rounded-3xl border border-accent/30 bg-white shadow-sm shadow-primary/5"
              >
                <div className="aspect-video overflow-hidden bg-cream">
                  {meeting.photos[0] ? (
                    <img
                      src={meeting.photos[0].src}
                      alt={`${meeting.dateLabel} group photo`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    meeting.posterUrl && (
                      <img
                        src={meeting.posterUrl}
                        alt={`${meeting.dateLabel} poster`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )
                  )}
                </div>

                <div className="p-5">
                  <p className="font-semibold text-ink">
                    {meeting.label ? `${meeting.label} — ` : ''}
                    {meeting.fullDateLabel}
                  </p>
                  <p className="text-sm text-ink/60">Theme: {meeting.theme}</p>

                  <button
                    type="button"
                    onClick={() => setActiveMeeting(meeting)}
                    className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
                  >
                    View Photos
                  </button>

                  <div className="mt-4 flex items-center gap-1.5 border-t border-accent/20 pt-4 text-xs text-ink/50">
                    <Award size={14} className="text-primary" />
                    {meeting.certificates.length > 0
                      ? `${meeting.certificates.length} certificate${
                          meeting.certificates.length > 1 ? 's' : ''
                        }`
                      : 'No certificates'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-white p-10 text-center">
            <ImageOff size={28} className="text-ink/30" />
            <p className="text-sm text-ink/50">No photos uploaded yet.</p>
          </div>
        )}
      </div>

      {activeMeeting && (
        <PhotoGalleryModal
          meeting={activeMeeting}
          onClose={() => setActiveMeeting(null)}
        />
      )}
    </MemberLayout>
  )
}
