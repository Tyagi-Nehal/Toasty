import { Link } from 'react-router-dom'
import mascot from '../assets/toasty-mascot.png'

export default function Logo({ className = '', to = '/' }) {
  return (
    <Link
      to={to}
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap font-extrabold text-lg text-ink ${className}`}
    >
      <img src={mascot} alt="" className="h-8 w-8 shrink-0 object-contain" />
      <span>
        Toast<span className="text-primary">y</span>
      </span>
    </Link>
  )
}
