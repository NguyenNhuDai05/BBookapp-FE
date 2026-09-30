# Complete feed with stable cursor pagination

Home and MUA community keep one feed. A five-artist/five-post dataset now yields all 25 public posts rather than only ten. There is no 100-post cutoff and no total per-artist quota.

## Ordering

Rank all eligible posts by the existing profile quality score, a bounded five-point recent-follow boost, creation time and portfolio id. Retain the two new-artist promotion slots, then interleave author queues by ranked priority. After two consecutive posts from one artist, choose the highest-ranked available alternative. Defer the blocked post rather than dropping it. If no other artist remains, continue the remaining artist's posts. This rule carries across page boundaries.

## API

GET /api/Feed/scroll?limit=10 creates a ranked snapshot and returns { items, nextCursor }. GET /api/Feed/scroll?limit=10&cursor=TOKEN resumes the immutable remaining state. Page size and authenticated user must match the original request. Invalid cursors return 400; expired snapshots return 410. A null nextCursor means no more results. The existing GET /api/Feed?page=1&limit=20 array response remains compatible for Explore and older clients, but legacy page-number calls do not get session stability.

Ranking metadata is loaded once per new snapshot. Detailed images, service and action data are loaded only for the selected page, using split EF queries. Remaining posts are checked against current visibility before each page: hidden/deleted/unlisted content is excluded and the page is filled from remaining candidates. New posts and quality/follow changes enter on refresh instead of shifting the current cursor sequence.

## Frontend

useFeed uses the server nextCursor, and exposes its original array-of-pages shape to Home/Community. An expired session shows a refresh message; refresh starts again without appending old pages. Automatic focus/reconnect/mount refetch is disabled to avoid incidental order changes. Existing explicit refresh, query invalidation, loading-more and engagement actions are retained.

## Operational scope

Snapshots live in server memory for 30 minutes from each continuation token's creation. A process restart loses them and the client must refresh. Multiple backend instances need sticky routing or a shared snapshot store. Initial ranking and visibility checks scale with the remaining metadata volume; the implementation is intended for the current app scale, without silently truncating content. No new database migration is required by pagination itself; the earlier Follow migration must already be applied. Deploy the backend before the app that calls /Feed/scroll. No deployment or live database changes were performed here.

## Regression coverage

Backend tests cover 25 and 125 posts, page boundaries, a single artist, a dominant artist, uniqueness/completeness, hidden posts, new posts during scrolling, stable replay, refresh, invalid/expired/other-account cursors, and Follow persistence/ranking. Frontend tests cover cursor forwarding, the screens' page shape, session expiry/refresh and existing follow/post actions. SQLite test schemas translate an unrelated PostgreSQL scheduling interval check; actual production PostgreSQL and device visual QA are not implied.
