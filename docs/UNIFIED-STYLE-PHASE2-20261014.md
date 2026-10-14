# Unified Makeup Styles — Phase 2 mobile

## Phạm vi

Triển khai local trong `D:/EXE/bbeauty-app`, nối contract backend Phase 1 đã nghiệm thu. Không thay backend/schema, admin, Advisor, ML Kit, Gemini, cấu hình Play hoặc dependency. Các thay đổi AI/config/release đã có trong working tree được giữ nguyên. Không commit/push/deploy, không build APK/AAB và không gọi production/Supabase trong kiểm tra.

## Hành vi

- Dùng chung `MakeupStylePicker` cho onboarding, sửa hồ sơ và dịch vụ. Chọn bằng StyleId, tìm theo tên, tên mới là draft; không gọi select-or-create trước khi lưu. Chuẩn hóa NFKC/trim/gộp khoảng trắng/lowercase; giữ dấu tiếng Việt, không fuzzy merge. Giới hạn MUA 20, dịch vụ 5, tính cả draft mới.
- Onboarding gửi styleIds/newStyleNames cùng request cuối. Sửa hồ sơ gửi các trường phong cách khi người dùng thay đổi tập lựa chọn. Sửa bio/ảnh/địa điểm không tự gửi lại tập specialty cũ, tránh thay đổi phong cách do cache refresh.
- Danh sách phong cách của dịch vụ lấy từ specialties của hồ sơ MUA; không tự gắn tất cả vào dịch vụ. Tên mới ở dịch vụ gửi cùng lần lưu, backend resolve/create và union vào MUA. Sau thành công cache hồ sơ/dịch vụ/danh mục được invalidation/refetch; tên mới trở thành lựa chọn trong các form sau.
- Inactive lịch sử vẫn hiển thị trong các lựa chọn đã gắn, có thể giữ/bỏ. Không xuất hiện trong danh sách thêm mới. Backend tiếp tục là nơi quyết định catalog/limits/concurrency.
- Chỉ sửa tên/giá/thông tin dịch vụ: không gửi tags/styleIds/newStyleNames, giữ StyleIds và chuỗi legacy. Khi đổi phong cách, gửi ID và tên mới, không gửi tags chuỗi đồng thời. Từ khóa legacy được hiển thị để biết dữ liệu đang có; chuỗi chưa ánh xạ vẫn do backend giữ, không tự chuyển thành phong cách.
- Bỏ specialty đang dùng trả STYLE_IN_USE: hiển thị tên các dịch vụ liên quan và giữ form để sửa. Các lỗi inactive, ambiguous, payload conflict, limit/rate-limit có thông báo phù hợp; có nút tải lại phong cách. Service conflict 409 refresh hồ sơ/danh mục.
- Tạo dịch vụ mới có requestId UUID. Sau timeout/mất kết nối hoặc HTTP 5xx, form giữ nguyên payload/requestId và ảnh đã upload để retry; khóa chỉnh sửa trong lúc chưa biết kết quả. Khi lỗi 4xx đã xác định, form cho phép sửa và lần tạo sau có ID mới. Update không gửi requestId.

## Giới hạn retry

RequestId/payload được giữ trong phiên form hiện tại, chưa persist qua đóng form hoặc restart app. Form cảnh báo cần kiểm tra danh sách dịch vụ trước khi đóng một lần lưu chưa xác định và tạo lại. Không tuyên bố chống trùng giữa hai draft mới độc lập hoặc sau restart. Không tự retry create với payload đã sửa.

## File production được sửa/thêm

- `app/mua-onboarding/apply.tsx`
- `app/(mua)/edit-profile.tsx`
- `app/(mua)/services.tsx`
- `app/(mua)/profile.tsx`
- `components/mua/MakeupStylePicker.tsx` (mới)
- `components/mua/services/ServiceFormModal.tsx`
- `hooks/useMuaOnboarding.ts`
- `hooks/useMuaProfile.ts`
- `hooks/useMuaServices.ts`
- `repositories/ApiMuaServicesRepository.ts`
- `types/onboarding.ts`
- `types/muaProfile.ts`
- `types/ServiceDto.ts`
- `utils/makeupStyles.ts` (mới)
- `utils/muaOnboarding.ts`

Test fixtures cũ cập nhật: muaApply, muaProfileEditing, ServiceFormModal, muaOnboarding. Test mới: MakeupStylePicker, hooks/unifiedStyles, repositories/unifiedStyles. Tài liệu này là file mới.

## Verification

- TypeScript `tsc --noEmit`: đạt.
- ESLint trên các file Phase 2: đạt.
- git diff --check: đạt.
- Nhóm nghiệm thu cuối: **52 passed, 0 failed, 0 skipped**, 8 suites, Jest exit 0. Gồm limits 20/5, draft names/cancel trước save, tên Việt chuẩn hóa/giữ dấu, inactive retain/remove, update bỏ qua trường phong cách, create requestId/retry giữ payload và ảnh, thông báo STYLE_IN_USE, repository contract và cache invalidation.
- Regression cuối toàn bộ mobile: **469 passed, 0 failed, 0 skipped**, 69 suites, Jest exit 0. 52 test nghiệm thu là tập con của bộ regression, không cộng hai số. Có warning SafeAreaView deprecated tại màn settings có sẵn, ngoài phạm vi; không có lỗi test.
- JSON bằng chứng trong `D:/EXE/artifacts/unified-style-phase2-final-targeted.json` và `unified-style-phase2-all-final.json`.

Các test mobile dùng mock API/storage/upload. Không coi đây là E2E app thật tới PostgreSQL. Bằng chứng backend PostgreSQL là nghiệm thu Phase 1 trước đó.

## Trước rollout

Backend phải có schema/contract Phase 1 trước khi phát hành mobile này; backend cũ không hiểu các trường phong cách mới. Không phát hành FE trước BE hoặc trộn writer BE cũ/mới khi bắt đầu ghi ID. Cần nghiệm thu thiết bị với backend local/staging đã xác minh: onboarding chỉ tên mới → profile → tạo dịch vụ theo specialty → thêm tên mới trong dịch vụ → mở lại profile/dịch vụ; hủy form không tạo catalog; 409 giữ draft; timeout/retry; inactive; sửa giá/tên giữ liên kết; Draft MUA tạo dịch vụ và quy tắc công khai không đổi. Không cần thay đổi engine hay matching trong bước này.

Phase 3 Advisor/matching chưa triển khai. Không có xác nhận production hoặc nghiệm thu trên điện thoại trong lượt này.
