// Print/PDF layout for a finished agenda — styled to match the club's
// real reference document (MAHE Bengaluru Toastmasters' printed meeting
// agenda), not a generic table dump. Rendered off-screen (`hidden
// print:block`, see AgendaEditorPage.jsx) and only shown to the browser's
// print engine when the VPE clicks "Print to PDF", which just calls
// window.print() — the person picks "Save as PDF" as the destination in
// their own browser's print dialog, no PDF library needed.
//
// No club/institution logos yet — those are real trademarked images this
// project doesn't have on file. Once provided (see AgendaEditorPage.jsx's
// "Print to PDF" section), drop them in and reference them here.

function formatOrdinalDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T00:00:00`)
  const day = date.getDate()
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th'
  const month = date.toLocaleDateString(undefined, { month: 'long' })
  return `${day}${suffix} ${month}, ${date.getFullYear()}`
}

const cellClass = 'border border-ink/25 px-3 py-2 align-top'

export default function AgendaPrintView({ agenda, meeting }) {
  if (!agenda || !meeting) return null

  const meetingNumber = meeting.label?.match(/\d+/)?.[0] ?? meeting.label ?? ''
  const timeText =
    agenda.overallStartTime && agenda.overallEndTime
      ? `${agenda.overallStartTime} to ${agenda.overallEndTime} (IST)`
      : ''

  return (
    <div className="p-10 text-ink" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-wide">
          MANIPAL ACADEMY OF HIGHER EDUCATION
        </h1>
        <p className="mt-1 text-sm font-semibold tracking-wide">TOASTMASTERS SESSION</p>
        <p className="mt-1 text-3xl font-extrabold tracking-wide">AGENDA</p>
        {meetingNumber && (
          <p className="mt-1 text-sm font-semibold">MEETING – {meetingNumber}</p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
        <div className="space-y-1.5">
          <p>
            <span className="font-bold">Theme:</span> {agenda.theme || '—'}
          </p>
          <p>
            <span className="font-bold">Word Of The Day:</span> {agenda.wordOfDay || '—'}
          </p>
          <p>
            <span className="font-bold">Meaning:</span> {agenda.meaning || '—'}
          </p>
        </div>
        <div className="space-y-1.5 text-right">
          <p>
            <span className="font-bold">Date:</span> {formatOrdinalDate(meeting.date)}
          </p>
          <p>
            <span className="font-bold">Time:</span> {timeText}
          </p>
          <p>
            <span className="font-bold">Venue:</span> {agenda.venue || '—'}
          </p>
        </div>
      </div>

      <table className="mt-8 w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col style={{ width: '13%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '28%' }} />
          <col style={{ width: '21%' }} />
          <col style={{ width: '25%' }} />
        </colgroup>
        <thead>
          <tr className="bg-ink/5">
            <th className={`${cellClass} text-left font-bold`}>Start Time</th>
            <th className={`${cellClass} text-left font-bold`}>End Time</th>
            <th className={`${cellClass} text-left font-bold`}>Segment</th>
            <th className={`${cellClass} text-left font-bold`}>Role Player</th>
            <th className={`${cellClass} text-left font-bold`}>Name</th>
          </tr>
        </thead>
        <tbody>
          {agenda.items.map((item) => (
            <tr key={item.id} style={{ breakInside: 'avoid' }}>
              <td className={`${cellClass} whitespace-nowrap`}>{item.startTime}</td>
              <td className={`${cellClass} whitespace-nowrap`}>{item.endTime}</td>
              <td className={cellClass}>{item.segment}</td>
              <td className={`${cellClass} whitespace-pre-line`}>{item.rolePlayer}</td>
              <td className={`${cellClass} whitespace-pre-line`}>{item.name || 'Unassigned'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
