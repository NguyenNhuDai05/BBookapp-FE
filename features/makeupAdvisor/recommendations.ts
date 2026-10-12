import type {ExploreStyle,ExploreService} from '../../types/explore';
import type {Geometry} from './faceGeometry';
import {knowledge,knowledgeVersion,Preferences,sources} from './knowledge';
const exact=(value:string)=>value.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi');
// Broad dead zones avoid forcing a difference on small measurement changes.
// These are disclosed exploratory thresholds, not accuracy/confidence scores.
export const experimentalPolicy={verticalOutline:1.4,compactOutline:1.15,eyeSpacingLow:.46,eyeSpacingHigh:.52} as const;
export function recommend(p:Preferences={},geometry?:Geometry) {
 const ratios=geometry?.status==='measured'?geometry.ratios:undefined;
 const usable=ratios&&Object.values(ratios).every(Number.isFinite)&&ratios.outlineHeightToWidth>=.9&&ratios.outlineHeightToWidth<=1.8&&ratios.eyeCenterDistanceToWidth>=.3&&ratios.eyeCenterDistanceToWidth<=.65;
 return knowledge.filter(rule=>rule.key!=='bridal'||p.occasion==='wedding').map(rule=>{
  let score=rule.base as number; const reasons:string[]=[];const signals:string[]=[];
  if(p.occasion&&(rule.occasions as readonly string[]).includes(p.occasion)){score+=4;reasons.push('Phù hợp dịp bạn đã chọn.');signals.push('preference');}
  if(p.intensity&&rule.intensity===p.intensity){score+=2;reasons.push('Theo mức makeup bạn muốn thử.');signals.push('preference');}
  if(p.focus&&rule.focus===p.focus){score+=2;reasons.push('Theo vùng bạn muốn nhấn.');signals.push('preference');}
  if(usable&&ratios){
   if(ratios.outlineHeightToWidth>=experimentalPolicy.verticalOutline&&rule.key==='portrait'){score+=4;reasons.push('Đường viền trong ảnh thiên chiều dọc: thử bố trí má trải ngang để khám phá hiệu ứng cân đối. Rule 2D thử nghiệm, không xác định dáng mặt.');signals.push('outline-2d');}
   if(ratios.outlineHeightToWidth<=experimentalPolicy.compactOutline&&rule.key==='event'){score+=3;reasons.push('Đường viền trong ảnh ít chênh chiều cao/rộng: thử điểm nhấn mắt rõ thay vì trang điểm đều mọi vùng. Đây là ý tưởng thử, không kết luận phong cách hợp nhất.');signals.push('outline-2d');}
   if(ratios.eyeCenterDistanceToWidth<=experimentalPolicy.eyeSpacingLow&&rule.key==='event'){score+=3;reasons.push('Vị trí hai vùng mắt đo được trong ảnh gợi ý thử eyeliner mở nhẹ về phía ngoài. Khoảng cách 2D chưa được hiệu chuẩn.');signals.push('eyes-2d');}
   if(ratios.eyeCenterDistanceToWidth>=experimentalPolicy.eyeSpacingHigh&&rule.key==='korean'){score+=2;reasons.push('Thử đường mắt mềm, gọn theo vùng mắt quan sát được. Đây là lựa chọn tham khảo từ số đo ảnh 2D.');signals.push('eyes-2d');}
  }
  if(!reasons.length){reasons.push('Một hướng khám phá phổ biến trong catalog BBook; ảnh chưa cung cấp tín hiệu đủ rõ để cá nhân hóa hướng này.');signals.push('discovery');}
  return {...rule,score,version:knowledgeVersion,sourceUrl:sources[rule.source],reasons,signals,geometryRanked:signals.some(s=>s.endsWith('-2d'))};
 }).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key)).slice(0,3);
}
export function resolveStyles(aliases:readonly string[],catalog:ExploreStyle[]) {return catalog.filter(style=>aliases.some(alias=>exact(alias)===exact(style.name)));}
export function hasServiceStyleTag(service:ExploreService,style:ExploreStyle){return service.tags.some(tag=>exact(tag)===exact(style.name));}
