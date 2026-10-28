import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('Role agenda details enforce assignment ownership and preserve unrelated agenda fields', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon; create role authenticated; create schema auth;
      create function auth.jwt() returns jsonb language sql as 'select current_setting(''request.jwt.claims'',true)::jsonb';
      create function auth.uid() returns uuid language sql as 'select (auth.jwt()->>''sub'')::uuid';
      grant usage on schema auth to authenticated,anon;
      create function current_club_id() returns text language sql as 'select auth.jwt()->>''club_id''';
      create table clubs(id text primary key,status text);
      create table meetings(id bigint primary key,club_id text,cancelled boolean default false,theme text);
      create table meeting_role_assignments(meeting_id bigint,role_id text,status text,taken_by_email text);
      create table agendas(id bigint generated always as identity,meeting_id bigint unique,club_id text,date_label text,
        theme text,word_of_day text,meaning text,venue text,others text,overall_start_time text,overall_end_time text,
        items jsonb default '[]',updated_at timestamptz default now(),sent_at timestamptz,sent_snapshot jsonb);
      alter table agendas enable row level security;
      create policy reads on agendas for select to authenticated using(club_id=current_club_id());
      create policy writes on agendas for all to authenticated using(club_id=current_club_id() and auth.jwt()->>'email'='vpe@example.com');
      grant select,insert,update on agendas to authenticated;
      grant usage,select on all sequences in schema public to authenticated;
      insert into clubs values('a','approved'),('b','approved');
      insert into meetings(id,club_id) values(1,'a'),(2,'b'),(3,'a');
      insert into meeting_role_assignments values(1,'tmod','auto','tmod@example.com'),(1,'grammarian','taken','grammar@example.com'),(2,'tmod','taken','tmod@example.com');
    `)
    const sql = await readFile(new URL('../supabase/role-agenda-details.sql', import.meta.url),'utf8')
    await db.exec(sql); await db.exec(sql)
    async function identity(email, role='authenticated') {
      await db.exec('reset role')
      await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:'00000000-0000-4000-8000-000000000001',email,club_id:'a'})])
      await db.exec(`set role ${role}`)
    }
    const save = (role,value,meaning='',meeting=1) => db.query('select save_role_agenda_details($1,$2,$3,$4)',[meeting,role,value,meaning])
    await identity('tmod@example.com','anon')
    await assert.rejects(save('tmod','Theme'),/permission denied/)
    await identity('tmod@example.com')
    await save('tmod','Growth') // Works before VPE generates the agenda.
    await assert.rejects(save('grammarian','Word','Meaning'),/no longer assigned/)
    await assert.rejects(save('tmod','Other','',2),/unavailable/)
    await assert.rejects(save('tmod','  '),/Enter a theme/)
    await identity('grammar@example.com')
    await save('grammarian','Resilience','The ability to recover')
    await assert.rejects(save('tmod','Changed'),/no longer assigned/)
    await assert.rejects(save('grammarian','Word',''),/Enter a theme/)
    let row = (await db.query('select * from agendas')).rows[0]
    assert.equal(row.theme,'Growth'); assert.equal(row.word_of_day,'Resilience')
    const original = {theme:row.theme,wordOfDay:row.word_of_day,meaning:row.meaning}
    const draft = {...row,items:[{segment:'Welcome'}],venue:'Hall'}
    await identity('tmod@example.com')
    await save('tmod','New theme')
    await assert.rejects(db.query('select save_agenda_draft($1,$2)',[draft,original]),/row-level security/)
    await identity('vpe@example.com')
    await db.query('select save_agenda_draft($1,$2)',[draft,original])
    row = (await db.query('select * from agendas')).rows[0]
    assert.equal(row.theme,'New theme'); assert.equal(row.venue,'Hall'); assert.equal(row.word_of_day,'Resilience')
    await db.query('select save_agenda_draft($1,$2)',[{...draft,theme:'VPE theme'},original])
    assert.equal((await db.query('select theme from agendas')).rows[0].theme,'VPE theme')
    await db.exec('reset role')
    await db.exec("update meeting_role_assignments set taken_by_email='replacement@example.com' where role_id='tmod'")
    await identity('tmod@example.com')
    await assert.rejects(save('tmod','Old owner'),/no longer assigned/)
    await db.exec('reset role'); await db.exec('update meetings set cancelled=true where id=1')
    await identity('grammar@example.com')
    await assert.rejects(save('grammarian','Word','Meaning'),/unavailable/)
  } finally { await db.close() }
})
