# Phase D — Mobile MUA & Service Catalog Integration

Ngày 18/10/2026. Repository triển khai: `D:\EXE\bbeauty-app`.

## Phạm vi và audit

Đã đọc AGENTS.md/CLAUDE.md, truy cập các URL Expo v54 được repo chỉ định (hiện máy chủ tài liệu redirect sang latest), kiểm tra package/source đang cài; không nâng SDK hay dependency. Đã đọc trực tiếp apply, edit-profile, services, profile, MakeupStylePicker, ServiceFormModal, hooks/services/repositories/DTOs và tests liên quan.

Đối chiếu backend bằng source read-only: MuaController, MuaService, MuaRepository, MakeupCatalogController, MakeupCatalogDtos, ServiceDtos và UnifiedStyleService. Không sửa/chạy backend hoặc database.

Audit trước thay đổi:

- Onboarding/edit-profile dùng danh sách styles cũ qua service gọi API trực tiếp, cache 30 phút.
- Hai nơi mở ServiceFormModal chỉ truyền specialties của profile; người dùng không có phần khám phá toàn bộ catalog.
- Picker render nhiều chip lớn, chưa nhóm chuyên môn/discovery và chưa thể hiện nguồn fallback.
- Service request đã hỗ trợ styleIds/newStyleNames, retry payload/requestId, omitted semantics và legacy tags; backend đã tự thêm specialties trong transaction.
- Hook lưu dịch vụ trước đây invalidate khi lỗi 409; profile hook refetch cả khi mutation thất bại.
- Edit profile khởi tạo một lần từ cache trước khi refetch đầu hoàn tất, có thể hiển thị specialties cũ. Cần chờ lần tải đầu, nhưng vẫn giữ edits khi background refresh.

Các thay đổi Advisor UI/portfolio/feed có sẵn trước Phase D được giữ nguyên, không hoàn tác hoặc gộp thêm sửa ngoài phạm vi.

## Kết quả

Giữ một nguồn query `['mua-styles']`, theo luồng:

`UI → useMuaStyles → muaStyleService → ApiMuaStyleRepository → API`

Repository ưu tiên GET /makeup-catalog, giữ StyleId/key/description và thứ tự từ backend. Không hardcode 20 phong cách, không map lại ID bằng tên. Response thành công nhưng rỗng vẫn là rỗng, không tự seed hoặc đổi sang dữ liệu mẫu.

Fallback qua GET /Mua/styles khi catalog mới bị network error hoặc 404/405/500/501/502/503/504. Có source/fallbackReason rõ trong UI. Không fallback để vượt 401/403, không fallback sau abort, không che response malformed bằng dữ liệu giả. Nếu cả hai API lỗi, có error/retry; lịch sử vẫn đọc được. Retry query tối đa một lần, không retry 401/403.

### Picker dùng chung

MakeupStylePicker phục vụ onboarding, edit-profile, create service và edit service:

- Ô tìm kiếm local theo tên/key, không gọi API theo từng ký tự.
- Nhóm Chuyên môn của bạn trước phần Khám phá toàn bộ phong cách trong dịch vụ.
- Loại trùng giữa nhóm bằng StyleId; hai ID cùng tên vẫn là hai mục và hiển thị key/#ID để phân biệt.
- Nếu gõ tên khớp nhiều ID, yêu cầu chọn mục đúng thay vì tự lấy ID đầu tiên.
- Selected/unselected, số lượng chọn, trạng thái giới hạn, loading/error/empty/fallback và reload.
- Nút thêm mới rõ ràng; draft names chỉ ở form, không pre-create hoặc ghi profile khi bấm chọn.
- Danh sách hàng gọn với text co giãn/xuống dòng, touch target tối thiểu 44–48, vùng selected/options cuộn có giới hạn và nestedScrollEnabled.
- Mục inactive/archived hoặc thiếu trong active catalog chỉ giữ trong lựa chọn lịch sử; không cho chọn mới. Khi chưa tải catalog, ghi chưa xác minh trạng thái thay vì coi history là active.
- Tối đa 20 cho MUA, 5 cho dịch vụ. Dữ liệu lịch sử vượt giới hạn chỉ được giữ/giảm, không thêm mới; không tự cắt danh sách.

### Các màn hình

- Onboarding tiếp tục validation 20 và ít nhất một chuyên môn; thêm source/loading/retry mới qua cùng hook.
- Edit profile chờ refetch đầu hoàn tất trước khi khởi tạo specialties, có lỗi/retry profile; background refetch không ghi đè nội dung chưa lưu. Style fields tiếp tục omitted khi không sửa. STYLE_IN_USE vẫn cho biết dịch vụ đang sử dụng.
- ServiceFormModal tự tải catalog khi được mở tại cả services.tsx và profile.tsx. Props specialties hiện có được dùng làm thứ tự ưu tiên/lịch sử, không còn là giới hạn danh mục. Khi mở form chỉ refetch profile, không có profile mutation.
- Tab Thông tin trên profile hiển thị danh sách chuyên môn từ query thật, kể cả history ngừng dùng.
- app/(mua)/services.tsx được audit nhưng không cần sửa: cả hai caller tiếp tục dùng ServiceFormModal chung và flow mutation cũ.

## API đã kết nối / giữ nguyên

| API | Vai trò |
| --- | --- |
| GET /api/makeup-catalog | Nguồn catalog ưu tiên, đầy đủ active styles |
| GET /api/Mua/styles | Fallback active styles theo contract cũ |
| POST /api/Mua/styles/select-or-create | Giữ trong repository/service và có contract test; picker không gọi trước khi lưu |
| GET /api/User/profile | Đọc/refetch chuyên môn hiện tại qua repository profile cũ |
| PUT /api/Mua/profile | Lưu profile styles/draft names trong lần lưu cuối |
| Auth become-MUA flow hiện có | Gửi lựa chọn onboarding trong payload cuối, không pre-create |
| POST /api/Mua/{id}/service | Tạo dịch vụ bằng flow hiện có |
| PUT /api/Mua/service/{id} | Sửa dịch vụ bằng flow hiện có |
| GET /api/Mua/service/me | Refetch dịch vụ hiện tại sau mutation |

Không đổi routes, auth, DTO request dịch vụ hoặc backend scoring. API select-or-create vẫn khả dụng nhưng flow UI dùng NewStyleNames ngay trong transaction profile/service/onboarding hiện có, tránh tạo mục mồ côi trước khi lưu.

## Transaction, retry và cache

Khi chọn style ngoài specialties, chỉ thay state của form. Khi lưu, gửi styleIds/newStyleNames trong request dịch vụ như trước. Backend UnifiedStyleService áp dụng ServiceStyles và union với MUAStyles trong cùng transaction, validate tổng 20. Frontend không gửi request cập nhật profile riêng, không tự xóa specialties khi bỏ style khỏi dịch vụ.

Sau mutation thành công, invalidate profile/services/catalog cùng các projection/eligibility keys sẵn có. Active profile được refetch, inactive query sẽ tải mới khi mở. Không setQueryData để dựng profile thành công giả. Sau lỗi dịch vụ không invalidate/refetch tự động; giữ form/error và lựa chọn, người dùng có thể reload rõ ràng.

Giữ nguyên requestId tạo dịch vụ, immutable retry payload sau network/5xx, reuse ảnh upload đã xong, lock chống gửi trùng, omitted/[] semantics và legacy tags. Không tự backfill ID từ legacy names/tags khi mở form hoặc tải catalog. Lỗi MUA_STYLE_LIMIT_EXCEEDED ghi rõ vượt 20 và chưa lưu; không bỏ bớt hoặc xóa chuyên môn để ép lưu.

Cache catalog staleTime 60 giây, refetch mỗi lần hook/form mount, refetch khi AppState trở lại active và có reload thủ công. Listener được remove khi unmount; không polling hoặc loop. Admin website không tự invalidate điện thoại; nếu form mở liên tục foreground, cần nút reload để nhận thay đổi ngay. Backend luôn validate lần cuối.

## Files Phase D

Đã sửa:

- app/mua-onboarding/apply.tsx
- app/(mua)/edit-profile.tsx
- app/(mua)/profile.tsx
- components/mua/MakeupStylePicker.tsx
- components/mua/services/ServiceFormModal.tsx
- hooks/useMuaStyles.ts
- hooks/useMuaServices.ts
- hooks/useMuaProfile.ts
- services/muaStyleService.ts
- utils/makeupStyles.ts
- app/__tests__/muaProfileEditing.test.tsx
- components/mua/__tests__/MakeupStylePicker.test.tsx
- components/mua/services/__tests__/ServiceFormModal.test.tsx
- hooks/__tests__/unifiedStyles.test.tsx

Đã tạo:

- repositories/IMuaStyleRepository.ts
- repositories/ApiMuaStyleRepository.ts
- repositories/__tests__/muaCatalog.test.ts
- hooks/__tests__/muaCatalog.test.tsx
- docs/MAKEUP-CATALOG-PHASE-D.md

Không sửa ServiceDto, ApiMuaServicesRepository hoặc ApiMuaProfileRepository vì contract hiện có đã đúng. Không sửa backend/admin, Advisor/engine JSON v1.2, native ML/Gemini, portfolio/booking/payment, release/EAS/package ID hay dependencies.

## Kiểm thử đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| TypeScript toàn repo — node node_modules/typescript/bin/tsc --noEmit | PASS, exit 0 |
| ESLint các file Phase D (gồm tests) | PASS, không warning/error |
| Tám suite catalog/picker/service/profile/onboarding, sau chỉnh sửa cuối | 59 passed, 0 failed, 0 skipped |
| Jest toàn repo ở lượt kiểm tra rộng | 114 suites: 112 passed / 2 failed; 807 tests: 805 passed / 2 failed |
| Expo lint toàn repo | Không PASS: 3 errors, 21 warnings ở phần có sẵn ngoài Phase D |
| git diff --check | PASS |

Hai test toàn repo thất bại:

- features/makeupAdvisor/__tests__/engine20Simulation.test.ts — protected file checksum assertion.
- features/makeupAdvisor/__tests__/consolidationBoundary.test.ts — cùng protected file checksum assertion.

Cả hai cùng chỉ tới features/makeupAdvisor/ScanPhoto.tsx: manifest mong a1118308..., working file là 3fd11a03.... File ScanPhoto đã modified trong git status đầu Phase D và không được Phase D sửa. Kiểm tra read-only cũng cho thấy bản HEAD không trùng manifest. Không thay manifest/baseline để làm tests xanh. Các test ranking/compatibility và các suite portfolio/booking khác trong lượt chạy rộng đều qua. Sau lượt rộng có thêm/chỉnh test UI cuối; đã xác nhận lại tám suite bị ảnh hưởng (59/59), không tuyên bố đã chạy lại toàn bộ sau chỉnh UI nhỏ cuối đó.

Ba lỗi lint ngoài phạm vi:

- app/(admin)/payouts/[id].tsx:32 — react-hooks/set-state-in-effect.
- app/(admin)/private-media.tsx:17 — react-hooks/set-state-in-effect.
- components/booking/AddressPickerSheet.tsx:34 — react-hooks/set-state-in-effect.

Không sửa các file này. Các warning toàn repo cũng không bị che/suppress.

Các tests Phase D kiểm tra: catalog thực/empty/fallback/auth/abort/schema; ID/key nullable/order; chọn tối đa 5/20 và chặn thêm; duplicate ID và tên gần giống/trùng tên; lịch sử inactive/overflow; custom draft không pre-create; omitted styles/legacy tags; retry requestId/payload/image reuse; service ngoài specialties; xóa service style không xóa profile; failed mutation giữ cache cũ; profile active refetch được chuyên môn mới sau service thành công mà không có profile write; stale profile init và bảo toàn edits; remount/resume/reload query và cleanup listener.

Lượt Jest đầu trong sandbox gặp EPERM ghi transform cache. Đã chạy lại ngoài sandbox với cache tại D:\EXE\artifacts\phase-d-jest-cache. Lượt cold cache còn gặp timeout mặc định 5 giây; các lượt cuối dùng --testTimeout=20000 và thành công cho phần Phase D. Không đổi cấu hình Jest/dependency trong repo.

Logs/JSON ở D:\EXE\artifacts:

- phase-d-typecheck-final.log
- phase-d-lint-scoped.log
- phase-d-lint-global-final.log
- phase-d-core-tests-final.log / .json
- phase-d-all-tests.log / .json

## Chưa kiểm chứng với backend/device thật

Không gọi API production, không tạo/sửa hồ sơ hoặc dịch vụ thật, không migrate/import database. Các kiểm tra mobile dùng mocked adapters/responses và TanStack Query thật trong tests, không chứng minh transaction/idempotency/concurrency trên môi trường backend deployment. Contract và transaction backend được đọc trực tiếp; các tests Phase B cũ không được chạy lại trong Phase D vì backend chỉ đọc.

Chưa chạy APK/emulator/điện thoại Android, chưa đo layout native ở màn nhỏ 320/360px hoặc bàn phím/font scaling trên thiết bị thật. Code dùng text wrap, flex minWidth=0, vùng cuộn giới hạn và safe-area/keyboard wrapper hiện có; không báo PASS vật lý cho overflow chỉ dựa vào component tests. Không build APK/AAB hoặc thay EAS.

QA sau khi bạn tự build:

1. Onboarding: catalog/fallback, tìm kiếm, tạo tên draft và chọn 20; mục 21 bị chặn.
2. Từ cả màn Dịch vụ và Hồ sơ: mở create/edit, kiểm tra chuyên môn trước/discovery không trùng; chọn ngoài chuyên môn; 5 hợp lệ/6 bị chặn.
3. Lưu thành công: mở sửa hồ sơ, kiểm tra specialty mới có StyleId thật. Lỗi tổng 20 phải giữ form và không lưu service một phần.
4. Network retry: requestId và payload không đổi; không tạo service trùng. Bỏ style khỏi service không xóa khỏi profile.
5. Edit legacy: chỉnh giá không đổi styleIds/tags; inactive/archived chỉ đọc/giữ hoặc bỏ, không chọn lại; hồ sơ lịch sử >20 giữ/giảm đúng.
6. Admin đổi catalog: đóng/mở form, resume app hoặc bấm reload; tên/trạng thái mới không tự thay ID hay xóa draft đang sửa.
7. Android nhỏ: kiểm tra nested scroll, bàn phím che CTA, tên/key dài, font lớn, safe area, loading/error/retry và thao tác với TalkBack.

## Chuẩn bị Phase E — Portfolio Tagging

- Chốt schema/API structured portfolio links và DTO đọc/ghi StyleId/TermId; Phase B hiện chưa có các bảng/link này.
- Giữ legacy free-text tags, định nghĩa migration/mapping được review và omitted/[] semantics; không tự đoán bằng display name.
- Tái sử dụng lớp catalog hiện có, mở rộng types để lấy terms/metadata/group phù hợp khi Phase E được duyệt; không tạo catalog runtime thứ hai.
- Group chỉ để phân loại, không coi group là portfolio tag. Không suy diễn effect trong catalog tự được Advisor hỗ trợ.
- Cần backend rollout và reviewed canonical import manifest trước khi kỳ vọng đủ taxonomy chuẩn ở môi trường thật.
- Bổ sung tests quyền sở hữu, limits, active/history, usage counts, atomic save và MUA/service matching cho portfolio sau khi API tồn tại.

Phase D không triển khai portfolio tagging. Không commit/push/merge/deploy. Dừng tại Phase D chờ người dùng kiểm tra.
