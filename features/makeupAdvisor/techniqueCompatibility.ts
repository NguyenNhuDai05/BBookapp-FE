import type {Observation} from './faceFeatures/profileV2';
export const techniqueTaxonomy={
 'soft-eyeliner':'Viền mắt mảnh, mềm','defined-eyeliner':'Viền mắt rõ','outer-eye-emphasis':'Nhấn đuôi mắt',
 'gradient-eyeshadow':'Phấn mắt chuyển sắc','eye-shimmer':'Nhũ điểm trên mắt',
 'natural-brow-styling':'Chải mày theo nét sẵn có','soft-brow-shaping':'Tạo nét mày mềm','defined-brow-shaping':'Tạo nét mày rõ',
 'gradient-lips':'Son chuyển sắc','defined-lip-outline':'Viền môi có nét','soft-blurred-lips':'Viền son tán mềm','glossy-lips':'Môi bóng',
 'soft-blush-placement':'Má tán mềm','directional-blush-placement':'Má tán có hướng','subtle-contour':'Tạo khối nhẹ',
} as const;
export type TechniqueKey=keyof typeof techniqueTaxonomy;
export type CompatibilityRule={id:string;feature:'eyeSpacing'|'eyeAspect'|'browArch'|'mouthAspect';observation:Exclude<Observation,'unknown'|'neutral'>;techniqueKey:TechniqueKey;rankingEffect:'positive';evidenceStatus:'experimental';reviewStatus:'pending';requiredQuality:'provisional';explanation:string;reviewNote:string};
const rule=(id:string,feature:CompatibilityRule['feature'],observation:CompatibilityRule['observation'],techniqueKey:TechniqueKey,explanation:string,reviewNote:string):CompatibilityRule=>({id,feature,observation,techniqueKey,rankingEffect:'positive',evidenceStatus:'experimental',reviewStatus:'pending',requiredQuality:'provisional',explanation,reviewNote});
export const compatibilityRules:CompatibilityRule[]=[
 rule('spacing-low-outer','eyeSpacing','relatively_low','outer-eye-emphasis','Bạn có thể thử nhấn màu ở đuôi mắt và kéo viền nhẹ ra ngoài để khám phá bố cục mắt khác.','Quan hệ bố trí mắt tham khảo; tỷ lệ normalized chưa phân loại close-set được kiểm chứng.'),
 rule('spacing-high-soft','eyeSpacing','relatively_high','soft-eyeliner','Thử giữ đường viền mắt mảnh, gọn thay vì kéo đuôi dài; tăng màu từng chút để chọn bố cục bạn thích.','Biến thể nghệ thuật giảm kéo đuôi; không suy wide-set giải phẫu.'),
 rule('opening-low-soft','eyeAspect','relatively_low','soft-eyeliner','Theo vùng mắt được phân tích, thử viền mảnh sát mi và kiểm tra khi mở mắt để giữ khoảng màu nhẹ.','Lấy ý tưởng viền mảnh tiết kiệm vùng màu; không đồng nhất eyeAspect với hooded/một mí.'),
 rule('opening-high-gradient','eyeAspect','relatively_high','gradient-eyeshadow','Bạn có thể thử màu mắt chuyển từ nhạt sang đậm từng lớp, kiểm tra vị trí màu khi mở mắt.','Kỹ thuật chuyển sắc trên vùng mắt hiện có; chưa chứng minh tương thích thẩm mỹ theo tỷ lệ.'),
 rule('arch-low-soft','browArch','relatively_low','soft-brow-shaping','Thử đi nét chân mày mềm theo đường sẵn có, không cần vẽ đỉnh mày cao hơn.','Giữ đường chân mày, không dùng độ cong làm chuẩn đẹp/xấu.'),
 rule('arch-high-natural','browArch','relatively_high','natural-brow-styling','Thử chải mày và bổ sung các khoảng thưa theo đường cong sẵn có để giữ nét tự nhiên.','Giữ natural arch theo kỹ thuật chải mày; classifier arch là provisional.'),
 rule('lip-low-outline','mouthAspect','relatively_low','defined-lip-outline','Với vùng môi được phân tích, thử viền cùng màu son, tán mép vào trong rồi kiểm tra trước khi tăng độ rõ.','Lip liner hỗ trợ kiểm soát viền; mouthAspect không phân loại môi mỏng được kiểm chứng.'),
 rule('lip-high-soft','mouthAspect','relatively_high','soft-blurred-lips','Thử son tán mềm ở mép môi, tăng màu từ giữa để chọn mức điểm nhấn bạn muốn.','Lựa chọn nghệ thuật đối chiếu với tỷ lệ môi; cần review MUA, không kết luận môi dày.'),
];
export function validCompatibility(value:unknown):value is CompatibilityRule[]{
 return Array.isArray(value)&&new Set(value.map(r=>r?.id)).size===value.length&&value.every(r=>r&&typeof r.id==='string'&&r.id.length>0&&['eyeSpacing','eyeAspect','browArch','mouthAspect'].includes(r.feature)&&['relatively_low','relatively_high'].includes(r.observation)&&typeof r.techniqueKey==='string'&&Object.prototype.hasOwnProperty.call(techniqueTaxonomy,r.techniqueKey)&&r.rankingEffect==='positive'&&r.evidenceStatus==='experimental'&&r.reviewStatus==='pending'&&r.requiredQuality==='provisional'&&typeof r.explanation==='string'&&r.explanation.length>0&&typeof r.reviewNote==='string'&&r.reviewNote.length>0);
}
if(!validCompatibility(compatibilityRules))throw new Error('Invalid compatibility rules');
