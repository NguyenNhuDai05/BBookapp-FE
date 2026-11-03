# Native plan payments

Plans and benefits now offers native payOS QR checkout when the backend's
`AppCommerce__Enabled` and product readiness flags permit it. No user allowlist or
Google Billing is used. Prices, identity, payment confirmation and access come from the API.

An older API returning 404 for the catalog leaves the existing read-only plans flow available.
No auth, booking, AI enforcement environment flag, native app identity, signing setup or
EAS build profile is changed. Existing AI rollout settings are intentionally preserved.

New dependencies: `toqr` (local QR encoding) and `expo-sharing` (native share sheet).
Use `npm ci` and produce a new native binary; do not deliver this as a JS-only update
to a binary lacking expo-sharing. App updates are currently disabled in app.json.

After backend migration/deployment, verify payment on Android, re-entry after banking,
lost connection, account switch, lifetime ownership and consecutive MUA periods.
Only the backend's verified Fulfilled state refreshes purchased benefits. Closing the
screen does not cancel an order. Pending request keys are persisted per account/product.

Build AAB manually with the existing signing and profile workflow after device acceptance.
Do not claim device acceptance merely to bypass existing build checks.
Backend settings and migration guidance are in BeautyBook `docs/NATIVE-APP-COMMERCE.md`.
