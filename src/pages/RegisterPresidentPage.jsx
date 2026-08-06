import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import Footer from '../components/Footer.jsx'
import { submitPresidentVerification } from '../lib/mockClubRegistry.js'

const initialForm = { name: '', memberId: '', clubName: '', email: '', phone: '' }

const fields = [
  { key: 'name', label: 'Your Name', placeholder: 'Full name' },
  { key: 'memberId', label: 'Member ID', placeholder: 'Official Toastmasters member ID' },
  { key: 'clubName', label: "Club's Name", placeholder: 'e.g. MAHE Bengaluru Toastmasters Club' },
  { key: 'email', label: 'Email ID', placeholder: 'you@example.com', type: 'email' },
  { key: 'phone', label: 'Phone Number', placeholder: '+91 90000 00000', type: 'tel' },
]

export default function RegisterPresidentPage() {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    submitPresidentVerification(form)
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
              Verification request submitted
            </h1>
            <p className="max-w-sm text-sm text-ink/60">
              The Toasty team will review your details and approve your
              account soon. Once approved, you'll be able to register your
              club using this email.
            </p>
            <Link
              to="/register-club"
              className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
            >
              Back to club registration
            </Link>
          </div>
        ) : (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <ShieldCheck size={13} />
              President Verification
            </span>
            <h1 className="mt-4 text-2xl font-extrabold text-ink sm:text-3xl">
              Register as a Club President
            </h1>
            <p className="mt-2 text-sm text-ink/60 sm:text-base">
              Only verified presidents can register a club on Toasty. Fill in
              your details below — the Toasty team will review and approve
              your request before you can submit a club registration.
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
