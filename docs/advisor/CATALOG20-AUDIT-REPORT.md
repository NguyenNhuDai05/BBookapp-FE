# Catalog 20, audit engine và giao diện — 2026-10-14

## Kết quả thực hiện và phạm vi cần duyệt

Đã load nguyên bản catalog 20 vào phần hiển thị/khám phá và thực hiện validation, không thay dữ liệu nguồn hay machine fields. Top 3 vẫn do engine thật 12 kiểu lựa chọn; UI chỉ ánh xạ nội dung theo stable key. Chưa bật 8 kiểu mới trong engine vì người dùng yêu cầu không đổi scoring/candidate behavior trước khi duyệt. Đề xuất cụ thể nằm trong CATALOG20-ENGINE-PROPOSAL.md.

Đã validate toàn bộ 20 core records. Chưa thể xác nhận toàn bộ catalog hợp lệ: 16 kiểu có đầy đủ nhóm nhãn hợp lệ, 4 kiểu có lỗi localization. UI vẫn hiển thị nội dung core của cả 20, nhưng không ghép hoặc hiển thị nhóm nhãn lỗi.

## Source of truth

- Input của người dùng: docs/advisor/input/bbook-makeup-catalog-20-vi-v1.2.json.
- Runtime presentation: features/makeupAdvisor/bbook-makeup-catalog-20-vi-v1.2.json, copy byte-for-byte từ input. SHA-256 và đối chiếu ở CATALOG20-STABILITY-CHECK.json.
- Runtime scoring hiện tại: features/makeupAdvisor/bbook-makeup-style-library.vi.json (v1.1, 12 kiểu) + styleLibrary.ts, techniqueCompatibility.ts và localEngine.ts. Các file này giữ nguyên.
- Backend không phải source of truth cho local style library. Backend sở hữu dữ liệu marketplace thật, numeric StyleId, dịch vụ, MUA và portfolio. JSON presentation không tự ghi DB hoặc thay đổi StyleId.

## Truy vết luồng thực tế

app/makeup-advisor.tsx mở AdvisorCamera hoặc Image Picker sau consent. useAdvisor.acquire giữ single-flight, adopt ảnh cache, chờ camera availability, ensureScanAdmission, normalize rồi analyze native. Native detector/mesh trả Analysis. extractFaceFeatures kiểm tra số mặt, kích thước, góc đầu, contours/mesh và tạo Extraction + summary V3. buildFaceProfile tạo profile V2, chỉ nhận số đo hữu hạn, có nguồn và qua quality gates. recommendFaceScan → recommendFromLibrary tạo AdvisorResult/MakeupRecommendation trong bộ nhớ. Không có API request/response cho Top 3 ở Face Scan local. Không thêm Gemini.

useAdvisor giữ completed result/extraction/owned photo theo phiên. Chọn sở thích là tùy chọn; mặc định occasion=null, intensity=null vẫn quét và nhận Top 3. Thay sở thích chỉ chạy local recommendation lại với extraction đã có, không chạy native inference. Đây là behavior cũ được giữ nguyên.

Sau stage=results, UI đọc presentation catalog và nhận extraction để lọc conditional tips. Fetch catalog marketplace chỉ enable ở stage=results; fetch dịch vụ/MUA trong result component, không tham gia critical path native. Mở chi tiết hoặc cuộn không chạy engine/inference.

## Scoring, candidate và trường dữ liệu

Candidate pool lấy từ styleLibrary 12 kiểu; chỉ cô dâu bị loại khi occasion khác wedding. Hardcode curated là tie-break, không phải danh sách tạo candidates.

Chỉ eyeSpacing, eyeAspect=min(leftEyeAspect,rightEyeAspect), browArch=mean(leftBrowArch,rightBrowArch), mouthAspect có rules tính điểm. Feature missing, thiếu nguồn, ngoài range, pose lỗi hoặc bị quality rejection không kích hoạt rule; eyesClosed loại dữ liệu mắt; expression hạn chế môi.

Ngưỡng hiện tại: eyeSpacing low<0.46/high>=0.52, vùng giữa neutral; eyeAspect <0.25/≥0.25; browArch <0.08/≥0.08; mouthAspect <0.30/≥0.30. Không thay ngưỡng.

faceCompatibility.ruleIds và techniqueKeys đều phải khớp rule active. faceScore = số feature được phong cách cover / số feature active. Mỗi feature có đóng góp capped, không tăng bằng rule trùng. preferenceScore +0.12 khớp occasion, +0.08 khớp intensity. finalScore=faceScore+preferenceScore. Bằng điểm: curated rồi key; diversity độ đậm chỉ áp dụng giữa ứng viên cùng điểm.

Tags không score; dùng metadata UI/search. colorPalette, shortDescription, signatureLook, techniques, quickSteps, imageKey/Brief/Focus không score. conditionalTips của catalog không score. whyTry/explanations giải thích; không thay title. Các số đo khác hiện có nhưng không có active rules nên không tự quyết định ranking.

faceAwareExperimental chỉ active khi flag bật và environment local/manual-test. advisor-preview bật mặc định trừ BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL=0; local cần opt-in. Không đổi flag/config hoặc Free Tier.

## Vì sao tên cũ khác và cách sửa

Engine đã lấy displayName của JSON v1.1; tên như Sắc đào mềm mại là dữ liệu displayName cũ, không phải tên technique hay Gemini. UI trước đó đọc row.title trực tiếp nên vẫn hiện nội dung cũ.

presentationCatalog.ts ánh xạ stable styleKey sang displayName của JSON v1.2. Ví dụ peach hiện Trang điểm tông đào ngọt ngào ở card, detail và selector dịch vụ/MUA. shortDescription/techniques/quickSteps/signatureLook/whyTry lấy từ v1.2. whyItFits và evidence của engine giữ ở phần lý do. Không mutate engine DTO, không đổi rank, machine keys hay keyword tìm kiếm đang hoạt động.

occasions/intensity/tags/colorPalette giữ nguyên mã trong JSON. UI dùng occasionLabels/intensityLabel/tagLabels/colorPaletteLabels. catalogLabelReference.json kiểm tra ngữ nghĩa/thứ tự mã-nhãn; length/order/language lỗi thì bỏ cả nhóm nhãn thay vì zip sai hoặc đoán nhãn. Không ghi đè dữ liệu người dùng.

## Lỗi dữ liệu và conditional tips

1. classic-glam: 5 tags [classic,hollywood,red-lips,vintage,timeless] nhưng 4 tagLabels; thiếu nhãn cho timeless. Nhóm tags không hiển thị.
2. soft-glam: colorPaletteLabels chứa warm brown. Nhóm palette chưa hiển thị.
3. western-glam: colorPaletteLabels chứa warm brown. Nhóm palette chưa hiển thị.
4. bridal-soft-glam: colorPaletteLabels chứa soft peach. Nhóm palette chưa hiển thị.

Nội dung còn lại của những kiểu này vẫn hoạt động. UI báo một số nhãn đang được cập nhật. Validator trả issues có styleKey/field/code, không crash luồng quét.

Conditional tip chỉ hiện nếu Extraction valid và profile measurement provisional, observation trùng chính xác. clean-girl:browArch high và peach:eyeAspect low có bucket được hỗ trợ. soft-korean dùng relatively_wide (profile không có observation này); douyin dùng mouthWidth low; latte/thai-glam dùng outlineAspect high/low chưa có bucket hiện hành: các tip này được giữ trong JSON nhưng không kích hoạt. Không tự chuyển relatively_wide thành high hay tạo ngưỡng mới. Nội dung editorial trong file vẫn cần review chuyên môn; UI không gọi đó là dữ liệu đo chắc chắn.

## Mô phỏng và coverage

CATALOG20-COVERAGE.md có bảng 20 kiểu; CATALOG20-COVERAGE.json chứa counters, score range, conditions và ví dụ. Đã chạy 6.912 trường hợp xác định (108 tổ hợp bucket/missing × 32 sở thích bao gồm null/null × bật/tắt experimental). Counts là kết quả tổng hợp, không phải tần suất thực tế hoặc xác suất.

Cả 12 kiểu engine cũ đều có ví dụ Top 3 khi xét đủ lựa chọn; 11 kiểu không phải cô dâu có ví dụ khi không chọn sở thích. Cô dâu chỉ khi wedding. Tắt experimental và không chọn sở thích cho natural/soft-glam/classic-glam trong 108 profiles; dữ liệu khuôn mặt không góp điểm khi flag tắt.

8 kiểu mới j-beauty, igari, ulzzang, western-glam, nude-makeup, fox-eye, sunkissed, glass-skin chưa có trong candidate pool nên không thể xuất hiện. JSON mới không có faceCompatibility. Không thể thay import thẳng: validator engine yêu cầu v1.1/12/compatibility; curated.indexOf(key mới)=-1 còn có thể ưu tiên sai nếu nạp tùy tiện.

## Giao diện và API

Đối chiếu code thực tế, màn hình result đã có featured Top 3, hai card còn lại responsive, section dịch vụ rồi MUA, palette, detail/catalog modals và bottom actions. Lượt này giữ bố cục đó và nối catalog 20/localization/conditional tips vào UI thực tế.

Tái sử dụng exploreService.home GET /Explore và search GET /Explore/search. Numeric ID resolve theo aliases hiện có; không sửa tên/mã API để vừa catalog UI. Dữ liệu thật: service image/name/price/author; artist avatar/cover/name/rating/reviewCount/styles/city; portfolio thumbnails từ featuredPosts theo muaId. Không có distance trong DTO nên không yêu cầu GPS hoặc tạo khoảng cách giả.

Backend read-only audit tại BeautyBook-advisor-integration-20261013/BeautyBookBackend/Services/ExploreService.cs: PublicArtists yêu cầu Listed+Approved, active/non-deleted user và block rules; services active và owner đủ điều kiện. Frontend tiếp tục dùng endpoint này, không bypass eligibility. Không kiểm chứng dữ liệu live trong lượt này.

TanStack cache/pagination/retry:false hiện có giữ nguyên; độc lập errors/empty/loading, API lỗi không clear Top 3. Service route /mua-detail với id, tab='Dịch vụ', serviceId; MUA route /mua-detail với id. Booking/auth không đổi. Mở/đóng style modal giữ result; khi rời hẳn Advisor thì lifecycle xóa ảnh hiện tại vẫn có hiệu lực.

## Hình ảnh và memory/lifecycle

20 imageKey có slot riêng trong styleImages.ts. assets/images/advisor/styles/manifest.json và README có imageBrief/visualFocus/path cho toàn bộ kiểu. Chưa có local WebP có quyền sử dụng; placeholder thống nhất và không dùng selfie. Không tải ảnh ngoài internet. Chưa thể đạt phần chân dung như ảnh tham chiếu cho đến khi có asset. ImageKey mapping không đổi machine key; palette colors chỉ minh họa nhãn, không đo màu da.

Timer giữ nguyên: valid min 10s, validation min 5s, watchdog processing 60s, sweep 1.8s. Cancellation abort presentation và generation kiểm tra chống stale result. Native single-flight lease, camera availability, cleanup, bounded decoding, privacy/consent không thay. Native normalizer đọc bounds trước decode, giới hạn input/cache, sampled bitmap ≤2560/≤16MB, output JPEG ≤5MiB và recycle trong cleanup. Memory guard dùng system pressure/headroom/cleanedWarmIdle anchor; không nâng budget để tạo thêm candidates.

CATALOG20-STABILITY-CHECK.json xác nhận 15 file bảo vệ đã snapshot không thay, và runtime JSON trùng byte với input. Không tuyên bố đã kiểm thử native runtime trên thiết bị chỉ từ checksum.

## File thay đổi trong lượt này

Modified: app/makeup-advisor.tsx (chỉ truyền extraction cho result); AdvisorResults.tsx; AdvisorMarketplace.tsx; AdvisorMatching.tsx; ResultVisuals.tsx; styleImages.ts; __tests__/resultMarketplace.test.tsx; assets/images/advisor/styles/README.md.

Added: bbook-makeup-catalog-20-vi-v1.2.json (runtime copy); presentationCatalog.ts; catalogLabelReference.json; __tests__/presentationCatalog.test.ts; __tests__/catalogCoverage.test.ts; scripts/Prepare-Catalog20.cjs; assets/images/advisor/styles/manifest.json; các báo cáo CATALOG20-*.md/json trong docs/advisor.

Không sửa localEngine/styleLibrary/techniqueCompatibility/profileV2/extractor/useAdvisor/faceAnalysis/timers/native/backend/schema/API/booking/auth/config. Không build APK/AAB/EAS, commit/push/merge hoặc deploy.

## Validation và phần chờ duyệt

TypeScript --noEmit: đạt. ESLint các file đổi: đạt, zero warnings. 81 test riêng biệt đạt qua các lượt kiểm tra liên quan (bao gồm 1 test mô phỏng 6.912 cases). CATALOG20-VALIDATION.json ghi 20 core records, 16 kiểu có đủ nhóm nhãn hợp lệ và lỗi chi tiết. Targeted tests: presentation/catalog validation, deterministic coverage, screen, marketplace, face-aware V2/integration, useAdvisor và scanPresentation. Các kiểm tra gồm nhãn đảo thứ tự/thiếu, title catalog, không mutate DTO/rank, 20 image slots, conditional tips quality, real DTO/routes/error/cache, optional preferences và timer/native cancellation mocks.

Chưa chạy visual/device QA 360–430dp, native memory/camera thực tế hoặc live API integration. Cần tự kiểm thử trên điện thoại sau build; review ảnh/typography và content dài tiếng Việt. Không có file ảnh mới trong lượt này ngoài catalog metadata.

Cần duyệt đề xuất engine/backend trong CATALOG20-ENGINE-PROPOSAL.md và xác nhận chỉnh 4 nhóm nhãn input. Catalog 20 đã được nối UI nhưng chưa là pool scoring 20; không báo hoàn thành phần engine 20 hoặc nhãn toàn bộ hợp lệ.
