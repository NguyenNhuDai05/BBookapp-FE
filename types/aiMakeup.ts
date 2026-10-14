export type AiMakeupCapabilities = { enabled: boolean; consentVersion: string; maxImageBytes: number };
export type AiMakeupResult = {
  imageStatus: 'valid' | 'no_face' | 'multiple_faces' | 'blurry' | 'occluded' | 'insufficient';
  observations: { feature: string; description: string; certainty: 'uncertain' | 'tentative' }[];
  recommendations: { styleId: number; styleName: string; reason: string; makeupTips: string[] }[];
  notice: string;
};
export type AiMakeupPhoto = { uri: string; width: number; height: number };
