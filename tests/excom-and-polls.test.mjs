import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('President deductions and QR voting enforce permissions and preserve the ledger', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create function auth.jwt() returns jsonb language sql as
        'select current_setting(''request.jwt.claims'', true)::jsonb';
      create function auth.uid() returns uuid language sql as
        'select (auth.jwt()->>''sub'')::uuid';
      grant usage on schema auth to anon, authenticated;
      create function public.current_club_id() returns text language sql as
        'select auth.jwt()->>''club_id''';
      create table clubs(id text primary key, name text, status text, president_email text);
      create table excom_appointments(id bigint primary key, club_id text, name text, email text, role text);
      create table excom_points(id bigint generated always as identity primary key,
        club_id text, email text, role text, category text, points integer, note text,
        awarded_at timestamptz default now());
      alter table excom_points enable row level security;
      grant select,insert on excom_points to authenticated;
      grant usage,select on all sequences in schema public to authenticated;
      create policy existing_select on excom_points for select to authenticated using(club_id = current_club_id());
      create policy existing_insert on excom_points for insert to authenticated with check(club_id = current_club_id());
      create table meetings(id bigint primary key, club_id text, label text, cancelled boolean default false);
      create table polls(id bigint primary key, meeting_id bigint, club_id text,
        categories jsonb, is_open boolean, released_at timestamptz);
      create table poll_votes(id bigint generated always as identity primary key,
        poll_id bigint references polls(id), club_id text, voter_email text not null,
        answers jsonb, unique(poll_id,voter_email));
      alter table polls enable row level security;
      alter table poll_votes enable row level security;
      grant select,insert on poll_votes to authenticated;
      grant usage,select on all sequences in schema public to authenticated;
      create policy signed_in_vote on poll_votes for insert to authenticated
        with check(club_id = current_club_id() and voter_email = lower(auth.jwt()->>'email'));
      insert into clubs values('a','Club A','approved','president@example.com'),('b','Club B','approved','other@example.com');
      insert into excom_appointments values(1,'a','Alice','alice@example.com','VPPR'),(2,'b','Bob','bob@example.com','SAA');
      insert into meetings values(1,'a','Meeting 1',false),(2,'b','Meeting 2',false);
      insert into polls values(1,1,'a','[{"id":"speaker","candidates":["Alice","Bob"]},{"id":"empty","candidates":[]}]',true,now()),
        (2,2,'b','[{"id":"speaker","candidates":["Carol"]}]',true,now());
    `)
    await db.exec(await readFile(new URL('../supabase/excom-deductions-and-public-polls.sql', import.meta.url), 'utf8'))
    async function identity(email, club = 'a', role = 'authenticated') {
      await db.exec('reset role')
      await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({
        sub: email === 'president@example.com' ? '00000000-0000-4000-8000-000000000001' : '00000000-0000-4000-8000-000000000002', email, club_id: club,
      })])
      await db.exec(`set role ${role}`)
    }
    const deduct = (id, points, reason, key = '10000000-0000-4000-8000-000000000001') =>
      db.query('select deduct_excom_points($1,$2,$3,$4) as id', [id, points, reason, key])
    await identity('alice@example.com')
    await assert.rejects(deduct(1, 5, 'Missed duty'), /Only the club President/)
    await identity('president@example.com')
    await assert.rejects(deduct(2, 5, 'Other club'), /your club/)
    await assert.rejects(deduct(1, 0, 'Missed duty'), /positive/)
    await assert.rejects(deduct(1, -5, 'Missed duty'), /positive/)
    await assert.rejects(deduct(1, 5, ' '), /reason/)
    const first = await deduct(1, 5, 'Missed duty')
    const retry = await deduct(1, 5, 'Missed duty')
    assert.equal(first.rows[0].id, retry.rows[0].id)
    const ledger = await db.query('select * from excom_points')
    assert.equal(ledger.rows.length, 1)
    assert.equal(ledger.rows[0].points, -5)
    assert.match(ledger.rows[0].note, /president@example.com/)
    await assert.rejects(db.exec("insert into excom_points(club_id,category,points) values('a','president_deduction',-5)"), /row-level security/)
    assert.equal((await db.query('select * from excom_point_deductions')).rows.length, 1)
    await identity('other@example.com', 'b')
    assert.equal((await db.query('select * from excom_point_deductions')).rows.length, 0)

    await db.exec('reset role')
    const { rows: tokens } = await db.query('select id,share_token from polls order by id')
    const token = tokens[0].share_token
    const vote = (email, answers = { speaker: 'Alice' }, link = token) => db.query(
      'select submit_public_poll($1,$2,$3,$4)', [link, 'Guest', email, JSON.stringify(answers)])
    await db.exec('set role anon')
    const publicPoll = (await db.query('select get_public_poll($1) as poll', [token])).rows[0].poll
    assert.equal(publicPoll.clubName, 'Club A')
    assert.equal(publicPoll.isOpen, true)
    await assert.rejects(db.exec('select * from poll_votes'), /permission denied/)
    await assert.rejects(deduct(1, 5, 'Guest deduction'), /permission denied/)
    await assert.rejects(vote('bad-email'), /valid email/)
    await assert.rejects(vote('guest@example.com', {}), /candidate changed/)
    await assert.rejects(vote('guest@example.com', { speaker: 'Not a candidate' }), /candidate changed/)
    await assert.rejects(vote('guest@example.com', { speaker: null }), /candidate changed/)
    await assert.rejects(vote('guest@example.com', { speaker: 'Alice', extra: 'Bob' }), /Invalid voting category/)
    await vote(' Guest@Example.com ')
    await assert.rejects(vote('guest@example.com'), /already voted/)
    await assert.rejects(vote('other@example.com', { speaker: 'Alice' }, tokens[1].share_token), /candidate changed/)
    await identity('guest@example.com')
    await assert.rejects(db.exec(`insert into poll_votes(poll_id,club_id,voter_email,answers)
      values(1,'a','guest@example.com','{"speaker":"Alice"}')`), /already voted/)
    await db.exec('reset role')
    const votes = (await db.query('select * from poll_votes')).rows
    assert.equal(votes.length, 1)
    assert.equal(votes[0].voter_name, 'Guest')
    assert.equal(votes[0].voter_email, 'guest@example.com')
    assert.equal(votes[0].club_id, 'a')
    await db.exec('update polls set is_open=false where id=1; set role anon')
    await assert.rejects(vote('next@example.com'), /not open/)
    await db.exec('reset role; update polls set is_open=true where id=1; update meetings set cancelled=true where id=1; set role anon')
    assert.equal((await db.query('select get_public_poll($1) as poll', [token])).rows[0].poll, null)
    await assert.rejects(vote('next@example.com'), /not open/)
  } finally { await db.close() }
})
