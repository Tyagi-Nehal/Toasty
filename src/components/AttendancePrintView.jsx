// Print/PDF layout for a submitted attendance roster — same pattern as
// AgendaPrintView.jsx / MOMPrintView.jsx.

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

const cellClass = 'border border-ink/25 px-2 py-[5px] align-top'

// entries: [{ email, name, present }] — the same shape AttendancePage
// already builds for submitAttendance, so the print view can reuse
// whatever's currently in state without a separate fetch.
export default function AttendancePrintView({ entries, meeting }) {
  if (!entries || !meeting) return null

  const meetingNumber = meeting.label?.match(/\d+/)?.[0] ?? meeting.label ?? ''
  const presentCount = entries.filter((e) => e.present).length
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="p-5 text-ink" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      <style>{'@media print { @page { margin: 0.3in; } }'}</style>
      <div className="text-center">
        <h1 className="text-xl font-extrabold tracking-wide">
          MANIPAL ACADEMY OF HIGHER EDUCATION
        </h1>
        <p className="text-xs font-semibold tracking-wide">TOASTMASTERS SESSION</p>
        <p className="text-2xl font-extrabold tracking-wide">ATTENDANCE</p>
        {meetingNumber && <p className="text-xs font-semibold">MEETING – {meetingNumber}</p>}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <p>
          <span className="font-bold">Date:</span> {formatOrdinalDate(meeting.date)}
        </p>
        <p>
          <span className="font-bold">Present:</span> {presentCount} of {entries.length}
        </p>
      </div>

      <table className="mt-2 w-full table-fixed border-collapse text-xs">
        <colgroup>
          <col style={{ width: '70%' }} />
          <col style={{ width: '30%' }} />
        </colgroup>
        <thead>
          <tr className="bg-ink/5">
            <th className={`${cellClass} text-left font-bold`}>Name</th>
            <th className={`${cellClass} text-left font-bold`}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr key={entry.email} style={{ breakInside: 'avoid' }}>
              <td className={cellClass}>{entry.name}</td>
              <td className={cellClass}>{entry.present ? 'Present' : 'Absent'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
