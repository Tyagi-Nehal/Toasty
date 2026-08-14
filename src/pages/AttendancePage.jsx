import { useEffect, useState } from 'react'
import { ClipboardCheck, CalendarClock, CheckSquare, Square, Send, CheckCircle2 } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import {
  getRecentMeetingsForAttendance,
  getAttendanceForMeeting,
  submitAttendance,
} from '../lib/mockAttendanceStore.js'
import { findNextActiveMeeting, getMeetings } from '../lib/mockRolesStore.js'

export default function AttendancePage() {
  const [recentMeetings, setRecentMeetings] = useState([])
  const [activeMeetingId, setActiveMeetingId] = useState(null)
  const [attendance, setAttendance] = useState(new Map())
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [nextMeeting, setNextMeeting] = useState(null)

  useEffect(() => {
    getRecentMeetingsForAttendance().then((meetings) => {
      setRecentMeetings(meetings)
      setActiveMeetingId((prev) => prev ?? meetings[0]?.id ?? null)
    })
    // Informational only — attendance still can't be taken for a meeting
    // that hasn't happened yet, this just shows what's coming up.
    getMeetings().then((meetings) => setNextMeeting(findNextActiveMeeting(meetings)))
  }, [])

  useEffect(() => {
    if (!activeMeetingId) return
    setLoading(true)
    setSubmitted(false)
    getAttendanceForMeeting(activeMeetingId).then(({ roster, alreadySubmitted: already }) => {
      setAttendance(new Map(roster.map((m) => [m.name, m.present])))
      setAlreadySubmitted(already)
      setLoading(false)
    })
  }, [activeMeetingId])

  const activeMeeting = recentMeetings.find((m) => m.id === activeMeetingId)
  const presentCount = [...attendance.values()].filter(Boolean).length

  function togglePresent(name) {
    setAttendance((prev) => {
      const next = new Map(prev)
      next.set(name, !next.get(name))
      return next
    })
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await submitAttendance(activeMeetingId, Object.fromEntries(attendance))
      setSubmitted(true)
      setAlreadySubmitted(true)
    } catch (err) {
      window.alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (recentMeetings.length === 0 && !loading) {
    return (
      <MemberLayout>
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ClipboardCheck size={16} />
            Attendance
          </div>
          {nextMeeting && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/50">
              <CalendarClock size={13} />
              Next meeting: {nextMeeting.dateLabel}
            </p>
          )}
          <p className="mt-4 text-sm text-ink/50">
            No past meetings yet to take attendance for.
          </p>
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
          Take Attendance
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Pick a meeting, mark who was present, then submit.
        </p>
        {nextMeeting && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/50">
            <CalendarClock size={13} />
            Next meeting: {nextMeeting.dateLabel}
          </p>
        )}

        {/* Meeting picker */}
        <div className="mt-6 flex gap-2 overflow-x-auto">
          {recentMeetings.map((m) => {
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

        {!loading && activeMeeting && (
          <>
            {alreadySubmitted && !submitted && (
              <div className="mt-6 rounded-2xl bg-cream p-4 text-sm text-ink/60">
                Attendance was already submitted for this meeting — editing and
                submitting again will update it.
              </div>
            )}

            {/* Roster */}
            <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">Members</p>
                <p className="text-xs text-ink/50">
                  {presentCount} of {attendance.size} present
                </p>
              </div>
              <ul className="mt-3 divide-y divide-accent/15">
                {[...attendance.keys()].map((name) => {
                  const present = attendance.get(name)
                  return (
                    <li key={name}>
                      <button
                        type="button"
                        onClick={() => togglePresent(name)}
                        className="flex w-full items-center justify-between py-3 text-left"
                      >
                        <span className="text-sm text-ink">{name}</span>
                        <span
                          className={`flex items-center gap-1.5 text-sm font-medium ${
                            present ? 'text-primary' : 'text-ink/40'
                          }`}
                        >
                          {present ? <CheckSquare size={18} /> : <Square size={18} />}
                          {present ? 'Present' : 'Absent'}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {submitted ? (
              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-primary/10 p-4 text-sm font-medium text-primary">
                <CheckCircle2 size={18} />
                Attendance submitted for {activeMeeting.dateLabel}.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={16} />
                {submitting ? 'Submitting…' : 'Submit Attendance'}
              </button>
            )}
          </>
        )}
      </div>
    </MemberLayout>
  )
}
