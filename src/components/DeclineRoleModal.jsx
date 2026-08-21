import { X, AlertTriangle } from 'lucide-react'
import { getDeclinePenalty } from '../lib/points.js'

export default function DeclineRoleModal({
  roleName,
  meetingLabel,
  hoursUntilMeeting,
  onClose,
  onConfirm,
}) {
  const penalty = getDeclinePenalty(hoursUntilMeeting)

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
          <h2 className="text-lg font-bold text-ink">Decline {roleName}</h2>
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

        <div
          className={`mt-5 flex items-start gap-2 rounded-xl p-3 text-sm ${
            penalty.points === 0
              ? 'bg-accent/15 text-ink/70'
              : 'bg-red-50 text-red-700'
          }`}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{penalty.label}</span>
        </div>

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
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
          >
            Confirm Decline
          </button>
        </div>
      </div>
    </div>
  )
}
