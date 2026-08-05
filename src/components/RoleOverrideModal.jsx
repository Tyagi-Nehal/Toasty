import { useState } from 'react'
import { UserCog, X } from 'lucide-react'

export default function RoleOverrideModal({
  roleName,
  currentAssignee,
  currentStatus,
  onClose,
  onConfirm,
}) {
  const [name, setName] = useState(currentAssignee ?? '')
  const [markAs, setMarkAs] = useState(currentStatus === 'auto' ? 'auto' : 'taken')

  function handleConfirm() {
    const trimmed = name.trim()
    onConfirm(trimmed ? { status: markAs, takenBy: trimmed } : { status: 'open', takenBy: null })
  }

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
            <UserCog size={18} className="text-primary" />
            Override Assignment
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
        <p className="mt-1 text-sm text-ink/60">{roleName}</p>

        <label htmlFor="override-name" className="mt-5 block text-sm font-medium text-ink">
          Assign to
        </label>
        <input
          id="override-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Leave blank to reopen this role"
          className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        />

        {name.trim() && (
          <>
            <label htmlFor="override-status" className="mt-4 block text-sm font-medium text-ink">
              Mark as
            </label>
            <select
              id="override-status"
              value={markAs}
              onChange={(e) => setMarkAs(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            >
              <option value="taken">Self-selected</option>
              <option value="auto">Auto-assigned</option>
            </select>
          </>
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
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
