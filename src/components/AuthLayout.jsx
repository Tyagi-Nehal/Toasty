import Logo from './Logo.jsx'

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <Logo className="mb-8" />
      <div className="w-full max-w-sm rounded-3xl border border-accent/30 bg-white p-6 shadow-lg shadow-primary/5 sm:p-8">
        {children}
      </div>
    </div>
  )
}
