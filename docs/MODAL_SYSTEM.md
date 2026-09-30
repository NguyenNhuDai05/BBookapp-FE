# B-Book modal system

## Scope

The initial AST audit read 242 frontend source files and recorded 137 overlay usages in `modal-audit-before.json`. This migration covers auth, booking/payment UI, MUA, bank accounts, refunds, feed, chat, profile, settings and administration. No backend files, API contracts, dependencies or payment calculations were changed.

## Created files

- `components/ui/OverlayProvider.tsx`: shared native modal host, stacking, Back routing and animation.
- `components/ui/AppModal.tsx`: info, success, warning, error, confirm and destructive variants.
- `components/ui/AppBottomSheet.tsx`: animated sheet frame, safe areas and keyboard handling.
- `components/ui/ActionSheet.tsx`: reusable menu rows with icons, descriptions and async guards.
- `components/ui/dialogStore.ts` and `DialogHost.tsx`: queued compatibility API preserving existing alert callbacks.
- `components/feed/PostActionSheet.tsx`: feed actions; unsupported moderation has explicit TODOs and does not report fake success.
- `utils/uiMessage.ts`: friendly display messages without transport errors or object dumps.
- `components/ui/__tests__/overlaySystem.test.tsx`, `utils/__tests__/uiMessage.test.ts`: callback/stacking/loading and message checks.
- `scripts/audit-overlays.cjs`, `docs/modal-audit-before.json`: repeatable audit and original usage inventory.

## Modified files

The root layout mounts the provider and dialog host. `constants/theme.ts` contains the shared overlay tokens. `services/api.ts` sanitizes display messages while preserving error status/code and request handling.

Existing `ConfirmDialog`, `FeedbackDialog`, `BankDefaultPasswordModal` and `AdminConfirmDialog` now delegate to the shared modal. Booking date/time/address pickers, portfolio/comments/reply forms, service forms, bank pickers and booking carts use the shared sheet. MUA edit/delete menus and chat options use `ActionSheet`.

Every original usage is listed with file and original source in `modal-audit-before.json`; the current Git diff gives the exact migrated files. Auth, booking, cancellation, checkout, onboarding, profile/settings, chat and portfolio notifications use the queued `appDialog.alert` adapter. This avoids duplicated state and retains their original confirmation, API and navigation callbacks.

## APIs

```tsx
<AppModal
  visible={visible}
  variant="error"
  title="Đăng nhập không thành công"
  description="Email hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra và thử lại."
  primaryAction={{ label: 'Thử lại', onPress: retry }}
  secondaryAction={{ label: 'Hủy', onPress: close }}
  onClose={close}
  loading={submitting}
/>
```

Actions accept `label`, `onPress`, `disabled`, `loading`, `destructive`. A promise-returning callback locks all dismissal/actions until it settles. The caller owns visibility; `AppModal` does not automatically close after an action. Optional props include `additionalActions`, `children`, `icon`, `dismissOnBackdrop`, `onShow`, `onActionError`, `priority`.

```tsx
<ActionSheet
  visible={visible}
  title="Tùy chọn bài viết"
  description="Các thao tác với bài viết này"
  onClose={close}
  actions={[{ id: 'edit', label: 'Chỉnh sửa', icon: Pencil, onPress: edit }]}
/>
```

Each action also supports `description`, `destructive`, `disabled`; async callbacks show a spinner and block repeat presses. `AppBottomSheet` accepts `visible`, `onClose`, `title`, `description`, `loading`, `children`, `contentStyle`, `onShow`.

Compatibility calls retain their existing buttons and callbacks:

```tsx
appDialog.alert(title, message, buttons, options);
```

Global notifications queue above an open form. Closing the notification restores the form. Back invokes cancellation, never the destructive callback. A single native host avoids competing native modal presentations on iOS.

## Intentional exceptions and behavior

Full-screen image viewers and service-detail content retain their full-screen layout through `AppOverlay`. They are content viewers rather than centered confirmation cards. No app-owned native `Alert.alert`, browser `window.alert` or `window.confirm` remains. OS permission, Google sign-in and calendar interfaces remain controlled by their SDKs.

Existing API calls, callback decisions, field values and navigation destinations remain in screens/hooks. Login error dismissal retains email/password. Empty-cart closure was moved from render into an effect; this fixes React lifecycle behavior. The added UI submission guards prevent repeated presses. Unsupported hide/block/report actions explain availability rather than changing business state.

## Validation and release limits

TypeScript, ESLint, whitespace checks, automated tests and Expo exports are run for this change. The final results are reported in the completion message. Local generated bundles are ignored under `.modal-validation/`.

- `npx tsc --noEmit`: passed.
- `npm test -- --watch=false`: 9 suites, 63 tests passed. An earlier run under concurrent Metro load timed out; both the isolated rerun and final complete run passed.
- `npm run lint`: 0 errors, 22 unused-code warnings (baseline: 29 warnings).
- `git diff --check`: passed.
- Android development export: passed using the configured production API URL.
- Production Android/iOS/web export: passed; no native APK/AAB build or upload was performed.
- Export reports existing Tailwind CSS at-rule warnings on web; successful export does not establish visual parity on web.

Expo export verifies JavaScript/module compilation; it does not verify APK/AAB signing, native SDK initialization, installation, payment callbacks, or actual device keyboard/accessibility behavior. This Windows environment has no configured Java or Android SDK; no EAS build was submitted. A physical-device development build and signed production build still need end-to-end login, booking, cancellation/refund, withdrawal, offline, Back and keyboard checks before release. Previously identified backend payout/refund issues are outside this frontend migration and remain release considerations.

## Exact modified file inventory

- .gitignore
- app/(admin)/mua-applications/[id].tsx
- app/(admin)/notifications/new.tsx
- app/(admin)/refunds/[id].tsx
- app/(auth)/forgot-password.tsx
- app/(auth)/login.tsx
- app/(auth)/register.tsx
- app/(mua)/bank-account-form.tsx
- app/(mua)/community.tsx
- app/(mua)/edit-profile.tsx
- app/(mua)/identity-verification.tsx
- app/(mua)/manage-portfolio.tsx
- app/(mua)/mua-booking/[id].tsx
- app/(mua)/mua-booking/complete.tsx
- app/(mua)/profile.tsx
- app/(mua)/settings.tsx
- app/(mua)/withdraw.tsx
- app/(tabs)/home.tsx
- app/(tabs)/profile.tsx
- app/_layout.tsx
- app/booking/[id].tsx
- app/booking/[id]/cancel.tsx
- app/booking/review.tsx
- app/change-password.tsx
- app/chat/[id].tsx
- app/checkout/index.tsx
- app/customer-profile-edit.tsx
- app/favorites.tsx
- app/mua-detail.tsx
- app/mua-onboarding/apply.tsx
- app/mua-onboarding/setup.tsx
- app/portfolio-feed.tsx
- app/refund-bank-account-form.tsx
- components/BookingCartBottomSheet.tsx
- components/ServiceDetailModal.tsx
- components/admin/AdminConfirmDialog.tsx
- components/bank/BankDefaultPasswordModal.tsx
- components/booking/AddressPickerSheet.tsx
- components/booking/DatePickerSheet.tsx
- components/booking/TimePickerSheet.tsx
- components/chat/ChatListScreen.tsx
- components/common/ConfirmDialog.tsx
- components/common/FeedbackDialog.tsx
- components/feed/PortfolioCommentsSheet.tsx
- components/mua/ReviewTabContent.tsx
- components/mua/portfolio/PortfolioFormModal.tsx
- components/mua/services/ServiceFormModal.tsx
- constants/theme.ts
- hooks/useMuaPortfolio.ts
- services/api.ts
