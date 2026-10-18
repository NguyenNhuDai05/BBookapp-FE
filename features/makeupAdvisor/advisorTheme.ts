import {BrandColors} from '../../constants/theme';

// Advisor presentation only; application-wide colors and scoring are unchanged.
export const advisorTheme = {
 background: BrandColors.bgPinkLight, surface: BrandColors.bgCard,
 text: BrandColors.textDark, body: BrandColors.textBody,
 accent: '#AF2458', accentSoft: '#FFF0F5', border: BrandColors.borderLight,
 imageBackground: '#F5F2F3',
} as const;
