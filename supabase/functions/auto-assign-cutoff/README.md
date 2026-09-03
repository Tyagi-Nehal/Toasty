# auto-assign-cutoff

Real cron-triggered replacement for the client-side "run auto-assign
opportunistically when a VPE/President's page loads" logic in
`src/lib/mockRolesStore.js`. Deploy + schedule steps — run these yourself
against your real Supabase project (`ymfvktsorlbzcctyyokf`), the CLI
needs to be logged into your account.

## 1. Install & log in to the Supabase CLI (one-time)

```
npm install -g supabase
supabase login
supabase link --project-ref ymfvktsorlbzcctyyokf
```

## 2. Set the secrets this function needs

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by
Supabase for every deployed function — you don't set those yourself.
You only need to set the optional defense-in-depth secret:

```
supabase secrets set CRON_SECRET=<make up a random long string>
```

## 3. Deploy the function

```
supabase functions deploy auto-assign-cutoff
```

## 4. Schedule it

Easiest: Supabase Dashboard → your project → **Integrations → Cron Jobs**
→ New cron job → pick this function, schedule e.g. every hour
(`0 * * * *`), and set the `x-cron-secret` header to the same value from
step 2. The function is idempotent-safe to run more often than the
"real" Saturday 9 AM cutoff — it checks `pastCutoff` + a 14-day recency
window + "still has open roles" every time, so running it hourly (or
even more often) just means it fires *close to* the real cutoff instead
of at 9:00:00 exactly, without ever double-assigning a meeting that's
already filled.

Alternative (raw SQL, if you'd rather not use the dashboard UI): enable
the `pg_cron` and `pg_net` extensions, then run this in the SQL Editor
(replace the secret placeholder with your real one from step 2 — don't
commit the real value anywhere):

```sql
select cron.schedule(
  'auto-assign-cutoff',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://ymfvktsorlbzcctyyokf.supabase.co/functions/v1/auto-assign-cutoff',
    headers := jsonb_build_object('x-cron-secret', '<your CRON_SECRET value>')
  );
  $$
);
```

## What to do with the old client-side trigger

Leave `runDueAutoAssignments`/the check inside `getMeetings()` in
`mockRolesStore.js` in place for now — it's a safe no-op once this cron
is running (a meeting the cron already filled just has no open roles
left, so the client-side check finds nothing to do). Only remove it
once you've confirmed the cron job has actually fired at least once
against a real meeting.
