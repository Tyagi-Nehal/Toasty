// Print/PDF layout for a submitted MOM — same off-screen
// (`hidden print:block`) + window.print() pattern as AgendaPrintView.jsx,
// styled to match it (same header treatment, @page margin, text sizing)
// so every document this app prints looks like it belongs to the same
// club, not three unrelated layouts.

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

function Section({ title, children }) {
  return (
    <div className="mt-2.5" style={{ breakInside: 'avoid' }}>
      <p className="border-b border-ink/25 pb-0.5 text-xs font-extrabold uppercase tracking-wide">
        {title}
      </p>
      <div className="mt-1 space-y-1 text-xs">{children}</div>
    </div>
  )
}

function RoleRow({ label, role }) {
  if (!role?.name?.trim() && !role?.comments?.trim()) return null
  return (
    <p>
      <span className="font-bold">{label}:</span> {role?.name || '—'}
      {role?.comments?.trim() && <span className="text-ink/70"> — {role.comments}</span>}
    </p>
  )
}

function ListSection({ title, items, renderLine }) {
  if (!items || items.length === 0) return null
  return (
    <Section title={title}>
      {items.map((item, i) => (
        <p key={item.key ?? i}>{renderLine(item, i)}</p>
      ))}
    </Section>
  )
}

export default function MOMPrintView({ mom, meeting }) {
  if (!mom || !meeting) return null

  const meetingNumber = meeting.label?.match(/\d+/)?.[0] ?? meeting.label ?? ''

  return (
    <div className="p-5 text-ink" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      <style>{'@media print { @page { margin: 0.3in; } }'}</style>
      <div className="text-center">
        <h1 className="text-xl font-extrabold tracking-wide">
          MANIPAL ACADEMY OF HIGHER EDUCATION
        </h1>
        <p className="text-xs font-semibold tracking-wide">TOASTMASTERS SESSION</p>
        <p className="text-2xl font-extrabold tracking-wide">MINUTES OF MEETING</p>
        {meetingNumber && <p className="text-xs font-semibold">MEETING – {meetingNumber}</p>}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-0.5">
          <p>
            <span className="font-bold">Location:</span> {mom.location || '—'}
          </p>
        </div>
        <div className="space-y-0.5 text-right">
          <p>
            <span className="font-bold">Date:</span> {formatOrdinalDate(meeting.date)}
          </p>
          <p>
            <span className="font-bold">Time:</span> {mom.startTime || '—'} to {mom.endTime || '—'}
          </p>
        </div>
      </div>

      <Section title="Officers">
        <RoleRow label="Sergeant at Arms" role={mom.saa} />
        <RoleRow label="Presiding Officer" role={mom.presidingOfficer} />
        <RoleRow label="Toastmaster of the Day" role={mom.tmod} />
      </Section>

      <ListSection
        title="Speakers"
        items={mom.speakers}
        renderLine={(s) => (
          <>
            <span className="font-bold">{s.name || '—'}</span>
            {s.project?.trim() && ` — ${s.project}`}
            {s.comments?.trim() && <span className="text-ink/70"> — {s.comments}</span>}
          </>
        )}
      />

      <ListSection
        title="Evaluators"
        items={mom.evaluators}
        renderLine={(e) => (
          <>
            <span className="font-bold">{e.name || '—'}</span>
            {e.speakerEvaluated?.trim() && ` — evaluated ${e.speakerEvaluated}`}
            {e.comments?.trim() && <span className="text-ink/70"> — {e.comments}</span>}
          </>
        )}
      />

      {(mom.ttMaster?.name?.trim() || (mom.ttSpeakers?.length ?? 0) > 0) && (
        <Section title="Table Topics">
          <RoleRow label="TT Master" role={mom.ttMaster} />
          {mom.ttSpeakers?.map((s, i) => (
            <p key={s.key ?? i}>
              <span className="font-bold">{s.name || '—'}</span>
              {s.comments?.trim() && <span className="text-ink/70"> — {s.comments}</span>}
            </p>
          ))}
        </Section>
      )}

      <Section title="Timer, Ah-Counter, Grammarian, Listener">
        <RoleRow label="Timer" role={mom.timer} />
        <RoleRow label="Ah-Counter" role={mom.ahCounter} />
        <RoleRow label="Grammarian" role={mom.grammarian} />
        <RoleRow label="Listener" role={mom.listener} />
      </Section>

      <Section title="General Evaluator">
        <RoleRow label="GE" role={mom.ge} />
        {mom.geOverallComments?.trim() && <p>{mom.geOverallComments}</p>}
      </Section>

      {mom.awardsGiven?.trim() && <Section title="Awards Given">{mom.awardsGiven}</Section>}
      {mom.actionItems?.trim() && <Section title="Action Items">{mom.actionItems}</Section>}
    </div>
  )
}
