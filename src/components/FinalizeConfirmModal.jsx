import { X, AlertTriangle } from 'lucide-react'

export default function FinalizeConfirmModal({ openCount, meetingLabel, onClose, onConfirm }) {
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
          <h2 className="text-lg font-bold text-ink">Finalize with open roles?</h2>
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
            {openCount} of 15 roles {openCount === 1 ? 'is' : 'are'} still open. Finalizing
            will lock the board and notify members — anyone without a role will see it
            listed as unavailable, with no way to tell why.
          </span>
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
            Finalize Anyway
          </button>
        </div>
      </div>
    </div>
  )
}
