import { Mail } from 'lucide-react'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="border-t border-accent/30 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink/60">
            Toasty automates the busywork of running a Toastmasters club —
            roles, agendas, attendance, polls, and more — so ExCom teams can
            focus on great meetings.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li className="flex items-center gap-2">
              <Mail size={16} className="text-primary" />
              <a href="mailto:jointoasty@gmail.com" className="hover:text-primary">
                jointoasty@gmail.com
              </a>
            </li>
            <li>Built for Toastmasters clubs, everywhere.</li>
          </ul>
        </div>

        <div>
          <p className="text-sm leading-relaxed text-ink/60">
            "No speeches were harmed in the making of this app."
            <br />
            Built by Isha Karn &amp; Nehal Tyagi.
            <br />
            Contact:{' '}
            <a href="mailto:jointoasty@gmail.com" className="hover:text-primary">
              jointoasty@gmail.com
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-accent/20 py-4 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} Toasty. Made with 🍞 for public speakers.
      </div>
    </footer>
  )
}
