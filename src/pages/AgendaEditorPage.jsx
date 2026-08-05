import { useState } from 'react'
import { Clock, History, Megaphone, Send, Sparkles } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import {
  generateAgenda,
  getAgenda,
  getAgendaChangeSummary,
  getAgendaHistory,
  sendAgendaToMembers,
  updateAgendaItem,
} from '../lib/mockAgendaStore.js'
import { roleCatalog } from '../data/roleCatalog.js'

const inputClass =
  'w-full rounded-lg border border-accent/30 bg-cream px-2.5 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none'

function roleName(roleId) {
  return roleCatalog.find((r) => r.id === roleId)?.name ?? roleId
}

function timeAgo(isoString) {
  if (!isoString) return null
  const diffMs = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function AgendaEditorPage() {
  const [agenda, setAgenda] = useState(() => getAgenda())
  const [history, setHistory] = useState(() => getAgendaHistory())

  function refresh(next) {
    setAgenda(next)
    setHistory(getAgendaHistory())
  }

  function handleGenerate() {
    refresh(generateAgenda())
  }

  function handleFieldChange(roleId, field, value) {
    refresh(updateAgendaItem(roleId, field, value))
  }

  function handleSend() {
    refresh(sendAgendaToMembers())
  }

  const changeSummary = agenda ? getAgendaChangeSummary(agenda) : null

  return (
    <MemberLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
              Agenda Editor
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Build and send the agenda for the current meeting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleGenerate}
              className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-cream"
            >
              <Sparkles size={16} />
              Auto-Generate Agenda
            </button>
            <button
              type="button"
              disabled={!agenda}
              onClick={handleSend}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={16} />
              Send to Members
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/50">
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            Last auto-generated:{' '}
            {agenda?.updatedAt ? timeAgo(agenda.updatedAt) : 'never'}
          </span>
          <span className="flex items-center gap-1.5">
            <Send size={12} />
            Last sent to members:{' '}
            {agenda?.sentAt ? timeAgo(agenda.sentAt) : 'never'}
          </span>
        </div>

        {changeSummary && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-accent/15 p-4 text-sm text-ink/70">
            <Megaphone size={18} className="mt-0.5 shrink-0 text-primary" />
            <p>
              <span className="font-semibold text-ink">
                Edited since last send
              </span>{' '}
              — {changeSummary}. Members will see this change and be
              re-notified once you send again.
            </p>
          </div>
        )}

        {!agenda ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-accent/40 bg-white p-12 text-center">
            <Sparkles size={28} className="text-ink/30" />
            <p className="text-sm text-ink/60">
              No agenda generated yet for this meeting.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              className="mt-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
            >
              Auto-Generate Agenda
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="overflow-hidden rounded-3xl border border-accent/30 bg-white lg:col-span-2">
              <div className="border-b border-accent/20 bg-cream/60 px-6 py-3">
                <h2 className="text-sm font-semibold text-ink">
                  {agenda.dateLabel} · {agenda.theme}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-accent/20 text-xs uppercase tracking-wide text-ink/50">
                      <th className="px-4 py-2.5 font-semibold">Time</th>
                      <th className="px-4 py-2.5 font-semibold">Role</th>
                      <th className="px-4 py-2.5 font-semibold">Assigned Member</th>
                      <th className="px-4 py-2.5 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agenda.items.map((item) => (
                      <tr key={item.roleId} className="border-b border-accent/10 last:border-0">
                        <td className="px-4 py-2 align-top">
                          <input
                            type="text"
                            value={item.time}
                            onChange={(e) =>
                              handleFieldChange(item.roleId, 'time', e.target.value)
                            }
                            className={`${inputClass} w-36`}
                          />
                        </td>
                        <td className="px-4 py-2.5 align-top font-medium text-ink">
                          {roleName(item.roleId)}
                        </td>
                        <td className="px-4 py-2 align-top">
                          <input
                            type="text"
                            value={item.member}
                            placeholder="Unassigned"
                            onChange={(e) =>
                              handleFieldChange(item.roleId, 'member', e.target.value)
                            }
                            className={`${inputClass} w-32`}
                          />
                        </td>
                        <td className="px-4 py-2 align-top">
                          <input
                            type="text"
                            value={item.notes}
                            placeholder="—"
                            onChange={(e) =>
                              handleFieldChange(item.roleId, 'notes', e.target.value)
                            }
                            className={inputClass}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit history log */}
            <div className="rounded-3xl border border-accent/30 bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <History size={16} className="text-primary" />
                Edit History
              </div>
              {history.length > 0 ? (
                <ul className="mt-4 space-y-4">
                  {history.map((entry) => (
                    <li key={entry.id} className="border-l-2 border-accent/30 pl-3">
                      <p className="text-sm leading-snug text-ink/80">{entry.message}</p>
                      <p className="mt-0.5 text-xs text-ink/40">{timeAgo(entry.time)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-ink/50">No edits yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  )
}
