import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'

export default function PublicPollPage() {
  const { token } = useParams()
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const busy = useRef(false)
  useEffect(() => {
    let stopped = false
    let inFlight = false
    async function refresh() {
      if (inFlight) return
      inFlight = true
      try {
        const { data, error: failure } = await supabase.rpc('get_public_poll', { p_token: token })
        if (failure) throw failure
        if (!stopped) setPoll(data)
      } catch {
        if (!stopped) setError('Could not load the poll. Please reload this page.')
      } finally {
        inFlight = false
        if (!stopped) setLoading(false)
      }
    }
    refresh()
    const timer = window.setInterval(refresh, 5000)
    return () => { stopped = true; window.clearInterval(timer) }
  }, [token])

  const categories = (poll?.categories ?? []).filter((cat) => cat.candidates.length > 0)
  async function submit(event) {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    setSaving(true); setError('')
    const selected = Object.fromEntries(categories.map((cat) => [cat.id, answers[cat.id]]))
    try {
      const { error: failure } = await supabase.rpc('submit_public_poll', {
        p_token: token, p_name: name.trim(), p_email: email.trim().toLowerCase(), p_answers: selected,
      })
      if (failure) throw failure
      setSubmitted(true)
    } catch (failure) {
      setError(failure.message || 'Your vote was not saved. Please try again.')
    } finally { busy.current = false; setSaving(false) }
  }

  return <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
    <h1 className="text-2xl font-extrabold text-ink">{poll?.clubName ?? 'Toasty'} — Voting poll</h1>
    <p className="mt-2 text-ink/60">{poll?.meetingLabel}</p>
    {error && <p role="alert" className="my-4 text-red-700">{error}</p>}
    {loading ? <p className="mt-6">Loading…</p> : submitted ? <p role="status" className="mt-6 font-semibold">Thank you! Your vote has been recorded.</p>
      : !poll?.isOpen ? <p className="mt-6">This poll is closed or has not been released. Ask the SAA for the current QR code.</p>
      : !categories.length ? <p className="mt-6">The SAA has not added candidates yet.</p>
      : <form onSubmit={submit} className="mt-6 space-y-5">
        <label className="block font-semibold">Your name<input required maxLength={120} value={name} disabled={saving} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-xl border border-accent/40 bg-white p-3" /></label>
        <label className="block font-semibold">Your email<input required type="email" maxLength={254} value={email} disabled={saving} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-xl border border-accent/40 bg-white p-3" /></label>
        <p className="text-sm text-ink/60">One submission per email for this poll. Your name and email are shared with the club organizers.</p>
        {categories.map((cat) => <fieldset key={cat.id} disabled={saving} className="rounded-2xl border border-accent/30 bg-white p-5">
          <legend className="px-2 font-bold">{cat.title}</legend>
          {cat.candidates.map((candidate) => <label key={candidate} className="flex items-center gap-3 py-2">
            <input type="radio" name={cat.id} required value={candidate} checked={answers[cat.id] === candidate} onChange={() => setAnswers((prev) => ({ ...prev, [cat.id]: candidate }))} />{candidate}
          </label>)}
        </fieldset>)}
        <button disabled={saving || categories.some((cat) => !cat.candidates.includes(answers[cat.id]))} className="w-full rounded-xl bg-primary p-3 font-semibold text-white disabled:opacity-40">{saving ? 'Submitting…' : 'Submit vote'}</button>
      </form>}
  </main>
}
