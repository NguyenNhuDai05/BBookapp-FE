import React from 'react';
import Svg,{Circle,Defs,Ellipse,G,LinearGradient,Path,Rect,Stop} from 'react-native-svg';
// Original cosmetic illustration for offline/catalog-empty states; never face observations.
export function BeautyIllustration(){return <Svg width="100%" height={170} viewBox="0 0 340 170" accessibilityLabel="Minh họa dụng cụ trang điểm">
 <Defs><LinearGradient id="beauty-powder" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFB6D3"/><Stop offset="1" stopColor="#FF5C9A"/></LinearGradient></Defs>
 <Rect width={340} height={170} rx={22} fill="#FFF7FA"/>
 <Circle cx={90} cy={56} r={48} fill="#FFD6E5" opacity={.5}/><Circle cx={256} cy={126} r={60} fill="#FFD6E5" opacity={.45}/>
 <Ellipse cx={170} cy={144} rx={106} ry={10} fill="#E5AAC0" opacity={.25}/>
 <G rotation={-12} origin="120,95"><Circle cx={116} cy={95} r={48} fill="#2B1B2A"/><Circle cx={116} cy={95} r={42} fill="#F6D3AE"/><Circle cx={116} cy={95} r={33} fill="url(#beauty-powder)"/><Path d="M92 80 Q116 65 139 80" stroke="#FFF7FA" strokeWidth={2} fill="none" opacity={.6}/></G>
 <G rotation={14} origin="244,85"><Rect x={229} y={78} width={27} height={61} rx={5} fill="#2B1B2A"/><Rect x={229} y={78} width={27} height={12} fill="#D9B080"/><Path d="M233 78 L233 46 Q242 35 251 44 L251 78 Z" fill="#FF5C9A"/><Path d="M236 48 L236 72" stroke="#FFD6E5" strokeWidth={3} strokeLinecap="round"/></G>
 <G rotation={-24} origin="188,90"><Rect x={182} y={66} width={12} height={78} rx={6} fill="#F1D1B4"/><Rect x={181} y={57} width={14} height={20} rx={3} fill="#D9B080"/><Path d="M181 61 Q166 34 188 25 Q210 34 195 61 Z" fill="#74566A"/><Path d="M188 31 L188 52" stroke="#F6D3AE" strokeWidth={1.5} opacity={.5}/></G>
 <Path d="M289 31 L289 45 M282 38 L296 38" stroke="#D9B080" strokeWidth={2} strokeLinecap="round"/>
 </Svg>;}
