import { useEffect, useRef, useState } from 'react'
import { Clock, History, Lock, Megaphone, Plus, Send, Sparkles, Trash2 } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import CancelledMeetingNotice from '../components/CancelledMeetingNotice.jsx'
import {
  addAgendaRow,
  generateAgenda,
  getAgenda,
  getAgendaChangeSummary,
  getAgendaHistory,
  persistAgenda,
  removeAgendaRow,
  sendAgendaToMembers,
  syncAgendaWithRoleBoard,
} from '../lib/mockAgendaStore.js'
import { findNextActiveMeeting, getMeetings } from '../lib/mockRolesStore.js'

const inputClass =
  'w-full rounded-lg border border-accent/30 bg-cream px-2.5 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
const headerInputClass =
  'mt-1 w-full rounded-lg border border-accent/30 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
const headerLabelClass = 'text-xs font-medium text-ink/50'

function multilineRows(...values) {
  return Math.max(1, ...values.map((v) => (v || '').split('\n').length))
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
  const [meetings, setMeetings] = useState([])
  const [activeMeetingId, setActiveMeetingId] = useState(null)
  const [agenda, setAgenda] = useState(null)
  const [history, setHistory] = useState(() => getAgendaHistory())
  const [saving, setSaving] = useState(false)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    getMeetings().then((fetched) => {
      setMeetings(fetched)
      const upcoming = findNextActiveMeeting(fetched)
      setActiveMeetingId((prev) => prev ?? upcoming?.id ?? fetched[fetched.length - 1]?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (!activeMeetingId) return
    getAgenda(activeMeetingId).then(async (loaded) => {
      if (!loaded) {
        setAgenda(null)
        return
      }
      // Pull in any Role Management / self-select changes that happened
      // since this agenda was last opened.
      setAgenda(await syncAgendaWithRoleBoard(activeMeetingId, loaded))
    })
  }, [activeMeetingId])

  function refresh(next) {
    setAgenda(next)
    setHistory(getAgendaHistory())
  }

  // Typing updates local state instantly; the write to Supabase is
  // debounced so a member on another device sees it shortly after the
  // VPE pauses, without a network round-trip on every keystroke. The
  // meetingId is captured here (not read inside the timeout) so a tab
  // switch mid-edit still saves to the meeting the edit was actually
  // made for.
  function scheduleSave(meetingId, nextAgenda) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      await persistAgenda(meetingId, nextAgenda)
      setSaving(false)
    }, 700)
  }

  async function handleGenerate() {
    refresh(await generateAgenda(activeMeetingId, agenda))
  }

  function handleHeaderChange(field, value) {
    setAgenda((prev) => {
      const next = { ...prev, [field]: value }
      scheduleSave(activeMeetingId, next)
      return next
    })
  }

  function handleFieldChange(itemId, field, value) {
    setAgenda((prev) => {
      const next = {
        ...prev,
        items: prev.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
      }
      scheduleSave(activeMeetingId, next)
      return next
    })
  }

  async function handleAddRow() {
    refresh(await addAgendaRow(activeMeetingId, agenda))
  }

  async function handleRemoveRow(itemId) {
    refresh(await removeAgendaRow(activeMeetingId, agenda, itemId))
  }

  async function handleSend() {
    refresh(await sendAgendaToMembers(activeMeetingId, agenda))
  }

  const changeSummary = agenda ? getAgendaChangeSummary(agenda) : null
  const activeMeeting = meetings.find((m) => m.id === activeMeetingId)
  const isPast = (activeMeeting?.hoursUntilMeeting ?? 0) < 0

  if (!activeMeeting) {
    return (
      <MemberLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-ink/50">Loading meetings...</p>
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
              Agenda Editor
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Build and send the agenda for the selected meeting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPast || activeMeeting.cancelled}
              className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition enabled:hover:bg-primary enabled:hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles size={16} />
              Auto-Generate Agenda
            </button>
            <button
              type="button"
              disabled={!agenda || isPast || activeMeeting.cancelled}
              onClick={handleSend}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={16} />
              Send to Members
            </button>
          </div>
        </div>

        {/* Meeting tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto">
          {meetings.map((m) => {
            const active = m.id === activeMeetingId
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMeetingId(m.id)}
                className={`shrink-0 rounded-2xl border px-4 py-2.5 text-left transition ${
                  active
                    ? 'border-primary bg-primary text-cream'
                    : 'border-accent/30 bg-white text-ink hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-semibold">{m.label}</p>
                <p className={`text-xs ${active ? 'text-cream/80' : 'text-ink/50'}`}>
                  {m.dateLabel}
                  {m.cancelled ? ' · Cancelled' : ''}
                </p>
              </button>
            )
          })}
        </div>

        {activeMeeting.cancelled ? (
          <div className="mt-6">
            <CancelledMeetingNotice
              dateLabel={activeMeeting.dateLabel}
              reason={activeMeeting.cancelReason}
            />
          </div>
        ) : (
        <>
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
          {saving && <span className="font-medium text-primary">Saving…</span>}
        </div>

        {isPast && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-cream p-4 text-sm text-ink/70">
            <Lock size={18} className="mt-0.5 shrink-0 text-ink/40" />
            <p>This meeting has already happened — the agenda is read-only.</p>
          </div>
        )}

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
              disabled={isPast}
              className="mt-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Auto-Generate Agenda
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Header info block, matching the club's printed agenda */}
              <div className="rounded-3xl border border-accent/30 bg-white p-6">
                <h2 className="text-sm font-semibold text-ink">
                  {activeMeeting.label} — {agenda.dateLabel}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={headerLabelClass}>Theme</label>
                    <input
                      type="text"
                      disabled={isPast}
                      value={agenda.theme}
                      onChange={(e) => handleHeaderChange('theme', e.target.value)}
                      placeholder="e.g. Lost and Found"
                      className={headerInputClass}
                    />
                  </div>
                  <div>
                    <label className={headerLabelClass}>Word Of The Day</label>
                    <input
                      type="text"
                      disabled={isPast}
                      value={agenda.wordOfDay}
                      onChange={(e) => handleHeaderChange('wordOfDay', e.target.value)}
                      placeholder="e.g. Motif"
                      className={headerInputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={headerLabelClass}>Meaning</label>
                    <input
                      type="text"
                      disabled={isPast}
                      value={agenda.meaning}
                      onChange={(e) => handleHeaderChange('meaning', e.target.value)}
                      placeholder="What the word of the day means"
                      className={headerInputClass}
                    />
                  </div>
                  <div>
                    <label className={headerLabelClass}>Venue</label>
                    <input
                      type="text"
                      disabled={isPast}
                      value={agenda.venue}
                      onChange={(e) => handleHeaderChange('venue', e.target.value)}
                      placeholder="e.g. AB1 103"
                      className={headerInputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={headerLabelClass}>Start Time</label>
                      <input
                        type="text"
                        disabled={isPast}
                        value={agenda.overallStartTime}
                        onChange={(e) => handleHeaderChange('overallStartTime', e.target.value)}
                        className={headerInputClass}
                      />
                    </div>
                    <div>
                      <label className={headerLabelClass}>End Time</label>
                      <input
                        type="text"
                        disabled={isPast}
                        value={agenda.overallEndTime}
                        onChange={(e) => handleHeaderChange('overallEndTime', e.target.value)}
                        className={headerInputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row table */}
              <div className="overflow-hidden rounded-3xl border border-accent/30 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-accent/20 bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                        <th className="px-3 py-2.5 font-semibold">Start Time</th>
                        <th className="px-3 py-2.5 font-semibold">End Time</th>
                        <th className="px-3 py-2.5 font-semibold">Segment</th>
                        <th className="px-3 py-2.5 font-semibold">Role Player</th>
                        <th className="px-3 py-2.5 font-semibold">Name</th>
                        <th className="px-3 py-2.5 font-semibold" />
                      </tr>
                    </thead>
                    <tbody>
                      {agenda.items.map((item) => {
                        const rows = multilineRows(item.rolePlayer, item.name)
                        return (
                          <tr key={item.id} className="border-b border-accent/10 last:border-0">
                            <td className="px-3 py-2 align-top">
                              <input
                                type="text"
                                disabled={isPast}
                                value={item.startTime}
                                onChange={(e) =>
                                  handleFieldChange(item.id, 'startTime', e.target.value)
                                }
                                className={`${inputClass} w-24`}
                              />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <input
                                type="text"
                                disabled={isPast}
                                value={item.endTime}
                                onChange={(e) =>
                                  handleFieldChange(item.id, 'endTime', e.target.value)
                                }
                                className={`${inputClass} w-24`}
                              />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <input
                                type="text"
                                disabled={isPast}
                                value={item.segment}
                                onChange={(e) =>
                                  handleFieldChange(item.id, 'segment', e.target.value)
                                }
                                className={`${inputClass} w-56`}
                              />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <textarea
                                rows={rows}
                                disabled={isPast}
                                value={item.rolePlayer}
                                onChange={(e) =>
                                  handleFieldChange(item.id, 'rolePlayer', e.target.value)
                                }
                                className={`${inputClass} w-32 resize-none whitespace-pre overflow-x-auto`}
                              />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <textarea
                                rows={rows}
                                disabled={isPast}
                                value={item.name}
                                placeholder="Unassigned"
                                onChange={(e) =>
                                  handleFieldChange(item.id, 'name', e.target.value)
                                }
                                className={`${inputClass} w-36 resize-none whitespace-pre overflow-x-auto`}
                              />
                            </td>
                            <td className="px-2 py-2 align-top">
                              <button
                                type="button"
                                disabled={isPast}
                                onClick={() => handleRemoveRow(item.id)}
                                aria-label="Remove row"
                                className="rounded-lg p-1.5 text-ink/40 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-accent/20 p-3">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    disabled={isPast}
                    className="flex items-center gap-1.5 rounded-xl border border-dashed border-accent/50 px-4 py-2.5 text-sm font-semibold text-ink/60 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={15} />
                    Add Row
                  </button>
                </div>
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
        </>
        )}
      </div>
    </MemberLayout>
  )
}
