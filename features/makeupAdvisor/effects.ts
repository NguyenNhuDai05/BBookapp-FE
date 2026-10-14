import overlay from './effectOverlay.json';
export type MakeupEffect=keyof typeof overlay;
export const makeupEffects=overlay;
export function validEffects(value:unknown):value is MakeupEffect[]{return Array.isArray(value)&&new Set(value).size===value.length&&value.every(k=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(overlay,k));}
export type SuggestionSource='face-aware'|'preference-based'|'fallback';
export const suggestionLabels:Record<SuggestionSource,string>={'face-aware':'Theo đường nét','preference-based':'Theo lựa chọn của bạn',fallback:'Gợi ý khám phá'};
