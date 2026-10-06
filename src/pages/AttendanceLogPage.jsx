import { useEffect, useState } from 'react'
import { ClipboardCheck, CheckSquare, Square, Hourglass } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import {
  getRecentMeetingsForAttendance,
  getAttendanceForMeeting,
} from '../lib/mockAttendanceStore.js'

export default function AttendanceLogPage() {
  const [meetings, setMeetings] = useState([])
  const [activeMeetingId, setActiveMeetingId] = useState(null)
  const [roster, setRoster] = useState(null)
  const [recorded, setRecorded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    getRecentMeetingsForAttendance(50).then((fetched) => {
      setMeetings(fetched)
      setActiveMeetingId((prev) => prev ?? fetched[0]?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (!activeMeetingId) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    getAttendanceForMeeting(activeMeetingId).then(({ roster: fetched, alreadySubmitted }) => {
      if (cancelled) return
      setRoster(alreadySubmitted ? fetched : null)
      setRecorded(alreadySubmitted)
    }).catch((error) => {
      if (cancelled) return
      setLoadError(error.message)
      setRoster(null)
      setRecorded(false)
    }).finally(() => {
      if (cancelled) return
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [activeMeetingId])

  const activeMeeting = meetings.find((m) => m.id === activeMeetingId)
  const presentCount = roster?.filter((m) => m.present).length ?? 0

  if (meetings.length === 0 && !loading) {
    return (
      <MemberLayout>
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ClipboardCheck size={16} />
            Attendance
          </div>
          <p className="mt-4 text-sm text-ink/50">No past meetings yet.</p>
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <ClipboardCheck size={16} />
          Attendance
        </div>
        <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">
          Attendance Log
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Who was present at each past meeting.
        </p>

        {/* Meeting picker */}
        <div className="mt-6 flex gap-2 overflow-x-auto">
          {meetings.map((m) => {
            const active = m.id === activeMeetingId
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMeetingId(m.id)}
                className={`shrink-0 rounded-2xl border px-4 py-2.5 text-left transition ${
                  active
                    ? 'border-primary bg-primary text-cream'
                    : 'border-accent/30 bg-white text-ink hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-semibold">{m.label}</p>
                <p className={`text-xs ${active ? 'text-cream/80' : 'text-ink/50'}`}>
                  {m.dateLabel}
                </p>
              </button>
            )
          })}
        </div>

        {loadError && <p role="alert" className="mt-6 text-sm text-red-700">{loadError}</p>}
        {!loading && !loadError && activeMeeting && (
          recorded && roster ? (
            <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">Members</p>
                <p className="text-xs text-ink/50">
                  {presentCount} of {roster.length} present
                </p>
              </div>
              <ul className="mt-3 divide-y divide-accent/15">
                {roster.map((m) => (
                  <li key={m.email} className="flex items-center justify-between py-3">
                    <span className="text-sm text-ink">{m.name}</span>
                    <span
                      className={`flex items-center gap-1.5 text-sm font-medium ${
                        m.present ? 'text-primary' : 'text-ink/40'
                      }`}
                    >
                      {m.present ? <CheckSquare size={18} /> : <Square size={18} />}
                      {m.present ? 'Present' : 'Absent'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-accent/40 bg-white p-10 text-center">
              <Hourglass size={26} className="text-ink/30" />
              <p className="text-sm text-ink/50">
                Attendance hasn't been recorded for this meeting yet.
              </p>
            </div>
          )
        )}
      </div>
    </MemberLayout>
  )
}
