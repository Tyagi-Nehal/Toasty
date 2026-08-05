import { Clock, Megaphone, User, CalendarClock } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import { getAccount } from '../lib/mockAuth.js'
import { roleCatalog } from '../data/roleCatalog.js'
import { getAgenda, getAgendaChangeSummary } from '../lib/mockAgendaStore.js'

function roleName(roleId) {
  return roleCatalog.find((r) => r.id === roleId)?.name ?? roleId
}

function formatTimestamp(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function AgendaPage() {
  const account = getAccount()
  const agenda = getAgenda()

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
          {agenda.dateLabel} Agenda
        </h1>
        <p className="mt-1 text-sm text-ink/60">Theme: {agenda.theme}</p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/50">
          <Clock size={13} />
          Last updated: {formatTimestamp(agenda.updatedAt)}
        </p>

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
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-accent/20 bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                <th className="px-5 py-3 font-semibold">Time</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Member</th>
              </tr>
            </thead>
            <tbody>
              {agenda.items.map((item) => {
                const isMine = account?.name === item.member
                return (
                  <tr
                    key={item.roleId}
                    className={`border-b border-accent/10 last:border-0 ${
                      isMine ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-5 py-3 text-ink/60">{item.time}</td>
                    <td className="px-5 py-3 font-medium text-ink">
                      {roleName(item.roleId)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-ink/70">{item.member || '—'}</span>
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

        {/* Mobile cards */}
        <div className="mt-6 space-y-3 sm:hidden">
          {agenda.items.map((item) => {
            const isMine = account?.name === item.member
            return (
              <div
                key={item.roleId}
                className={`rounded-2xl border p-4 ${
                  isMine ? 'border-primary/40 bg-primary/5' : 'border-accent/25 bg-white'
                }`}
              >
                <p className="flex items-center gap-1.5 text-xs text-ink/50">
                  <Clock size={12} />
                  {item.time}
                </p>
                <p className="mt-1 font-semibold text-ink">{roleName(item.roleId)}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink/70">
                  <User size={13} />
                  {item.member || '—'}
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
