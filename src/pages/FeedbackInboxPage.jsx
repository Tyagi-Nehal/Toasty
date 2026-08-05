import { useState } from 'react'
import { Circle, CheckCircle2, ChevronDown, Inbox, StickyNote } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import {
  getAllFeedback,
  markRead,
  setPresidentNote,
  toggleResolved,
} from '../lib/mockFeedbackStore.js'

export default function FeedbackInboxPage() {
  const [items, setItems] = useState(() => getAllFeedback())
  const [openId, setOpenId] = useState(null)

  const unreadCount = items.filter((item) => !item.read).length

  function handleToggleOpen(item) {
    const nowOpen = openId === item.id ? null : item.id
    setOpenId(nowOpen)
    if (nowOpen && !item.read) {
      markRead(item.id)
      setItems(getAllFeedback())
    }
  }

  function handleToggleResolved(id) {
    toggleResolved(id)
    setItems(getAllFeedback())
  }

  function handleNoteChange(id, note) {
    setPresidentNote(id, note)
    setItems(getAllFeedback())
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Feedback Inbox
          </h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-cream">
              {unreadCount} unread
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink/60">
          All submissions are anonymous — the member's identity is never
          stored against these entries.
        </p>

        {items.length > 0 ? (
          <div className="mt-6 space-y-3">
            {items.map((item) => {
              const isOpen = openId === item.id
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-white transition ${
                    !item.read ? 'border-primary/40' : 'border-accent/25'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleOpen(item)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {!item.read && (
                        <Circle size={8} className="shrink-0 fill-primary text-primary" />
                      )}
                      <span
                        className={`truncate ${
                          item.read ? 'font-medium text-ink/80' : 'font-bold text-ink'
                        }`}
                      >
                        {item.subject}
                      </span>
                      {item.resolved && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          <CheckCircle2 size={11} />
                          Resolved
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-ink/40 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-accent/15 p-4 pt-3">
                      <p className="text-sm leading-relaxed text-ink/70">
                        {item.message}
                      </p>
                      <p className="mt-2 text-xs text-ink/40">
                        {new Date(item.submittedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleToggleResolved(item.id)}
                        className={`mt-3 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                          item.resolved
                            ? 'border border-accent/40 text-ink/60 hover:bg-cream'
                            : 'bg-primary text-cream hover:bg-primary-dark'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        {item.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                      </button>

                      <label
                        htmlFor={`note-${item.id}`}
                        className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-ink/60"
                      >
                        <StickyNote size={13} />
                        Private note (not shown to member)
                      </label>
                      <textarea
                        id={`note-${item.id}`}
                        rows={2}
                        defaultValue={item.presidentNote}
                        onBlur={(e) => handleNoteChange(item.id, e.target.value)}
                        placeholder="Add a private note..."
                        className="mt-1.5 w-full resize-none rounded-xl border border-accent/40 bg-cream px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-white p-10 text-center">
            <Inbox size={28} className="text-ink/30" />
            <p className="text-sm text-ink/50">No feedback submitted yet.</p>
          </div>
        )}
      </div>
    </MemberLayout>
  )
}
