import assert from 'node:assert/strict'
import { test } from 'node:test'
import { syncAgendaRoleItems } from '../src/lib/agendaRoleSync.js'

test('existing officer defaults follow meeting assignments independently of TMOD', () => {
  const rows = [
    { rolePlayer: 'SAA', segment: 'Sergeant At Arms Address', name: 'TM Durva S.', roleIds: [] },
    { rolePlayer: 'PO', segment: 'Presiding Officer Address', name: 'TM Sarvajit S.', roleIds: [] },
    { rolePlayer: 'PO', segment: 'Presiding Officer Address + Poll Session', name: 'TM Sarvajit S.', roleIds: [] },
    { name: 'Old TMOD', roleIds: ['tmod'] },
  ]
  const names = { saa: 'TM Alice A.', po: 'TM Bob B.', tmod: 'TM Carol C.' }
  const synced = syncAgendaRoleItems(rows, (id) => names[id] ?? '')
  assert.deepEqual(synced.map((row) => row.name), ['TM Alice A.', 'TM Bob B.', 'TM Bob B.', 'TM Carol C.'])
  assert.deepEqual(synced.map((row) => row.roleIds), [['saa'], ['po'], ['po'], ['tmod']])
  assert.equal(rows[0].name, 'TM Durva S.')
  const reopened = syncAgendaRoleItems(synced, (id) => id === 'saa' ? '' : names[id])
  assert.equal(reopened[0].name, '')
  assert.equal(syncAgendaRoleItems(synced, (id) => names[id])[0], synced[0])
})

test('manual names and unrelated rows survive synchronization', () => {
  const rows = [
    { rolePlayer: 'PO', segment: 'Presiding Officer Address', name: 'DTM Guest', roleIds: [] },
    { rolePlayer: 'SAA', segment: 'Sergeant At Arms Address', name: 'TM Durva S.', roleIds: [], manualNameOverride: true },
    { rolePlayer: 'PO', segment: 'Custom address', name: 'TM Sarvajit S.', roleIds: [] },
  ]
  assert.deepEqual(syncAgendaRoleItems(rows, () => 'Replacement'), rows)
})
