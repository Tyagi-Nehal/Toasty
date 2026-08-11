import { X, Award } from 'lucide-react'

export default function PhotoGalleryModal({ meeting, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink sm:text-xl">
              {meeting.dateLabel}
            </h2>
            <p className="text-sm text-ink/60">Theme: {meeting.theme}</p>
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

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {meeting.photos.map((photo, i) => (
            <div
              key={photo.id}
              className="aspect-square overflow-hidden rounded-2xl shadow-sm shadow-primary/10"
            >
              <img
                src={photo.src}
                alt={`${meeting.dateLabel} meeting photo ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <div className="mt-7">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Award size={16} className="text-primary" />
            Certificates
          </h3>
          {meeting.certificates.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {meeting.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="overflow-hidden rounded-2xl border border-accent/30 bg-cream"
                >
                  <div className="grid grid-cols-2 gap-0.5 bg-accent/10">
                    {cert.certificateSrc && (
                      <img
                        src={cert.certificateSrc}
                        alt="Certificate"
                        className="h-28 w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    {cert.presentationSrc && (
                      <img
                        src={cert.presentationSrc}
                        alt="Presentation"
                        className="h-28 w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <p className="px-3 py-2 text-xs font-medium text-ink/70">
                    {cert.category} — {cert.winnerName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink/50">
              No certificates uploaded for this meeting.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
