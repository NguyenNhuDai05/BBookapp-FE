export const knowledgeVersion = '2026-10-12.photo-first.1';
export type Preferences = Partial<{occasion:'daily'|'party'|'wedding'|'portrait';intensity:'soft'|'defined';focus:'balanced'|'eyes'|'lips'}>;
export const sources = [
 'https://www.bobbibrowncosmetics.com/trends-natural-dewy-makeup',
 'https://www.bobbibrowncosmetics.com/trends-filter',
 'https://www.nyxcosmetics.com/blog/where-how-to-apply-blush-for-your-face-shape.html',
 'https://www.bobbibrowncosmetics.com/bride-wedding-makeup',
];
// Original editorial descriptions, not clinical advice. Aliases verified against
// GET /Explore 2026-10-12; IDs always resolved at runtime. Geometry thresholds
// below are experimental product heuristics, not validated face classifiers.
export const knowledge = [
 {key:'korean',name:'Korean · tươi sáng',aliases:['Korean'],occasions:['daily'],intensity:'soft',focus:'balanced',detail:'Nền mỏng, hiệu ứng sáng nhẹ; má mềm và môi tự nhiên. Trao đổi màu cụ thể với MUA.',source:0,base:3},
 {key:'portrait',name:'Kỷ yếu · hài hòa trong ảnh',aliases:['Kỷ yếu'],occasions:['portrait'],intensity:'soft',focus:'balanced',detail:'Nền gọn, mắt và môi có độ rõ vừa phải; thử bố trí má để tạo hiệu ứng cân đối trong ảnh.',source:2,base:2},
 {key:'event',name:'Sự kiện · điểm nhấn rõ nét',aliases:['Sự kiện'],occasions:['party'],intensity:'defined',focus:'eyes',detail:'Tạo chiều sâu bằng phấn mắt và eyeliner; cân bằng với má và môi theo mức nổi bật bạn muốn.',source:1,base:1},
 {key:'bridal',name:'Cô dâu · thanh lịch',aliases:['Cô dâu'],occasions:['wedding'],intensity:'soft',focus:'balanced',detail:'Phối nền, mắt và môi cho ngày cưới. Cần thử makeup với MUA; không suy ra nhu cầu cưới từ ảnh.',source:3,base:0},
] as const;
