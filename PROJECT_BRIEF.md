==============================================================
TOASTY — CLAUDE CODE MASTER PROMPT
==============================================================
This is the original project brief given at the start of this
project. It is saved here so any future Claude Code session
(even a brand-new chat with no history) can read it directly
instead of depending on conversation memory.
==============================================================

# Project: Toasty
A web app for Toastmasters clubs that automates all manual meeting
work — role assignment, agenda generation, attendance, voting polls,
MOM, renewals, and more. Built for both ExCom efficiency and member
convenience, with a public marketing layer for club visibility.

---

## Tech Stack
- Frontend: React + Tailwind CSS
- Auth: Google OAuth via Supabase Auth (college email domain restricted)
- Backend: FastAPI or Node/Express (REST API)
- Database: PostgreSQL via Supabase
- Notifications: Email via SendGrid free tier
- Deployment: Vercel (frontend), Railway or Render (backend)

---

## Design System
- App name: Toasty
- Primary color: #c45c00 (warm orange)
- Background: #fff8f0 (cream)
- Accent: #e0a060 (light orange)
- Text: #1a1a1a (near black)
- Font: Inter or Poppins
- Style: Warm, friendly, approachable. Mobile-first. Clean cards,
  rounded corners, soft shadows. Not corporate, not childish.
- Every page must be fully responsive (mobile + desktop)

---

## App Structure

### PUBLIC PAGES (no login required)

**Page 1: Global Landing Page**
- Hero section: What is Toastmasters International?
  - TM International logo, tagline, brief history
  - Key achievements: number of clubs worldwide, recent
    World Championship of Public Speaking winners
  - Photos (use placeholder images)
- Club Selection:
  - A search/dropdown: "Find your club" — user types or selects
    their club name (e.g. MAHE Bengaluru Toastmasters Club)
  - After selecting: "Go to Club Page" button
- Footer: About Toasty, Contact, Social links

**Page 2: Club Home Page** (after club is selected)
- Club name as hero: "MAHE Bengaluru Toastmasters Club"
- Club photos gallery (carousel or grid, placeholder images)
- Club history + founding story (placeholder text)
- Club achievements (Distinguished Club status, milestones)
- Two CTAs:
  - "Login" — for existing members
  - "I'm interested in joining" — opens a simple form:
    name, email, phone (optional), message to the club.
    On submit: stored + notifies VPM and President.
- Mentor section preview (link to full mentor page)
- Past ExCom section preview (link to full past ExCom page)

---

### AUTH PAGES

**Sign Up Page**
- "Sign in with Google" button (Google OAuth)
- On first login: account created with status = "pending"
- User sees: "Your account is pending approval by the VPM.
  You will be notified once approved."

**Login Page**
- "Sign in with Google" button
- If account is pending: show pending message
- If account is approved: redirect to Member Dashboard

---

### MEMBER PAGES (visible after login, role = member)

**Member Dashboard**
- Welcome: "Hi [Name]!"
- My Points this month: [X points] — with a small progress bar
  showing rank vs other members
- Upcoming Meeting card:
  - Date: Next Thursday, 5:15pm
  - My Role: [role name] or "No role selected yet"
  - Accept / Decline buttons (if auto-assigned)
  - "Select a Role" button (if no role yet)
- Notifications panel: list of recent notifications
  (role assigned, agenda updated, poll released, etc.)
- Quick links: Agenda, Photo Memories, Mentor Page

**Role Selection Page**
- Shows 3 upcoming meetings in tabs (Meeting 1, Meeting 2, Meeting 3)
- For each meeting: list of all Toastmasters roles with:
  - Role name
  - Description (1 line — e.g. "Timer: tracks speech durations")
  - Status: Open / Taken (by whom) / Auto-assigned
  - "Select this Role" button (only for Open roles)
- If member already has a role: shows their role with a
  "Decline Role" button
- Decline flow: dropdown reason (Emergency / Scheduling conflict
  / Health / Other) + confirm button
- Decline penalty warning shown based on timing:
  - 48+ hrs before: "No points will be deducted"
  - 24-48 hrs: "You will lose 2 points"
  - Under 24 hrs: "You will lose 4 points"
  - No-show: "6 points will be deducted (marked by Secretary)"

**Agenda Page (Member view)**
- Current meeting's finalized agenda
- Shows: Time slot, Role, Member Name for each agenda item
- Read-only for regular members
- Shows "Last updated: [timestamp]" at top
- If agenda was updated after first send: shows
  "Agenda Updated — [what changed]" banner

**Voting Poll Page (Member view — mobile-first)**
- Only visible after SAA releases the poll during meeting
- Four voting categories, one per card:
  1. Best Speaker — radio buttons with speaker names
  2. Best Evaluator — radio buttons with evaluator names
  3. Best TAGL (Timer/Ah-Counter/Grammarian/Listener) — radio buttons
  4. Best Main Role-Taker (GE/TMOD/Table Topics Master/PO) — radio buttons
  5. Best Table Topics Speaker — radio buttons (added live by SAA)
- "Submit Vote" button
- After submit: "Thank you for voting!" confirmation
- Design: very clean, large tap targets, one category visible
  at a time (step/wizard style on mobile)

**Photo Memories Page**
- Grid of past meetings, each as a card:
  - Meeting date + theme
  - Group photo thumbnail
  - "View Photos" button → opens full gallery for that meeting
  - Certificates section below photos
- Filter by meeting date

**Past ExCom Page**
- Cards for every past ExCom member:
  - Photo (placeholder avatar)
  - Name
  - Department & Branch (e.g. Information Technology, MAHE)
  - Role held (e.g. President, VPE)
  - Year of study at time of service
  - Key achievements / club contributions (2-3 lines)
  - Phone number + email (visible to logged-in members only)
- Previous ExCom (the one in the data below):
  President: Nehal, VPE: Isha, Ass.VPE: Advik,
  Ass.VPE/Treasurer: Chozhan, VPPR: Swetha,
  Ass.VPPR: Ahana, Ass.VPPR: Ayman, VPM: Nick,
  Secretary: Parth, SAA: Venkat

**Mentor Page**
- Cards for each mentor:
  - Photo (placeholder)
  - Name, Phone, Email
  - Toastmasters experience (years, clubs)
  - Their Toastmasters club name
  - Professional designation / organization
  - "Contact Mentor" button (opens email or phone)

**Member Profile Page**
- My photo, name, email
- My Toastmasters role history (table: meeting date, role taken,
  points earned)
- My points breakdown: total, this month, by category
- Renewal status: "Fee paid: [term] to [term]" or "Renewal Pending"
- "Payment Done" button — for when member has paid on the
  official TM website and wants to notify the Treasurer
- My mentor: [mentor name and contact]

**Feedback Page**
- Simple form: Subject + Message text area + Submit
- Anonymous submission (name not shown to President)
- After submit: "Your feedback has been submitted."
- Member can see their own past submissions but not others'

---

### EXCOM PAGES (visible only to ExCom members)

**ExCom Dashboard**
- Overview cards:
  - Upcoming meeting: date, roles filled vs total
  - Pending renewals: count
  - Pending new member approvals: count (VPM)
  - Unread feedback: count (President only)
- Recent activity feed (timestamped):
  - "[Name] accepted role [X] for meeting on [date]"
  - "[Name] declined role [X]"
  - "[Name] submitted Payment Done"
  - "Agenda updated by [VPE name]"
- Quick action buttons per role (only visible to that role):
  - VPE: Edit Agenda, View Role Status
  - Secretary: Submit Attendance, Submit MOM
  - SAA: Open Poll Editor
  - VPM: View Pending Approvals
  - Treasurer: View Pending Renewals
  - VPPR: Upload Photos

**Role Management Page (VPE + Ass. VPE)**
- Current meeting's role board:
  - Table: Role | Assigned To | Status (Self-selected /
    Auto-assigned / Pending / Confirmed / Declined)
  - VPE can manually override any assignment
  - "Trigger Auto-Assign Now" button (runs the algorithm)
- Notifications log on right side:
  - Every accept/decline/assignment with timestamp
- Upcoming meetings tabs (3 meetings ahead)
- Algorithm parameters shown (read-only for now):
  Attendance weight, role recency weight, frequency weight,
  projects completed weight

**Agenda Editor (VPE + Ass. VPE)**
- Full agenda for current meeting — editable table:
  Time slot | Role | Assigned Member | Notes
- "Auto-Generate Agenda" button (pulls from confirmed roles)
- "Send to Members" button (broadcasts to all members)
- After send: any further edit shows a diff of what changed
  and auto-notifies members
- Last auto-generated: [timestamp]
- Last sent to members: [timestamp]
- Edit history log at bottom (who changed what, when)

**Attendance Page (Secretary)**
- Meeting date header
- Simple list: member name + tick checkbox for Present/Absent
- "Did the meeting start on time?" toggle (Yes/No)
  — If Yes: system auto-awards SAA their on-time points
- Submit button
- Deadline shown: "Due by Friday 8pm"
- Status: Submitted / Pending

**MOM Page (Secretary)**
- Pre-formatted template:
  - Meeting Date, Theme, Location
  - Presiding Officer, TMOD, GE
  - Speakers section: Speaker name | Project | Comments
  - Evaluators section: Evaluator name | Speaker evaluated | Comments
  - Table Topics section: TT Master | TT Speakers | Comments
  - TAGL section: Timer | AC | Grammarian | Listener | Comments
  - General Evaluator comments
  - Awards given
  - Action items
  - Meeting start time (auto-filled from attendance page)
  - Meeting end time
- Submit button
- Deadline shown: "Due by Friday 8pm"

**Poll Editor (SAA — mobile-first)**
- Four category cards, each with:
  - Category name (Best Speaker, Best Evaluator, etc.)
  - List of role-takers (pre-filled from agenda, editable)
  - "Add name" button (for Table Topics speakers added live)
  - "Remove" button per name
- Big orange "Release Poll to Members" button at bottom
- After release: shows live vote count per person (visible
  to SAA only while poll is open)
- "Close Poll" button
- Results summary after close

**New Member Approvals (VPM)**
- List of pending signup requests:
  - Name, Email, Date requested
  - "Approve" / "Reject" buttons
- Approved members list
- Referral points section:
  - Dropdown: select member who brought a guest
  - "Guest attended" button (+6 points to that member)
  - "Guest converted to member" button (+8 to member, +10 to VPM)

**Renewal Management (Treasurer)**
- List of members with renewal status:
  - Name | Status (Paid / Pending / Overdue) | Date claimed |
    UTR reference (if member submitted one)
- "Confirm Renewal" button per member →
  Member profile updates to "Fee paid: [term] to [term]"
- Points: +1 to Treasurer per confirmed renewal (auto)
- Filter by status

**Photo Upload (VPPR + Ass. VPPR)**
- Select meeting date from dropdown
- Upload group photos (drag and drop or file picker)
- Upload certificates (separate section)
- Preview before submit
- After upload: photos appear in Photo Memories page

**Feedback Inbox (President only)**
- List of all anonymous feedback submissions
- Unread highlighted
- President can mark as resolved
- President can write a private note per item (not shown to member)

---

## Notification System
Every user has a Notifications bell icon in the navbar.
Notifications for members:
- Role assigned to you
- Role auto-assigned to you (with accept/decline CTA)
- Agenda published / updated
- Poll released (vote now!)
- Renewal confirmed
- Account approved by VPM

Notifications for ExCom (in addition to above):
- VPE: every role selection, decline, auto-assignment,
  agenda update, unfilled role 48hrs before meeting
- VPM: new signup request pending approval
- Secretary: reminder at 8pm Thursday to submit MOM + attendance
- Treasurer: member clicked "Payment Done"
- SAA: meeting start time confirmed by Secretary

---

## Weekly Automation Timeline (for reference — backend triggers)
- Thursday 8pm: notify all members to select roles
- Saturday 9am: auto-assign unfilled roles
- Sunday 10am: auto-generate agenda first version
- Wednesday 9am: VPE manually sends agenda to members
- Thursday 5:15pm: SAA opens poll editor during meeting
- Thursday 8pm: Secretary notified to submit attendance + MOM
- Friday 8pm: MOM + attendance deadline

---

## Role-Based Access Control
- member: can see their dashboard, select roles, view agenda,
  vote in poll, view photos, view past ExCom, view mentors,
  manage their profile, submit feedback
- excom: everything above + their specific ExCom admin pages
  (only the pages relevant to their ExCom role)
- president: everything, including feedback inbox
- Note: one user can hold multiple ExCom roles simultaneously
  (e.g. Chozhan was both Ass. VPE and Treasurer)
  — they get combined permissions of all their roles

---

## Points System (for UI display — backend calculates)

### Member Points (monthly, resets each month)
Role completion:
- TMOD / GE / Table Topics Master / Presiding Officer: +10
- Prepared Speaker: +9
- Individual Evaluator: +7
- Table Topics Speaker: +6
- TAGL (Timer/AC/Grammarian/Listener): +5
Attendance:
- Present at meeting: +4
- Declined 48+ hrs before: 0
- Declined 24-48 hrs before: -2
- Declined under 24 hrs: -4
- No-show: -6
Recognition:
- Won voting award: +4
- Brought a guest: +5
- Guest converted to member: +8
- Pathways project completed: +8
Rules: floor of 0 per month, resets each month,
ExCom members excluded from member leaderboard

### ExCom Points (per term, resets each term)
President: meeting on schedule +8, task completed +4,
  new member joins +5, meeting cancelled without notice -8
VPE/Ass.VPE: all roles filled before auto-assign +6,
  agenda on time +4, clean agenda (no edits needed) +5,
  role unfilled after auto-assign -3
VPM: account approved within 24hrs +1, guest attends +6,
  guest converts +10
VPPR/Ass.VPPR: photos uploaded before deadline +5,
  certificates before deadline +5, after deadline -3
Secretary: MOM + attendance both on time +8,
  only one on time +3, both missed -6
Treasurer: renewal confirmed per member +1
SAA: meeting starts on time +8,
  meeting starts 15+ mins late -5,
  all voting closed before end of meeting +3
Rules: floor of 0 per month within term,
  resets each term, Best ExCom Member award at end of term

---

## Current ExCom (for seeding/placeholder data)
President: Sarvajit
VPE: Faizaan
Ass. VPE: Aman
Ass. VPE: Anish
VPPR: Ahana
Ass. VPPR: Ruhaani
Ass. VPPR: Swetha
VPM: Nick
Secretary: Chozhan
Treasurer: Advik
SAA: Durva

## Previous ExCom (for Past ExCom page)
President: Nehal
VPE: Isha
Ass. VPE: Advik
Ass. VPE / Treasurer: Chozhan
VPPR: Swetha
Ass. VPPR: Ahana
Ass. VPPR: Ayman
VPM: Nick
Secretary: Parth
SAA: Venkat

---

## Build Instructions for Claude Code

Build this project page by page in this order:
1. Global Landing Page (public)
2. Club Home Page (public)
3. Sign Up / Login pages
4. Member Dashboard
5. Role Selection Page
6. Agenda Page (member view)
7. Voting Poll Page (mobile-first, SAA + member views)
8. Attendance Page (Secretary view)
9. MOM Page (Secretary view)
10. Photo Memories Page
11. Past ExCom Page
12. Mentor Page
13. Member Profile Page
14. Feedback Page (member submit + President inbox)
15. ExCom Dashboard
16. Role Management Page (VPE)
17. Agenda Editor (VPE)
18. Poll Editor (SAA)
19. New Member Approvals (VPM)
20. Renewal Management (Treasurer)
21. Photo Upload (VPPR)
22. Notifications system (bell icon + panel)

Build frontend only first with hardcoded/placeholder data.
No backend calls yet — use mock data and useState.
Every page must use the Toasty design system defined above.
After all pages are built and approved, we will wire up
the backend and replace mock data with real API calls.

==============================================================


==============================================================
IMPORTANT ADDENDUM — rules established during the build
(these override/refine the base spec above; read this section
before continuing work)
==============================================================

**No fabricated data about real people or the real club.**
The user gave real names for Past/Current ExCom. Do NOT invent
departments, years of study, bios, phone numbers, or emails for
those real named people — only use fields actually supplied
(name + role). Do NOT invent specific "facts" about the real
club (founding year, achievement stats) — use clearly-labeled
generic placeholder text instead (see `src/data/clubDetails.js`
`isPlaceholder` pattern, shown as a "Sample content" badge in
the UI). Never use real stock/stranger photos (e.g. pravatar.cc)
labeled with any name — use the generated-initials `Avatar`
component instead. Entirely fictional supporting data (e.g. a
generic member roster used across Roles/Agenda/Poll/Attendance/
MOM mock data) is fine as long as it doesn't reuse any of the
real names above — reuse the existing pool of generic first
names already established across the mock data files (Riya,
Kabir, Ananya, Dev, Meera, Neha, Vikram, Priyanka, Rohan, Aarav,
Diya, Simran, Arjun, Tanvi) rather than inventing new realistic
full names each time.

**Mock auth / role system (no backend yet):**
- `src/lib/mockAuth.js` — localStorage-backed mock account
  `{ name, email, status: 'pending'|'approved', excomRoles: [] }`.
- `src/components/RequireApprovedAccount.jsx` — route guard,
  redirects to `/login` unless status is `approved`.
- `src/components/RequireExcomRole.jsx` — route guard, takes a
  `role` prop (e.g. `"Secretary"`), redirects to `/dashboard`
  if the account doesn't hold that role (or `"President"`,
  which is treated as having every role).
- Since there's no real backend to assign ExCom roles, the
  account dropdown menu (in `MemberLayout.jsx`) has a labeled
  "Prototype: view as" selector that self-assigns any ExCom
  role for testing/demo purposes only. This is explicitly
  throwaway scaffolding — when the real backend exists, this
  selector must be deleted and roles must come from real admin-
  assigned data, never member self-selection.
- The nav bar in `MemberLayout.jsx` conditionally shows extra
  links (Attendance, MOM, etc.) based on `hasExcomRole(role)` —
  follow this pattern for every new ExCom page so it's actually
  reachable via a real link, not just a typed URL.

**Persistence pattern for "submitted" mock actions:**
Several pages simulate a real submit-once action (voting poll,
MOM). These persist a flag/record to `localStorage` (see
`src/lib/mockPollVotes.js`, `src/lib/mockMOMStore.js`) so
revisiting the page after submitting shows the already-submitted
state instead of silently letting the user redo the action.
Apply this same pattern to any future page with a one-time
submit action (e.g. Attendance, Renewal confirmation, New Member
Approval) — this was flagged as a bug once already (poll allowed
re-voting) and fixed reactively; do it proactively going forward.

**Member ↔ ExCom data linkage:**
Where a member-facing page and an ExCom page cover the same
underlying data, wire them together for real instead of using
two disconnected mock datasets — e.g. `MinutesPage.jsx` (member,
at `/minutes`) reads the same localStorage record that
`MOMPage.jsx` (Secretary, at `/mom`) writes on submit, via
`src/lib/mockMOMStore.js`. This wasn't in the original page
list — it was added because the spec assumes members can see
meeting outcomes the ExCom produces, but only explicitly listed
a Secretary-facing MOM page. Consider this pattern for other
ExCom→member handoffs as they come up (e.g. Agenda Editor →
Agenda member view is a similar pair, already connected in
spirit since both will read/write the same mock agenda data).

**lucide-react version note:** the installed version (1.x) is
newer than typical docs suggest and has DROPPED brand icons
(Instagram, Linkedin, Twitter, Facebook, etc.) entirely. Verify
any icon name actually exists in the installed package before
using it — see pattern of `node -e "console.log(typeof require('lucide-react').IconName)"`
used throughout this build — rather than assuming standard
lucide icon names are all present.

**Dev workflow used throughout:**
- Dev server: `npm run dev` (Vite, default port 5173).
- Visual verification: Playwright (`npm install -D playwright`
  once, then a throwaway `screenshot.mjs` script per check,
  deleted after use) since there's no `chromium-cli` in this
  environment. Always check `console --errors` equivalent
  (page.on('console')/('pageerror')) alongside screenshots.
- No git repository has been initialized yet in this project.
==============================================================
