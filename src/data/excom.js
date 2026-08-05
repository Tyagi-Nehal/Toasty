function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export const currentExcom = [
  { name: 'Sarvajit', role: 'President' },
  { name: 'Faizaan', role: 'VPE' },
  { name: 'Aman', role: 'Ass. VPE' },
  { name: 'Anish', role: 'Ass. VPE' },
  { name: 'Ahana', role: 'VPPR' },
  { name: 'Ruhaani', role: 'Ass. VPPR' },
  { name: 'Swetha', role: 'Ass. VPPR' },
  { name: 'Nick', role: 'VPM' },
  { name: 'Chozhan', role: 'Secretary' },
  { name: 'Advik', role: 'Treasurer' },
  { name: 'Durva', role: 'SAA' },
].map((member) => ({ id: slugify(`${member.name}-${member.role}`), ...member }))

// Names and roles below are as provided. Department, year of study,
// contributions, phone, and email are not known — left unset rather than
// invented, since this is real ExCom roster data, not fictional sample data.
export const pastExcom = [
  { name: 'Nehal', role: 'President' },
  { name: 'Isha', role: 'VPE' },
  { name: 'Advik', role: 'Ass. VPE' },
  { name: 'Chozhan', role: 'Ass. VPE / Treasurer' },
  { name: 'Swetha', role: 'VPPR' },
  { name: 'Ahana', role: 'Ass. VPPR' },
  { name: 'Ayman', role: 'Ass. VPPR' },
  { name: 'Nick', role: 'VPM' },
  { name: 'Parth', role: 'Secretary' },
  { name: 'Venkat', role: 'SAA' },
].map((member) => ({
  id: slugify(`${member.name}-${member.role}`),
  department: null,
  branch: null,
  yearOfStudy: null,
  contribution: null,
  phone: null,
  email: null,
  ...member,
}))
