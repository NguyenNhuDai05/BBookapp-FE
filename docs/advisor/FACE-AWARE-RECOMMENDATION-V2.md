# Face-Aware Recommendation V2 — 13/10/2026

## Trạng thái và phạm vi

IMPLEMENTED + TESTED WITH SYNTHETIC/MOCK; DEVICE TEST PENDING. Engine đang chạy được nâng cấp trực tiếp, không có engine V2 song song. Không build APK/AAB/Gradle/prebuild, commit/push/merge/deploy hoặc sửa BE/DB. Mọi dirty changes trước đó giữ nguyên.

FE branch candidate/mlkit-advisor, HEAD a037eadc0207379312bee87313c380ae14428a65. Advisor tham khảo feature/AI HEAD e9d91035400daeb41c2c7a3efd2c66f7ef092253 sạch; BBook feature/deleteupdate HEAD 42fcc29d1f0c8fc30002109a0b09dd52b941d980 có dirty legacy AI/quota/migration: không sửa/tích hợp chúng.

JSON gốc docs/advisor/input/gemini-code-1791882215261.json đã đọc, không ghi đè. App load features/makeupAdvisor/bbook-makeup-style-library.vi.json v1.1. Giữ 12 nội dung biên tập v1.1 và thêm faceCompatibility (lớp V2); không dùng conditionalTips chưa chuẩn hóa trong JSON gốc làm rule ngầm.

## Source/functions

| File | Chức năng |
|---|---|
| faceFeatures/extractor.ts | extractFaceFeatures thêm qualityContext.eyesClosed local, không đổi Face Summary v3 hoặc inference |
| faceFeatures/profileV2.ts | buildFaceProfile, measurementKeys, observationPolicy: finite/source/range/pose/expression/closed-eye evaluation và categories provisional |
| techniqueCompatibility.ts | 15 technique keys, 8 compatibilityRules, validCompatibility; tất cả experimental/pending |
| bbook-makeup-style-library.vi.json | faceCompatibility.techniqueKeys/ruleIds cho đúng 12 styles, không sửa kỹ thuật vốn có |
| styleLibrary.ts | validLibrary kiểm tra metadata, reference rule/key và duplicate |
| localEngine.ts | recommendFromLibrary: profile -> active rule -> score mọi style -> optional preference -> top3 -> explanations/trace |
| advisorRecommendation.ts | localRecommendations truyền cả local features/qualityContext; optional response metadata, provider validation vẫn strict |
| app.config.ts / flags.ts | advisorFaceAwareExperimental / faceAwareExperimental, Preview default ON; production/closed-test OFF |
| RecommendationDebug.tsx | Trace cục bộ có nút mở, chỉ diagnostic local/manual-test |
| app/makeup-advisor.tsx | Dùng result hiện có để render debug; không thêm màn hình/inference |
| AdvisorResults.tsx | Một thông báo experimental/fallback chung, không score/% ở cards |
| Check-HybridAdvisorConfig.cjs | Kiểm tra flag và APK profile thực bằng Expo config, không prebuild |
| faceAwareV2/faceAwareIntegration/recommendationDebug/buildFlag/styleLibrary/localSimilarity tests | Counterfactual, gating, fair score, actual extractor wiring, regression |

useAdvisor đang lưu completed extraction; setPreferences chạy localRecommendations với extraction đó. Không picker/normalizer/ML Kit/HTTP mới; mới thay preference thì source vẫn local. Timer valid 10 s / quality invalid 5 s, JS gate, native memory guard, cancellation/cleanup giữ nguyên. Không đụng Kotlin trong nhiệm vụ V2.

## Measurement inventory

Tất cả giá trị là number finite, dimensionless. Tọa độ raw chỉ local trong Analysis, không nằm trong Profile/trace. X/Y được xoay theo trục nối tâm hai mắt để giảm roll; w/h là span của outline trên hai trục này. Không có đơn vị mm. Profile chứa 33 measurement slots và hai nhóm tổng hợp eyeAspect=min(L,R), browArch=mean(L,R). Mỗi slot có key, value|null, observation, quality, calibration, reason, sourceFeatures.

Common validity: Face Summary schema3, single/frontal face, box normalized trong [0,1], pitch/yaw <=15°, roll <=10°, source detection/mesh, giá trị đúng range, không declared missing. Đây là quality gate kế thừa, không accuracy guarantee. Source mixed được extractor ghi detection thận trọng khi bất kỳ outline/eyes prerequisite fallback detection.

Common calibration: tất cả provisional; không confidence phần trăm/nhãn reliable. Perspective và che mặt có thể thay đổi mọi phép đo dù pose pass. Unknown chỉ loại feature, không loại profile hợp lệ còn feature khác.

| Measurement | Công thức / normalize | Điểm/region | Range | Thiếu/biểu cảm | Ranking V2 |
|---|---|---|---|---|---|
| outlineAspect | h/w | outline contour1 hoặc mesh outline | .5–2.5 | thiếu/che outline; perspective | Không |
| eyeSpacing | distance(tâm hai mắt)/w | mắt contour6/7 hoặc mesh | 0–1 | thiếu mắt; nhắm mắt local -> reject | Có |
| leftEyeWidth | spanX/w | leftEye | >0–1 | thiếu contour, nhắm -> reject profile | Không |
| rightEyeWidth | spanX/w | rightEye | >0–1 | như trái | Không |
| leftEyeAspect | spanY/spanX | leftEye | >0–1 | closed detector bỏ; chớp mắt ảnh hưởng | Có, nhóm eyeAspect |
| rightEyeAspect | spanY/spanX | rightEye | >0–1 | như trái | Có, nhóm eyeAspect |
| leftEyeTilt | abs(atan2(endpoint dy,dx))/pi | leftEye endpoints theo X | 0–.25 | thiếu/nhắm; roll có thể ảnh hưởng | Không |
| rightEyeTilt | như trái | rightEye | 0–.25 | như trái | Không |
| eyeWidthDifference | abs(widthL-widthR)/w | hai mắt | 0–1 | phối cảnh/nhắm; local-only | Không |
| leftEyePosition | (centroidY-top)/h | leftEye, outline | 0–1 | local-only; perspective | Không |
| rightEyePosition | như trái | rightEye, outline | 0–1 | local-only; perspective | Không |
| leftBrowLength | spanX/w | BrowTop contour2 hoặc mesh | >0–1 | thiếu/thưa/che region | Không |
| rightBrowLength | spanX/w | BrowTop contour4 hoặc mesh | >0–1 | như trái | Không |
| leftBrowArch | max distance to endpoint chord / brow spanX | leftBrowTop | 0–1 | thiếu/chord0; nhướng mày ảnh hưởng | Có, nhóm browArch |
| rightBrowArch | như trái | rightBrowTop | 0–1 | như trái | Có, nhóm browArch |
| leftBrowTilt | abs endpoint angle/pi | leftBrowTop | 0–.25 | thiếu; biểu cảm/pose | Không |
| rightBrowTilt | như trái | rightBrowTop | 0–.25 | như trái | Không |
| leftBrowEyeGap | (eyeY-browY)/h | mắt và brow trái | 0–1 | thiếu; nhướng mày/nhắm mắt | Không |
| rightBrowEyeGap | như trái | mắt và brow phải | 0–1 | như trái | Không |
| noseBridgeLength | spanY/h | contour12 hoặc mesh noseBridge | >0–1 | thiếu; yaw ảnh hưởng | Không |
| noseBaseWidth | spanX/w | đúng 3 điểm contour13 | >0–1 | thiếu; yaw/biểu cảm | Không |
| mouthWidth | mouth spanX/w | upperLipTop8/lowerLipBottom11 hoặc mesh | >0–1 | thiếu, cười -> bỏ | Không |
| mouthAspect | mouth spanY/mouth spanX | cùng hai lip regions | >0–1 | cười -> bỏ; nói/há môi vẫn là giới hạn | Có |
| upperLipThickness | abs(meanY upperInner-upperOuter)/h | regions8/9 | >0–1 | thiếu/cười -> bỏ | Không |
| lowerLipThickness | abs(meanY lowerInner-lowerOuter)/h | regions10/11 | >0–1 | thiếu/cười -> bỏ | Không |
| mouthPosition | (mouth centroidY-top)/h | lips/outline | 0–1 | local-only; thiếu/cười -> bỏ | Không |
| lowerFaceHeight | (bottom-mouth centroidY)/h | lips/outline | >0–1 | thiếu/cười -> bỏ | Không |
| outlineUpperWidth | spanX của band Y=.25 +/- .08 /w | outline | >0–1 | band <2 points; perspective | Không |
| outlineMiddleWidth | band Y=.5 +/- .08 /w | outline | >0–1 | như trên | Không |
| outlineLowerWidth | band Y=.75 +/- .08 /w | outline | >0–1 | như trên | Không |
| chinWidth | band Y=.9 +/- .08 /w | outline | >0–1 | như trên | Không |
| outlineCompactness | 4*pi*polygonArea/perimeter² | ordered outline | 0–1 | local-only diagnostic; thiếu contour | Không |
| meshProjectedArea | tổng projected triangle area/(w*h) | SDK triangles | 0–4 | chỉ mesh468/topology valid, local-only diagnostic | Không |
| meshRelativeZSpan | span(relativeZ)/w | mesh468 | 0–4 | chỉ mesh valid, local-only diagnostic; không depth giải phẫu | Không |

Detector còn cung cấp bounding box, Euler angles, landmarks và probabilities mắt mở/cười nếu có. Probabilities dùng closed<.4, smiling>.55 kế thừa extractor; không đưa probabilities/raw coords vào Profile/cloud. Không suy một/hai mí, dáng mặt, độ nhô gò má, undertone, loại da.

## Observation và technical evidence

Quản lý ngưỡng duy nhất trong observationPolicy; kế thừa buckets PoC trước, KHÔNG tạo threshold riêng từng style:

| Nhóm | Low | High | Giá trị nằm giữa |
|---|---|---|---|
| eyeSpacing | <.46 | >=.52 | neutral, không kích hoạt rule |
| eyeAspect | <.25 | >=.25 | không dead zone |
| browArch | <.08 | >=.08 | không dead zone |
| mouthAspect | <.3 | >=.3 | không dead zone |

Categories là provisional projections để thử nghiệm, không gọi mắt gần/xa theo classifier đã kiểm chứng, không đồng nhất eyeAspect với nếp mí hoặc mouthAspect với môi dày/mỏng. Các mốc chưa được chuyên gia hiệu chuẩn; vùng sát ngưỡng có thể đổi category giữa hai lần chụp. Cần data/review MUA và đánh giá repeatability trước release. Không tạo số confidence hoặc tự sửa ngưỡng trong device test.

Nguồn kỹ thuật tham khảo: [Charlotte Tilbury eye shapes](https://www.charlottetilbury.com/us/secrets/what-eye-shape-do-i-have), [Bobbi Brown thin eyeliner](https://www.bobbibrowncosmetics.com/how-to-hooded-eyes-1), [Bobbi Brown natural arch](https://www.bobbibrowncosmetics.com/find-your-brow), [L'Oréal lip liner](https://www.lorealparisusa.com/beauty-magazine/makeup/lip-makeup/matte-lipstick-and-matte-lip-liner-combos). Các nguồn mô tả kỹ thuật; KHÔNG xác minh threshold normalized hoặc chứng minh style compatibility của BBook. Rules phía dưới là ngoại suy experimental cần review, không trích nguồn thành chứng nhận MUA.

## 12 style / technique metadata

Taxonomy 15 keys, lấy từ kỹ thuật thực trong bản v1.1. Không ép số rule bằng nhau. Rule IDs global chỉ tham chiếu khi style có technique thật:

| Style | Technique có liên quan ranking (ngoài ra còn base/cheeks/contour metadata) |
|---|---|
| Soft Korean | soft-eyeliner, soft-brow-shaping, soft-blurred-lips; gradient-lips/gloss/shimmer không tự thêm điểm |
| Douyin | outer-eye-emphasis, gradient-eyeshadow, soft-brow-shaping, soft-blurred-lips |
| Clean Girl | soft-eyeliner, natural-brow-styling |
| Natural | soft-eyeliner, natural-brow-styling, soft-blurred-lips |
| Peach | soft-eyeliner, outer-eye-emphasis, gradient-eyeshadow, soft-brow-shaping, soft-blurred-lips |
| Strawberry | soft-eyeliner, natural-brow-styling, soft-blurred-lips |
| Latte | soft-eyeliner, outer-eye-emphasis, gradient-eyeshadow, defined-lip-outline |
| Soft Glam | soft-eyeliner, outer-eye-emphasis, gradient-eyeshadow, defined-lip-outline |
| Thai Glam | outer-eye-emphasis, gradient-eyeshadow, defined-lip-outline |
| Smokey Eyes | gradient-eyeshadow, soft-brow-shaping |
| Bridal Soft Glam | soft-eyeliner, gradient-eyeshadow, soft-brow-shaping, defined-lip-outline |
| Classic Glam | outer-eye-emphasis, defined-lip-outline |

Bridal chỉ được chọn khi occasion=wedding chủ động. Tất cả metadata đầy đủ ở JSON; không sửa nội dung hữu ích hoặc copy rule không phù hợp từ JSON gốc. Style có nhiều technique không được bonus chỉ vì có nhiều key.

## 8 rules / review

Tổng global rules: 8 experimental, 8 pending review, 0 MUA verified. Có thể kích hoạt trong Preview, không production. Explanation được dùng thực trong ranking và phần hướng dẫn:

| Rule | Observation -> technique | Lý do thử |
|---|---|---|
| spacing-low-outer | eyeSpacing low -> outer-eye-emphasis | khám phá bố cục nhấn đuôi mắt |
| spacing-high-soft | eyeSpacing high -> soft-eyeliner | viền gọn thay vì kéo đuôi dài |
| opening-low-soft | eyeAspect low -> soft-eyeliner | bắt đầu bằng viền mảnh, kiểm tra khi mở mắt |
| opening-high-gradient | eyeAspect high -> gradient-eyeshadow | tăng màu chuyển sắc từng lớp |
| arch-low-soft | browArch low -> soft-brow-shaping | giữ nét mềm, không ép vẽ đỉnh cao |
| arch-high-natural | browArch high -> natural-brow-styling | theo đường cong sẵn có, chải và bổ sung nét |
| lip-low-outline | mouthAspect low -> defined-lip-outline | thử viền cùng màu, tán vào trong |
| lip-high-soft | mouthAspect high -> soft-blurred-lips | tăng màu từ giữa và làm mềm mép |

Eye opening, arch và lip relationships là lựa chọn nghệ thuật, không quy luật cơ thể đẹp/xấu. Không có rule đủ cơ sở cho outline/nose/lower-face/chin/eye tilt để ranking: các feature đó giữ measurement, không bí mật đổi điểm. Các tỷ lệ ấy cần review chuyên môn riêng; đây là giới hạn có chủ đích.

## Scoring / giải thích / fallback

1. Validate từng measurement, tạo Profile V2; value invalid thành null. Với closed-eye context bỏ eye geometry, vẫn giữ lip/brow đủ điều kiện. Smiling bỏ lip/lower-face nhạy biểu cảm. Thiếu một phía eye/brow -> group unknown.
2. Chỉ kích hoạt global rule matching observation + provisional quality + experimental gate. Thử gắn verified/pending bị validator từ chối; hiện không có verified rule nào để bật production.
3. Chấm mọi style trước chọn top3. Một feature góp tối đa một phần điểm cho style, dù nhiều rules cùng feature match. FaceScore = số active feature groups được style hỗ trợ / tổng active groups chung cho tất cả styles, nằm 0..1, không phải probability. Duplicate rule refs không inflate điểm. Style thiếu rule nhận 0 face bonus, không negative penalty.
4. Preference optional: occasion +.12, intensity +.08. Tổng <=.2; face có tối đa 4 groups, một group tạo chênh lệch tối thiểu .25 nên preference không lật một mức hỗ trợ face đầy đủ. Đây là trọng số heuristic để thử, không xác suất khoa học.
5. Sort score descending; tie bằng curated order độc lập JSON order và key. Diversity chỉ trong nhóm có final score bằng nhau, ưu tiên intensity khác. Không random, hash khuôn mặt hoặc chọn trước Top3 rồi bịa reasons.
6. whyRecommended/whyItFits = đúng explanations từ contributing rules + đúng preference matches + style whyTry. matchedTechniques, detailedTechniques, quickSteps, source/evidence trả cùng response local. Không anatomy labels/% phù hợp. Rows không rule có evidence=fallback riêng; toàn bộ result face-aware khi có ít nhất một row nhận face contribution.
7. Không feature/rule đủ điều kiện hoặc experimental OFF -> fallback rõ, natural/soft-glam/classic-glam nếu không preference. Không gọi đó là personalized. Cùng feature/rules có thể cùng Top3; không ép khác người là khác style.

RankingTrace chỉ có tên feature/rejection reason, rule IDs, contributions, preferences, final score/selection reason; không giá trị đo/raw coords/photo/token/user ID. UI debug chỉ hiện diagnostic=true và local/manual-test, không console log/file export dữ liệu người thật. Scores không hiện ở cards. Synthetic report xuất riêng từ test khi owner/agent chủ động set BBOOK_SYNTHETIC_REPORT.

## Synthetic validation (thật sự chạy local, không Gemini)

| Profile | Feature dùng | Technique matching | Top3 | Lý do ranking |
|---|---|---|---|---|
| A | eyeSpacing high, browArch low | soft-eyeliner, soft-brow-shaping | Peach / Soft Korean / Soft Glam | ưu tiên styles có kỹ thuật viền nhẹ/mày mềm; diversity chỉ tie |
| B | eyeSpacing low, eyeAspect low | outer-eye-emphasis, soft-eyeliner | Peach / Soft Glam / Latte | hỗ trợ cả bố cục đuôi và viền mảnh |
| C | browArch high, mouthAspect low | natural-brow-styling, defined-lip-outline | Natural / Soft Glam / Classic Glam | từng style có contribution thực từ mày hoặc viền môi |
| D | outlineAspect/lower width; các feature scoring unknown | không rule đủ cơ sở | Natural / Soft Glam / Classic Glam | fallback, outline không tự sinh compatibility |
| E | tất cả unknown | không rule | Natural / Soft Glam / Classic Glam | fallback |
| F | như A, party+bold | như A | Peach / Soft Korean / Smokey Eyes | giữ face rules, preference đổi ordering trong mức face support tương đương |

Trace/reasons đầy đủ: D:/EXE/artifacts/advisor-gemini-integration-20261013/face-aware-v2-synthetic.json, syntheticOnly=true. Không chứa dữ liệu test ảnh người thật.

Counterfactual giữ feature khác cố định: eyeSpacing .35->.6, eyeAspect .15->.4 (hai mắt đồng bộ để biểu diễn một group), browArch .02->.12 (hai mày đồng bộ), mouthAspect .2->.4. Cả bốn đổi activated rules, style score vector và Top3. Đây là synthetic values cho unit test, không threshold mới hoặc nhãn giải phẫu. NoseBaseWidth/outlineAspect thay đổi riêng không đổi scores. JSON reverse không đổi ranking; duplicate ref không cộng thêm điểm.

Actual extractor integration test tạo contours synthetic -> extractFaceFeatures -> localRecommendations với Preview flag: faceScore>0 và Top3 khác unknown fallback. Test closed-eye detector bỏ eye rules. Không native inference, network hoặc APK trong Jest.

## Flags / Gemini / build

advisor-preview mặc định advisorFaceAwareExperimental=true từ app.config; BBOOK_ADVISOR_FACE_AWARE_EXPERIMENTAL=0 để tắt trong preview. Local development chỉ bật khi env=1. advisor-closed-test/production luôn false kể cả env1. Runtime flags còn kiểm tra environment local/manual-test để fail closed.

Cloud vẫn OFF, privacy pending. Không gửi Profile V2/qualityContext/rankingTrace lên BE/Gemini: cloudSummary vẫn rebuild whitelist Face Summary v3. Gemini validation/provider legacy không đổi, không key mới/billing. Local 12 keys nhất quán library/UI/matcher. Provider hiện dùng keys legacy; trước khi dùng Gemini cho library mới cần đồng bộ allowed style keys + metadata + validation backend trong task riêng, không đoán map event thành một style cụ thể. Đây chưa phải nghiệm thu Gemini online.

Preview applicationId com.bbook.advisor, scheme bbookadvisor, APK assembleRelease/internal. Production package com.bbook.app không đổi. Các source mới không bị ignore, nhưng vẫn chưa commit; EAS CLI working tree lấy chúng, remote HEAD build chưa có. Kiểm tra artifact package/native/16KiB sau build, không suy config PASS là APK PASS.

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
npx eas-cli@latest build --platform android --profile advisor-preview
```

Không cần deploy BE để test face-aware local. Để so sánh: dùng hai người trưởng thành tình nguyện, cùng điều kiện ánh sáng/chính diện, preference null, cloud OFF. Quét từng ảnh rồi xem Top3/reasons và mở Kiểm tra ranking để xem activated rules. Không xuất/share screenshot có ảnh hoặc lưu số đo thật. Nếu cùng groups/rules thì cùng kết quả là hợp lệ. Thử lặp 5–10 lượt, ảnh không mặt/nhiều mặt, hủy/background; quét cùng ảnh và đổi preference để xác nhận không chạy ML Kit lại. Không coi biến động giữa ảnh chụp khác là độ chính xác.

## Acceptance và rủi ro

Tests đã chạy: full Advisor 25 suites / 200 PASS; extractor, invalid/missing, profile/closed/expression, library/schema/rule keys, flag gating, scoring/counterfactual/fairness/determinism, no preference/clear, no inference rerun, existing Gemini guards/results, Scan Recovery. Typecheck/lint/config checks cuối được báo trong chat. Một số tests ban đầu còn kỳ vọng v1.1 không-rank hoặc thiếu detection fields; đã sửa fixtures/expectations đúng contract. Không gán Jest PASS thành native/device accuracy.

NOT RUN: Android compile/JUnit/instrumentation, APK mới, device scan/memory, calibrated compatibility accuracy, MUA review. Engine V2 đủ source/static để thử thiết bị khi các kiểm tra cuối PASS; không production-ready. Ngưỡng/provisional rules, biểu cảm ngoài smiling, pose/perspective và thiếu dữ liệu chuyên môn còn là rủi ro. Không thay memory safety để cố đạt readiness.
