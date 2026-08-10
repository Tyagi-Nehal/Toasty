import { useEffect, useState } from 'react'
import { Clock, User, Megaphone, CalendarClock } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import { getAccount } from '../lib/mockAuth.js'
import { getAgenda, getAgendaChangeSummary, syncAgendaWithRoleBoard } from '../lib/mockAgendaStore.js'
import { getMeetings } from '../lib/mockRolesStore.js'

function formatTimestamp(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function InfoField({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-medium text-ink/50">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  )
}

export default function AgendaPage() {
  const account = getAccount()
  const [meeting, setMeeting] = useState(null)
  const [agenda, setAgenda] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMeetings().then(async (meetings) => {
      // Nearest upcoming meeting first; fall back to the most recent one.
      const upcoming = meetings.find((m) => (m.hoursUntilMeeting ?? -1) >= 0)
      const target = upcoming ?? meetings[meetings.length - 1]
      setMeeting(target ?? null)
      if (target) {
        const loaded = await getAgenda(target.id)
        // Pull in any Role Management / self-select changes that
        // happened since this agenda was last opened.
        setAgenda(loaded ? await syncAgendaWithRoleBoard(target.id, loaded) : null)
      } else {
        setAgenda(null)
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-ink/50">Loading...</p>
        </div>
      </MemberLayout>
    )
  }

  if (!agenda) {
    return (
      <MemberLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Agenda</h1>
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-white p-10 text-center">
            <CalendarClock size={28} className="text-ink/30" />
            <p className="text-sm text-ink/50">
              The agenda for the next meeting hasn't been published yet.
            </p>
          </div>
        </div>
      </MemberLayout>
    )
  }

  const changeSummary = getAgendaChangeSummary(agenda)

  return (
    <MemberLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          {meeting?.label ? `${meeting.label} — ` : ''}
          {agenda.dateLabel}
        </h1>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/50">
          <Clock size={13} />
          Last updated: {formatTimestamp(agenda.updatedAt)}
        </p>

        {/* Header info block, matching the club's printed agenda */}
        <div className="mt-4 grid gap-4 rounded-2xl border border-accent/30 bg-white p-5 sm:grid-cols-2">
          <InfoField label="Theme" value={agenda.theme} />
          <InfoField label="Word Of The Day" value={agenda.wordOfDay} />
          {agenda.meaning && (
            <div className="sm:col-span-2">
              <InfoField label="Meaning" value={agenda.meaning} />
            </div>
          )}
          <InfoField
            label="Venue"
            value={agenda.venue ? `${agenda.venue}` : ''}
          />
          <InfoField
            label="Time"
            value={
              agenda.overallStartTime && agenda.overallEndTime
                ? `${agenda.overallStartTime} to ${agenda.overallEndTime}`
                : ''
            }
          />
        </div>

        {changeSummary && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-accent/15 p-4 text-sm text-ink/70">
            <Megaphone size={18} className="mt-0.5 shrink-0 text-primary" />
            <p>
              <span className="font-semibold text-ink">Agenda Updated</span> —{' '}
              {changeSummary}
            </p>
          </div>
        )}

        {/* Desktop table */}
        <div className="mt-6 hidden overflow-hidden rounded-2xl border border-accent/30 bg-white sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-accent/20 bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                  <th className="px-4 py-3 font-semibold">Start Time</th>
                  <th className="px-4 py-3 font-semibold">End Time</th>
                  <th className="px-4 py-3 font-semibold">Segment</th>
                  <th className="px-4 py-3 font-semibold">Role Player</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                </tr>
              </thead>
              <tbody>
                {agenda.items.map((item) => {
                  const isMine = item.name && account?.name && item.name.includes(account.name)
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-accent/10 last:border-0 ${
                        isMine ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-ink/60">{item.startTime}</td>
                      <td className="px-4 py-3 text-ink/60">{item.endTime}</td>
                      <td className="px-4 py-3 font-medium text-ink">{item.segment}</td>
                      <td className="whitespace-pre px-4 py-3 text-ink/70">{item.rolePlayer}</td>
                      <td className="whitespace-pre px-4 py-3">
                        <span className="text-ink/70">{item.name || '—'}</span>
                        {isMine && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            You
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="mt-6 space-y-3 sm:hidden">
          {agenda.items.map((item) => {
            const isMine = item.name && account?.name && item.name.includes(account.name)
            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 ${
                  isMine ? 'border-primary/40 bg-primary/5' : 'border-accent/25 bg-white'
                }`}
              >
                <p className="flex items-center gap-1.5 text-xs text-ink/50">
                  <Clock size={12} />
                  {item.startTime} – {item.endTime}
                </p>
                <p className="mt-1 font-semibold text-ink">{item.segment}</p>
                <p className="mt-0.5 whitespace-pre-line text-xs text-ink/50">
                  {item.rolePlayer}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 whitespace-pre-line text-sm text-ink/70">
                  <User size={13} className="shrink-0" />
                  {item.name || '—'}
                  {isMine && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      You
                    </span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </MemberLayout>
  )
}
