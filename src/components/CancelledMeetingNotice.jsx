import { CalendarOff, LockOpen } from 'lucide-react'

// onUncancel is only ever passed from the VPE's own page (Role
// Management) — member-facing pages show the notice with no way to
// reverse it.
export default function CancelledMeetingNotice({ dateLabel, reason, onUncancel }) {
  return (
    <div className="rounded-3xl border border-accent/30 bg-white p-8 text-center">
      <CalendarOff size={28} className="mx-auto text-ink/30" />
      <p className="mt-3 text-lg font-bold text-ink">This meeting was cancelled</p>
      <p className="mt-1 text-sm text-ink/60">{dateLabel}</p>
      {reason && <p className="mt-3 text-sm text-ink/70">"{reason}"</p>}
      {onUncancel && (
        <button
          type="button"
          onClick={onUncancel}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-accent/40 px-4 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-cream"
        >
          <LockOpen size={15} />
          Un-cancel Meeting
        </button>
      )}
    </div>
  )
}
