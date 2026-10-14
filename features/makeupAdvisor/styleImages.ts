import type {ImageSourcePropType} from 'react-native';
import {presentationStyle} from './presentationCatalog';
// Each slot accepts one unique licensed local WebP via a literal require().
// Missing assets deliberately use the themed placeholder; never use the selfie.
export const styleImages:Readonly<Record<string,ImageSourcePropType|undefined>>={
 'soft-korean.webp':undefined, // ../../assets/images/advisor/styles/soft-korean.webp
 'douyin.webp':undefined, // ../../assets/images/advisor/styles/douyin.webp
 'clean-girl.webp':undefined, // ../../assets/images/advisor/styles/clean-girl.webp
 'natural.webp':undefined, // ../../assets/images/advisor/styles/natural.webp
 'peach.webp':undefined, // ../../assets/images/advisor/styles/peach.webp
 'strawberry.webp':undefined, // ../../assets/images/advisor/styles/strawberry.webp
 'latte.webp':undefined, // ../../assets/images/advisor/styles/latte.webp
 'soft-glam.webp':undefined, // ../../assets/images/advisor/styles/soft-glam.webp
 'thai-glam.webp':undefined, // ../../assets/images/advisor/styles/thai-glam.webp
 'smokey-eyes.webp':undefined, // ../../assets/images/advisor/styles/smokey-eyes.webp
 'bridal-soft-glam.webp':undefined, // ../../assets/images/advisor/styles/bridal-soft-glam.webp
 'classic-glam.webp':undefined, // ../../assets/images/advisor/styles/classic-glam.webp
 'j-beauty.webp':undefined, // ../../assets/images/advisor/styles/j-beauty.webp
 'igari.webp':undefined, // ../../assets/images/advisor/styles/igari.webp
 'ulzzang.webp':undefined, // ../../assets/images/advisor/styles/ulzzang.webp
 'western-glam.webp':undefined, // ../../assets/images/advisor/styles/western-glam.webp
 'nude-makeup.webp':undefined, // ../../assets/images/advisor/styles/nude-makeup.webp
 'fox-eye.webp':undefined, // ../../assets/images/advisor/styles/fox-eye.webp
 'sunkissed.webp':undefined, // ../../assets/images/advisor/styles/sunkissed.webp
 'glass-skin.webp':undefined, // ../../assets/images/advisor/styles/glass-skin.webp
};
export const styleFor=presentationStyle;
export const paletteColors:Readonly<Record<string,string>>={
  "cam đào": "#EEAA8D",
  "hồng hoa hồng": "#D98FAD",
  "nâu": "#96705A",
  "đỏ": "#CF263B",
  "nude": "#D6B5A3",
  "be ấm": "#DCC5A7",
  "ánh đồng": "#B9855F",
  "hồng nhạt": "#F5C0CF",
  "đào nude": "#DEAA96",
  "be nhạt": "#EBDAC5",
  "hồng ấm": "#E6A1A3",
  "cam mơ": "#F2AC74",
  "hồng": "#EB9DB8",
  "đỏ mọng": "#B34B68",
  "nâu dịu": "#B29485",
  "nâu cà phê sữa": "#A78065",
  "vàng hồng": "#DAAAA0",
  "nâu xám": "#A18F85",
  "hồng tím đất": "#B18291",
  "đỏ đất nung": "#BB765B",
  "nude ấm": "#CBA18B",
  "cam cháy": "#C7794C",
  "đen than": "#413C42",
  "trắng ngọc trai": "#F5EBE7",
  "trắng ngà": "#F5EBD6",
  "vàng kim": "#D8B362",
  "be": "#DDC6AE",
  "hồng phấn": "#F4A8BF",
  "đào nhạt": "#F5C3AF",
  "nâu hồng": "#B78780",
  "hồng nude": "#D6A2A4",
  "đào trong": "#F3BCAB",
  "hồng đất nhẹ": "#D4A0A0",
  "be hồng": "#E2C3BA",
  "cam hồng": "#EEA08F",
  "nâu đào": "#BC907A",
  "đỏ hồng": "#DD526D",
  "nâu mềm": "#B39587",
  "caramel": "#AF7E51",
  "đồng nhạt": "#BE967C",
  "nâu trung tính": "#998276",
  "champagne dịu": "#E9D8B9",
  "nâu đồng": "#9C745B",
  "be nâu": "#C3A68F",
  "hồng nâu": "#B88988",
  "nâu khói": "#80716E",
  "xám than": "#514B52",
  "champagne mịn": "#EEDDBD",
  "be sáng": "#F0DFCC",
  "hồng đào": "#F5B6A5",
  "hồng sữa": "#F6B9CD",
  "hồng đất": "#BE8185",
  "hồng dâu": "#F1698C",
  "đỏ dâu": "#D73352",
  "đỏ cherry": "#BD2445",
  "đỏ cổ điển": "#B62136",
  "đỏ rượu": "#7D2941",
  "nude hồng": "#D9A5A8",
  "nude đào": "#E9BAA4",
  "nude be": "#DFC4B3",
  "nâu sữa": "#C4A18D",
  "nâu nhạt": "#C2A18C",
  "nâu ấm": "#A06B4F",
  "nâu chocolate": "#6F4838",
  "nâu taupe": "#97847C",
  "champagne": "#EAD6AD",
  "vàng champagne": "#EAD6AD",
  "san hô": "#EF8B8D",
  "đen": "#342C32",
  "bạc": "#CDD0DA",
  "nâu đậm": "#6C4F42"
};
export function colorFor(name:string){return /^#[0-9a-f]{6}$/i.test(name)?name:paletteColors[name.toLocaleLowerCase('vi').trim()];}

