import { useState } from 'react'
import { Award, CalendarDays, ImageOff } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import PhotoGalleryModal from '../components/PhotoGalleryModal.jsx'
import { photoMemories } from '../data/mockPhotoMemories.js'

export default function PhotoMemoriesPage() {
  const [dateFilter, setDateFilter] = useState('all')
  const [activeMeeting, setActiveMeeting] = useState(null)

  const filteredMemories =
    dateFilter === 'all'
      ? photoMemories
      : photoMemories.filter((m) => m.id === dateFilter)

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
                <option key={m.id} value={m.id}>
                  {m.dateLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredMemories.length > 0 ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMemories.map((meeting) => (
              <div
                key={meeting.id}
                className="overflow-hidden rounded-3xl border border-accent/30 bg-white shadow-sm shadow-primary/5"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={`https://picsum.photos/seed/${meeting.coverSeed}/600/400`}
                    alt={`${meeting.dateLabel} group photo`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="p-5">
                  <p className="font-semibold text-ink">{meeting.dateLabel}</p>
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
            <p className="text-sm text-ink/50">No meetings found for this filter.</p>
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
