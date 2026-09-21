import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import { getAccount } from '../lib/mockAuth.js'
import { getMonthlyAwards, recordMonthlyAwards } from '../lib/mockAwardsStore.js'

function monthLabel(monthStart) {
  return new Date(`${monthStart}T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

function WinnerBox({ title, winners, myEmail, showRole }) {
  return (
    <div className="rounded-2xl bg-cream p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</p>
      {winners.length > 0 ? (
        <div className="mt-1.5 space-y-1">
          {winners.map((w) => (
            <p key={w.email} className="text-lg font-extrabold text-ink">
              {w.name}
              {w.email === myEmail && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 align-middle text-xs font-bold text-cream">
                  You
                </span>
              )}
              <span className="ml-2 text-sm font-semibold text-ink/50">
                {showRole && w.role ? `${w.role} · ` : ''}
                {w.points} pts
              </span>
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-1.5 text-sm text-ink/40">No winner recorded.</p>
      )}
    </div>
  )
}

export default function AchievementsPage() {
  const account = getAccount()
  const myEmail = account?.email?.toLowerCase()
  const [months, setMonths] = useState(null)

  useEffect(() => {
    if (!account?.clubId) return
    recordMonthlyAwards()
      .then(() => getMonthlyAwards(account.clubId))
      .then(setMonths)
  }, [])

  return (
    <MemberLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <Trophy size={24} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Achievements</h1>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Best Toastmaster and Best ExCom of every month, recorded automatically from the points
          system.
        </p>

        {months === null ? (
          <p className="mt-8 text-sm text-ink/50">Loading...</p>
        ) : months.length > 0 ? (
          <div className="mt-6 space-y-4">
            {months.map((m) => (
              <div key={m.monthStart} className="rounded-3xl border border-accent/30 bg-white p-5">
                <h2 className="text-sm font-bold text-ink">{monthLabel(m.monthStart)}</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <WinnerBox
                    title="Best Toastmaster of the Month"
                    winners={m.toastmasters}
                    myEmail={myEmail}
                  />
                  <WinnerBox
                    title="Best ExCom of the Month"
                    winners={m.excom}
                    myEmail={myEmail}
                    showRole
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-white p-10 text-center">
            <Trophy size={28} className="text-ink/30" />
            <p className="text-sm text-ink/50">
              No awards yet — the first month's winners appear here once the month ends.
            </p>
          </div>
        )}
      </div>
    </MemberLayout>
  )
}
