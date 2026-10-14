# Chốt implementation — 12/10/2026

Theo yêu cầu mới nhất của chủ dự án: dừng build APK, chủ dự án tự commit/push/build. Không còn tiến trình Java có command line candidate được tìm thấy khi kiểm tra. Chưa tạo được APK tích hợp hoàn chỉnh; không tuyên bố Android runtime hoặc 16KB PASS.

## Code hoàn thành

Worktree `D:\EXE\bbeauty-app-mlkit-advisor`, branch `candidate/mlkit-advisor`, baseline `58be978`. Có photo-first entry trong Khám phá, consent, bounded normalizer, ML Kit/quality gates, knowledge base versioned/rules deterministic, ba phong cách tham khảo với lý do, bộ lọc tùy chọn sau kết quả, Explore matching thật, điều hướng MUA/service tới flow booking cũ, cleanup và fallback. Không upload ảnh/geometry. Production flag OFF, không dùng Gemini.

62 Jest tests/7 suites PASS; TypeScript exit0; lint phần mới exit0. 3 JUnit normalization policy tests PASS. Native module Kotlin Release và C++ đã compile; JS/Hermes bundle hoàn tất với route/module Advisor của candidate. GET Explore/search thật cho Korean trả2 MUA/3 dịch vụ; ID lấy catalog runtime.

APK assemble hoàn chỉnh NOT COMPLETED: host thiếu tài nguyên ở DEX, retry Ninja gặp đường dẫn header>260 ký tự. Resume có một lỗi cú pháp task đã được sửa; dừng theo yêu cầu chủ dự án trước khi có APK. Không dùng các kết quả compile này để tuyên bố flow trên điện thoại PASS. Script Build-Preview.cmd là hỗ trợ build local, không tự phát hành; không dùng task exclusion cho fresh build hoặc khi source native thay đổi. Fresh build Windows cần cache/workspace đủ ngắn, hoặc build EAS internal trên môi trường phù hợp.

## Push/deploy readiness

- FE candidate: READY để chủ dự án review, commit và push NHÁNH RIÊNG rồi build internal preview. Các file còn uncommitted/untracked; push riêng HEAD hiện tại sẽ không đưa code mới lên remote. Review `git diff` và `git status`, thêm cả app/features/modules/plugins/docs/type declaration cần thiết. Không thêm node_modules, generated android/.expo, APK/AAB, logs, cache hoặc secrets. package.json/lock có status M nhưng `git diff` nội dung rỗng; không có dependency JS mới.
- FE gốc `D:\EXE\bbeauty-app` / `feature/gps`: không phải candidate này; còn Gemini và thay đổi app config/NotificationService. Không push/gộp toàn bộ để phát hành Advisor.
- BE/Render: KHÔNG CẦN cho ML Kit MVP. API Explore live đã được kiểm tra. Repo gốc `feature/deleteupdate`, HEAD42fcc29 còn Gemini, Program/Explore changes và hai migration untracked. Có startup MigrateAsync trong Program.cs. Chưa nghiệm thu deploy binary đó; không coi READY push main/deploy. Render main Auto-Deploy On Commit có thể kích hoạt khi main đổi.
- Alpha: NO-GO phát hành hiện tại. Cần APK thực tế, QA nhiều máy/permission/orientation/ảnh lớn/lifecycle/memory, static+runtime16KB, regression booking/auth/chat/push/GPS, signing/ABI, Privacy Policy/Data Safety và phê duyệt bật production. AAB tương lai giữ package com.bbook.app, alpha, versionCode>4.

## Tự build preview

`eas.json` có profile `advisor-preview`: APK internal tự chứa, BBOOK_ADVISOR_ENABLED=1, không autoIncrement. Có thể dùng `eas build --platform android --profile advisor-preview` sau khi chủ dự án commit/push và kiểm tra cấu hình EAS/credential của mình. Không dùng profile production để thử vì production flag OFF và cố bật sẽ bị chặn. Không tự submit lên Play.

APK local giữ com.bbook.app, versionCode1 và debug signing theo native template. Không cài đè/gỡ alpha để thử; dùng máy ARM64 riêng chưa cài alpha. EAS build cần kiểm tra signing/version thực tế trước cài. Build internal không chứng minh tương thích với chữ ký Play.

Memory chưa FIXED: guard whole-process +128MiB/768MiB, lowMemory, headroom64MiB và max2 task/lifetime native module. Phải đo thực tế bản tích hợp; không tự lặp nhiều lần hay reset budget để né guard. Chỉ OPPO PoC cũ đã được chủ dự án test; candidate này chưa có hãng nào được xác nhận PASS.

Chi tiết: IMPLEMENTATION.md và QA-AND-RELEASE.md.
