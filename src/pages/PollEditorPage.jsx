import { useState } from 'react'
import {
  Vote,
  Sparkles,
  Radio,
  History,
  Plus,
  X,
  Trophy,
  ListChecks,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import {
  getPoll,
  buildPollFromAgenda,
  addCandidate,
  removeCandidate,
  releasePoll,
  closePoll,
  getVoteCounts,
  getResultsSummary,
  getPollHistory,
} from '../lib/mockPollStore.js'

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function AddCandidateForm({ onAdd }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add name..."
        className="flex-1 rounded-lg border border-accent/40 bg-cream px-3 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        className="flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-cream"
      >
        <Plus size={13} />
        Add
      </button>
    </form>
  )
}

export default function PollEditorPage() {
  const [poll, setPoll] = useState(() => getPoll())
  const [history, setHistory] = useState(() => getPollHistory())

  function refresh() {
    setPoll(getPoll())
    setHistory(getPollHistory())
  }

  function handleBuild() {
    buildPollFromAgenda()
    refresh()
  }

  function handleAdd(categoryId, name) {
    addCandidate(categoryId, name)
    refresh()
  }

  function handleRemove(categoryId, name) {
    removeCandidate(categoryId, name)
    refresh()
  }

  function handleRelease() {
    releasePoll()
    refresh()
  }

  function handleClose() {
    closePoll()
    refresh()
  }

  const isClosed = poll && !poll.isOpen && poll.closedAt
  const voteCounts = poll?.isOpen || isClosed ? getVoteCounts() : null
  const results = isClosed ? getResultsSummary() : null

  return (
    <MemberLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
              Poll Editor
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Manage voting categories and release the poll to members.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(!poll || !poll.isOpen) && (
              <button
                type="button"
                onClick={handleBuild}
                className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-cream"
              >
                <Sparkles size={16} />
                {poll ? 'Rebuild from Agenda' : 'Build Poll from Agenda'}
              </button>
            )}
            {poll && !poll.isOpen && !isClosed && (
              <button
                type="button"
                onClick={handleRelease}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
              >
                <Radio size={16} />
                Release Poll to Members
              </button>
            )}
            {poll?.isOpen && (
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-cream shadow-md transition hover:bg-ink/80"
              >
                <X size={16} />
                Close Poll
              </button>
            )}
          </div>
        </div>

        {!poll ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-white p-10 text-center">
            <Vote size={28} className="text-ink/30" />
            <p className="text-sm text-ink/50">
              No poll yet. Click "Build Poll from Agenda" to pre-fill
              categories from the current meeting's role-takers.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  poll.isOpen
                    ? 'bg-primary/10 text-primary'
                    : isClosed
                      ? 'bg-ink/10 text-ink/70'
                      : 'bg-accent/20 text-ink/60'
                }`}
              >
                {poll.isOpen ? 'Live' : isClosed ? 'Closed' : 'Draft'}
              </span>
              <span className="text-sm text-ink/60">{poll.meetingLabel}</span>
            </div>

            {isClosed && results && (
              <div className="mt-4 rounded-3xl border border-accent/30 bg-white p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Trophy size={16} className="text-primary" />
                  Results Summary
                </div>
                <div className="mt-4 space-y-2.5">
                  {results.map((r) => (
                    <div
                      key={r.categoryId}
                      className="flex items-center justify-between rounded-xl bg-cream/60 px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium text-ink">{r.title}</span>
                      <span className="text-ink/70">
                        {r.winners.length > 0
                          ? `${r.winners.join(', ')} (${r.votes} vote${r.votes > 1 ? 's' : ''})`
                          : 'No votes cast'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {poll.categories.map((cat) => (
                <div key={cat.id} className="rounded-3xl border border-accent/30 bg-white p-5">
                  <h2 className="font-semibold text-ink">{cat.title}</h2>
                  <p className="mt-0.5 text-xs text-ink/50">{cat.description}</p>

                  <div className="mt-4 space-y-2">
                    {cat.candidates.length === 0 && (
                      <p className="text-xs text-ink/40">No candidates yet.</p>
                    )}
                    {cat.candidates.map((name) => (
                      <div
                        key={name}
                        className="flex items-center justify-between rounded-xl bg-cream/60 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-ink">{name}</span>
                        {poll.isOpen || isClosed ? (
                          <span className="text-xs font-semibold text-primary">
                            {voteCounts?.[cat.id]?.[name] ?? 0} vote
                            {(voteCounts?.[cat.id]?.[name] ?? 0) === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemove(cat.id, name)}
                            aria-label={`Remove ${name}`}
                            className="text-ink/40 transition hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {!poll.isOpen && !isClosed && (
                    <AddCandidateForm onAdd={(name) => handleAdd(cat.id, name)} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Activity log */}
        <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <History size={16} className="text-primary" />
            Activity Log
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
            <p className="mt-4 flex items-center gap-2 text-sm text-ink/50">
              <ListChecks size={14} />
              No activity yet.
            </p>
          )}
        </div>
      </div>
    </MemberLayout>
  )
}
