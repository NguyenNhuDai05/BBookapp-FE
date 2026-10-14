# Advisor Preview — kiểm tra source ngày 13/10/2026

> Cập nhật mới hơn: [SCAN-TIMING-AND-LOCAL-SIMILARITY.md](./SCAN-TIMING-AND-LOCAL-SIMILARITY.md). Thời gian hiện tại valid 10 s / quality invalid 5 s; mốc 3,6 s bên dưới là lịch sử.

APK Preview: GO để tự build phục vụ kiểm thử thiết bị với ML Kit + gợi ý local. Chưa xác nhận native compilation hoặc APK thành phẩm vì không chạy Gradle/EAS/prebuild. Gemini dữ liệu mặt thật: NO-GO; cloud OFF và approval pending. Production/Play release và deploy Gemini thật: NO-GO.

## Thay đổi trải nghiệm quét

- `scanPresentation.ts`: tối thiểu 3600 ms tính từ lúc bắt đầu inference, chỉ chờ phần thời gian còn thiếu sau khi phân tích và tạo gợi ý xong. Abort bỏ timer.
- `useAdvisor.ts`: gọi ML Kit và recommendation ngay, sau đó chờ hiển thị; không giữ native bitmap/detector thêm, không rerun inference, không áp dụng delay cho retryCloud. Generation check trước/sau timer ngăn kết quả cũ hiện lại.
- `ScanPhoto.tsx`: thanh quét đi đều từ trên xuống trong 1800 ms mỗi lượt, native driver; không phải phần trăm inference. Chỉ hiển thị contour/mesh thật khi có kết quả native.
- Phân tích thành công nhanh: khoảng hai lượt quét. Chậm hơn 3,6 s: không cộng thêm delay. Lỗi quality/native: báo ngay.
- Tests presentation: fast/slow/abort, timers được dọn; tests hook hiện có mock presentation để kiểm tra lifecycle riêng.

## APK/config/source

- `advisor-preview`: internal, developmentClient=false, buildType=apk, assembleRelease.
- Package `com.bbook.advisor`, scheme `bbookadvisor`; production/closed-test vẫn `com.bbook.app` / `bbookapp`. Config riêng cho cài song song; manifest thành phẩm cần kiểm tra sau build.
- Không dùng Firebase production cho preview. Native push OFF khi không có Firebase riêng. Inbox REST và đăng nhập email/password/JWT dùng API BBook hiện có. Deep links/OAuth/device acceptance chưa kiểm thử trên APK mới.
- `ScanSafety.kt`, module native, profile converter và presentation không bị gitignore loại bỏ. Không có .easignore. Root /android bị ignore nhưng modules/.../android không bị ignore.
- Nhiều file Phase 1/Gemini/UX chưa commit, gồm ScanSafety.kt. Build từ working tree này bằng EAS CLI; build từ remote HEAD sẽ thiếu source mới nếu chưa commit. Không chạy git clean/reset hoặc thay checkout.
- Preview diagnostics ON; metadata instrumentation Phase 1 còn cần kiểm chứng trên thiết bị. Không có API key Gemini trong cấu hình frontend.

## Tự build

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
npx eas-cli@latest build --platform android --profile advisor-preview
```

Agent không chạy lệnh này. Đăng nhập EAS đúng project. Credentials Android cần phù hợp package com.bbook.advisor; không thay key/package production. Cloud=0 nên APK này không gửi số đo mặt thật tới Gemini. Không cần deploy BE chỉ để thử quét local và thanh quét mới.

Sau build, kiểm tra bằng các script có sẵn:

```powershell
.\docs\advisor\Inspect-PreviewPackage.ps1 -Apk 'C:\path\advisor.apk'
.\docs\advisor\Inspect-ReleaseArtifact.ps1 -Artifact 'C:\path\advisor.apk' -Output 'D:\EXE\artifacts\advisor-new-16k.json'
```

Kiểm tra badging package=com.bbook.advisor, native module/mesh, flags; cài song song BBook Play. Test 5–10 ảnh liên tiếp, ảnh lỗi, hủy lúc thanh quét, app background, scan chậm, retry không quét lại. Native memory recovery/16 KiB vẫn DEVICE/ARTIFACT TEST PENDING; không suy từ tests JS là native an toàn.

## Backend/push/deploy

- Checkout tích hợp: D:\EXE\BeautyBook-advisor-integration-20261013, baseline GitHub main 986fbd2bdcd2b867bc73919b34d45e7a1281dfdf. Render production SHA chưa được cung cấp/xác minh.
- Backend gốc BeautyBook có dirty changes hướng upload AI/daily quota/migrations cũ: không push tất cả hoặc đưa nhầm vào Advisor summary-only. BeautyBook-feature-advisor vẫn không bị sửa trong lượt này.
- Module Advisor đã dùng host/JWT chính trong checkout cách ly; provider chỉ nhận categorical Makeup Profile, không selfie/raw mesh/định danh. Không đổi Render, secrets, billing, production DB.
- Tư vấn Gemini synthetic thật với model gemini-3.5-flash-lite đã PASS trong lượt tích hợp trước; lượt này không gọi lại API thật. Không coi đó là kiểm thử dữ liệu mặt người thật.
- Free Tier: dữ liệu suy từ khuôn mặt thật chưa được xác minh phù hợp để gửi theo điều khoản Unpaid; consent không tự giải quyết điều kiện này. Giữ chặn real-data, không nâng billing hoặc bypass guard.
- Trước push: review/select đúng file mới và diff FE/BE, kiểm tra secrets; commit riêng trên nhánh feature khi owner quyết định. Trước deploy: xác minh Render SHA, áp patch lên baseline phù hợp, kiểm tra cấu hình fail closed và rollout. Không bật cloud/data approval chỉ để thử chạy.
- 99 PostgreSQL tests skip khi không có database test; không đồng nghĩa toàn bộ production regression đã được xác minh.

Không build APK/AAB, commit/push/merge, deploy hoặc thay billing trong lượt kiểm tra này. Báo cáo kết quả test cuối cùng nằm trong phản hồi của chat.
