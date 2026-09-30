# Follow and unified Home feed

Home remains a single feed: no Discover/Following selector. MUA profile replaces the old booking shortcut with Follow; messaging, service selection, cart and post booking callbacks are retained. The Account screen links to a paginated Following list.

## Behavior

Follow state is persisted server-side and cached per signed-in user and MUA. Shared post controls and the MUA profile consume the same state. Follow/unfollow optimistically updates the status and follower count, rolls back on failure, locks duplicate requests, and invalidates the list and the signed-in user's unified feed. Unfollow requires confirmation; it removes the preference rather than excluding the artist's posts from Home. Guests are prompted to sign in. Self-follow is blocked both in the service and by the database check.

## Ranking

Recent posts (created since UTC day start minus seven days) from followed artists receive a bounded five-point addition to the existing quality score. Guests keep the original quality ordering. Other artists remain eligible and existing new-artist injection remains. The total two-post-per-artist quota and 100-candidate cutoff have been removed. At most two consecutive posts are chosen from one artist when another artist remains; deferred posts are retained. Cursor pages freeze the ranked candidates for a scroll session. See FEED_PAGINATION.md for session lifetime and deployment details.

## API and database

- GET /api/Follow/{muaId}: public profile follow status and active follower count; personalized when authenticated.
- PUT /api/Follow/{muaId}: authenticated, idempotent follow.
- DELETE /api/Follow/{muaId}: authenticated, idempotent unfollow.
- GET /api/Follow?page=1&limit=20: authenticated, paginated public MUA list.
- GET /api/Feed: existing unified feed; optional personalization via the authenticated user.

Migration: 20260930145141_AddMuaFollows. Creates only MuaFollows with foreign keys, a composite primary key, indexes and a no-self-follow constraint. PUT uses parameterized INSERT ON CONFLICT DO NOTHING to protect concurrent duplicate requests.

## Deployment and verification

Deploy the backend and apply the migration before using Follow in the app. Production startup already supports ApplyMigrations; this task does not deploy or apply changes to a live database. Migration SQL was generated offline at D:/EXE/.build-check/follow-migration.sql.

Eight frontend regression tests and three backend tests passed. Backend tests exercise persistence across contexts, repeated requests, private/unavailable artist rejection, no-self-follow metadata and unified-feed ranking/pagination. The relational fixture uses SQLite and translates an unrelated PostgreSQL interval check only in its test schema; production PostgreSQL execution and device visual QA are not verified by these tests. New-post notifications remain deferred.
