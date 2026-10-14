> Superseded for release configuration: see [RELEASE-READINESS.md](RELEASE-READINESS.md). Current unpaid real-user cloud stays OFF; old enable switches alone no longer approve it.

# BBook Feature Advisor — flow local, 13/10/2026

Đây là hướng dẫn hiện tại, thay cho contract v2 trong báo cáo APK trước. Source đã nối flow dữ liệu thật; kiểm thử mạng đã chạy với synthetic, **chưa thử selfie trên thiết bị**. APK preview cũ chưa chứa schema/UI mới. Không push, merge, deploy, bật billing, đổi Render hoặc chạy migrations.

## Luồng dữ liệu

1. Người dùng đồng ý xử lý ảnh trên thiết bị, chọn/chụp ảnh. Opt-in Gemini riêng mặc định tắt.
2. Native chuẩn hóa ảnh rồi ML Kit Detection lấy face count, box, Euler angles, contours/landmarks. Face Mesh hỗ trợ khi khả dụng, nếu không dùng contours thật. Quality gate chặn nhiều mặt, mặt nhỏ/cắt, góc đầu lớn và hình học thiếu ổn định; chưa có detector ánh sáng/che mặt đã hiệu chuẩn.
3. Extractor tạo **schemaVersion 3**: `detection.faceCount`, `boundingBox` theo [0,1] so với kích thước ảnh, `pose.yaw/pitch/roll` từ Euler Y/X/Z, `quality`, các tỷ lệ đo được + source, missing và limitations whitelist. `outlineAspect` là **cao/rộng** đường viền sau căn trục; `eyeSpacing` là khoảng cách tâm mắt/rộng mặt; `mouthWidth` là rộng môi/rộng mặt. Không gửi điểm tọa độ, mesh Z, URI, ảnh, base64, EXIF, JWT hoặc định danh tài khoản. Những trường không đo được bị bỏ qua, không dùng số mặc định. Không thêm descriptor dáng mặt chưa kiểm chứng.
4. Axios Advisor riêng gửi summary tới `http://127.0.0.1:5088/api`, qua USB `adb reverse`, dùng nonce tạm. API Explore/auth/booking hiện có không đổi. Host Development riêng đọc `FeatureAdvisor:ApiKey` từ User Secrets; không gọi Program production, DbContext hay migrations.
5. Backend kiểm tra strict JSON/body <=12 KiB, consent, version, count/box/pose/ranges/provenance/quality. Gửi Gemini **gemini-3.5-flash-lite** prompt gồm summary và metadata tin cậy; không gửi gợi ý local để viết lại. Gemini chỉ được trả JSON đúng **3** style khác nhau, 8 trường: `styleKey`, `title`, `shortDescription`, `whyItFits`, `makeupFocus`, `colorSuggestions`, `occasionFit`, `serviceQueryKeywords`. Bốn trường cuối là mảng string có giới hạn. Palette/dịp chỉ là lựa chọn để thử, không suy ra undertone/nhu cầu cưới từ ảnh.
6. Sau scan app tự tới results, cùng màn quét có status/loading khi chờ. Mỗi card có mô tả, lý do, điểm nhấn, màu/dịp, hướng dẫn chi tiết và chọn phong cách để tìm MUA. Không có màn “gửi Gemini”. Lỗi Gemini/timeout/429/schema sai → 3 ý tưởng local + thông báo lịch sự + nút thử lại. Hủy/rời/background chặn kết quả đến muộn, xóa ảnh tạm do Advisor sở hữu.
7. `styleKey` ánh xạ tên catalog sang ID thật; khi thiếu mapping dùng keyword Gemini. Explore trả MUA/service thật; match rỗng mở rộng tìm kiếm, giữ khu vực/ngân sách và gắn nhãn gần phù hợp. Không tạo ID, giá, rating hay lịch trống. CTA mở hồ sơ/dịch vụ trong flow hiện có, không tự tạo booking.

## Cấu hình và chạy local

Key hiện đã cấu hình và diagnostic PASS, không cần nhập lại. Không đưa key vào Expo/env public/source. Backend chỉ đọc `FeatureAdvisor:ApiKey` (env tương đương `FeatureAdvisor__ApiKey`).

Terminal 1:

```powershell
Set-Location D:\EXE\BeautyBook-feature-advisor
& .\docs\Start-LocalAdvisor.ps1 -EnableRealData
```

Script chỉ set env của process: Enabled/RealUserDataApproved/ModelAvailabilityVerified=true, Model=gemini-3.5-flash-lite. Không đổi User Secrets/appsettings/Render/billing. Host in `Real-data gate available: True` và **nonce 48 ký tự**, không phải Google API key. Nonce thay đổi mỗi lần khởi động. Không có `-EnableRealData` thì capability false và app dùng local fallback.

Terminal 2, sau khi nối **điện thoại Android test riêng** qua USB debugging và đã có Advisor dev client:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
$advisorNonce = Read-Host 'Nonce từ host local'
& .\scripts\Start-LocalAdvisor.ps1 -Nonce $advisorNonce -EnableGemini
```

Script bật profile `advisor-development`, Advisor/Gemini flags và loopback URL/nonce; `adb reverse tcp:5088 tcp:5088`; khởi động Expo dev client. Không có `-EnableGemini` thì không chia sẻ Gemini. Frontend/backend đều phải bật và tester phải opt-in. Production/default vẫn OFF; config chặn URL remote và loại bỏ URL/nonce khỏi build thường. Không đổi `EXPO_PUBLIC_API_URL` sang localhost để tránh chuyển Explore/đăng nhập/booking.

Gemini free tier được chọn theo yêu cầu của chủ dự án. [Điều khoản Google](https://ai.google.dev/gemini-api/terms) cho phép dùng input/output để cải thiện sản phẩm, có review, và yêu cầu không gửi thông tin cá nhân/nhạy cảm/bí mật. Không có chứng cứ các tỷ lệ khuôn mặt đã được Google xem là anonymous; consent không phải xác nhận tuân thủ điều khoản. `RealUserDataApproved` là quyết định bật thử nghiệm của chủ dự án, **không kiểm tra billing hay chứng nhận của Google**. UI nêu việc dùng dữ liệu trên free tier và cho phép bỏ qua. Đây còn là rủi ro trước khi giao tester.

## Dev client/APK local — chỉ hướng dẫn, chưa build mới

Expo Go không chứa module ML Kit này. Nếu chưa có Advisor debug dev client, chuẩn bị trong worktree frontend:

```powershell
$env:BBOOK_ADVISOR_ENABLED='1'
$env:BBOOK_ADVISOR_GEMINI_APPROVED='0'
$env:EAS_BUILD_PROFILE='advisor-development'
npx expo prebuild --platform android --no-install
$env:JAVA_HOME='C:\Users\Acer\.gradle\jdks\eclipse_adoptium-17-amd64-windows.2'
$env:ANDROID_HOME='C:\Users\Acer\AppData\Local\Android\Sdk'
$env:GRADLE_USER_HOME='D:\EXE\.ga'
Set-Location .\android
.\gradlew.bat :app:assembleDebug --max-workers=1 --no-daemon --init-script ..\docs\advisor\native-build.init.gradle '-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=768m -XX:ActiveProcessorCount=2' '-Pkotlin.compiler.execution.strategy=in-process' '-PreactNativeArchitectures=arm64-v8a'
```

APK tạo ở `android\app\build\outputs\apk\debug\app-debug.apk`, cài thủ công trên máy test riêng không có BBook alpha. Không dùng `install -r`/uninstall alpha; package vẫn `com.bbook.app`. Debug cho phép loopback HTTP; release preview cũ không phải dev client và không cập nhật JS qua Metro. Native build trước mất nhiều giờ, nên chưa chạy lại trong lượt này. ML Kit/native version không đổi ở lượt này. Audit APK cũ còn **15 prebuilt RELRO không đạt kiểm tra 16 KiB**; không dùng như bằng chứng release-ready hoặc hứa hỗ trợ máy 16 KiB.

## Lệnh kiểm thử

```powershell
# Frontend
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
npx jest features/makeupAdvisor/__tests__ --runInBand --cacheDirectory .expo/hybrid-jest-cache --silent
npx tsc --noEmit
npx eslint app.config.ts app/makeup-advisor.tsx features/makeupAdvisor --quiet
node scripts/Check-HybridAdvisorConfig.cjs

# Backend (không DB)
Set-Location D:\EXE\BeautyBook-feature-advisor
dotnet test BeautyBookBackend.Tests --filter FullyQualifiedName~FeatureAdvisor
dotnet run --project .\BeautyBookAdvisor.Diagnostics -- --verify
```

Smoke HTTP end-to-end synthetic qua đúng endpoint app, với Terminal 1 đang chạy:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
node scripts/Export-AdvisorFixture.cjs D:/EXE/BeautyBook-feature-advisor/BeautyBookBackend.Tests/Fixtures/FrontendFeatureSummary.json
$env:BBOOK_ADVISOR_LOCAL_NONCE=Read-Host 'Nonce từ host'
node scripts/Smoke-LocalAdvisor.cjs D:/EXE/BeautyBook-feature-advisor/BeautyBookBackend.Tests/Fixtures/FrontendFeatureSummary.json
```

Smoke thực hiện 1 request Gemini, chỉ in code/version/count/style keys, không in số đo/prompt/response/key. Fixture synthetic chỉ dùng test, không import vào app. `--serve` cũ vẫn là endpoint synthetic cố định, không nhận body; `--serve-advisor` là mode local mới nhận summary đã validate.

## Kết quả và phần chưa xác minh

Frontend **126 tests / 13 suites PASS**. Backend Advisor **41 tests PASS**. TypeScript/lint PASS. Gemini diagnostic mới **OK / selectedModelAvailable true / syntheticOnly true / validRecommendations 3**; HTTP smoke **OK / requestSchema 3 / syntheticOnly true / validRecommendations 3**, model gemini-3.5-flash-lite. Không đổi billing; project-specific quota không được đo. Host smoke đã dừng.

Chưa có thiết bị: chưa xác minh native SDK runtime, ảnh thật → Gemini, hiển thị/latency thực tế, thao tác camera/cancel/consent trên điện thoại hoặc dev APK mới. Trước tester cần test một mặt rõ, nhiều mặt, mặt nghiêng/cắt, không opt-in, offline, timeout/quota, hủy/rời/background, style không có service và CTA detail. Kiểm tra không có field ảnh/base64 trong request bằng inspect tên trường, tránh lưu/chia sẻ raw summary. Đánh giá nội dung makeup bằng người thật; validator/prompt không bảo đảm mọi câu Gemini chính xác. Explore hiện dùng dữ liệu backend thật, CTA đặt lịch là flow hiện có; không xác nhận lịch trống và không tạo booking trong smoke.

## File thay đổi trong lượt local này

| Repo | Files |
|---|---|
| Frontend config/flow | `app.config.ts`, `app/makeup-advisor.tsx`, `features/makeupAdvisor/faceFeatures/extractor.ts`, `advisorRecommendation.ts`, `advisorTransport.ts` (mới) |
| Frontend UI/matching | `AdvisorResults.tsx`, `AdvisorMatching.tsx`, `matchCatalog.ts` (mới) |
| Frontend tests | `__tests__/buildFlag.test.ts`, `faceFeatures.test.ts`, `geminiPipeline.test.ts`, `screen.test.tsx`, `advisorMatching.test.ts` (mới), `advisorTransport.test.ts` (mới) |
| Frontend scripts/docs | `scripts/Check-HybridAdvisorConfig.cjs`, `Start-LocalAdvisor.ps1` (mới), `Smoke-LocalAdvisor.cjs` (mới), `docs/advisor/LOCAL-E2E.md` (mới), banner trên report cũ |
| Backend contract/provider/host | `BeautyBookBackend/Program.cs` (khóa Advisor ngoài Development), `Services/FeatureAdvisorContract.cs`, `FeatureAdvisorDefinitions.cs`, `FeatureAdvisorProvider.cs`, `FeatureAdvisorLocalHost.cs` (mới), `BeautyBookAdvisor.Diagnostics/Program.cs` |
| Backend tests | `BeautyBookBackend.Tests/FeatureAdvisorTests.cs`, `FeatureAdvisorPipelineTests.cs`, `Fixtures/FrontendFeatureSummary.json` |
| Backend scripts/docs | `docs/Start-LocalAdvisor.ps1` (mới), `FEATURE-ADVISOR.md`, `GEMINI-SETUP.md` |

Những thay đổi native, hook lifecycle và DI/controller từ lượt trước được audit và giữ nguyên; working tree đã dirty trước lượt này. Không reset các thay đổi đó. Không sửa backend gốc `D:\EXE\BeautyBook`, cấu hình Render hoặc migrations. Backend bổ sung khóa môi trường để Advisor luôn tắt ngoài Development, kể cả khi vô tình kế thừa flag local.
