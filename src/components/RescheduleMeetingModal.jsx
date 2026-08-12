import { useState } from 'react'
import { X, CalendarClock } from 'lucide-react'

export default function RescheduleMeetingModal({
  meetingLabel,
  currentDate,
  otherDates,
  onClose,
  onConfirm,
}) {
  const [date, setDate] = useState(currentDate ?? '')
  const today = new Date().toISOString().slice(0, 10)
  const isPast = date && date < today
  const collides = date && date !== currentDate && otherDates.includes(date)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-ink">
            <CalendarClock size={18} className="text-primary" />
            Reschedule
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-ink/50 transition hover:bg-cream hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-sm text-ink/60">{meetingLabel}</p>
        <p className="mt-3 text-xs text-ink/50">
          Its agenda, MOM, attendance, roles, and photos all move with it — nothing needs
          to be re-entered.
        </p>

        <label htmlFor="reschedule-date" className="mt-4 block text-sm font-medium text-ink">
          New date
        </label>
        <input
          id="reschedule-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />
        {isPast && <p className="mt-2 text-xs text-red-600">Pick a date that isn't in the past.</p>}
        {collides && (
          <p className="mt-2 text-xs text-red-600">
            Another meeting is already scheduled on this date — double check before saving.
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-accent/40 px-4 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-cream"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!date || isPast}
            onClick={() => onConfirm(date)}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
