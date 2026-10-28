# Word editor

The private editor lives at `/editor`. Review approves words into a FIFO queue;
only **Save assignments** publishes dates. Existing date-keyed answers stay in
place. All game dates use UTC, and the editor cannot change today or the past.

## Settings and first start

Use Node 22 for the frontend's Vercel adapter. Run the existing backend and frontend
as usual; no new service or database is required. Both must reach the same Redis
used by the game. Keep Redis private and persistence enabled.

Backend private settings:

- `ADMIN_API_KEY`: a strong server-to-server secret.
- `EDITOR_PASSWORD_HASH`: the salted scrypt result generated below.
- `EDITOR_ORIGIN`: the exact frontend origin, including scheme and development
  port, without a trailing slash. Production must use HTTPS.
- `EDITOR_TRUST_CLIENT_IP`: default `false`. Initially the login limit is shared
  by the owner account (five attempts per 15 minutes). After verifying the
  frontend hosting platform's trusted proxy/client-address configuration, set
  this to `true` for five attempts per trusted IP and 30 overall per 15 minutes.
  Successful attempts also count, conservatively bounding password hashing work.
- Existing Redis connection settings, including `REDIS_USER` if required.

Frontend private settings:

- `USEGLE_API_HOST`: the backend origin.
- `ADMIN_API_KEY`: the same server secret. Never expose it using a `PUBLIC_` name.
- Keep the existing `PUBLIC_USEGLE_API_HOST` for the public game.

Generate a password hash locally from the repository root (zsh):

```sh
read -s 'editor_password?Owner password: '
printf '%s' "$editor_password" | node backend/scripts/hash-editor-password.cjs
unset editor_password
```

Copy only the resulting `salt:hash` into the backend's private setting. Do not
commit passwords, hashes, keys, or session records. Restart all backend instances
when rotating this setting; sessions created with the previous hash immediately
fail their next check on updated instances. Logout revokes the current session.
Sessions have an absolute 30-day lifetime and do not refresh on use.

Cookies always use Secure, HttpOnly, SameSite=Strict and a host-only `__Host-`
name. Use HTTPS for phone testing. Loopback localhost is supported by browsers
that treat it as a secure context; a plain HTTP LAN address is insufficient.
For adapter-node deployments, configure its origin/proxy settings and trusted
client-address header explicitly; do not trust arbitrary forwarded headers.

## Workflow

1. Open `/editor`, sign in, and approve/reject dictionary cards. Search accepts an
   exact unreviewed word. Repeated letters are allowed. Undo lasts ten minutes
   and works only before another editor mutation or the next UTC day.
2. Open Queue to expand meanings, move a word to the front, or reject it.
   Decisions persist; scheduling does not return a word to Review.
3. Open Schedule and choose **Fill next 30 days — preview**. Check the exact dates
   and shortage count. Swap any proposal using another queued word (type its
   exact lowercase spelling if it is outside the first 50 suggestions).
4. Save the displayed assignments. A short queue produces an explicitly shown
   partial plan. To change an assigned future date, use **Change** and save that
   replacement. Approved displaced words return to the end of the queue when
   they have no other future assignment. Legacy unapproved words do not.
5. A stale edit returns a refreshed preview for review. After an uncertain network
   result, use **Recheck schedule and preview** before retrying. The schedule is
   reread; already-saved dates are never silently overwritten.

The coverage banner counts consecutive days starting tomorrow, up to one year.
A missing answer today requires operator recovery outside this editor. Past use
is not indexed, and played words do not automatically return to the queue.

## Compatibility and rollout

The old API-key-only `/api/admin/words` write/delete/status/list paths are retired.
The new `/api/admin/*` data endpoints require both the server key and owner
session. Login requires the key, password, and matching origin. Update any external
writers to use this service or disable them before rollout. Public health checks
remain answer-free. Production deployment and initial queue curation are separate
operator actions; implementation does not provision credentials or publish changes.

Before enabling the editor, confirm Redis backups and persistence with the Redis
provider. The current atomic compare-and-set implementation scans date-shaped
keys inside a short Redis script; this is suitable for this small single-owner
store. Revisit it if the shared database grows substantially. Redis Cluster is
not supported by the existing date-key model and this multi-key operation.

## Backup and restore

Back up the existing Redis database using its provider's snapshots or RDB/AOF
facilities. Include date keys and these editor keys in the **same** snapshot:

- `editor:decisions` (hash), `editor:queue` (sorted set), `editor:revision` (integer).
- `editor:session:*`, `editor:login:*`, and `editor:undo:*` are ephemeral and can be
  omitted. Restore without them to require fresh login and discard old undo links.

For restoration, stop **all** writers, restore the snapshot into an isolated Redis
instance first, inspect assignments/queue/decisions, and validate public init and
private coverage before switching the configured connection. Do not restore only
one half of queue and schedule state. Resume writers only after validation.

## Verification

`cd backend && npm test` compiles and starts its own loopback Redis process on an
unused port, with persistence disabled. It checks the actual client's address and
port before any flush; it must never target a configured application database.
Requires `redis-server` on PATH. Tests cover concurrent saves/replacements, rejected
batches, stale revisions, UTC-date mismatches, decisions/undo, normalization, session
rotation/logout/expiry, throttling, and both private credentials.

`cd frontend && npm run check && npm run build && npm test` verifies frontend types,
Vercel output and existing tests. Editor pages are no-store, excluded from analytics,
and marked noindex; no service worker caches editor responses.

Before production use, test on actual iOS and Android: log in, approve words, inspect
queue, preview/swap/save, reopen schedule, then add the editor to the home screen and
repeat login/relaunch. Also check a 320px screen, keyboard focus, long definitions,
empty/short queue, network loss, and a stale preview in two tabs. OS home-screen
cookie sharing varies and requires device verification; offline editing is unsupported.
