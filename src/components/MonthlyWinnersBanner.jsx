import { useEffect, useState } from 'react'
import { Trophy, PartyPopper } from 'lucide-react'
import { getAccount } from '../lib/mockAuth.js'
import { recordMonthlyAwards } from '../lib/mockAwardsStore.js'
import { getMonthlyWinners, getWinnerAnnouncementMonth } from '../lib/mockPointsStore.js'

function WinnerCard({ title, winners, showRole, myEmail }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
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
        <p className="mt-1.5 text-sm text-ink/50">No points recorded this month.</p>
      )}
    </div>
  )
}

export default function MonthlyWinnersBanner() {
  const [result, setResult] = useState(null)
  const myEmail = getAccount()?.email?.toLowerCase()

  useEffect(() => {
    const target = getWinnerAnnouncementMonth()
    const clubId = getAccount()?.clubId
    if (!target || !clubId) return
    recordMonthlyAwards()
    getMonthlyWinners(target, clubId).then((winners) => setResult({ target, winners }))
  }, [])

  if (!result) return null
  const { target, winners } = result
  if (winners.toastmasters.length === 0 && winners.excom.length === 0) return null

  const monthLabel = new Date(target.year, target.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const wonToastmaster = winners.toastmasters.some((w) => w.email === myEmail)
  const wonExcom = winners.excom.some((w) => w.email === myEmail)
  const wonTitles = [
    wonToastmaster && 'Best Toastmaster of the Month',
    wonExcom && 'Best ExCom of the Month',
  ].filter(Boolean)

  return (
    <div className="mt-6 rounded-3xl border border-primary/30 bg-primary/5 p-5">
      {wonTitles.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-primary p-4 text-cream">
          <PartyPopper size={24} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-lg font-extrabold">Congratulations! You did it!</p>
            <p className="text-sm text-cream/90">
              You're {wonTitles.join(' and ')} for {monthLabel}. Thank you for everything you do
              for the club.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-primary" />
        <h2 className="text-sm font-bold text-ink">Winners of {monthLabel}</h2>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <WinnerCard
          title="Best Toastmaster of the Month"
          winners={winners.toastmasters}
          myEmail={myEmail}
        />
        <WinnerCard
          title="Best ExCom of the Month"
          winners={winners.excom}
          showRole
          myEmail={myEmail}
        />
      </div>
    </div>
  )
}
