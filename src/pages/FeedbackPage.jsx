import { useState } from 'react'
import { CheckCircle2, MessageSquare, Send } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import { getAccount } from '../lib/mockAuth.js'
import { getMyFeedback, submitFeedback } from '../lib/mockFeedbackStore.js'

export default function FeedbackPage() {
  const account = getAccount()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [mySubmissions, setMySubmissions] = useState(() =>
    getMyFeedback(account?.email),
  )
  const [justSubmitted, setJustSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    submitFeedback({ subject: subject.trim(), message: message.trim(), authorEmail: account?.email })
    setMySubmissions(getMyFeedback(account?.email))
    setSubject('')
    setMessage('')
    setJustSubmitted(true)
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Feedback</h1>
        <p className="mt-1 text-sm text-ink/60">
          Share anything with the President — your name is never attached to
          what you submit.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-3xl border border-accent/30 bg-white p-6"
        >
          <label htmlFor="subject" className="block text-sm font-medium text-ink">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value)
              setJustSubmitted(false)
            }}
            placeholder="e.g. Meeting timing feedback"
            className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />

          <label htmlFor="message" className="mt-4 block text-sm font-medium text-ink">
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setJustSubmitted(false)
            }}
            placeholder="Write your feedback here..."
            className="mt-1.5 w-full resize-none rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />

          <button
            type="submit"
            disabled={!subject.trim() || !message.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={15} />
            Submit
          </button>

          {justSubmitted && (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary">
              <CheckCircle2 size={15} />
              Your feedback has been submitted.
            </p>
          )}
        </form>

        <div className="mt-8">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <MessageSquare size={16} className="text-primary" />
            My Past Submissions
          </h2>

          {mySubmissions.length > 0 ? (
            <div className="mt-3 space-y-3">
              {mySubmissions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-accent/25 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{item.subject}</p>
                    {item.resolved && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        <CheckCircle2 size={12} />
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink/70">{item.message}</p>
                  <p className="mt-2 text-xs text-ink/40">
                    {new Date(item.submittedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-accent/40 bg-white p-6 text-center text-sm text-ink/50">
              You haven't submitted any feedback yet.
            </div>
          )}
        </div>
      </div>
    </MemberLayout>
  )
}
