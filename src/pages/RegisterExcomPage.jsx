import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Plus, Trash2, UserCog } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import { getAccount } from '../lib/mockAuth.js'
import { getExcomAppointments, registerExcomMember, removeExcomMember } from '../lib/mockExcomRegistry.js'

const excomRoles = [
  'VPE', 'Ass. VPE',
  'VPPR', 'Ass. VPPR',
  'VPM', 'Ass. VPM',
  'Treasurer', 'Ass. Treasurer',
  'Secretary', 'Ass. Secretary',
  'SAA',
]

function emptyRow() {
  return { key: crypto.randomUUID(), role: excomRoles[0], name: '', email: '' }
}

export default function RegisterExcomPage() {
  const account = getAccount()
  const [rows, setRows] = useState([])
  const [appointments, setAppointments] = useState(() => getExcomAppointments())
  const [justSaved, setJustSaved] = useState(false)

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function updateRow(key, field, value) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
  }

  function removeRow(key) {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validRows = rows.filter((r) => r.name.trim() && r.email.trim())
    for (const row of validRows) {
      registerExcomMember({
        role: row.role,
        name: row.name.trim(),
        email: row.email.trim().toLowerCase(),
        appointedByEmail: account?.email,
      })
    }
    setRows([])
    setAppointments(getExcomAppointments())
    setJustSaved(true)
  }

  function handleRemoveAppointment(id) {
    removeExcomMember(id)
    setAppointments(getExcomAppointments())
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <UserCog size={22} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Register Your EXCOM
          </h1>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Pre-register ExCom members by role and email. Once added, they can
          log in with that email and land straight on their role's
          dashboard — no separate approval needed.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent/30 bg-white p-3"
            >
              <select
                value={row.role}
                onChange={(e) => updateRow(row.key, 'role', e.target.value)}
                className="rounded-lg border border-accent/40 bg-cream px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
              >
                {excomRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={row.name}
                onChange={(e) => updateRow(row.key, 'name', e.target.value)}
                placeholder="Name"
                className="min-w-0 flex-1 rounded-lg border border-accent/40 bg-cream px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
              />
              <input
                type="email"
                required
                value={row.email}
                onChange={(e) => updateRow(row.key, 'email', e.target.value)}
                placeholder="Email"
                className="min-w-0 flex-1 rounded-lg border border-accent/40 bg-cream px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                aria-label="Remove row"
                className="shrink-0 rounded-lg p-2 text-ink/40 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-accent/50 px-4 py-2.5 text-sm font-semibold text-ink/60 transition hover:border-primary hover:text-primary"
          >
            <Plus size={15} />
            Add role
          </button>

          {rows.length > 0 && (
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
            >
              Save ExCom appointments
            </button>
          )}
        </form>

        {justSaved && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary">
            <CheckCircle2 size={15} />
            Saved.
          </p>
        )}

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-ink">
            Current ExCom ({appointments.length})
          </h2>
          {appointments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {appointments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {a.name}{' '}
                      <span className="font-normal text-ink/50">— {a.role}</span>
                    </p>
                    <p className="truncate text-xs text-ink/50">{a.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAppointment(a.id)}
                    aria-label={`Remove ${a.name}`}
                    className="shrink-0 rounded-lg p-2 text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/50">No ExCom members registered yet.</p>
          )}
        </div>

        <Link
          to="/excom-dashboard"
          className="mt-8 inline-block text-sm font-semibold text-primary hover:underline"
        >
          ← Back to ExCom Dashboard
        </Link>
      </div>
    </MemberLayout>
  )
}
