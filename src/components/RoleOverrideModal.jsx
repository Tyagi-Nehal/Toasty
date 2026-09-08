import { useState } from 'react'
import { UserCog, X } from 'lucide-react'

const OTHER_VALUE = '__other__'

// roster: [{ name, email }] — the real club roster, so the VPE picks a
// name Toasty already knows instead of typing one that might not match
// anyone (a typo, a slightly different spelling) and would otherwise
// leave taken_by_email empty — nobody actually tied to the assignment,
// silently unnotifiable. "Other" is the deliberate escape hatch for a
// real non-member guest, where there's genuinely no email to attach.
export default function RoleOverrideModal({ roleName, currentAssignee, roster, onClose, onConfirm }) {
  const currentMember = roster?.find((m) => m.name === currentAssignee)
  const [selected, setSelected] = useState(currentMember ? currentMember.email : currentAssignee ? OTHER_VALUE : '')
  const [guestName, setGuestName] = useState(currentMember ? '' : (currentAssignee ?? ''))

  const isOther = selected === OTHER_VALUE

  function handleConfirm() {
    if (isOther) {
      const trimmed = guestName.trim()
      onConfirm({ takenBy: trimmed || null, takenByEmail: null })
      return
    }
    const member = roster?.find((m) => m.email === selected)
    onConfirm({ takenBy: member?.name ?? null, takenByEmail: member?.email ?? null })
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

        <label htmlFor="override-select" className="mt-5 block text-sm font-medium text-ink">
          Assign to
        </label>
        <select
          id="override-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
        >
          <option value="">Leave blank to reopen this role</option>
          {roster?.map((member) => (
            <option key={member.email} value={member.email}>
              {member.name}
            </option>
          ))}
          <option value={OTHER_VALUE}>Other (guest)…</option>
        </select>

        {isOther && (
          <input
            type="text"
            autoFocus
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Guest's name"
            className="mt-2 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />
        )}

        {(selected || (isOther && guestName.trim())) && (
          <p className="mt-3 text-xs text-ink/50">
            Assigning someone here always marks the role as auto-assigned — only a
            member picking it themselves counts as self-selected.
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
