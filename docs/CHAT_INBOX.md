# Chat inbox identity and layout

The shared customer/MUA inbox no longer renders the All, Customer, MUA or System category strip. A compact header and persistent search field sit directly above a top-aligned conversation list. Rows use 48px avatars, ellipsized names/previews, timestamps and unread badges. The page is full-width on mobile and centered up to 640px on larger screens.

GET /api/chat/rooms now resolves participant names and avatars from Users in one batch and returns otherUserId, otherUserName and otherUserAvatar for the authenticated viewer. Existing customer/MUA fields remain compatible. Missing or deleted identity uses a neutral name and no avatar; no role-based display name is fabricated. Room creation returns the same peer fields. No database migration is required.

Both inbox and conversation header use getChatPeer: API peer fields first, then the original participant fields selected by the signed-in user id. A MUA account booking/chatting with another MUA therefore sees that artist rather than its own identity. Broken inbox avatar downloads fall back to initials and recover when the URL changes.

Search, conversation routes, previews (including the sent-by-you prefix), SignalR updates, unread state and mark-all-read remain. The old horizontal category ScrollView has been removed so it cannot stretch vertically and push conversations down the screen.

Deploy the backend changes to enable authoritative identity fields in the running environment; this task does not deploy or modify stored profile names. Older backend responses remain readable through the compatibility fallback. Tests verify peer selection, avatars, search, removed categories, routing and API identities for both room roles. Actual live API responses and device visual QA are not verified by component tests.
