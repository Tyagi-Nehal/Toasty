import { Hourglass } from 'lucide-react'

export default function PendingApprovalNotice({ email }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 text-primary">
        <Hourglass size={26} />
      </div>
      <h2 className="text-lg font-bold text-ink sm:text-xl">
        Your account is pending approval
      </h2>
      <p className="text-sm text-ink/60">
        {email && (
          <>
            <span className="font-medium text-ink">{email}</span> is waiting on{' '}
          </>
        )}
        approval by the VPM. You'll be notified once approved.
      </p>
    </div>
  )
}
