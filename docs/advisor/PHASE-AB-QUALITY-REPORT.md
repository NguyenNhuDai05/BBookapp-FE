# Phase A/B và Quality Gates — 2026-10-14

## Trạng thái

Phase A hoàn tất: sửa 4 nhóm nhãn đã duyệt, đồng bộ input/runtime, 20/20 core + localization hợp lệ. Machine fields của file 20 không đổi; engine v1.1/12 giữ nguyên byte. Phase B độc lập trong scripts/advisorSimulation/engine20.ts; app không import module này. Phase D chưa thực hiện.

Đã chạy 6912 paired cases (108 profiles × 32 lựa chọn sở thích × 2 trạng thái experimental) và 8 quality probes. Đây là dữ liệu tổng hợp, không là tần suất ngoài thực tế hoặc đánh giá chất lượng thẩm mỹ.

## 1. Metadata và source of truth

Catalog input/runtime v1.2 sở hữu tên/nội dung hiển thị. Engine runtime vẫn dùng v1.1/12 và overlay cũ. Phase-A metadata diff có before/after từng field, không áp dụng vào ranking. 8 khác biệt ảnh hưởng điểm gồm intensity của douyin/peach/strawberry/soft-glam và occasions của clean-girl/latte/soft-glam/thai-glam. Occasion chỉ đổi thứ tự không làm đổi includes(); tags/colorPalette không score. Cả simulation cũng giữ key/name/intensity/occasions/tags/colorPalette v1.1 của 12 kiểu cũ. 8 kiểu mới dùng metadata v1.2.

Nhãn được sửa: timeless → Cổ điển; warm brown → Nâu ấm (soft-glam, western-glam); soft peach → Đào nhạt (bridal-soft-glam). displayName và các label arrays tiếp tục do UI projection đọc; không mutate engine result/ranking.

## 2. Candidate, overlay và tie-break

20 candidate keys được validate. Tie order giữ nguyên 12 vị trí cũ rồi nối j-beauty/igari/ulzzang/western-glam/nude-makeup/fox-eye/sunkissed/glass-skin. Mỗi key có đúng một vị trí, không indexOf=-1. Cô dâu vẫn chỉ eligible khi wedding. Rule IDs/technique keys cũ không đổi; các mappings mới giống đề xuất được duyệt thử nghiệm. igari/sunkissed không được gắn rule khuôn mặt không có cơ sở. Trọng số giữ {"faceBudget":1,"occasionBonus":0.12,"intensityBonus":0.08}; diversity chỉ khi bằng điểm. Không random, không bonus coverage.

## 3. Coverage 20 kiểu

Bật face-aware: 3456 cases. Tắt face-aware: 3456 cases. Không chọn sở thích: 108 cases mỗi mode. Counts là số lần trong lưới tổng hợp, không xác suất.

| Key | Top 3 bật | Top 3 tắt | Không sở thích, bật | Có ví dụ Top 3 | Overlay rule IDs |
|---|---:|---:|---:|---|---|
| soft-korean | 846 | 756 | 22 | Có | spacing-high-soft, opening-low-soft, arch-low-soft, lip-high-soft |
| douyin | 852 | 432 | 29 | Có | spacing-low-outer, opening-high-gradient, arch-low-soft, lip-high-soft |
| clean-girl | 339 | 432 | 10 | Có | spacing-high-soft, opening-low-soft, arch-high-natural |
| natural | 1212 | 1404 | 49 | Có | spacing-high-soft, opening-low-soft, arch-high-natural, lip-high-soft |
| peach | 2038 | 972 | 71 | Có | spacing-low-outer, spacing-high-soft, opening-low-soft, opening-high-gradient, arch-low-soft, lip-high-soft |
| strawberry | 575 | 108 | 10 | Có | spacing-high-soft, opening-low-soft, arch-high-natural, lip-high-soft |
| latte | 1106 | 972 | 22 | Có | spacing-low-outer, spacing-high-soft, opening-low-soft, opening-high-gradient, lip-low-outline |
| soft-glam | 1554 | 1620 | 60 | Có | spacing-low-outer, spacing-high-soft, opening-low-soft, opening-high-gradient, lip-low-outline |
| thai-glam | 558 | 648 | 21 | Có | spacing-low-outer, opening-high-gradient, lip-low-outline |
| smokey-eyes | 148 | 324 | 7 | Có | opening-high-gradient, arch-low-soft |
| bridal-soft-glam | 221 | 108 | 0 | Có | spacing-high-soft, opening-low-soft, opening-high-gradient, arch-low-soft, lip-low-outline |
| classic-glam | 325 | 1188 | 15 | Có | spacing-low-outer, lip-low-outline |
| j-beauty | 72 | 432 | 0 | Có | opening-low-soft, arch-high-natural |
| igari | 6 | 324 | 0 | Có | Chỉ sở thích |
| ulzzang | 218 | 108 | 2 | Có | opening-low-soft, opening-high-gradient, arch-low-soft |
| western-glam | 62 | 0 | 0 | Có | lip-low-outline, opening-high-gradient |
| nude-makeup | 200 | 216 | 6 | Có | opening-low-soft, arch-high-natural |
| fox-eye | 20 | 216 | 0 | Có | spacing-low-outer |
| sunkissed | 0 | 0 | 0 | Không | Chỉ sở thích |
| glass-skin | 16 | 108 | 0 | Có | opening-low-soft, arch-high-natural |

19/20 kiểu có ví dụ Top 3. sunkissed không được chọn trong toàn bộ lưới. Nó chỉ có preferenceScore ≤0.20, faceScore=0. Mỗi case có tối thiểu 3 ứng viên medium eligible có điểm cao hơn hoặc bằng điểm nhưng đứng trước; tie-only diversity không giúp một ứng viên medium đứng sau vượt các ứng viên medium đó. Đây là giới hạn thực sự của cấu hình, không sửa bằng điểm thưởng. western-glam không xuất hiện khi experimental OFF; không có rule active và mất cạnh tranh sở thích/tie-break. Cô dâu không xuất hiện khi không chọn dịp.

## 4. Score distribution

FinalScore = coveredActiveFeatures/activeFeatures + occasion 0.12 + intensity 0.08. Một feature capped và không tăng bởi rule trùng. Histogram đầy đủ (final/face/preference) trong JSON; bản chia mode ở PHASE-B-SCORE-DISTRIBUTIONS.json. Eligible count cô dâu thấp hơn vì wedding gate.

| Key | Eligible bật | Min–max bật | Mean bật | P50 bật | P90 bật | Mean tắt |
|---|---:|---|---:|---:|---:|---:|
| soft-korean | 3456 | 0–1.2 | 0.5557 | 0.533333 | 1.08 | 0.0650 |
| douyin | 3456 | 0–1.2 | 0.5557 | 0.533333 | 1.08 | 0.0650 |
| clean-girl | 3456 | 0–1.2 | 0.4230 | 0.453333 | 0.866667 | 0.0650 |
| natural | 3456 | 0–1.2 | 0.5557 | 0.533333 | 1.08 | 0.0650 |
| peach | 3456 | 0–1.2 | 0.7810 | 0.786667 | 1.12 | 0.0650 |
| strawberry | 3456 | 0–1.2 | 0.5557 | 0.533333 | 1.08 | 0.0650 |
| latte | 3456 | 0–1.2 | 0.6633 | 0.666667 | 1.12 | 0.0800 |
| soft-glam | 3456 | 0–1.2 | 0.6633 | 0.666667 | 1.12 | 0.0800 |
| thai-glam | 3456 | 0–1.2 | 0.4230 | 0.453333 | 0.866667 | 0.0650 |
| smokey-eyes | 3456 | 0–1.2 | 0.3154 | 0.33 | 0.666667 | 0.0500 |
| bridal-soft-glam | 432 | 0.12–1.2 | 0.7635 | 0.786667 | 1.12 | 0.1400 |
| classic-glam | 3456 | 0–1.2 | 0.2903 | 0.2 | 0.62 | 0.0650 |
| j-beauty | 3456 | 0–1.2 | 0.3304 | 0.333333 | 0.7 | 0.0650 |
| igari | 3456 | 0–0.2 | 0.0650 | 0.08 | 0.12 | 0.0650 |
| ulzzang | 3456 | 0–1.2 | 0.4631 | 0.5 | 0.866667 | 0.0650 |
| western-glam | 3456 | 0–1.2 | 0.3154 | 0.33 | 0.666667 | 0.0500 |
| nude-makeup | 3456 | 0–1.2 | 0.3304 | 0.333333 | 0.7 | 0.0650 |
| fox-eye | 3456 | 0–1.2 | 0.1576 | 0.12 | 0.453333 | 0.0650 |
| sunkissed | 3456 | 0–0.2 | 0.0650 | 0.08 | 0.12 | 0.0650 |
| glass-skin | 3456 | 0–1.2 | 0.3304 | 0.333333 | 0.7 | 0.0650 |

Phân phối phản ánh các bucket/sở thích được liệt kê, không phân phối người dùng. Mean của preference-only không cho thấy tư vấn từ khuôn mặt.

## 5. Regression 12 kiểu cũ

Simulator giới hạn legacyOnly so với engine thật: 6912/6912 cases trùng Top 3 có thứ tự, activated rules và mọi face/preference/final score. Mở pool 20 vẫn có 0 thay đổi điểm của 12 kiểu cũ. Thay đổi kết quả bên dưới do cạnh tranh và tie/diversity, không do đổi metadata hoặc weights.

| Mode | Cases | Đổi thứ tự Top 3 | Đổi tập Top 3 | Overlap 0/1/2/3 |
|---|---:|---:|---:|---|
| Bật | 3456 | 574 (16.61%) | 574 | 2/16/556/2882 |
| Tắt | 3456 | 1188 (34.38%) | 1188 | 108/0/1080/2268 |

Vị trí 1/2/3 trong bảng dưới tổng hợp cả hai mode, không là score rank tuyệt đối vì có tie-only diversity.

| Key cũ | Chọn bật: baseline | Chọn bật: 20 | Delta | Vị trí 1/2/3 baseline, cả 2 mode | Vị trí 1/2/3 mới, cả 2 mode | Score delta |
|---|---:|---:|---:|---|---|---:|
| soft-korean | 872 | 846 | -26 | 72/931/1165 | 72/869/661 | 0 |
| douyin | 864 | 852 | -12 | 198/423/675 | 198/417/669 | 0 |
| clean-girl | 415 | 339 | -76 | 30/322/603 | 26/234/511 | 0 |
| natural | 1291 | 1212 | -79 | 2157/250/396 | 2017/144/455 | 0 |
| peach | 2132 | 2038 | -94 | 1666/1064/590 | 1530/822/658 | 0 |
| strawberry | 673 | 575 | -98 | 78/345/358 | 78/333/272 | 0 |
| latte | 1159 | 1106 | -53 | 273/1199/767 | 273/1199/606 | 0 |
| soft-glam | 1648 | 1554 | -94 | 1779/952/753 | 1779/789/606 | 0 |
| thai-glam | 566 | 558 | -8 | 77/640/497 | 77/634/495 | 0 |
| smokey-eyes | 195 | 148 | -47 | 18/45/456 | 18/43/411 | 0 |
| bridal-soft-glam | 221 | 221 | 0 | 72/196/61 | 72/196/61 | 0 |
| classic-glam | 332 | 325 | -7 | 492/545/591 | 492/542/479 | 0 |

## 6. Không chọn occasion/intensity

Null/null vẫn nhận đủ 3 không trùng. Bật: đổi 8/108 = 7.41%; 13 kiểu có ví dụ. Tắt: đổi 0/108, fallback giữ natural,soft-glam,classic-glam. sunkissed và igari không có face rules nên không được mô tả là gợi ý đo từ khuôn mặt.

## 7. Ví dụ deterministic

### fallback-no-features-no-preferences

Input features: {}; preferences: {"occasion":null,"intensity":null}.

12: natural → soft-glam → classic-glam

20: natural (0.0000, fallback) → soft-glam (0.0000, fallback) → classic-glam (0.0000, fallback)

### preference-only-igari

Input features: {}; preferences: {"occasion":"daily","intensity":null}.

12: natural → peach → soft-korean

20: natural (0.1200, preference-only) → igari (0.1200, preference-only) → peach (0.1200, preference-only)

### zero-overlap-regression

Input features: {}; preferences: {"occasion":"daily","intensity":"medium"}.

12: natural → peach → soft-korean

20: igari (0.2000, preference-only) → ulzzang (0.2000, preference-only) → nude-makeup (0.2000, preference-only)

### experimental-western-glam

Input features: {"mouthAspect":0.2}; preferences: {"occasion":null,"intensity":"bold"}.

12: classic-glam → thai-glam → soft-glam

20: classic-glam (1.0800, experimental) → thai-glam (1.0800, experimental) → western-glam (1.0800, experimental)

### no-preferences-ranking-change

Input features: {"leftBrowArch":0.12,"rightBrowArch":0.12}; preferences: {"occasion":null,"intensity":null}.

12: natural → clean-girl → strawberry

20: natural (1.0000, experimental) → nude-makeup (1.0000, experimental) → clean-girl (1.0000, experimental)

### full-measurements-no-preferences

Input features: {"eyeSpacing":0.35,"leftEyeAspect":0.15,"rightEyeAspect":0.15,"leftBrowArch":0.02,"rightBrowArch":0.02,"mouthAspect":0.2}; preferences: {"occasion":null,"intensity":null}.

12: peach → soft-glam → latte

20: peach (0.7500, experimental) → soft-glam (0.7500, experimental) → latte (0.7500, experimental)


JSON còn có ví dụ cho từng kiểu có coverage, full contribution/explanation và probes thiếu feature/pose/source/nonfinite/out-of-range/declared-missing/eyes-closed/expression. No-overlap example được giữ để reviewer đánh giá thay đổi lớn, không chỉ ví dụ tốt.

## 8. Explanation audit và đánh giá mappings

Đã kiểm tra 132192 candidate traces: tổng ruleContributions=faceScore; tổng preferenceContributions=preferenceScore; tổng hai phần=finalScore. Explanation chỉ gồm đúng active rules có đóng góp và preferences thực sự được cộng điểm. Generic mô tả phong cách không được dùng để giải thích ranking. Không gắn nguyên nhân khuôn mặt cho preference-only/fallback.

Có cơ sở sử dụng trong thử nghiệm: stable keys, nguồn số đo hợp lệ qua quality gate, mapping rule-to-technique có thể truy vết, optional preferences và tính toán deterministic. Chưa có mapping khuôn mặt nào đủ chứng cứ để gọi verified hoặc đảm bảo phù hợp thẩm mỹ ngoài thực tế. Tất cả mappings face, kể cả 12 kiểu cũ, vẫn experimental/pending.

- j-beauty/nude-makeup/glass-skin: viền mắt mềm và chải mày có mô tả kỹ thuật phù hợp; liên hệ từ tỷ lệ sang lựa chọn thẩm mỹ vẫn cần review MUA. Không suy tone da/độ ẩm.
- western-glam: viền môi và chuyển sắc mắt hiện trong kỹ thuật, nhưng relation từ tỷ lệ chưa được kiểm chứng. Không score contour/face shape.
- fox-eye: nhấn đuôi mắt phù hợp mô tả; rule spacing-low-outer chỉ gợi ý thử bố cục, không phân loại giải phẫu.
- ulzzang: soft eyeliner/brow shaping hợp mô tả; opening-high-gradient là mapping yếu hơn vì nội dung JSON chỉ nêu nhấn nâu đuôi mắt, chưa mô tả rõ chuyển sắc. Giữ trong simulation như thử nghiệm đã cho phép; cần review hoặc loại trước runtime.
- igari/sunkissed: preference-only có cơ sở từ lựa chọn người dùng, không có căn cứ để tạo face rule cho blush/bronzer/skin finish. sunkissed hiện bị dominance; không thêm bonus hoặc buộc coverage.

## 9. Rủi ro và kết luận Phase C

0 score regression không đồng nghĩa 0 thay đổi trải nghiệm: pool mới đổi Top 3 như bảng, có cases đổi cả 3. Khi experimental OFF, thêm ứng viên preference-only đổi tới 34.38% lưới có sở thích. Người dùng hiện tại có thể nhận phong cách mới cho cùng ảnh/lựa chọn. Counts không thể suy ra tỷ lệ production vì chưa có tập ảnh/vị trí/sở thích thật.

Ngưỡng provisional, chất lượng ảnh và missing features có thể làm chuyển face-aware/fallback. Mappings trùng kỹ thuật khiến j-beauty/nude/glass cạnh tranh dù aesthetic finish khác; engine không đo finish/tone. Catalog v1.2 hiển thị intensity/occasions mới cho một số key cũ trong khi scoring giữ v1.1; phải quyết định riêng cách nhất quán nội dung UI/metadata trước Phase D, không tự đổi bonus metadata. Các conditional tips unsupported tiếp tục hidden, không thêm ngưỡng.

Recommendation: chưa kích hoạt runtime 20 chỉ vì coverage 19/20. Review chuyên môn mappings, đặc biệt ulzzang; chốt metadata khác biệt; quyết định chấp nhận competition regression và sunkissed preference-only chưa vào Top 3. Nếu cần variant overlay/tie order hoặc tín hiệu sở thích khác, chỉ mô phỏng riêng, không sửa production. Backend/native/Free Tier không cần thay cho simulation.

## 10. Stability, tests và files

Protected checksum 15 files: không thay. Runtime JSON=input đã sửa nhãn, valid 20. Tests chứng minh không app import simulation, strict tie/overlay validation, old machine metadata/weights bất biến, legacy parity và quality gates. Không sửa ML Kit, face measurements, memory guards, camera, cleanup, consent, 10/5s presentation hoặc timeout 60s; không thêm fetch vào critical path. Không API/database/Gemini/config change. Không commit/push/build/deploy.

Files sửa: input/runtime JSON 20; catalogLabelReference.json; __tests__/presentationCatalog.test.ts. Files thêm: scripts/advisorSimulation/engine20.ts; __tests__/engine20Simulation.test.ts; scripts/Report-PhaseAB.cjs; PHASE-A-METADATA-DIFF.md/json; PHASE-B-SIMULATION.json; PHASE-B-SCORE-DISTRIBUTIONS.json; PHASE-B-QUALITY-PROBES.json; PHASE-AB-PROTECTED-HASHES.json; PHASE-AB-STABILITY.json; báo cáo này. CATALOG20-VALIDATION.json cập nhật 20/20. Không đổi code UI/native/engine runtime trong Phase A/B.

TypeScript --noEmit: đạt. ESLint các file đổi: đạt, zero warnings. 85 tests liên quan trong 8 suites đạt; test simulation kiểm tra 6.912 paired cases và 8 quality probes. Chưa kiểm thử thiết bị/native runtime, visual screenshot hoặc dataset người dùng thật. Phase D chưa được phép và chưa được thực hiện.
