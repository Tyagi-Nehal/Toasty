import { Link } from 'react-router-dom'
import mascot from '../assets/toasty-mascot.png'

export default function Logo({ className = '', to = '/' }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 font-extrabold text-xl text-ink ${className}`}
    >
      <img src={mascot} alt="" className="h-12 w-12 object-contain" />
      <span>
        Toast<span className="text-primary">y</span>
      </span>
    </Link>
  )
}
