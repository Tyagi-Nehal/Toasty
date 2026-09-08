# Toasty

Toasty is a web platform for Toastmasters clubs that automates the manual
work of running weekly meetings — role assignment, agenda generation,
attendance, voting, minutes, membership renewals, and more — while giving
members a single place to see what's happening in their club.

It's built to support multiple clubs, not just one: anyone can register
their club, get their ExCom set up, and start running meetings through
Toasty.

**Live:** [toasty-pi.vercel.app](https://toasty-pi.vercel.app)

## What it does

**For members**
- Real Google sign-in, approved by the club's VPM (or pre-registered
  directly if they can't create their own account)
- Self-select an open role for the next meeting, or get auto-assigned one
  based on attendance, role recency, and rotation fairness
- View the finalized agenda, vote in the post-meeting poll, browse photo
  memories and past ExCom, and submit private feedback to the President

**For ExCom officers**
- Role-specific dashboards (VPE, VPM, VPPR, Secretary, Treasurer, SAA,
  President), each scoped to that officer's own tools via real
  permission checks — not just hidden nav links
- VPE: role board with manual override + a scheduled auto-assign that
  runs on its own, agenda editor with send/diff tracking
- Secretary: attendance and Minutes of Meeting submission
- VPM: new member approvals, referral points, member pre-registration
- Treasurer: renewal management with multi-cycle renewals
- VPPR: meeting photo/certificate uploads
- SAA: live voting poll editor
- President: ExCom appointments (direct or via application review),
  club-wide feedback inbox
- A monthly points system per officer, computed automatically from real
  actions (on-time submissions, approvals, renewals, etc.), with
  individual credit for Associate officers

## Tech stack

- **Frontend:** React 19 + Vite, Tailwind CSS
- **Backend:** Supabase (Postgres + Row Level Security + Auth) — no
  separate backend server; the frontend talks to Supabase directly, with
  RLS as the real security boundary
- **Auth:** Google OAuth via Supabase Auth
- **Scheduled jobs:** a Supabase Edge Function (Deno) on `pg_cron`/`pg_net`
  for automatic role auto-assignment
- **Deployment:** Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL/anon key
npm run dev
```

The database schema (tables, RLS policies) lives in
[`supabase/schema.sql`](supabase/schema.sql) — apply it to a Supabase
project with the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db query --linked --file supabase/schema.sql
```

`schema.sql` is written to be safely re-run any time (every statement is
`create ... if not exists` / `drop policy if exists` + recreate), so it
doubles as the running migration history for the project.

## Other scripts

```bash
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint       # oxlint
```
