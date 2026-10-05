# BBook — audit APK thực tế và Data Safety

Ngày kiểm tra: 05/10/2026. Phạm vi: đọc APK, manifest nhị phân, toàn bộ class definitions trong 5 DEX, disassembly native chọn lọc, bundle Hermes và đối chiếu source/config. Không sửa code, không build, không push/deploy. Các bản trích xuất phục vụ audit nằm trong `.expo/apk-audit-preview/`.

## 1. Artifact đã xác minh

- File: `D:\EXE\bbeauty-app\artifacts\bbook-preview.apk`.
- Dung lượng: 115.731.652 byte.
- SHA-256: `82EC1224392D8F5E496BCB27BAA9302A1EDF90AC10EA30A5E474B2808E03B49A`.
- Có AndroidManifest.xml nhị phân, resources, 5 DEX, native libraries và bundle Hermes: đúng APK Android.
- Package `com.bbook.app`; versionName `1.0.0`; versionCode `2`; minSdk 24; targetSdk/compileSdk 36; launcher `com.bbook.app.MainActivity`.
- APK signature verification PASS, một signer, chữ ký v2 hợp lệ. Chưa đối chiếu chứng thư với upload key của Play Console.
- BuildConfig đóng gói: `BUILD_TYPE=release`, `DEBUG=false`, Hermes bật. Đây là release APK, không suy luận build debug chỉ vì tên preview hoặc dependency expo-dev-client.
- Hash kiểm tra lại sau audit không đổi.

## 2. Permissions từ manifest thực tế

APK có **31 uses-permission**, gồm:

```text
android.permission.ACCESS_COARSE_LOCATION
android.permission.ACCESS_FINE_LOCATION
android.permission.INTERNET
android.permission.READ_EXTERNAL_STORAGE [maxSdkVersion=32]
android.permission.SYSTEM_ALERT_WINDOW
android.permission.VIBRATE
android.permission.WRITE_EXTERNAL_STORAGE [maxSdkVersion=32]
android.permission.ACCESS_NETWORK_STATE
android.permission.CAMERA
android.permission.RECEIVE_BOOT_COMPLETED
android.permission.POST_NOTIFICATIONS
android.permission.WAKE_LOCK
com.google.android.c2dm.permission.RECEIVE
com.bbook.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE
com.sec.android.provider.badge.permission.READ
com.sec.android.provider.badge.permission.WRITE
com.htc.launcher.permission.READ_SETTINGS
com.htc.launcher.permission.UPDATE_SHORTCUT
com.sonyericsson.home.permission.BROADCAST_BADGE
com.sonymobile.home.permission.PROVIDER_INSERT_BADGE
com.anddoes.launcher.permission.UPDATE_COUNT
com.majeur.launcher.permission.UPDATE_BADGE
com.huawei.android.launcher.permission.CHANGE_BADGE
com.huawei.android.launcher.permission.READ_SETTINGS
com.huawei.android.launcher.permission.WRITE_SETTINGS
android.permission.READ_APP_BADGE
com.oppo.launcher.permission.READ_SETTINGS
com.oppo.launcher.permission.WRITE_SETTINGS
me.everything.badger.permission.BADGE_COUNT_READ
me.everything.badger.permission.BADGE_COUNT_WRITE
```

Custom permission DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION còn được khai báo với protectionLevel signature; không phải quyền người dùng cần đồng ý riêng.

Không thấy AD_ID, RECORD_AUDIO, READ/WRITE_CALENDAR, ACCESS_BACKGROUND_LOCATION hay READ_MEDIA_IMAGES/VIDEO. Permission tồn tại không chứng minh dữ liệu tương ứng đã được gửi. INSTALL_REFERRER không tự chứng minh có quảng cáo/Analytics.

Manifest có FirebaseInitProvider và các registrar Messaging/Installations, ExpoFirebaseMessagingService, FirebaseMessagingService, FirebaseInstanceIdReceiver và DataTransport CCT. Không thấy cấu hình tắt Firebase/FCM auto-init. Có service Expo location nhưng sự hiện diện service không chứng minh chạy định vị nền.

Expo Updates ENABLED=false, CHECK_ON_LAUNCH=NEVER. Không thấy Maps API key/component. Không thấy android:debuggable=true. Manifest không có usesCleartextTraffic riêng: chưa thể chứng nhận toàn bộ traffic thực tế chỉ từ điều này.

## 3. SDK thực sự được đóng gói

Kiểm tra 36.733 class definitions, không chỉ tìm tên trong package.json.

| Thành phần | Bằng chứng APK | Khởi tạo / giới hạn kết luận |
|---|---|---|
| Firebase Core | FirebaseInitProvider, FirebaseApp | onCreate của provider gọi FirebaseApp.initializeApp |
| FCM 25.0.1 | 112 lớp messaging, registrar, service/receiver | AutoInit.isEnabled đọc override hoặc FirebaseApp.isDataCollectionDefaultEnabled; manifest không tắt |
| Firebase Installations 18.0.0 | 70 lớp installations, registrar | Có đường sử dụng cùng FCM; dữ liệu mạng chưa quan sát trực tiếp |
| Firebase Analytics | Chỉ 5 lớp AnalyticsConnector/interface và measurement-connector 19.0.0 | Không có FirebaseAnalytics hoặc com.google.android.gms.measurement implementation. Không kết luận có Analytics từ connector |
| Crashlytics / Sentry / Firebase Performance | 0 class definitions của từng SDK | Không tìm thấy SDK tương ứng hoặc điểm khởi tạo trong source/bundle đã kiểm tra |
| Google DataTransport/CCT | 312 lớp datatransport | Có khả năng vận chuyển dữ liệu, chưa chứng minh hoạt động gửi diagnostics. Export delivery metrics BigQuery mặc định false; không thấy app bật |
| Expo Notifications | Module native và hàm Expo push trong Hermes | Có getExpoPushTokenAsync và đường post token về backend |
| Expo application/device/constants/location, filesystem/image-picker/image, clipboard/web-browser và React Native/Hermes | Module/lớp native thực tế | Cung cấp API cho app; không tự đồng nghĩa telemetry/crash upload |
| Expo DevLauncher | 8 lớp còn trong release | Delegate trả emptyList cho native modules/lifecycle handlers đã đọc; không coi dependency dev-client là uploader crash release |
| Expo Updates | Không có implementation expo.modules.updates trong DEX; có updatesinterface | Manifest tắt; không có bằng chứng cập nhật/telemetry từ Expo Updates |
| Google Maps / react-native-maps | 0 lớp thuộc SDK tương ứng | Không có Google Maps SDK trong APK này |
| Bugsnag, AppCenter, Instabug, Amplitude, Mixpanel, Segment, Adjust, AppsFlyer | 0 lớp theo namespace SDK đã rà | Không thấy native SDK; không phải chứng minh mọi dạng custom JavaScript tracking đều bất khả thi |

Các lớp com.facebook.react là React Native, không tự đồng nghĩa Facebook tracking. Không thấy Google Ads SDK hoặc Facebook AppEvents/Ads/Login SDK.

## 4. Đối chiếu source/config với APK

- package.json có expo-notifications, expo-device, expo-constants và expo-dev-client; config/native có Firebase và thông báo. APK xác nhận Messaging/Installations được đóng gói qua dependency native, dù không có @react-native-firebase trong package.json.
- app config/source bỏ Maps SDK phù hợp APK không có Maps. Location foreground và API GPS/manual address là phạm vi riêng.
- `services/NotificationService.ts:88` xin quyền thông báo; nếu không được cấp thì bỏ qua Expo push registration. `:125–132` lưu Expo token và POST `/Notification/device-token` với expoPushToken, platform, deviceName.
- Hermes thực tế có getExpoPushTokenAsync, Expo push endpoints và syncDeviceToken gọi API POST endpoint trên. Backend base URL trong bundle là `https://beautybook-13zj.onrender.com/api`.
- `components/AppErrorBoundary.tsx:15` chỉ console.error trong __DEV__. Trong Hermes APK, componentDidCatch chỉ trả undefined, không có upload. console.error không phải bằng chứng thu thập crash log.
- Source có @supabase/supabase-js, SignalR, axios: dependency JS/client network không tự chứng minh crash/analytics. Không dùng tên dependency để khai báo mục đích Analytics.
- Không xác định được commit build chính xác từ artifact. Những điểm đối chiếu trên phù hợp, nhưng không chứng nhận toàn bộ checkout hiện tại giống byte-for-byte với APK. Kết luận này áp dụng hash APK trên; AAB cuối cần kiểm tra riêng nếu build/config khác.

## 5. Kết luận ba mục Data Safety

| Mục | Có thu thập? | Có chia sẻ? | Bắt buộc/tùy chọn | Mục đích | Cách điền hiện tại |
|---|---|---|---|---|---|
| Nhật ký sự cố | Không có cơ chế thu thập được nhận diện trong APK/source đã audit | Không có đường chia sẻ được nhận diện | Không áp dụng nếu không thu thập | Không áp dụng | Có cơ sở bỏ mục Crash logs đang khai báo trong CSV cũ; chưa quan sát traffic crash thực tế |
| Thông tin chẩn đoán | **UNKNOWN / CẦN DYNAMIC TEST** | UNKNOWN đối với luồng chưa xác định; provider exception chỉ áp dụng nếu đúng quan hệ xử lý hộ | UNKNOWN | UNKNOWN; không tự chọn Phân tích từ tên MessagingAnalytics/CCT | **Chưa chốt**, không giữ tùy chọn/Phân tích của CSV cũ như một kết luận đã xác minh |
| Mã nhận dạng thiết bị hoặc mã nhận dạng khác | **Có**, theo đường khởi tạo SDK, chức năng token và mô tả chính thức | **Không**, đối với luồng Firebase/Expo xử lý push hộ app theo ngoại lệ service provider; không phát hiện luồng chia sẻ độc lập khác | **Bắt buộc** ở cấp loại dữ liệu vì native FCM/FID không có lựa chọn tắt được chứng minh; Expo registration riêng phụ thuộc quyền thông báo | **Chức năng của ứng dụng** | Thu thập; không nhất thời; bắt buộc; Chức năng. Bỏ Phân tích cho ID nếu không có bằng chứng sử dụng đó |

Mã nhận dạng ở đây là installation ID/push token, không phải đã tìm thấy IMEI, advertising ID hoặc việc theo dõi quảng cáo. SDK/push token được lưu qua vòng đời yêu cầu nên không khai báo xử lý nhất thời. Từ chối POST_NOTIFICATIONS không chứng minh Firebase Installations/FCM ngừng khởi tạo native.

Đối với diagnostics: tài liệu Firebase nêu FCM/SDK có app version và Firebase user-agent (thông tin OS/thiết bị/SDK), đồng thời có các điều kiện riêng cho dữ liệu delivery metrics. Cần phân loại payload thật, sự liên kết định danh và đường gửi; không thể bỏ diagnostics chỉ vì thiếu Crashlytics, cũng không thể chọn Analytics vì có CCT. Hiện chưa xác minh payload thực tế.

**Phân biệt mức bằng chứng:** đóng gói SDK và mã khởi tạo đã xác minh; đường gọi API trong bundle đã xác minh; việc server thực sự nhận từng payload trong một phiên chạy **chưa quan sát**. Không tuyên bố đã capture network.

Không lấy crash reports do hệ điều hành/Google Play tạo ra để tự động coi app có Crashlytics. Nếu có luồng app/SDK gửi crash độc lập, phải bổ sung khai báo theo luồng đó.

## 6. Dynamic test chính xác cần làm để chốt diagnostics

ADB enumeration trong môi trường audit không thành công vì daemon không khởi động; chưa kiểm tra được điện thoại/traffic. Không thay APK, không repack hoặc bật thêm SDK.

1. Dùng đúng APK/hash trên ở thiết bị hoặc profile test riêng, cài mới để tránh preferences cũ. Không xóa dữ liệu tài khoản đang dùng chỉ để audit.
2. Capture traffic có khả năng đọc payload hoặc dùng tracing/log phía SDK/provider/backend. Chỉ thấy hostname hay logcat không đủ chứng minh loại dữ liệu; HTTPS mã hóa cũng không cho biết payload.
3. Quan sát lần mở đầu trước đăng nhập, từ chối quyền thông báo, đóng/mở lại; rồi đăng nhập và cấp quyền thông báo. Kiểm tra FID/FCM registration, Expo push token và request device-token; che token/email trong bằng chứng.
4. Gửi push test: nhận foreground/background, mở thông báo, restart app. Kiểm tra có CCT/delivery/diagnostic request không, payload có app version, model/OS, error/latency/counters hoặc identifier đi kèm không; phân biệt user-agent thuần túy với dữ liệu chẩn đoán.
5. Thử mất mạng/timeout và phục hồi; nếu có lỗi/crash tái hiện được an toàn trên tài khoản test, kiểm tra gửi báo cáo ngay và lần mở sau. Force-stop không phải crash và không dùng làm chứng minh đã thử crash uploader.
6. Xác minh runtime preferences auto_init và delivery_metrics_exported_to_big_query_enabled nếu có quyền đọc trên thiết bị test. Không giả định chúng giống defaults khi app từng được cài.
7. Nếu có diagnostics off-device: ghi trường dữ liệu, nơi nhận, mục đích, có thực sự tắt được thu thập không. Nếu không có opt-out thì không chọn tùy chọn. Nếu chỉ nhà cung cấp xử lý hộ thì áp dụng ngoại lệ chia sẻ. Nếu không thấy upload: kết hợp phạm vi test với code và tài liệu SDK; không dùng một phiên im lặng làm bằng chứng tuyệt đối.

Nếu release không tin cậy certificate proxy, ghi giới hạn thay vì coi không đọc được traffic là không thu thập; chọn thiết bị test/instrumentation phù hợp, không build lại APK để đổi hành vi audit.

## 7. Nguồn chính thức và evidence

- [Google Play: khai báo, mục đích, ngoại lệ chia sẻ và dữ liệu tùy chọn](https://support.google.com/googleplay/android-developer/answer/10787469).
- [Firebase: disclosure theo từng SDK](https://firebase.google.com/docs/android/play-data-disclosure).
- [FCM Android: auto initialization](https://firebase.google.com/docs/cloud-messaging/android/get-started).

Evidence cục bộ trong `.expo/apk-audit-preview/`: `manifest-tree.txt`, `permissions.txt`, `dex-classes.txt`, `sdk-scan.json`, `hermes-disassembly.txt`, `native-selected-classes3.dex.txt`, `native-selected-classes4.dex.txt`, `native-auto-init-and-devdelegate.txt`.

Các điểm disassembly: Hermes componentDidCatch khoảng dòng 1106391; syncDeviceToken khoảng 1318044–1318104. Native classes4 FirebaseInitProvider.onCreate khoảng 3451; MessagingAnalytics.deliveryMetricsExportToBigQueryEnabled khoảng 1953. AutoInit.isEnabled và DevLauncher delegate có file riêng để kiểm tra.

**Trạng thái cuối:** hoàn tất static audit APK; chưa hoàn tất dynamic verification diagnostics. Chưa thể nói cả ba mục Data Safety đã chốt tuyệt đối hoặc APK này chứng minh AAB tương lai được Google Play chấp nhận.
