import {recommendFromLibrary as engine} from '../../features/makeupAdvisor/localEngine';
import {DEFAULT_PREFERENCES,type LibraryPreferences} from '../../features/makeupAdvisor/styleLibrary';
import type {Extraction,FaceFeatureSummaryV3} from '../../features/makeupAdvisor/faceFeatures/extractor';
import type {EngineOptions} from '../../features/makeupAdvisor/recommendationCore';
// Summary adapter for legacy quality/contribution tests, using the consolidated implementation.
export function recommendFromLibrary(summary?:FaceFeatureSummaryV3,p:LibraryPreferences=DEFAULT_PREFERENCES,options:EngineOptions={}){
 const empty:FaceFeatureSummaryV3={schemaVersion:3,analysisMethod:'face_detection',quality:{frontal:true,singleFace:true,expressionLimited:false},detection:{faceCount:1,boundingBox:{x:.1,y:.1,width:.8,height:.8},pose:{yaw:0,pitch:0,roll:0}},features:{},featureSources:{},missing:[],limitations:[]};
 const extraction:Extraction={status:'valid',summary:summary||empty,features:options.localFeatures||{},qualityContext:options.qualityContext};
 return engine(extraction,p,[],options);
}


