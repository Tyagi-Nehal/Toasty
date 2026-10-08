import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('Pathways: club isolation, member read-only access, validation and audit', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create function auth.jwt() returns jsonb language sql as 'select current_setting(''request.jwt.claims'',true)::jsonb';
      create function auth.uid() returns uuid language sql as 'select (auth.jwt()->>''sub'')::uuid';
      grant usage on schema auth to anon,authenticated;
      create function public.current_club_id() returns text language sql as 'select auth.jwt()->>''club_id''';
      create table clubs(id text primary key,status text,president_email text);
      create table members(id bigint primary key,club_id text,email text,is_test_account boolean default false);
      create table excom_appointments(club_id text,email text,role text);
      create table meetings(id bigint primary key,club_id text);
      insert into clubs values('a','approved','president@example.com'),('b','approved','other@example.com');
      insert into members values(1,'a','alice@example.com',false),(2,'a','bob@example.com',false),(3,'b','carol@example.com',false),(4,'a','test@example.com',true);
      insert into excom_appointments values('a','vpe@example.com','VPE'),('a','assistant@example.com','Ass. VPE'),('a','vppr@example.com','VPPR');
      insert into meetings values(1,'a'),(2,'b');
    `)
    const sql = await readFile(new URL('../supabase/pathways-tracking.sql', import.meta.url), 'utf8')
    await db.exec(sql)
    await db.exec(sql) // Reapplying the migration must preserve tables and permissions.
    async function identity(email, club = 'a', role = 'authenticated') {
      await db.exec('reset role')
      await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({sub:'00000000-0000-4000-8000-000000000001',email,club_id:club})])
      await db.exec(`set role ${role}`)
    }
    const addPath = (member = 1, club = 'a') => db.query(`insert into pathway_enrollments(club_id,member_id,path_name)
      values($1,$2,'Presentation Mastery') returning *`, [club,member])
    await identity('vpe@example.com')
    const path = (await addPath()).rows[0]
    assert.equal(path.updated_by, 'vpe@example.com')
    await assert.rejects(addPath(3), /real member/)
    await assert.rejects(addPath(3,'b'), /Only your club/)
    await assert.rejects(addPath(4), /real member/)
    const path2 = (await addPath(2)).rows[0]
    const addEntry = (meeting = 1, member = 1, parent = path.id) => db.query(`insert into pathway_entries
      (enrollment_id,club_id,member_id,level,kind,title,status,completed_on,meeting_id)
      values($1,'a',$2,1,'speech','My ice breaker','completed','2026-01-01',$3) returning *`, [parent,member,meeting])
    const entry = (await addEntry()).rows[0]
    await assert.rejects(addEntry(2), /meeting from this club/)
    await assert.rejects(addEntry(1,2), /path and member/)
    await assert.rejects(db.query("update pathway_enrollments set current_level=6 where id=$1",[path.id]), /check constraint/)
    await assert.rejects(db.query("update pathway_enrollments set status='completed' where id=$1",[path.id]), /check constraint/)
    await assert.rejects(db.query("update pathway_entries set completed_on='2999-01-01' where id=$1",[entry.id]), /future/)
    await assert.rejects(db.query('update pathway_entries set enrollment_id=$1 where id=$2',[path2.id,entry.id]), /cannot be moved/)
    await assert.rejects(db.query('update pathway_enrollments set member_id=2 where id=$1',[path.id]), /cannot be transferred/)
    await db.query("update pathway_entries set notes='Helpful feedback',updated_by='spoofed@example.com' where id=$1",[entry.id])
    const audits = (await db.query('select * from pathway_history order by changed_at')).rows
    assert.equal(audits.length,4)
    assert.equal(audits[3].changed_by,'vpe@example.com')
    assert.equal(audits[3].before_record.notes,'')
    assert.equal(audits[3].after_record.notes,'Helpful feedback')
    // Optimistic concurrency must not overwrite someone else's newer edit.
    assert.equal((await db.query("update pathway_entries set notes='Stale' where id=$1 and updated_at=$2 returning id",[entry.id,entry.updated_at])).rows.length,0)
    await identity('alice@example.com')
    assert.equal((await db.query('select * from pathway_enrollments')).rows.length,1)
    assert.equal((await db.query('select * from pathway_entries')).rows.length,1)
    assert.equal((await db.query('select * from pathway_history')).rows.length,3)
    await assert.rejects(addPath(), /Only your club|row-level security/)
    assert.equal((await db.query("update pathway_enrollments set notes='Unauthorized' returning id")).rows.length,0)
    await assert.rejects(db.exec('delete from pathway_entries'),/permission denied/)
    await assert.rejects(db.exec("update pathway_history set changed_by='spoof'"),/permission denied/)
    await identity('vppr@example.com')
    assert.equal((await db.query('select * from pathway_enrollments')).rows.length,0)
    await assert.rejects(addPath(),/Only your club|row-level security/)
    await identity('other@example.com','b')
    assert.equal((await db.query('select * from pathway_enrollments')).rows.length,0)
    assert.equal((await db.query('select * from pathway_history')).rows.length,0)
    await assert.rejects(addPath(),/Only your club|row-level security/)
    await identity('assistant@example.com')
    assert.equal((await db.query('select * from pathway_enrollments')).rows.length,2)
    await identity('president@example.com')
    await db.query("update pathway_enrollments set current_level=5,status='completed',completed_on='2026-01-02' where id=$1",[path.id])
    assert.equal((await db.query('select status from pathway_enrollments where id=$1',[path.id])).rows[0].status,'completed')
    await identity('nobody@example.com','a','anon')
    await assert.rejects(db.exec('select * from pathway_enrollments'),/permission denied/)
    await assert.rejects(db.exec('select * from pathway_history'),/permission denied/)
  } finally { await db.close() }
})
