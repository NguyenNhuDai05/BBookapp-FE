# BBook Play Review — Phase 4B implementation report

Phạm vi: frontend tại D:/EXE/bbeauty-app. Backend Phase 1–4A được đọc trực tiếp làm source of truth. Không có backend contract blocker. Đây là kết quả local/mocked validation, chưa phải xác nhận production reviewer walkthrough.

## A. Frontend architecture changes

Giữ screen → hook → service/repository → API. Thêm helper capability, thông báo sample dùng chung, component xác nhận payment và counterpart actions. Các mutation gọi API rồi lấy lại dữ liệu backend; không optimistic financial state, không simulator state machine trong frontend.

Server quyết định isDemoAccount, demoCounterpartMuaId, availableDemoActions, payment.provider, canRequestSimulatedPayout và permittedSimulationBankAccountId. Không nhận diện review account bằng email/password; không env flag, JWT giả hay client-controlled demo/provider flag. Mixed/unknown payment context không mở checkout. Các review error code được đổi thành thông báo dễ hiểu.

## B. Files changed

Các file sửa (đường dẫn tương đối từ D:/EXE/bbeauty-app):

- `app/(mua)/bank-account-form.tsx`
- `app/(mua)/bank-accounts.tsx`
- `app/(mua)/dashboard.tsx`
- `app/(mua)/earnings.tsx`
- `app/(mua)/edit-profile.tsx`
- `app/(mua)/identity-verification.tsx`
- `app/(mua)/manage-portfolio.tsx`
- `app/(mua)/mua-booking/[id].tsx`
- `app/(mua)/mua-booking/complete.tsx`
- `app/(mua)/payouts/[id].tsx`
- `app/(mua)/profile.tsx`
- `app/(mua)/services.tsx`
- `app/(mua)/settings.tsx`
- `app/(mua)/withdraw.tsx`
- `app/(mua)/working-hours.tsx`
- `app/(tabs)/explore.tsx`
- `app/(tabs)/profile.tsx`
- `app/__tests__/financialQrForms.test.tsx`
- `app/__tests__/muaChecklistEditing.test.tsx`
- `app/__tests__/muaEarnings.test.tsx`
- `app/_layout.tsx`
- `app/booking/[id].tsx`
- `app/booking/[id]/cancel-success.tsx`
- `app/change-password.tsx`
- `app/checkout/index.tsx`
- `app/checkout/success.tsx`
- `app/customer-profile-edit.tsx`
- `app/mua-detail.tsx`
- `app/mua-onboarding/setup.tsx`
- `app/refund-bank-account-form.tsx`
- `app/refund-destination.tsx`
- `app/refund/[id].tsx`
- `components/mua/portfolio/PortfolioGrid.tsx`
- `components/mua/services/ServiceList.tsx`
- `hooks/useBooking.ts`
- `hooks/useMuaDetail.ts`
- `hooks/useMuaPayouts.ts`
- `repositories/ApiAuthRepository.ts`
- `repositories/ApiBookingRepository.ts`
- `repositories/ApiMuaPayoutRepository.ts`
- `repositories/ApiMuaRepository.ts`
- `repositories/IBookingRepository.ts`
- `services/api.ts`
- `services/bookingService.ts`
- `store/useAuthStore.ts`
- `types/auth.ts`
- `types/booking.ts`
- `types/earnings.ts`
- `types/payout.ts`
- `utils/uiMessage.ts`

Các file mới:

- `app/__tests__/playReviewUx.test.tsx`
- `components/ReviewNotice.tsx`
- `components/ReviewReadOnlyScreen.tsx`
- `components/booking/ReviewCounterpartActions.tsx`
- `components/booking/SamplePaymentConfirmation.tsx`
- `services/__tests__/playReviewContracts.test.ts`
- `services/__tests__/playReviewErrors.test.ts`
- `services/bookingPaymentFlow.ts`
- `store/__tests__/playReviewSession.test.ts`
- `utils/playReview.ts`
- docs/PLAY_REVIEW_PHASE_4B_REPORT.md (báo cáo này).

Các file test normal hiện có chỉ bổ sung auth-store mock để cô lập dependency mới. Không đổi dependencies, native packages, migration hay backend.

## C. DTO/contracts added

| Contract frontend | Nguồn / cách dùng |
| --- | --- |
| User.isDemoAccount | Boolean từ server, không từ input đăng nhập |
| User.demoCounterpartMuaId | GET User/profile; chỉ chọn counterpart do server chỉ định |
| Booking.availableDemoActions | Backend capability; không suy quyền simulator từ booking status |
| BookingPayment.provider | PayOS=0, Simulated=1; unknown fail closed |
| BookingPayment.checkoutUrl | Nullable cho Simulated |
| Earnings.canRequestSimulatedPayout | Điều kiện cho nút rút mẫu |
| Earnings.permittedSimulationBankAccountId | Chỉ cho phép chọn sample bank được backend cấp |
| Payout.provider | Manual=0, PayOS=1, Simulated=2 |

Dùng đúng ba endpoint backend đã có: POST Booking/{id}/demo-payment/succeed, demo-counterpart/accept, demo-counterpart/reject. Action → path cố định; không generic setStatus. Repository POST rồi GET Booking/{id}. Payout dùng POST mua/payouts hiện có và payload hiện có; không thêm isDemo/provider.

Public service listing không trả Draft counterpart. GET Mua/{id} đã cho authorized reviewer đọc detail và services embedded; frontend reuse response đó thay vì nới backend/public listing.

## D. Auth/mode switching

Đăng nhập email/password hiện có; review login hydrate GET User/profile để lấy counterpart. Customer/MUA chuyển mode bằng cùng JWT. Router hiện có dùng role/hasMuaProfile và không buộc reviewer Draft hoàn thành onboarding, nên không thêm bypass role hay fake approval. Normal Draft flow giữ nguyên.

Login thành công, logout và expire session clear query cache + booking draft; logout reset active mode. Không persist toàn bộ review profile/capabilities. Rehydrate profile từ backend. Push registration/listeners không chạy cho server-marked review account; normal flow giữ nguyên.

## E. Customer review flow

Login → Customer → helper card ở Explore → counterpart detail → chọn dịch vụ/lịch → tạo booking bằng API thường → deposit payment.

Payment Simulated mở modal sample, không WebBrowser, checkout URL hay QR. Nút xác nhận chỉ khả dụng khi provider Simulated, booking ID khớp, reviewer là Customer của booking và backend trả paymentSucceed. Amount đọc từ server; không nhập amount giả. Pending UI chống bấm lặp. Thành công lấy booking mới từ backend.

PendingConfirmation chỉ hiện counterpartAccept/counterpartReject nếu backend cấp từng action. Backend thực hiện counterpart transition, frontend không impersonate MUA. Seed WaitingCustomer dùng completion API Customer hiện có; cancelled/refunded dùng màn hình lịch sử hiện có. Không full lifecycle simulator trên client.

Thông báo tài chính dùng thống nhất: “Giao dịch mẫu dành cho đánh giá ứng dụng. Không có tiền thật được chuyển.”

## F. MUA review flow

MUA mode → incoming booking → Accept/Reject qua API participant thường → InProgress → WaitingCustomer qua API thường. Không counterpart endpoint cho reviewer đang là MUA booking. Không auto-complete Customer.

Review completion không bắt chọn ảnh cục bộ: endpoint hiện có không nhận ảnh này và sample profile là readonly. Normal completion vẫn giữ yêu cầu ảnh UI trước đó. Mutation errors hiển thị thân thiện, trạng thái chỉ đổi theo backend/refetch.

Sample profile/services/portfolio/schedule được đọc từ API. Edit/create/archive/delete/visibility/upload/save bị ẩn hoặc disable trong context review. Direct mutation routes trả màn hình readonly cho reviewer, vẫn render screen gốc cho normal user.

## G. Identity UX

GET owner identity hiện có, render đủ ba signed sample images bằng PrivateMediaImage. Không dùng asset identity hardcoded, không upload/replace/submit. Draft được ghi rõ là chưa xác minh; không giả Verified/Approved, không blue verified badge cho sample profile. Signed URL renew dùng component hiện có.

## H. Bank UX

Sample bank vẫn Pending, không đổi global bank usability helper. List readonly; add/edit/delete/default/OTP/QR mutation không có trong review UX. Direct bank form/refund destination không mở đường ghi dữ liệu review.

Sample payout được chọn bank chỉ qua permittedSimulationBankAccountId từ earnings, không dựa Pending thành usable. Normal bank eligibility và refund destination flow giữ nguyên.

## I. Earnings/payout UX

Earnings hiển thị backend receivables/sample data. Reviewer payout dùng canRequestSimulatedPayout + permitted bank ID, không dùng normal CanWithdraw để mở quyền. POST payout giữ API/body cũ; response Simulated được refetch earnings/list/detail trước khi navigation.

Payout history/detail hiển thị giao dịch mẫu, dùng status Paid thực từ server, không claim chuyển tiền thật và không hiển thị provider reference như chứng từ chuyển khoản cho sample. Refund history cũng ghi sample; không real bank/QR/provider flow. Không tạo payout/refund worker frontend.

## J. Password/delete UX

Review password route readonly với “Mật khẩu của tài khoản đánh giá được quản lý riêng.” Profile/settings không cho đổi mật khẩu/xóa tài khoản; giải thích protected account. Backend PLAY_REVIEW_ACCOUNT_PROTECTED và PLAY_REVIEW_OPERATION_BLOCKED được map tập trung, không hiển thị raw code cho người dùng.

Forgot-password không sửa, không kiểm tra email review trong client. Normal password/delete flow giữ screen/API cũ.

## K. Normal-user regression

Normal PayOS payment vẫn yêu cầu provider PayOS và checkoutUrl hợp lệ, gọi WebBrowser.openBrowserAsync theo flow cũ. Simulated và mixed contexts không mở browser. Provider missing/unknown fail closed thay vì fallback production.

Normal onboarding/checklist, profile mutations, identity form, bank usability, payout eligibility, booking participant actions và forgot password giữ behavior hiện có. Readonly props mặc định false. Test regression có normal PayOS, normal bank/payout, normal password, normal MUA checklist, modal/form và existing booking/API tests.

Backend authorization vẫn là lớp quyết định cuối cùng. UI capability không thay backend guards; stale marker/capability hoặc SimulationEnabled bị tắt phải nhận lỗi backend và refresh, không fallback production. Backend security suite 330 tests là baseline người dùng cung cấp, không chạy lại hoặc tuyên bố được kiểm chứng trong Phase 4B.

## L. Tests/build

| Kiểm tra | Kết quả |
| --- | --- |
| Full frontend Jest | 35 suites; 201 passed, 0 failed, 0 skipped; 51.001 giây |
| TypeScript | PASS — npx tsc --noEmit, exit code 0 |
| Lint | FAIL — 3 lỗi baseline ở file không sửa; 12 warnings |
| Android export | Thành công; Hermes bundle 8.1 MB + metadata tại .expo/phase4b-android |
| Android release/device smoke | Chưa thực hiện; thuộc Phase 4C |

Jest command: npm test -- --cacheDirectory .expo/jest-phase4b --testTimeout=15000 --silent --json --outputFile=.expo/phase4b-tests.json. Log: .expo/phase4b-tests-final.log; machine-readable results: .expo/phase4b-tests.json. Trước đó một existing modal test vượt timeout 5 giây; full suite rerun với 15 giây đã pass, không sửa logic test đó.

Targeted tests: playReviewContracts, playReviewErrors, playReviewSession, playReviewUx. Bao phủ marker hydration; mode cùng JWT; clear cache/draft; simulated provider không mở browser; normal PayOS; unknown/mixed fail closed; capability absent/stale; Customer ownership; counterpart buttons theo từng action; pending confirmation; readonly signed identity; Pending bank; payout bank capability/body; protected password; friendly errors; normal regression. Các API/provider trong test đều mocked.

Lint errors là react-hooks/set-state-in-effect tại app/(admin)/payouts/[id].tsx:32, app/(admin)/private-media.tsx:17, components/PrivateMediaImage.tsx:21. git diff xác nhận cả ba file không đổi. Không sửa unrelated lint errors để mở rộng scope. git diff --check đã pass sau khi xóa trailing whitespace. Export là JS/Hermes compile, không phải APK build/install hay production smoke.

## M. Backend changes

NONE. Không sửa D:/EXE/BeautyBook, không giảm Phase 1–3 guards; không migration, seed, provider call hoặc production DB mutation.

## N. Production provisioning performed?

NO. Không chạy provisioning CLI production, tạo review account thật, upload production sample assets, thay Render environment hay bật SimulationEnabled.

## O. Deployment performed?

NO. Không deploy, commit, push, submit Google Play hay điền credentials. Không viết final App Access instructions như đã smoke-test production.

## P. Remaining Phase 4C work

- Production provisioning.
- Runtime config.
- Controlled activation.
- Android release smoke test.
- Reviewer walkthrough.
- Play Console App Access instructions.
- Final policy/release checklist.

Dừng sau implementation → local validation → báo cáo. Chờ người dùng review trước Phase 4C.
