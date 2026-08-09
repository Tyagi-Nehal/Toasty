import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Landmark } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import Footer from '../components/Footer.jsx'
import { submitClubRegistration } from '../lib/mockClubRegistry.js'

const initialForm = {
  name: '',
  presidentEmail: '',
  clubName: '',
  clubId: '',
  district: '',
  area: '',
  memberCount: '',
  foundedYear: '',
  city: '',
  country: '',
  meetingDay: '',
  meetingTime: '6:00 PM',
  meetingLocation: '',
}

const weekdays = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1))
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

const fields = [
  { key: 'name', label: 'Your Name', placeholder: 'Full name of the President' },
  { key: 'presidentEmail', label: 'Your Email', placeholder: 'you@example.com', type: 'email' },
  { key: 'clubName', label: "Club's Name", placeholder: 'e.g. MAHE Bengaluru Toastmasters Club' },
  { key: 'clubId', label: "Club's ID", placeholder: 'Official Toastmasters club ID' },
  { key: 'district', label: "Club's District", placeholder: 'e.g. Division D, District 41' },
  { key: 'area', label: "Club's Area", placeholder: 'e.g. Area 12' },
  { key: 'memberCount', label: 'No. of Members in Club', placeholder: 'e.g. 45', type: 'number' },
  { key: 'foundedYear', label: 'Year the Club was Founded', placeholder: 'e.g. 2018' },
  { key: 'city', label: 'City', placeholder: 'e.g. Bengaluru' },
  { key: 'country', label: 'Country', placeholder: 'e.g. India' },
  { key: 'meetingLocation', label: 'Meeting Location', placeholder: 'e.g. Innovation Centre, MAHE Bengaluru Campus' },
]

export default function RegisterClubPage() {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [meetingHour, setMeetingHour] = useState('6')
  const [meetingMinute, setMeetingMinute] = useState('00')
  const [meetingPeriod, setMeetingPeriod] = useState('PM')

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleMeetingTimeChange(part, value) {
    const next = {
      hour: part === 'hour' ? value : meetingHour,
      minute: part === 'minute' ? value : meetingMinute,
      period: part === 'period' ? value : meetingPeriod,
    }
    if (part === 'hour') setMeetingHour(value)
    if (part === 'minute') setMeetingMinute(value)
    if (part === 'period') setMeetingPeriod(value)
    setForm((prev) => ({
      ...prev,
      meetingTime: `${next.hour}:${next.minute} ${next.period}`,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const result = await submitClubRegistration(form)
    if (result?.error) {
      setError(result.error)
      return
    }
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-cream">
      <PublicNavbar />

      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-accent/30 bg-white p-10 text-center">
            <CheckCircle2 size={44} className="text-primary" />
            <h1 className="text-xl font-bold text-ink sm:text-2xl">
              Registration submitted
            </h1>
            <p className="max-w-sm text-sm text-ink/60">
              We've notified the Toasty team at{' '}
              <span className="font-medium text-ink">jointoasty@gmail.com</span>{' '}
              — they'll review your club's details and approve it soon. Once
              approved, {form.clubName || 'your club'} will appear in "Find
              your club" on the home page.
            </p>
            <Link
              to="/"
              className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Landmark size={13} />
              Club Presidents
            </span>
            <h1 className="mt-4 text-2xl font-extrabold text-ink sm:text-3xl">
              Register your Club
            </h1>
            <p className="mt-2 text-sm text-ink/60 sm:text-base">
              Fill in your club's details below. Every submission is reviewed
              by the Toasty team before your club appears in "Find your club."
            </p>

            <div className="mt-4 rounded-2xl border border-dashed border-accent/40 bg-white px-4 py-3 text-sm text-ink/70">
              Are you a registered president?{' '}
              <Link
                to="/register-president"
                className="font-semibold text-primary hover:underline"
              >
                If not, click here.
              </Link>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-4 rounded-3xl border border-accent/30 bg-white p-6 sm:p-8"
            >
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="meetingDay" className="text-sm font-medium text-ink">
                  Meeting Day
                </label>
                <select
                  id="meetingDay"
                  name="meetingDay"
                  required
                  value={form.meetingDay}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                >
                  <option value="" disabled>
                    Select a day
                  </option>
                  {weekdays.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-ink">Meeting Time</label>
                <div className="mt-1.5 flex gap-2">
                  <select
                    value={meetingHour}
                    onChange={(e) => handleMeetingTimeChange('hour', e.target.value)}
                    className="w-full rounded-xl border border-accent/40 bg-cream px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    value={meetingMinute}
                    onChange={(e) => handleMeetingTimeChange('minute', e.target.value)}
                    className="w-full rounded-xl border border-accent/40 bg-cream px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                  >
                    {minutes.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={meetingPeriod}
                    onChange={(e) => handleMeetingTimeChange('period', e.target.value)}
                    className="w-full rounded-xl border border-accent/40 bg-cream px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {fields.map((field) => (
                <div key={field.key}>
                  <label htmlFor={field.key} className="text-sm font-medium text-ink">
                    {field.label}
                  </label>
                  <input
                    id={field.key}
                    name={field.key}
                    type={field.type ?? 'text'}
                    required
                    value={form[field.key]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                  />
                </div>
              ))}

              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
              >
                Submit for review
              </button>
            </form>
          </>
        )}
      </section>

      <Footer />
    </div>
  )
}
