import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, PartyPopper, Vote, Clock, CheckCircle2 } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import { getAccount } from '../lib/mockAuth.js'
import { getPoll, hasVoted, submitVote } from '../lib/mockPollStore.js'

export default function VotingPollPage() {
  const account = getAccount()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [poll, setPoll] = useState(null)
  const [alreadyVoted, setAlreadyVoted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPoll().then(async (fetched) => {
      setPoll(fetched)
      setAlreadyVoted(fetched ? await hasVoted(fetched.id) : false)
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

  if (!poll || !poll.isOpen) {
    return (
      <MemberLayout>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 text-primary">
            <Clock size={26} />
          </div>
          <h1 className="text-xl font-bold text-ink">Voting hasn't opened yet</h1>
          <p className="text-sm text-ink/60">
            The SAA will release the poll during{' '}
            {poll?.meetingLabel ?? 'the'} meeting. Check back then.
          </p>
        </div>
      </MemberLayout>
    )
  }

  if (justSubmitted) {
    return (
      <MemberLayout>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PartyPopper size={30} />
          </div>
          <h1 className="text-2xl font-bold text-ink">Thank you for voting!</h1>
          <p className="text-sm text-ink/60">
            Your votes for {poll.meetingLabel}'s meeting have been recorded.
          </p>
          <Link
            to="/dashboard"
            className="mt-3 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
          >
            Back to Dashboard
          </Link>
        </div>
      </MemberLayout>
    )
  }

  if (alreadyVoted) {
    return (
      <MemberLayout>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 size={30} />
          </div>
          <h1 className="text-2xl font-bold text-ink">You've already voted</h1>
          <p className="text-sm text-ink/60">
            Your votes for {poll.meetingLabel}'s meeting were already recorded.
            Each member gets one vote per meeting.
          </p>
          <Link
            to="/dashboard"
            className="mt-3 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
          >
            Back to Dashboard
          </Link>
        </div>
      </MemberLayout>
    )
  }

  const category = poll.categories[step]
  const candidates = category.candidates.filter((c) => c !== account?.name)
  const excludedSelf = candidates.length < category.candidates.length
  const selected = answers[category.id]
  const isLastStep = step === poll.categories.length - 1

  function handleSelect(name) {
    setAnswers((prev) => ({ ...prev, [category.id]: name }))
  }

  async function handleNext() {
    if (isLastStep) {
      await submitVote(poll.id, answers)
      setJustSubmitted(true)
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Vote size={16} />
          Voting Poll · {poll.meetingLabel}
        </div>

        {/* Progress */}
        <div className="mt-4 flex items-center gap-1.5">
          {poll.categories.map((c, i) => (
            <div
              key={c.id}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? 'bg-primary' : 'bg-accent/25'
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/40">
          Step {step + 1} of {poll.categories.length}
        </p>

        {/* Category card */}
        <div className="mt-5 rounded-3xl border border-accent/30 bg-white p-6">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">{category.title}</h1>
          <p className="mt-1.5 text-sm text-ink/60">{category.description}</p>
          {excludedSelf && (
            <p className="mt-2 text-xs text-ink/40">
              You're not shown as an option in this category.
            </p>
          )}

          <div className="mt-6 space-y-3">
            {candidates.length === 0 && (
              <p className="text-sm text-ink/50">
                No candidates added for this category yet — you can skip it.
              </p>
            )}
            {candidates.map((name) => {
              const active = selected === name
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(name)}
                  className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left text-base font-semibold transition ${
                    active
                      ? 'border-primary bg-primary/5 text-ink'
                      : 'border-accent/25 text-ink/80 hover:border-primary/40'
                  }`}
                >
                  {name}
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      active ? 'border-primary bg-primary text-cream' : 'border-accent/40'
                    }`}
                  >
                    {active && <Check size={14} />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 rounded-full border border-accent/40 px-5 py-3 text-sm font-semibold text-ink/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!selected && candidates.length > 0}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLastStep ? 'Submit Vote' : 'Next'}
            {!isLastStep && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </MemberLayout>
  )
}
