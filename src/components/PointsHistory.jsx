import { useMemo, useState } from 'react'
import { ListChecks } from 'lucide-react'

function monthKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function formatWhen(iso) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatMeeting(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// Every individual point event behind a total — when it was recorded,
// what earned it, and the rule that applies, so nothing is a black box.
export default function PointsHistory({ title, rows, labels, rules, showRole }) {
  const months = useMemo(() => {
    const keys = [...new Set(rows.map((r) => monthKey(r.awardedAt)))]
    return keys.sort().reverse()
  }, [rows])
  const [selected, setSelected] = useState('current')

  const currentKey = monthKey(new Date().toISOString())
  const activeKey = selected === 'current' ? currentKey : selected
  const visible = selected === 'all' ? rows : rows.filter((r) => monthKey(r.awardedAt) === activeKey)
  const total = visible.reduce((sum, r) => sum + r.points, 0)
  const options = months.includes(currentKey) ? months : [currentKey, ...months]

  return (
    <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ListChecks size={16} className="text-primary" />
          {title}
        </div>
        <select
          value={selected === 'current' ? currentKey : selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-full border border-accent/40 bg-cream px-3 py-1.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none"
        >
          {options.map((key) => (
            <option key={key} value={key}>
              {monthLabel(key)}
            </option>
          ))}
          <option value="all">All time</option>
        </select>
      </div>

      {visible.length > 0 ? (
        <>
          <ul className="mt-4 divide-y divide-accent/15">
            {visible.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {labels[row.category] ?? row.category}
                    {showRole && row.role && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {row.role}
                      </span>
                    )}
                  </p>
                  {row.note && <p className="mt-0.5 text-sm text-ink/70">{row.note}</p>}
                  {rules[row.category] && (
                    <p className="mt-0.5 text-xs text-ink/50">Why: {rules[row.category]}</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink/40">
                    {row.meetingDate ? `Meeting: ${formatMeeting(row.meetingDate)} · ` : ''}
                    Recorded {formatWhen(row.awardedAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold ${
                    row.points < 0 ? 'text-red-600' : 'text-primary'
                  }`}
                >
                  {row.points > 0 ? '+' : ''}
                  {row.points}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-accent/20 pt-3 text-sm font-semibold text-ink">
            <span>Total</span>
            <span>{total} pts</span>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-ink/50">No points recorded for this period.</p>
      )}
    </div>
  )
}
