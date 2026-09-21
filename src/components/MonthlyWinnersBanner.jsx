import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { getAccount } from '../lib/mockAuth.js'
import { recordMonthlyAwards } from '../lib/mockAwardsStore.js'
import { getMonthlyWinners, getWinnerAnnouncementMonth } from '../lib/mockPointsStore.js'

function WinnerCard({ title, winners, showRole }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</p>
      {winners.length > 0 ? (
        <div className="mt-1.5 space-y-1">
          {winners.map((w) => (
            <p key={w.name} className="text-lg font-extrabold text-ink">
              {w.name}
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

  return (
    <div className="mt-6 rounded-3xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-primary" />
        <h2 className="text-sm font-bold text-ink">Winners of {monthLabel}</h2>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <WinnerCard title="Best Toastmaster of the Month" winners={winners.toastmasters} />
        <WinnerCard title="Best ExCom of the Month" winners={winners.excom} showRole />
      </div>
    </div>
  )
}
