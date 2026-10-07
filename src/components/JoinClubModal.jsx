import { useEffect, useRef, useState } from 'react'
import { Calendar, CheckCircle2, Clock, MapPinned, X } from 'lucide-react'
import { submitVisitRequest } from '../lib/mockVisitRequests.js'
import { supabase } from '../lib/supabaseClient.js'
import { formatVisitDate, visitMeetingDates } from '../lib/visitMeetingDates.js'

const initialForm = { name: '', email: '', phone: '', message: '', visitDate: '' }

export default function JoinClubModal({ club, onClose }) {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [dates, setDates] = useState(null)
  const [scheduleError, setScheduleError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const scheduleVersion = useRef(0)
  const hasMeetingInfo = club.meetingDay || club.meetingTime || club.meetingLocation

  useEffect(() => {
    if (submitted) return
    let stopped = false
    let inFlight = false
    async function refresh() {
      if (stopped || inFlight || submittingRef.current || document.visibilityState === 'hidden') return
      inFlight = true
      const version = ++scheduleVersion.current
      try {
        const { data, error } = await supabase.rpc('get_visit_meetings', { p_club_id: club.id })
        if (error) throw error
        if (!stopped && version === scheduleVersion.current) {
          setDates(visitMeetingDates(data ?? []))
          setScheduleError('')
        }
      } catch {
        if (!stopped && version === scheduleVersion.current) setScheduleError('Could not load meeting dates. We’ll retry automatically.')
      } finally {
        inFlight = false
      }
    }
    setDates(null)
    refresh()
    const timer = window.setInterval(refresh, 5000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      stopped = true
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [club.id, submitted])

  useEffect(() => {
    if (dates && form.visitDate && !dates.includes(form.visitDate)) {
      setForm((prev) => ({ ...prev, visitDate: '' }))
      setNotice('The meeting schedule changed. Please choose another date.')
    }
  }, [dates, form.visitDate])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'visitDate') setNotice('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    ++scheduleVersion.current
    setSubmitting(true)
    try {
      const { data, error } = await supabase.rpc('get_visit_meetings', { p_club_id: club.id })
      if (error) throw error
      const currentDates = visitMeetingDates(data ?? [])
      setDates(currentDates)
      setScheduleError('')
      if (!currentDates.includes(form.visitDate)) {
        setForm((prev) => ({ ...prev, visitDate: '' }))
        setNotice('The meeting schedule changed. Please choose another date.')
        return
      }
      submitVisitRequest({
        clubId: club.id,
        clubName: club.name,
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        visitDate: form.visitDate,
      })
      setSubmitted(true)
    } catch {
      setNotice('Could not send your request. Please try again.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink sm:text-2xl">
              {submitted ? 'Thanks for reaching out!' : "I'm interested in visiting"}
            </h2>
            {!submitted && (
              <p className="mt-1 text-sm text-ink/60">{club.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-ink/50 transition hover:bg-cream hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 size={44} className="text-primary" />
            <p className="text-sm text-ink/70">
              Your message has been sent to the club's VPM. They'll
              acknowledge your request soon.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {hasMeetingInfo && (
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 rounded-xl bg-cream px-4 py-3 text-xs text-ink/60">
                {club.meetingTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-primary" />
                    🕒 {club.meetingTime}
                  </span>
                )}
                {club.meetingLocation && (
                  <span className="flex items-center gap-1.5">
                    <MapPinned size={13} className="text-primary" />
                    📍 {club.meetingLocation}
                  </span>
                )}
                {club.meetingDay && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary" />
                    📅 {club.meetingDay}
                  </span>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-ink">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-ink">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="phone" className="text-sm font-medium text-ink">
                  Phone <span className="text-ink/40">(optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 90000 00000"
                  className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="visitDate" className="text-sm font-medium text-ink">
                  When are you planning to visit?
                </label>
                <select
                  id="visitDate"
                  name="visitDate"
                  required
                  disabled={submitting || dates === null || dates.length === 0 || !!scheduleError}
                  value={dates?.includes(form.visitDate) ? form.visitDate : ''}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                >
                  <option value="">{dates === null ? 'Loading meeting dates…' : 'Choose a meeting date'}</option>
                  {(dates ?? []).map((date) => <option key={date} value={date}>{formatVisitDate(date)}</option>)}
                </select>
                {scheduleError ? (
                  <p role="alert" className="mt-2 text-sm text-red-700">{scheduleError}</p>
                ) : dates?.length === 0 ? (
                  <p className="mt-2 text-sm text-ink/60">No future meetings are scheduled yet. Please check back later.</p>
                ) : null}
                {notice && <p role="status" className="mt-2 text-sm text-ink/70">{notice}</p>}
              </div>
              <div>
                <label htmlFor="message" className="text-sm font-medium text-ink">
                  Message to the club
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  required
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us why you'd like to visit..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !!scheduleError || !dates?.includes(form.visitDate)}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
              >
                {submitting ? 'Checking meeting date…' : 'Send to club'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
