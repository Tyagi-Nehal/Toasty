import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

export default function CancelMeetingModal({ meetingLabel, onClose, onConfirm }) {
  const [reason, setReason] = useState('')

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
          <h2 className="text-lg font-bold text-ink">Cancel this meeting?</h2>
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

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Everyone will see this meeting as cancelled — its agenda, MOM, attendance,
            roles, and photos will be hidden until you un-cancel it. Nothing is deleted.
          </span>
        </div>

        <label htmlFor="cancel-reason" className="mt-4 block text-sm font-medium text-ink">
          Reason <span className="text-ink/40">(optional, shown to members)</span>
        </label>
        <textarea
          id="cancel-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="e.g. Venue unavailable"
          className="mt-1.5 w-full resize-none rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
        />

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-accent/40 px-4 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-cream"
          >
            Never mind
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-red-600/20 transition hover:bg-red-700"
          >
            Cancel Meeting
          </button>
        </div>
      </div>
    </div>
  )
}
