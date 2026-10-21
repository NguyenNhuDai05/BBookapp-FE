import catalog from './bbook-makeup-catalog-20-vi-v1.2.json';
import { compatibilityRules } from './techniqueCompatibility';
import { observationPolicy, type FaceProfileV2 } from './faceFeatures/profileV2';

type FeatureKey = keyof typeof observationPolicy;
export type MeasurementProfile = {
  version: string; evidenceStatus: string; reviewStatus: string;
  missingFeaturePolicy: string; mode: string;
  featureRules: { feature: string; ruleId: string; weight: number }[];
};
export function validateMeasurementProfile(value: MeasurementProfile): void {
  if (value.version !== 'measurements-v2' || value.evidenceStatus !== 'experimental' ||
      value.reviewStatus !== 'pending' || value.missingFeaturePolicy !== 'ignore-and-report' ||
      !['face-and-preference', 'preference-only'].includes(value.mode) ||
      (value.mode === 'preference-only') !== (value.featureRules.length === 0) ||
      new Set(value.featureRules.map(r => r.ruleId)).size !== value.featureRules.length) {
    throw new Error('Invalid measurement ranking profile');
  }
  for (const r of value.featureRules) {
    if (!compatibilityRules.some(rule => rule.id === r.ruleId && rule.feature === r.feature) ||
        !Number.isFinite(r.weight) || r.weight <= 0 || r.weight > 1) {
      throw new Error('Invalid measurement ranking rule');
    }
  }
}
export const measurementProfiles = Object.fromEntries(catalog.styles.map(style => {
  validateMeasurementProfile(style.recommendationProfile);
  return [style.key, style.recommendationProfile];
}));
// Smoothing around existing provisional thresholds, not calibrated population
// percentiles or validated standards of beauty.
const transitionWidths: Record<FeatureKey, number> = {
  eyeSpacing: .03, eyeAspect: .05, browArch: .02, mouthAspect: .05,
};
const clamp = (value: number) => Math.min(1, Math.max(0, value));
export function scoreMeasurements(key: string, profile: FaceProfileV2) {
  const settings = measurementProfiles[key];
  if (!settings) throw new Error('Missing measurement ranking profile');
  const usable = (feature: string) => profile.measurements[feature]?.quality === 'provisional';
  const denominator = Object.keys(observationPolicy).filter(usable).length;
  const contributions = new Map<string, {
    ruleId: string; feature: string; techniqueKey: typeof compatibilityRules[number]['techniqueKey'];
    contribution: number; explanation: string;
  }>();
  for (const spec of settings.featureRules) {
    if (!usable(spec.feature) || !denominator) continue;
    const rule = compatibilityRules.find(r => r.id === spec.ruleId)!;
    const feature = spec.feature as FeatureKey;
    const value = profile.measurements[feature].value!;
    const threshold = observationPolicy[feature];
    const width = transitionWidths[feature];
    const strength = rule.observation === 'relatively_low'
      ? clamp((threshold.low + width - value) / (2 * width))
      : clamp((value - threshold.high + width) / (2 * width));
    const contribution = strength * spec.weight / denominator;
    // At most one contribution per measurement; duplicated techniques do not
    // inflate the score. All styles share the same available-feature budget.
    if (contribution > (contributions.get(feature)?.contribution ?? 0)) {
      contributions.set(feature, { ruleId: rule.id, feature, techniqueKey: rule.techniqueKey,
        contribution, explanation: rule.explanation });
    }
  }
  return [...contributions.values()];
}
