# Fix EAS npm ci lockfile — 2026-10-14

## Nguyên nhân đã xác minh

Build dừng ở Install dependencies, trước Android/Gradle. Lockfile khi thêm expo-camera đã thiếu dependency bắc cầu:

```
expo-camera@57.0.6
└─ barcode-detector@3.2.2
   └─ zxing-wasm@3.1.3
      └─ type-fest@5.10.0
         └─ tagged-tag@1.0.0
```

Lock cũ có type-fest 0.7.1 và 0.21.3 cho các package khác, nhưng không có bản 5.x thỏa yêu cầu ^5.8.0 của zxing-wasm. Việc kiểm tra closure khi bổ sung camera trước đó của Codex đã không kiểm tra đủ semver của dependency cùng tên. Đây là thiếu sót của lần cập nhật lockfile trước.

Đã tái hiện đúng EUSAGE / Missing type-fest@5.10.0 / Missing tagged-tag@1.0.0 bằng `npm ci --include=dev --dry-run --ignore-scripts --no-audit --no-fund` trên bản lock cũ trong thư mục riêng.

## Sửa bằng resolver npm

Chạy `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` với npm 10.9.8, Node 22.22.3, trong `D:\EXE\.verification\advisor-lockfile-20261014`, dùng bản sao package.json và package-lock.json của dự án. Không dùng force/legacy-peer-deps và không chép thủ công entry từ một lockfile khác.

Resolver chỉ thêm hai entry:

- `node_modules/zxing-wasm/node_modules/type-fest` — 5.10.0.
- `node_modules/tagged-tag` — 1.0.0.

So sánh JSON toàn bộ lock trước/sau: không xóa package, không đổi version nào, không đổi metadata entry cũ. Sao chép nguyên lock đã được npm tạo và kiểm chứng về dự án. Trong task này chỉ thay `package-lock.json` và tài liệu này. package.json vẫn giữ trạng thái trước task, gồm expo-camera đã được cho phép từ trước.

Không nâng Expo SDK/React/React Native, không thêm native dependency độc lập, không sửa code ứng dụng hoặc cấu hình EAS/Play/package name. Junction node_modules của app vẫn trỏ đúng `D:\EXE\bbeauty-app\node_modules`; không chạy npm ci trên checkout đang dùng junction này.

## Kiểm chứng

- Lock cũ: tái hiện đúng hai Missing dependencies, exit 1.
- Lock sửa: clean install **thật**, `npm ci --include=dev --ignore-scripts --no-audit --no-fund`, exit 0; cài 1289 packages trong khoảng 3 phút, vào thư mục verification riêng.
- `npm ls type-fest tagged-tag --all`: exit 0, xác nhận đúng chuỗi dependency và giữ các version type-fest cũ cho package khác.
- SHA-256 lock trong verification và lock đã chép về app giống nhau.
- `git diff --check -- package-lock.json`: đạt.
- Lifecycle scripts được tắt trong clean-install verification. Đã kiểm chứng dependency resolution/install; chưa xác minh toàn bộ EAS Linux build, lifecycle scripts, Gradle hoặc APK.
- Không chạy lại bộ test UI: không sửa JS/TS hay thay phiên bản dependency cũ. Các kiểm tra source trước đó vẫn độc lập với sửa lock này.

## Cảnh báo peer React/Reconciler

Cảnh báo `react-reconciler@0.34.0` yêu cầu React ^19.3.0 đến từ `@testing-library/react-native@14.0.1 → test-renderer@1.3.0`, trong khi app dùng React 19.2.3. Đây là cảnh báo dev test dependency có sẵn; nó vẫn xuất hiện sau sửa nhưng clean install trả exit 0. Không phải EUSAGE dừng build lần này.

Giữ nguyên React theo SDK và test-tool versions để tránh mở rộng thay đổi khi ứng dụng closed testing. Không khẳng định peer warning đã được giải quyết; nếu cần xử lý riêng, cần chọn renderer tương thích và kiểm thử toàn bộ test tooling, không nâng React chỉ để xóa warning.

## Chạy lại

Từ `D:\EXE\bbeauty-app-mlkit-advisor`, chạy lại chính lệnh EAS và profile đã dùng. EAS phải upload bản package-lock.json vừa sửa. Không cần đổi profile hoặc xóa build cache để sửa lỗi thiếu metadata này.

Không chạy APK/AAB build, commit, push hoặc deploy trong task này.

Tài liệu npm: [npm ci](https://docs.npmjs.com/cli/v10/commands/npm-ci/) quy định lockfile phải đồng bộ và không tự sửa lock; [npm install](https://docs.npmjs.com/cli/v10/commands/npm-install/) cung cấp resolver để cập nhật lock.
