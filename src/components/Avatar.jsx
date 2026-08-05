const PALETTE = ['#c45c00', '#9c4900', '#e0a060', '#7a4a1f', '#b5722f']

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '')
  return initials.join('') || '?'
}

export default function Avatar({ name, size = 48, className = '' }) {
  const bg = PALETTE[hashString(name) % PALETTE.length]
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-cream ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: size * 0.38,
      }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  )
}
