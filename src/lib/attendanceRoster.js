const normalizeEmail = (email) => (email ?? '').trim().toLowerCase()

// Saved attendance is the meeting's roster snapshot, not today's membership list.
export function buildAttendanceRoster(rows, members, meetingDate) {
  const testEmails = new Set(members.filter((m) => m.is_test_account).map((m) => normalizeEmail(m.email)))
  const saved = rows.filter((row) => !testEmails.has(normalizeEmail(row.member_email)))
  if (saved.length > 0) {
    return {
      alreadySubmitted: true,
      roster: saved.map((row) => ({
        name: row.member_name,
        email: row.member_email,
        present: row.present,
      })).sort((a, b) => a.name.localeCompare(b.name)),
    }
  }

  // Without a saved snapshot, use the term dates we have for the meeting date.
  // These are editable drafts only; they are not evidence of actual attendance.
  return {
    alreadySubmitted: false,
    roster: members.filter((member) =>
      !member.is_test_account &&
      (!member.membership_start || member.membership_start <= meetingDate) &&
      (!member.membership_end || member.membership_end >= meetingDate) &&
      (member.membership_end ? true : member.is_active),
    ).map((member) => ({ name: member.name, email: member.email, present: true }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }
}
