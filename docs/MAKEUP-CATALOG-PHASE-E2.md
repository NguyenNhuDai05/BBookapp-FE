# Phase E2 — Mobile Portfolio Tagging

Implementation date: 18 October 2026. Scope: `bbeauty-app` only. Backend Phase E1 was read to verify DTOs, endpoints and omitted/null/empty semantics. No backend, database, admin, Advisor engine, booking, payment, EAS or package changes. No dependencies added. No APK/AAB, commit, push or deployment.

## Audit and compatibility

The existing form uploaded albums but had no structured tagging. Its category/free-text path could reconstruct legacy Tags; the write repository also incorrectly treated message acknowledgements as read DTOs. Feed, owner and favorites had separate interpretations. E2 removes legacy tag writes from this form and uses one shared normalizer.

Existing uncommitted changes were captured before E2 in `.expo/phase-e2/before-status.txt` and `before.patch`. Advisor hashes were captured in `advisor-before.json`; final verification compares those exact files. Existing image layouts are preserved. The repository's AGENTS.md requests Expo v54 documentation; that exact version URL was opened before coding and redirected to current docs. Installed Expo/RN versions were inspected locally and were not changed.

## Files changed or added by E2

- Catalog pipeline: `repositories/IMuaStyleRepository.ts`, `repositories/ApiMuaStyleRepository.ts`, `hooks/useMuaStyles.ts`.
- Portfolio contract and reads: `types/portfolio.ts`, `utils/portfolio.ts`, `repositories/IPortfolioRepository.ts`, `repositories/ApiPortfolioRepository.ts`, `services/feedService.ts`.
- Write/draft flow: `hooks/useMuaPortfolio.ts`, `utils/portfolioTagging.ts`, `utils/portfolioWrite.ts`.
- UI: `components/mua/portfolio/PortfolioFormModal.tsx`, new `PortfolioTaggingFields.tsx`, `PortfolioPost.tsx`, `app/(mua)/services.tsx` (parent no longer closes before form handles read errors).
- Tests: `repositories/__tests__/muaCatalog.test.ts`, new `repositories/__tests__/portfolio.test.ts`, `hooks/__tests__/portfolioWrites.test.tsx`, `utils/__tests__/portfolioTagging.test.ts`, `components/mua/portfolio/__tests__/PortfolioTaggingFields.test.tsx`, `PortfolioTaggingForm.test.tsx`, `PortfolioTaggingPost.test.tsx`; updated existing `PortfolioFormModal.test.tsx` wrappers/mocks; shared fixtures in `test-utils/portfolioFixture.ts`.
- This handoff document. The Portfolio service remains the existing pass-through. PortfolioTab/profile/manage screens already use the shared form/hook and need no E2 source changes.

## UI and catalog

The existing `UI → useMuaStyles → muaStyleService → ApiMuaStyleRepository` pipeline and `['mua-styles']` cache are retained. Hook `data` remains the Phase D styles array; `catalog` exposes terms, group terms, version and capabilities. Runtime validation checks term identity, kinds, keys, group references and supported intensity keys. Structured writes require catalog source, valid taxonomy and capability version 1. Legacy fallback/missing capability/catalog error still allow untagged content; historical tags are retained, with reload messaging and explicit discard of unsaved tag changes if support disappears.

All groups are optional: occasions 3, primary 1, secondary 2 (requires primary, disjoint IDs), intensity 1, colors 3, effects 4. Names/keys/IDs come from the API, including custom styles; no style default metadata is applied. Group rows cannot be selected. Style search and nested option lists are bounded to 240px. Colors/effects are collapsed initially. Selected rows have checks and removable chips, with counts and empty/loading/error/retry states. Existing AppBottomSheet owns keyboard/safe area; form content scrolls above a separate footer. No Title field or Title in feed.

## API and resolved references

POST `/Mua/portfolio` and PUT `/mua/portfolio/{id}` return `{ message }`, never a PortfolioDto. Read/write types are separate. Invalid/missing write acknowledgement is an uncertain write, not synthetic success. Owner `/Mua/portfolio/me`, public owner list and favorites pass through `normalizePortfolio`; both feed routes use the same normalizer without changing ordering/cursors. It carries serviceId, version, primary/secondary style and occasion/intensity/color/effect references with active/selectable/history status. Missing legacy tagging is unknown, not a fabricated empty structured object.

Feed starts with at most three resolved labels, prioritizing the main style, occasions and intensity. Remaining structured/legacy labels expand on demand. Existing album, author, service, social controls, ordering and visibility fields are preserved.

## Draft, version and history

Edit first fetches the current owner list and finds the entry, then initializes once with its version. Background cache/catalog/parent refreshes do not reset text or selection. Structured edit is disabled if version/tagging is unknown. Content writes remain available. Inactive/archived references can be kept or removed; inactive roles cannot be newly assigned. Frontend checks limits, duplicates, primary requirements and new selections; backend remains authoritative.

Only changed groups are sent. Empty arrays mean an intentional group clear; null means an intentional scalar clear. Unchanged arrays/groups, content, album and service are omitted. Legacy Tags/Title are never generated, cleared or rewritten by the form. Version conflict/required errors preserve the draft and version, offer GET comparison and require explicit **Dùng bản mới (bỏ bản nháp)** to replace the draft. No automatic retry with a newer version.

## Upload and submission

Each form retains a local URI → uploaded URL map, without bitmaps/base64. HTTP images are reused. Parallel upload uses allSettled to cache every successful image even if another fails; retry uploads only missing images, preserving order. Submission captures content/album/service/tag snapshots. A synchronous ref lock prevents duplicate saves, image-picker overlap and close while saving; controls are disabled for the request duration.

Definite write failure retains the draft and uploaded URLs. Ambiguous network/5xx/invalid acknowledgement blocks another write and requires a fresh owner-list GET plus explicit user review. There is no requestId/idempotency fiction. For an uncertain edit, explicit loading of the compared version is available.

After acknowledgement the hook invalidates portfolio, eligibility, feed, explore and favorites, then awaits an actual owner GET. Active projections refresh afterwards. No fake PortfolioDto or success setQueryData is used. If GET fails after acknowledgement, `PortfolioSavedRefreshError` displays **Đã lưu portfolio, nhưng chưa tải lại được dữ liệu mới.** Its retry runs GET/refetch only, never POST/PUT again.

## Validation results

- Final TypeScript `tsc --noEmit`: exit 0 (`ts-complete.log`).
- ESLint on E2 changed source and tests: exit 0, zero warnings (`lint-verified.log`).
- Broad source ESLint: **4 errors / 38 warnings** (`lint-source-final.log`). Errors are in unchanged `app/(admin)/payouts/[id].tsx`, `app/(admin)/private-media.tsx`, `scripts/audit-overlays.cjs`, and `scripts/ci/release-policy.test.cjs`; their diff against HEAD is empty. No E2 file appears in the broad lint diagnostics. This freshly measured wider-source result supersedes the prior Phase D lint count; the command includes scripts and tests as well as app source.
- E2 plus catalog regression: **9 suites / 52 tests passed** (`scoped-complete.json`), including snapshot locking, missing capability, historical tags, partial upload reuse, uncertain POST, saved/read error, version conflict and DTO projections.
- Final full regression: **839 passed / 2 failed / 841 total**, **118 passed / 2 failed / 120 suites** (`final-regression.json`, 224.345 seconds). The two remaining failures are Advisor protected-byte assertions in `engine20Simulation.test.ts` and `consolidationBoundary.test.ts`, matching the known Phase D checksum baseline. The newly added snapshot test harness was corrected before this final run and passes. Service, profile, feed, booking and Advisor functional regressions pass.
- Final Advisor file hash comparison against the pre-E2 snapshot: **0 files changed**. No protected test or checksum manifest was modified.
- Initial sandbox checks hit Windows dependency reads (`EPERM`), and concurrent validation hit resource error 1450/timeouts. Validation was rerun outside the sandbox after stopping only E2-owned processes. React test warnings about act/open handles were emitted; they are not test passes or failures. The final full run uses `--testTimeout=15000 --forceExit` without changing assertions.

Raw logs are under `.expo/phase-e2/` (local ignored working output). Commands: `node node_modules/typescript/bin/tsc --noEmit`; changed-file ESLint; broad-source ESLint across app/components/constants/features/hooks/lib/mock/modules/plugins/repositories/scripts/services/store/test-utils/types/utils; full Jest with `--runInBand --testTimeout=15000 --forceExit`. Earlier interrupted/failed environment attempts are retained separately and are not the final result.

## Android QA after your own APK build

1. On a small Android screen, open create from profile/services; open keyboard, scroll every expanded group, check footer and close/back behavior. Check larger accessibility font sizes, long labels and touch targets.
2. Save an album with no tags; then save five groups. Verify actual catalog labels/custom styles, primary/secondary removal and each maximum. Confirm no Title and no default tag selections.
3. Edit existing legacy and archived-tag entries. Change only description, service or one group; verify all omitted fields/other tags survive after reload. Trigger catalog failure or missing capability and confirm content saves preserve history.
4. Simulate one failed upload then retry, and definite write validation failure then retry. Confirm successful image URLs are reused and album order remains. During upload, attempt close/back, duplicate Save, image edits and picker actions.
5. Simulate lost POST response: verify no resend until GET review. Simulate successful write followed by failed GET: verify saved warning and GET-only retry. Compare another-device update and verify conflict keeps the draft until explicit reload choice.
6. Check owner, public feed and favorites display the same resolved labels with compact expand/collapse; check albums, likes/comments/save, linked service, hidden/pinned and ordering. Smoke test service editing, booking and Advisor without introducing matching/scoring changes.

Physical Android/device, real gallery permission/keyboard/system back behavior and live backend fault injection have not been exercised in this environment. Automated component/API mocks do not replace those checks.

## Next phase boundary

Resolved structured references and shared taxonomy are available for later matching work. E2 does not connect portfolio effects/tags to Advisor scoring, alter Top 3, union tags into MUAStyles, add admin usage, or implement Safe Merge. Stop after E2.
