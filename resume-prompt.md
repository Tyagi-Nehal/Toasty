I'm continuing work on an existing project called Toasty at
D:\Nehal\Projects\Toasty (this is a resumed session — nothing
has been built yet in this conversation, but the codebase and
prior decisions already exist on disk).

Before doing anything else:
1. Read D:\Nehal\Projects\Toasty\PROJECT_BRIEF.md in full — it
   has the complete spec (all 22 pages, design system, points
   system, RBAC) plus an "IMPORTANT ADDENDUM" section at the
   bottom documenting conventions established during the build
   (mock auth/role-guard pattern, localStorage persistence
   pattern for one-time submits, the no-fabricated-data rule,
   etc.). Follow that addendum exactly.
2. Read src/App.jsx to see which routes point to real page
   components vs the ComingSoon stub — that tells you exactly
   which of the 22 pages are already built.
3. Start (or confirm) the dev server with `npm run dev` and
   verify it's running on localhost:5173 before doing anything
   else.

Then tell me which page is next in the build order and confirm
you're ready to continue before starting work.
