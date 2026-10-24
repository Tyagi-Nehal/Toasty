// Older generated officer rows had no roleIds. Only recognize their original
// defaults; unrelated/manual rows must not be silently reassigned.
const legacyOfficers = [
  ['SAA', 'Sergeant At Arms Address', 'TM Durva S.', 'saa'],
  ['PO', 'Presiding Officer Address', 'TM Sarvajit S.', 'po'],
  ['PO', 'Presiding Officer Address + Poll Session', 'TM Sarvajit S.', 'po'],
]

export function syncAgendaRoleItems(items, named) {
  return items.map((item) => {
    if (item.manualNameOverride) return item
    const legacy = !item.roleIds?.length && legacyOfficers.find(([role, segment, name]) =>
      item.rolePlayer === role && item.segment === segment && item.name === name)
    const roleIds = legacy ? [legacy[3]] : item.roleIds
    if (!roleIds?.length) return item
    const name = roleIds.map(named).join('\n')
    return name === item.name && !legacy ? item : { ...item, roleIds, name }
  })
}
