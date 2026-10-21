import { evaluateRanking, candidates } from '../recommendationCore';
import { measurementProfiles, validateMeasurementProfile } from '../measurementRanking';
import type { FaceFeatureSummaryV3 } from '../faceFeatures/extractor';
import { recommendFromLibrary } from '../localEngine';
import { extractFaceFeatures } from '../faceFeatures/extractor';
import type { Analysis } from '../faceAnalysis';

jest.mock('../flags', () => ({ faceAwareExperimental: true, measurementRankingEnabled: true }));
function summary(spacing = .42, eye = .18, brow = .04, lip = .2): FaceFeatureSummaryV3 {
  const features = { eyeSpacing: spacing, leftEyeAspect: eye, rightEyeAspect: eye,
    leftBrowArch: brow, rightBrowArch: brow, mouthAspect: lip };
  return { schemaVersion: 3, analysisMethod: 'face_detection',
    quality: { frontal: true, singleFace: true, expressionLimited: false },
    detection: { faceCount: 1, boundingBox: { x: .1, y: .1, width: .8, height: .8 }, pose: { yaw: 0, pitch: 0, roll: 0 } },
    features, featureSources: Object.fromEntries(Object.keys(features).map(k => [k, 'face_detection' as const])),
    missing: [], limitations: [] };
}
const run = (s: FaceFeatureSummaryV3, experimental = true) => evaluateRanking(s, undefined, { experimental, measurementRanking: true });
it('reproduces the old disabled-face trio, but actual runtime enables metric ranking', () => {
  expect(run(summary(), false).top3.map(r => r.styleKey)).toEqual(['natural', 'soft-glam', 'classic-glam']);
  const result = recommendFromLibrary({ status: 'valid', features: {}, summary: summary() });
  expect(result.engineVersion).toBe('20-measurements-v2');
  expect(result.rankingTrace?.experimentalEnabled).toBe(true);
  expect(result.rankingTrace?.measurements?.find(m => m.key === 'eyeSpacing')?.value).toBe(.42);
  expect(result.recommendations.map(r => r.styleKey)).not.toEqual(['natural', 'soft-glam', 'classic-glam']);
});
it('uses distinct measurements deterministically and every score reconciles to its explanation', () => {
  const a = run(summary()), b = run(summary(.58, .4, .16, .48));
  expect(a.top3.map(r => r.styleKey)).not.toEqual(b.top3.map(r => r.styleKey));
  expect(run(summary())).toEqual(a);
  for (const result of [a, b]) for (const row of result.scores) {
    expect(row.faceScore).toBeGreaterThanOrEqual(0); expect(row.faceScore).toBeLessThanOrEqual(1);
    expect(row.ruleContributions.reduce((n, r) => n + r.contribution, 0)).toBeCloseTo(row.faceScore);
    expect(row.finalScore).toBeCloseTo(row.faceScore + row.preferenceScore);
    expect(new Set(row.ruleContributions.map(r => r.feature)).size).toBe(row.ruleContributions.length);
  }
});
it('changes smoothly near an existing bucket boundary', () => {
  const a = run(summary(.52 - .00001)), b = run(summary(.52 + .00001));
  for (const row of a.scores) expect(Math.abs(row.faceScore - b.scores.find(r => r.styleKey === row.styleKey)!.faceScore)).toBeLessThan(.001);
});
it('rejects bad quality and missing features instead of manufacturing face evidence', () => {
  const s = summary(); s.detection!.pose.yaw = 30;
  expect(run(s).scores.every(r => r.faceScore === 0)).toBe(true);
  const absent = summary(); absent.features = {}; absent.featureSources = {};
  expect(run(absent).scores.every(r => r.faceScore === 0)).toBe(true);
  const expressive = summary(); expressive.quality.expressionLimited = true;
  expect(run(expressive).scores.every(r => r.ruleContributions.every(c => c.feature !== 'mouthAspect'))).toBe(true);
});
it('keeps closed-eye geometry out of ranking', () => {
  const result = evaluateRanking(summary(), undefined, { experimental: true, measurementRanking: true, qualityContext: { eyesClosed: true } });
  expect(result.scores.every(r => r.ruleContributions.every(c => !['eyeSpacing','eyeAspect'].includes(c.feature)))).toBe(true);
});
it('validates profiles for all 20 styles and preserves honest preference-only styles', () => {
  expect(Object.keys(measurementProfiles).sort()).toEqual(candidates.map(c => c.key).sort());
  for (const profile of Object.values(measurementProfiles)) expect(() => validateMeasurementProfile(profile)).not.toThrow();
  const invalid = structuredClone(measurementProfiles.natural); invalid.featureRules[0].weight = NaN;
  expect(() => validateMeasurementProfile(invalid)).toThrow();
  for (const key of ['igari','sunkissed']) {
    expect(measurementProfiles[key].mode).toBe('preference-only');
    expect(run(summary()).scores.find(r => r.styleKey === key)?.faceScore).toBe(0);
  }
});
it('ignores JSON iteration order when scores tie', () => {
  const before = run(summary()); candidates.reverse();
  try { expect(run(summary())).toEqual(before); } finally { candidates.reverse(); }
});
it('actually reads the numeric weights from the 20-style JSON', () => {
  const spec = measurementProfiles.natural.featureRules.find(r => r.ruleId === 'spacing-high-soft')!;
  const input = summary(.58, .4, .16, .48);
  const before = run(input).scores.find(r => r.styleKey === 'natural')!.faceScore;
  const original = spec.weight;
  try {
    spec.weight = .25;
    expect(run(input).scores.find(r => r.styleKey === 'natural')!.faceScore).toBeLessThan(before);
  } finally { spec.weight = original; }
});
it('feeds extracted ML Kit geometry into the actual v2 runtime without a second inference', () => {
  const ellipse = (cx: number, cy: number, rx: number, ry: number, n: number) => Array.from({ length: n }, (_, i) => ({ x: cx + rx * Math.cos(i * 2 * Math.PI / n), y: cy + ry * Math.sin(i * 2 * Math.PI / n) }));
  function input(gap: number): Analysis {
    return { width: 800, height: 1000, faceCount: 1, faces: [{ box: { x: 190, y: 240, width: 420, height: 520 }, angles: { x: 0, y: 0, z: 0 }, probabilities: { leftEyeOpen: .9, rightEyeOpen: .9, smiling: .1 } }],
      contours: [{ type: 1, points: ellipse(400, 500, 200, 250, 36) }, { type: 6, points: ellipse(400-gap/2, 450, 25, 10, 16) }, { type: 7, points: ellipse(400+gap/2, 450, 25, 10, 16) }],
      latencyMs: 1, nativeHeapBeforeBytes: 1, nativeHeapAfterBytes: 1 };
  }
  const a = extractFaceFeatures(input(120)), b = extractFaceFeatures(input(240));
  expect(a.status).toBe('valid'); expect(b.status).toBe('valid');
  const ra = recommendFromLibrary(a), rb = recommendFromLibrary(b);
  expect(ra.engineVersion).toBe('20-measurements-v2');
  expect(ra.rankingTrace!.styles.map(s => s.faceScore)).not.toEqual(rb.rankingTrace!.styles.map(s => s.faceScore));
  expect(ra.rankingTrace!.measurements!.find(m => m.key === 'eyeSpacing')?.value).toBeCloseTo(.3);
});
