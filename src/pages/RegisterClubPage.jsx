import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Landmark } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import Footer from '../components/Footer.jsx'
import { submitClubRegistration } from '../lib/mockClubRegistry.js'

const initialForm = {
  name: '',
  clubName: '',
  clubId: '',
  district: '',
  area: '',
  memberCount: '',
  foundedYear: '',
  city: '',
  country: '',
}

const fields = [
  { key: 'name', label: 'Your Name', placeholder: 'Full name of the President' },
  { key: 'clubName', label: "Club's Name", placeholder: 'e.g. MAHE Bengaluru Toastmasters Club' },
  { key: 'clubId', label: "Club's ID", placeholder: 'Official Toastmasters club ID' },
  { key: 'district', label: "Club's District", placeholder: 'e.g. Division D, District 41' },
  { key: 'area', label: "Club's Area", placeholder: 'e.g. Area 12' },
  { key: 'memberCount', label: 'No. of Members in Club', placeholder: 'e.g. 45', type: 'number' },
  { key: 'foundedYear', label: 'Year the Club was Founded', placeholder: 'e.g. 2018' },
  { key: 'city', label: 'City', placeholder: 'e.g. Bengaluru' },
  { key: 'country', label: 'Country', placeholder: 'e.g. India' },
]

export default function RegisterClubPage() {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    submitClubRegistration(form)
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
              <span className="font-medium text-ink">toastytyka@gmail.com</span>{' '}
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

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-4 rounded-3xl border border-accent/30 bg-white p-6 sm:p-8"
            >
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
