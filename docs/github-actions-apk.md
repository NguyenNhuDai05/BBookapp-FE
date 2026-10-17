# GitHub Actions Release Candidate APK — 17/10/2026

## Phạm vi và trạng thái

Chỉ chuẩn bị workflow **APK Release Candidate để nghiệm thu thiết bị**. Chưa build APK local/cloud, chạy Actions, commit/push/deploy, sửa backend/database hoặc phát hành. Không có workflow/lệnh tạo AAB mới. Giai đoạn AAB vẫn phải chờ yêu cầu riêng rõ ràng “OK, build AAB”; RC build thành công không phải phê duyệt phát hành.

Chủ dự án đã gỡ bản Play và đồng ý giữ package `com.bbook.app`. Firebase, API, EAS project và khóa ký hiện có giữ nguyên. Không tạo package/keystore mới.

## Chính sách build mới

Trong `features/makeupAdvisor/buildConfig.js`, thêm cờ **build-time-only** `BBOOK_APK_RELEASE_CANDIDATE=1`:

- Chỉ hợp lệ với profile `tester-apk`.
- Cho phép tạo APK candidate trước nghiệm thu. Không yêu cầu và không tự đặt tester approval/device acceptance.
- Không cho RC đồng thời tuyên bố tester approval hoặc device acceptance đã approved.
- Không ghi cờ RC vào `extra`, native metadata hoặc runtime flags; config resolved của candidate bằng config release được phê duyệt trong test fixture.
- Mọi tester release không có cờ RC vẫn phải có đủ `BBOOK_ADVISOR_TESTER_APPROVED=1` và `BBOOK_ADVISOR_DEVICE_ACCEPTANCE=approved` như trước.
- Cờ RC không hợp lệ với profile đóng gói store, production hoặc profile khác. Không có thay đổi quyền rollout.

Đây là tách quyền *tạo APK phục vụ kiểm thử* khỏi quyền *phát cho tester/phát hành*. Việc tải artifact/cài thủ công để nghiệm thu không chứng minh nghiệm thu đã đạt. Không dùng artifact này như bằng chứng tự động cho phép phát hành.

## Cấu hình nghiệp vụ và tính tương đương

`release-apk-config.cjs` đọc **eas.json → build.tester-apk.env**, thêm `EAS_BUILD_PROFILE=tester-apk`, `NODE_ENV=production` và quyền RC. Không dùng EAS CLI/cloud hay biến EAS từ xa. API HTTPS là `https://beautybook-13zj.onrender.com/api`.

| Thuộc tính | RC APK hiện tại | Closed Testing mục tiêu trong repo |
| --- | --- | --- |
| Package/Firebase | com.bbook.app / google-services.json hiện có | Giống nhau |
| releaseEnvironment / transport | closed-test / https | Giống nhau |
| Native Advisor + ML Kit | Bật | Giống nhau |
| Thư viện gợi ý | Engine20, 20 phong cách + ảnh | Giống nhau |
| Face-Aware experimental ranking | Tắt | Tắt |
| Advisor Gemini cloud / data approval | Tắt / pending | Giống nhau |
| Diagnostics / __DEV__ | Tắt / false trong release | Giống nhau |
| Push identity / EAS projectId | Giữ cấu hình hiện có | Giống nhau |
| Quyền build | Candidate để nghiệm thu, chưa được phát hành | Giữ guard nghiệm thu/phê duyệt phát hành |
| Đóng gói/phân phối/chữ ký/version metadata | APK sideload bằng khóa hiện có được cung cấp | Có thể khác theo quy trình phát hành sau này |

Không đổi `app.config.ts`, `app.json`, `eas.json`, `flags.ts`, feature flags hoặc logic nghiệp vụ. Cặp profile tester đã tồn tại có cùng env nghiệp vụ và config resolved; kiểm tra CI so sánh toàn bộ config, không chỉ vài flags. Khi không còn bằng nhau, CI dừng trước Prebuild. So sánh profile store chỉ đọc config, không tạo/chạy workflow hay build store.

`production` mặc định hiện tắt Advisor; **không phải mục tiêu tương đương của RC này**. `advisor-closed-test` vẫn bị guard engine20 rollout chặn. Không tự mở các profile đó. Không thể xác nhận bản Play đang phát hành thật sự dùng env nào vì chưa truy cập Play Console/EAS remote env.

### Face-Aware ranking và Gemini

**ML Kit phát hiện khuôn mặt vẫn bật, nhưng Face-Aware ranking experimental đang tắt.** `localEngine` nhận cờ false, nên không kích hoạt các face-compatibility rules; gợi ý theo sở thích/dịp/hiệu ứng và fallback vẫn hoạt động. APK này cho phép kiểm thử scan, UI và luồng gợi ý đúng hành vi Closed Testing mục tiêu, nhưng không chứng minh chất lượng cá nhân hóa xếp hạng theo hình học khuôn mặt khi experimental bật. Muốn bật phải được duyệt cấu hình riêng và nghiệm thu lại; workflow không bật.

`useAdvisor` gọi `recommendFaceScan` trực tiếp; không tự gọi Gemini. Nhánh Advisor Gemini cloud đang tắt theo cấu hình mục tiêu. Không tìm thấy Gemini chatbot độc lập trong frontend đã audit. Tính năng AI Makeup ảnh riêng qua `/ai/makeup-recommendations/capabilities` phụ thuộc backend capability/consent, không cùng flag Advisor cloud. Chưa kiểm tra backend enabled/model/key/quota; không nhúng Gemini/server key vào app.

## Audit native và runtime

- Expo 57.0.24, React Native 0.86.3, React 19.2.3 trong lockfile; Node 22.22.3, Java 17.
- SDK 36, build tools 36.0.0, NDK 27.1.12297006, CMake 3.22.1; wrapper do Expo Prebuild cung cấp. `android/` được ignore, chỉ tái tạo trên runner.
- Local Expo module `bbook-face-analysis`: autolink class `expo.modules.bbookfaceanalysis.BBookFaceAnalysisModule`; ML Kit face-detection 16.1.7, face-mesh 16.0.0-beta3, ExifInterface 1.4.2. `withAdvisor` giữ native metadata và CMake flags hiện có.
- Camera/gallery: cùng plugins/quyền/native modules; phải test cấp quyền, hủy, background và scan thật.
- Booking/chat/upload: cùng API/auth/routes; chat booking là SignalR và `/chat/...`. Không đổi flags cho các luồng này.
- Notification: giữ `pushNotificationsEnabled=true`, `advisorRemotePushEnabled=true`, Firebase client và EAS projectId hiện có. Cần FCM credentials phía server/Expo và thiết bị thật để xác minh delivery. Không dùng EAS Build quota không có nghĩa loại bỏ dịch vụ push Expo.
- Updates vẫn tắt. Gradle release nhúng JS/ảnh, không cần Metro. CI từ chối artifact nếu thiếu JS bundle.
- Các nhánh frontend `__DEV__` đã audit liên quan logging/ErrorBoundary/memory/scan diagnostics. Cấu hình release dùng false, không thêm đường nghiệp vụ riêng cho RC.

## GitHub Free và quyền truy cập

Ngày 17/10/2026 đã mở trực tiếp `https://github.com/NguyenNhuDai05/BBookapp-FE` bằng trình duyệt không đăng nhập và thấy nhãn **Public**, default branch **main**. Không đổi visibility.

Theo tài liệu GitHub, Free hỗ trợ Environment secrets/variables cho public repo, không hỗ trợ chúng cho private repo. Workflow đã bỏ `environment: github-apk`, dùng **Repository secrets** để hoạt động cả với GitHub Free private mà không cần nâng gói/công khai repo. Không cần Repository variables cho RC.

Không có phiên đăng nhập GitHub quản trị sẵn để xác nhận gói tài khoản thật, quyền admin/write, Actions policy hoặc số phút/storage còn lại. Điều này không chặn chuẩn bị workflow: repo hiện public và workflow không dựa vào tính năng trả phí. Người có quyền quản lý secrets cấu hình chúng; người có quyền write chạy workflow. Nếu tổ chức/tài khoản tắt Actions hoặc chặn third-party actions thì cần người quản trị cho phép các actions được dùng.

GitHub standard hosted runner public repo được miễn phí theo chính sách hiện hành; artifact/cache/storage vẫn phụ thuộc giới hạn tài khoản. Private repo sử dụng phút/storage theo gói. Không thể bảo đảm quota còn lại nếu chưa đăng nhập; không nâng gói hoặc bật chi tiêu tự động.

## Secrets cần cấu hình

Vào repo → **Settings → Secrets and variables → Actions → Repository secrets**. Không tạo chúng trong Environment cũ.

| Secret | Giá trị |
| --- | --- |
| ANDROID_KEYSTORE_BASE64 | Base64 của keystore hiện có bạn chọn |
| ANDROID_KEYSTORE_PASSWORD | Mật khẩu keystore |
| ANDROID_KEY_ALIAS | Alias |
| ANDROID_KEY_PASSWORD | Mật khẩu private key |
| ANDROID_SIGNING_CERT_SHA256 | SHA-256 certificate của alias, 64 hex, chấp nhận dấu : |

**Không cần** tester approval, device acceptance, acceptance reference, Expo token, Google service-account hoặc Play credential để build candidate. Không đặt các cờ approval vào job. Nếu secrets hiện ở Environment, bạn cần tự thêm lại ở cấp Repository; không thể đọc ngược giá trị secret từ GitHub và agent không di chuyển/đọc keystore.

Đọc fingerprint của khóa hiện có bằng `keytool -list -v -keystore <file> -alias <alias>`; nhập mật khẩu khi được hỏi. Không tạo/đổi khóa. Copy base64 không in vào chat/log:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('D:\duong-dan\existing-keystore.jks')) | Set-Clipboard
# Sau khi dán vào GitHub Secret:
Set-Clipboard -Value ''
```

Repository đang public: chỉ commit cấu hình/scripts, không commit keystore/password/server credentials. `google-services.json` client đã track được giữ nguyên, không phải server service-account. Chỉ chạy workflow từ code/nhánh bạn tin cậy; repository secret không có lớp Environment approval. Workflow không chạy trên push/PR, không dùng pull_request_target, token chỉ contents:read, checkout không giữ credential. Keystore chỉ giải mã trong RUNNER_TEMP lúc ký và xóa sau đó; cache không chứa khóa. Artifact không chứa keystore/mật khẩu/server key. Không log giá trị secrets.

## Workflow và chứng cứ build

1. Chạy thủ công, tick xác nhận cài đặt. Kiểm tra input/5 signing secrets.
2. Cài npm bằng lockfile (include devDependencies cho compiler), Node/Java.
3. Chạy `node --test scripts/ci/release-policy.test.cjs`: tests dùng approval giả lập **chỉ trong test fixture**, reset env sau từng phép kiểm tra, không tạo chứng cứ nghiệm thu thật.
4. Nạp env tester-apk và cờ quyền RC; kiểm tra config resolved closed-test/https/package/flags.
5. Ghi provenance trước Prebuild, rồi Prebuild Android và kiểm tra native metadata, autolinking, Firebase plugin.
6. Gradle **chỉ `:app:assembleRelease`**. Trong output dùng một lần: bỏ debug signing mặc định release, đặt versionCode input; ký APK bằng existing key và kiểm tra certificate/package/version/bundle.
7. Kiểm tra input hashes không đổi; upload APK và thông tin build. Cache npm/Gradle dependencies, 2 workers/C++ jobs, heap 3 GB. Mặc định universal; arm64 chỉ bao phủ thiết bị ARM64.

Artifact gồm:

- `BBook-test.apk`, `SHA256SUMS.txt`, `manifest.sha256`, `build-info.txt`.
- `release-provenance.json`: commit SHA/tree, profile, business env, public config, business-config hash, hashes input, Node/Java/runner/SDK/NDK, ABI/versionCode và **releaseAuthorized=false, deviceAcceptance=pending**.
- `expo-public-config.json`, `signing-certificate.txt` (chứng chỉ public, không có private key).

Giữ artifact 7 ngày; tự tải và lưu hồ sơ trước khi hết hạn. Nghiệm thu phải ghi commit/config hash và kết quả thật. Bản đóng gói sau này cần checkout đúng commit đã test và đối chiếu config; chỉ khác packaging/signing/distribution/version metadata. Nếu source/flags thay đổi thì phải test APK mới. Hash không chứng minh bit-for-bit reproducibility hoặc đóng băng backend/Firebase state.

## Cách tự chạy APK

1. Review rồi tự commit/push tất cả file liên quan, gồm thay đổi `buildConfig.js`, workflow và CI scripts/tests. Workflow cần có trên default branch `main` để hiện nút Run workflow.
2. Thêm đủ 5 **Repository secrets** ở trên. Không cấu hình approval variables cho candidate.
3. Repo → **Actions → Android APK (manual only) → Run workflow**; chọn branch đã review, tick xác nhận, ưu tiên **universal**, đặt versionCode phù hợp. Đã gỡ bản Play nên lần cài mới không cần versionCode cao hơn bản đã gỡ.
4. Khi thành công, mở run → Artifacts → **BBook-APK-<run number>**, tải ZIP, giải nén và cài `BBook-test.apk`. Lưu toàn bộ provenance/config/checksum.
5. Test login, booking/chat/upload, notification, camera/gallery/ML Kit, scan nhiều tình huống, thư viện/ảnh/gợi ý, đóng/mở app khi không có Metro; ghi nhận phần Gemini phụ thuộc capability server. Dùng tài khoản và kịch bản có quyền phù hợp.
6. Báo kết quả thật. Build thành công không phải nghiệm thu, không phải đồng ý AAB hoặc phát hành.

## Kiểm chứng và điều chưa xác nhận

Đã kiểm tra chính sách RC không cần acceptance, complete resolved-config parity giữa RC và release fixtures, env parity cặp tester hiện có, guard phát hành giữ nguyên, RC bị chặn ngoài tester-apk và khi tự tuyên bố acceptance. Kiểm tra YAML/manual-only/repository-secrets/APK-only/provenance và cú pháp shell/Node; chạy config tests, không build.

Chưa thực thi npm ci/Prebuild/Gradle trên Ubuntu, ký APK thật, kiểm tra thiết bị, Play Console, EAS remote env hay server capabilities/FCM. Chưa xác nhận native runtime, thời gian/OOM/quota thực tế. Mã/config tương đương không thay thế test thiết bị hoặc kiểm chứng cơ chế Google Play split APK/signing trong giai đoạn được phép sau này.

Nguồn: [Repository đã kiểm tra](https://github.com/NguyenNhuDai05/BBookapp-FE), [GitHub Environment availability](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments), [Manual Actions](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow), [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [APK signing](https://developer.android.com/tools/apksigner).
