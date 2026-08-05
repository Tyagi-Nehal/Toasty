import { useState } from 'react'
import {
  ClipboardCheck,
  CheckSquare,
  Square,
  Clock,
  Send,
  CheckCircle2,
  Star,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import { attendanceMeta, rosterNames } from '../data/mockAttendance.js'

export default function AttendancePage() {
  const [attendance, setAttendance] = useState(
    () => new Map(rosterNames.map((name) => [name, true])),
  )
  const [startedOnTime, setStartedOnTime] = useState(null) // null | true | false
  const [submitted, setSubmitted] = useState(false)

  const presentCount = [...attendance.values()].filter(Boolean).length

  function togglePresent(name) {
    if (submitted) return
    setAttendance((prev) => {
      const next = new Map(prev)
      next.set(name, !next.get(name))
      return next
    })
  }

  function handleSubmit() {
    if (startedOnTime === null) return
    setSubmitted(true)
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ClipboardCheck size={16} />
              Attendance
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">
              {attendanceMeta.dateLabel}
            </h1>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              submitted
                ? 'bg-primary/10 text-primary'
                : 'bg-accent/20 text-ink/60'
            }`}
          >
            {submitted ? 'Submitted' : 'Pending'}
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/50">
          <Clock size={13} />
          Due by {attendanceMeta.deadlineLabel}
        </p>

        {/* On-time toggle */}
        <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-5">
          <p className="font-semibold text-ink">
            Did the meeting start on time?
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              disabled={submitted}
              onClick={() => setStartedOnTime(true)}
              className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${
                startedOnTime === true
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-accent/25 text-ink/60'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              disabled={submitted}
              onClick={() => setStartedOnTime(false)}
              className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${
                startedOnTime === false
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-accent/25 text-ink/60'
              }`}
            >
              No
            </button>
          </div>
          {startedOnTime === true && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
              <Star size={13} />
              The SAA will be auto-awarded on-time points.
            </p>
          )}
        </div>

        {/* Roster */}
        <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink">Members</p>
            <p className="text-xs text-ink/50">
              {presentCount} of {rosterNames.length} present
            </p>
          </div>
          <ul className="mt-3 divide-y divide-accent/15">
            {rosterNames.map((name) => {
              const present = attendance.get(name)
              return (
                <li key={name}>
                  <button
                    type="button"
                    disabled={submitted}
                    onClick={() => togglePresent(name)}
                    className="flex w-full items-center justify-between py-3 text-left disabled:cursor-not-allowed"
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
            Attendance submitted for {attendanceMeta.dateLabel}.
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={startedOnTime === null}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} />
            Submit Attendance
          </button>
        )}
      </div>
    </MemberLayout>
  )
}
