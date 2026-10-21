import Constants from 'expo-constants';
export const advisorEnabled = Constants.expoConfig?.extra?.advisorEnabled === true;
export const realUserGeminiApproved = advisorEnabled && Constants.expoConfig?.extra?.advisorCloudEnabled === true && Constants.expoConfig?.extra?.advisorDataProcessingApproved === true;
export const faceAwareExperimental = advisorEnabled && Constants.expoConfig?.extra?.advisorFaceAwareExperimental===true && ['manual-test','local','closed-test'].includes(Constants.expoConfig?.extra?.advisorReleaseEnvironment);



export const measurementRankingEnabled = faceAwareExperimental && Constants.expoConfig?.extra?.advisorMeasurementRanking === true;
