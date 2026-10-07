# ExCom deductions and public poll QR codes

Apply `excom-deductions-and-public-polls.sql` before deploying this frontend.
The migration is transactional and does not remove point events or votes.

- President deductions use `deduct_excom_points` with a retry-safe request UUID.
  The server verifies the President and target appointment belong to the same
  approved club. Negative events affect the current month's existing totals;
  the reason and President email appear in points history. An audit row records
  the authenticated actor. Prior monthly awards are not rewritten.
- Each poll gets an unguessable share token. QR images are generated locally
  using `qrcode` (https://github.com/soldair/node-qrcode); no external QR service
  receives the poll URL. The SAA sees the QR after releasing the poll.
- `/vote/:token` is public. Visitors supply name/email and choose candidates.
  The RPC validates the current ballot, club, cancellation/open state and
  duplicate email. Existing signed-in votes and QR votes use `poll_votes`, so
  the editor's existing results include both. Emails are self-declared, not
  verified identities; the uniqueness check is not proof of one person/one vote.
- A vote-insert trigger also rejects signed-in duplicate and closed-poll votes.
  No anonymous table access to ballots or personal voting details is granted.

Local checks: `npm test`, `npm run lint`, `npm run build`. Database tests use
synthetic records in an isolated PGlite instance; they do not contact Supabase.
Verify actual deployed permissions and scan the QR on a phone in preview before
production rollout. A preview connected to production Supabase writes real votes.

Mentor editing uses the existing VPPR/President policies. The new button exposes
the existing fields, and photo replacement retains the old photo until save
succeeds. Inactive roster members display as Unpaid without modifying historical
payment records; renewing them restores Paid using the existing save flow.
