import { useState } from 'react'
import { Calendar, CheckCircle2, Clock, MapPinned, X } from 'lucide-react'
import { submitVisitRequest } from '../lib/mockVisitRequests.js'

const initialForm = { name: '', email: '', phone: '', message: '', visitDate: '' }

export default function JoinClubModal({ club, onClose }) {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const hasMeetingInfo = club.meetingDay || club.meetingTime || club.meetingLocation

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
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
                <input
                  id="visitDate"
                  name="visitDate"
                  type="date"
                  required
                  value={form.visitDate}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                />
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
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
              >
                Send to club
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
