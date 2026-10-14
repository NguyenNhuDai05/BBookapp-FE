import manifest from './scoringMetadataManifest.json';
import legacy from './bbook-makeup-style-library.vi.json';
import {presentationCatalog,catalogValidation} from './presentationCatalog';
import type {Intensity,Occasion} from './styleLibrary';
export const scoringOccasionLabels:Record<Occasion,string>={daily:'Hằng ngày',work:'Đi làm',school:'Đi học',date:'Hẹn hò',party:'Dự tiệc',photoshoot:'Chụp ảnh',wedding:'Đám cưới'};
export const scoringIntensityLabels:Record<Intensity,string>={light:'Nhẹ nhàng',medium:'Vừa phải',bold:'Đậm nét'};
export type ScoringMetadata={key:string;name:string;version:string;intensity:Intensity;occasions:Occasion[];tags:string[];colorPalette:string[]};
export function validScoringManifest(value:unknown):value is typeof manifest{
 try{const m=value as typeof manifest;if(!catalogValidation.valid||m.version!=='scoring-mixed-1.1-1.2'||Object.keys(m.styles).length!==20)return false;
 return presentationCatalog.every(s=>{const x=(m.styles as Record<string,ScoringMetadata>)[s.key],old=legacy.styles.find(o=>o.key===s.key),expected=old||s;
 return !!x&&x.version===(old?'1.1':'1.2')&&x.key===s.key&&Object.prototype.hasOwnProperty.call(scoringIntensityLabels,x.intensity)&&x.occasions.every(o=>Object.prototype.hasOwnProperty.call(scoringOccasionLabels,o))&&(['name','intensity','occasions','tags','colorPalette'] as const).every(k=>JSON.stringify(x[k])===JSON.stringify(expected[k]));});
 }catch{return false;}
}
if(!validScoringManifest(manifest))throw Error('Scoring metadata does not match approved versions');
export const scoringMetadata=manifest.styles as Record<string,ScoringMetadata>;
