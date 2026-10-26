# Mobile word editor implementation plan

Status: implemented locally; setup and release checks are documented in `word-editor-runbook.md`. Production rollout and physical-device verification remain operator tasks.

## Outcome and scope

Create a private `/editor` area in the existing SvelteKit frontend for a single owner to approve dictionary words, manage an approved queue, and fill future dates from a phone. Keep Express, Redis, the dictionary file, and the current game API. No new database, separate application, or scheduled background worker is needed.

The primary workflow is: sign in once → review a few words → preview missing dates for the next 30 days → save. Approval alone never publishes a word. Scheduling always requires an explicit save.

Initial scope excludes Skip, reviewing the approved pool, historical-use tracking, repeat windows, requeueing played words, swiping, drag-and-drop, offline editing, push notifications, automatic scheduling, multiple editor accounts, and numerical word-quality scores. Add these only after using the basic workflow.

## Current code and constraints

- `frontend/src/routes/+page.svelte` and `App.svelte` own the public game. Add editor routes alongside them.
- `backend/src/services/dictionary-service.ts` loads the JSONL dictionary and exposes the accepted five-letter word set. Extend this canonical loader with definitions and part-of-speech metadata; do not create another dictionary parser.
- `backend/src/routes/admin.ts` already lists, assigns, deletes, and reports coverage for Redis date keys. Its bulk assignment accepts arbitrary nonempty words and overwrites dates. Replace that write behavior with the validated scheduling workflow below, rather than keeping competing bulk scheduling paths.
- `backend/src/middleware/auth.ts` protects admin APIs using `ADMIN_API_KEY`. Keep this credential server-only.
- `backend/src/routes/game.ts` reads `YYYY-MM-DD` keys and caches today's answer. Editor mutations must only affect future days, avoiding changes to active games.
- Game, admin, and health dates currently use UTC. Preserve that convention, display “Game dates use UTC” with a local reset-time explanation, and share the relevant date helpers. A Mongolia-time rollover would be a separate behavioral change.
- Today's missing answer already makes the game unavailable. Show a prominent coverage warning; a same-day recovery tool is outside the initial editor scope.
- The worktree includes the user's deletions of the old candidate scorer, scheduler, CLI script, and autofill endpoint. Remove the obsolete `schedule-words` package command during implementation.

## Mobile interaction

Use a compact editor shell with coverage at the top and fixed bottom navigation: Review / Queue / Schedule. Default to Review. Support 320px widths, phone safe-area insets, readable Mongolian text, 44px minimum touch targets, keyboard access, and visible focus states. Do not require hover or dragging.

### Review

Show one unreviewed candidate card with the word, dictionary meanings, and part of speech. Provide Approve and Reject, plus Undo for the last decision. Approve adds to the queue; reject excludes from suggestions persistently. Both decisions remove the word from review. Scheduling or playing an approved word does not clear its approval, so it never reappears during this first pass.

Use randomized candidate order per review session to avoid alphabetical bias; paginate server-side. Offer exact-word search within unreviewed candidates for deliberate choices. Only suggest five-letter Mongolian Cyrillic words that are also accepted by the game's canonical dictionary. Include repeated letters; do not infer quality from definition length or letter variety. When no unreviewed candidates remain, show that the first pass is complete; do not automatically recycle either pool.

Reviewing the approved pool and deciding how to reuse played words are a later iteration, after the dictionary has been sorted into approved and rejected words. Add historical-use information only when implementing that workflow.

### Queue

Show approved words awaiting scheduling with expandable definitions. Provide Move to top and Reject using a small action menu. Reject removes the word from the queue and changes its decision to rejected; do not return it to unreviewed. Undo restores the previous decision and queue state only if no subsequent mutation has made that unsafe. Use FIFO order by default and do not add arbitrary full-list sorting in v1. Add search if the queue cannot be comfortably browsed.

### Schedule

Show chronological date rows with assigned words or an Empty label. Use a coverage banner that counts consecutive future days, not the total number of scattered assignments. Load 30 days initially and offer another page for browsing.

“Fill next 30 days” means tomorrow through UTC today + 30, filling only gaps. Open a preview showing dates, proposed words, queue shortage, and existing assignments as read-only rows. Allow swapping a proposed word for another eligible queued word. No writes occur until Save schedule. If the queue is too short, show exactly how many dates can be filled and allow that explicitly shown partial plan to be saved.

For an existing future assignment, Change opens a deliberate single-date replacement preview. On success, return the previous approved word to the queue if it has no other current assignment; leave legacy words without an approval decision out of the queue; do this in the same transaction. Do not expose deletion as the normal way to change a word.

Show success, validation errors, empty states, network retry states, and stale-edit conflicts inline. Keep an unsaved preview during transient failures, but revalidate it before saving. Disable duplicate taps while requests are pending.

## Authentication and privacy

Implement a single-owner password login on the frontend server. Store a salted password hash as a private server setting and verify it with a standard password hashing implementation. Add setup instructions for generating it; never include the actual password or key in source control.

On successful login, issue a cryptographically random opaque session token in a Secure, HttpOnly, SameSite cookie with a 30-day absolute expiry. Store only its hash and expiry in Redis. Logout revokes the session. Rotating the owner password must invalidate prior sessions, using a credential version or equivalent check.

Use SvelteKit server loads/actions and a small shared server-only admin client to call Express. Forward the session cookie server-to-server for verification alongside the server-only admin key. Define dedicated Express session login/check/logout handlers: login requires the server key and verifies the owner password; check/logout require both server key and session. All editor operations require both credentials. Do not rely solely on a frontend route guard. Existing API-key-only admin access should be removed from editor data routes once the server-side bridge is in place.

Rate-limit failed logins centrally in Redis, with bounded counters by trusted client IP and an overall account limit. Verify proxy/IP behavior in deployment before trusting forwarded headers. Apply origin checks to mutations, retain SvelteKit's CSRF protection, and return `Cache-Control: no-store` for editor pages and private API responses. Future words, session tokens, passwords, and admin keys must not appear in logs, public page data, or analytics. The server-held API key must never enter a `PUBLIC_` environment variable.

Add a scoped editor web manifest and icon for Add to Home Screen. Do not add a service worker or cache private responses. Verify home-screen authentication behavior on iOS and Android; this does not promise offline support.

## Redis model and invariants

Keep current date-keyed answers unchanged. Add namespaced editor keys:

- A hash of explicit review decisions by normalized word: approved or rejected.
- A sorted set for approved queue order, with a monotonic sequence for appending and moving to the top.
- An editor revision incremented by every review, queue, or schedule mutation.
- Expiring hashed session records and login rate-limit counters.

Do not scan past schedules to seed review decisions, build last-used indexes, or enforce a repeat window. Existing date-keyed answers remain intact. Previously used legacy words without review decisions can appear during the first review pass; this is accepted scope, not a hidden historical deduplication promise. Check existing future assignments directly when approving or scheduling to prevent duplicate upcoming answers. Approval of a word already assigned to a future date records the decision without adding it to the queue.

Use one canonical scheduling service for all mutations. Update date assignments, review decisions where applicable, queue membership, and revision atomically using Redis transactions with WATCH/retry or a small readable Lua script. Validate every word against the canonical dictionary, allowed alphabet, approval, queue membership, and duplicate future assignments on the server. Successful scheduling removes the word from the queue but preserves its approval. After the scheduled day passes, nothing automatically adds it back. This prevents reuse through the editor without requiring a historical-use index.

Preview responses include the current UTC game date, editor revision, and exact proposed assignments. Save must recheck the date, revision, eligibility, and current date values atomically. A stale preview gets a conflict response and a refreshed preview; never silently overwrite, substitute words, or partially save a submitted batch. Explicit replacement also checks the previously displayed value. Retrying after a lost response reloads the schedule first, preventing duplicate assignment.

If another Redis writer exists outside this repository, migrate it to the same scheduling service or disable it before enabling the editor; revisions cannot detect out-of-band writes by themselves. Verify date values and duplicate assignments at commit time as well.

## API and code ownership

Keep handlers thin and group behavior by responsibility:

- Dictionary service: canonical normalized words, metadata, candidate pagination/search.
- Editor service: decisions, queue order, unreviewed candidate filtering, and revision.
- Schedule service: preview, atomic save, explicit replacement, shared coverage computation.
- Session service/middleware: owner credential verification, session lifecycle, login limits.
- Admin routes: request validation and HTTP responses delegating to those services.
- Frontend `$lib/server/editor/`: typed private backend client and session helpers.
- Frontend `routes/editor/`: login, protected layout, Review, Queue, and Schedule pages; extract components only where there is a clear shared responsibility.

Proposed protected operations:

- Read editor summary: consecutive coverage, first missing date, queue count.
- Read candidates/search and submit/undo decisions.
- Read queue, move a word to top, reject a queued word.
- Read bounded schedule range.
- Preview and save a gap-fill plan.
- Preview and save an explicit future-date replacement.

Use consistent validation errors and conflict responses. Bound pagination, date ranges, and request sizes. Consolidate superseded bulk writes and duplicate coverage/date logic when introducing their canonical replacements. Keep public health checks answer-free.

## Implementation sequence

1. **Domain foundation:** remove the dangling CLI command; extend the dictionary loader; centralize UTC date/coverage helpers; add review and queue storage and filter candidates by absent review decisions.
2. **Scheduling rules:** implement preview, atomic batch save, and explicit replacement; retire the old unrestricted bulk write path and route other schedule mutations through the same service.
3. **Private access:** implement password/session lifecycle, rate limits, server-only frontend API bridge, protected routes, no-store policy, and logout.
4. **Mobile editor:** build the shell, Review decisions/undo, Queue actions, and Schedule preview/save/swap flow with responsive states.
5. **Release preparation:** add home-screen metadata, setup/runbook documentation, execute acceptance checks, and populate an initial approved batch manually through the UI.

Each phase should leave one canonical implementation. Do not commit, push, deploy, alter production Redis, or provision credentials as part of this planning task. Implementation and production rollout are separate actions.

## Verification and acceptance

Use focused behavioral tests rather than duplicating implementation details. The backend currently has no test command; prefer Node's built-in test runner with TypeScript compiled for tests unless the repository gains an established alternative.

- Review decisions survive reloads, approval is idempotent, approved/rejected words never reappear after scheduling or reload, and undo handles a stale revision safely.
- Normalization, Mongolian letters, dictionary membership, invalid dates, queue membership, and duplicate future assignments are enforced server-side.
- Filling handles gaps before later assignments, insufficient queue inventory, UTC rollover, duplicate taps, and stale previews.
- Real isolated Redis integration tests prove atomicity: simultaneous saves/replacements cannot overwrite existing dates, double-consume a queued word, or leave partial assignments. Inject failure before commit and verify no mutation.
- Existing date assignments remain intact. Legacy past use does not filter review; an existing future assignment prevents duplicate queueing. Replacing a future answer updates queue state consistently, and played words are not automatically requeued.
- Unauthenticated requests cannot read future answers or mutate state. Verify cookie settings, expiry/logout/password rotation, login throttling, origin rejection, and absence of credentials in browser bundles or logs.
- At phone widths, complete login → approve → inspect queue → preview → swap → save → reopen schedule. Check keyboard/focus, long definitions, empty states, failed requests, and home-screen launch on iOS/Android.
- Run backend build and targeted tests; run frontend check/build and relevant existing tests. Confirm the public game's init, accepted guesses, UTC answer selection, and health coverage remain correct.

Done means the owner can prepare and save 30 days of reviewed words from a phone, with no script, no accidental replacement, and no new infrastructure. Document required private settings and backup/restore steps for editor state. Before rollout, verify existing Redis persistence/backups; no infrastructure replacement is assumed.
