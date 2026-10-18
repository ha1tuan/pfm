// PFM design tokens (source: PFM Design System — tokens/*.css).
// Mirrors apps/admin/src/styles/_variables.scss; change both together.

export const palette = {
  green50: '#EEF7F1',
  green100: '#D7EFE0',
  green200: '#B2E4C9',
  green300: '#86DAB2',
  green400: '#5DD39E',
  green500: '#1FA673',
  green600: '#0E8A5F',
  green700: '#0B7552',
  green800: '#085F44',
  green900: '#064E3B',
  green950: '#03301F',
  gold50: '#FEF7E6',
  gold100: '#FDEBC2',
  gold300: '#F8C862',
  gold400: '#F5B73B',
  gold500: '#E59F1A',
  gold600: '#C38213',
  gold700: '#94610F',
  neutral0: '#FFFFFF',
  neutral25: '#F5F8F6',
  neutral50: '#EFF3F1',
  neutral100: '#E3EAE6',
  neutral200: '#CFDAD4',
  neutral300: '#B0BFB7',
  neutral400: '#8A9B92',
  neutral500: '#66786F',
  neutral600: '#4B5C54',
  neutral700: '#34433C',
  neutral800: '#1F2B26',
  red50: '#FDEDEE',
  red500: '#E5484D',
  red600: '#C9353A',
  blue50: '#EAF2FD',
  blue500: '#2F7FE0',
  blue600: '#1F66BF',
  violet50: '#F1EEFD',
  violet500: '#7A5AF0',
  coral50: '#FFF0EA',
  coral500: '#FF7A50',
  pink50: '#FDEBF4',
  pink500: '#E2559B',
} as const;

export const colors = {
  ...palette,
  surfacePage: palette.neutral25,
  surfaceCard: palette.neutral0,
  surfaceSunken: palette.neutral50,
  surfaceTint: palette.green50,
  surfaceInverse: palette.green900,
  overlay: 'rgba(6,30,22,0.48)',
  textStrong: palette.green950,
  textHeading: palette.green900,
  textBody: palette.neutral700,
  textMuted: palette.neutral500,
  textSubtle: palette.neutral400,
  borderSubtle: palette.neutral100,
  borderDefault: palette.neutral200,
  borderBrand: '#CFE7D9',
  focusRing: 'rgba(31,166,115,0.28)',
  moneyIn: palette.green600,
  moneyOut: palette.neutral800,
  onDarkSoft: 'rgba(255,255,255,0.10)',
  onDarkMedium: 'rgba(255,255,255,0.14)',
} as const;

export const space = { 1: 2, 2: 4, 3: 8, 4: 12, 5: 16, 6: 20, 7: 24, 8: 32, 9: 40, 10: 48 } as const;
export const gutter = 20;

export const radius = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const fonts = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  extrabold: 'BeVietnamPro_800ExtraBold',
  mono: 'JetBrainsMono_500Medium',
} as const;

const greenShadow = (y: number, blur: number, opacity: number) => ({
  shadowColor: palette.green900,
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: blur / 2,
  elevation: Math.round(y / 2),
});

export const shadows = {
  xs: greenShadow(1, 2, 0.06),
  sm: greenShadow(2, 6, 0.06),
  md: greenShadow(8, 24, 0.08),
  lg: greenShadow(20, 48, 0.14),
  brand: { ...greenShadow(10, 24, 0.3), shadowColor: palette.green600 },
  gold: { ...greenShadow(8, 20, 0.32), shadowColor: palette.gold500 },
} as const;

export const motion = { fast: 120, base: 200, slow: 320, pressScale: 0.97 } as const;

export const absoluteFill = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

/** Removes the browser focus outline on web; the field draws its own focus state. */
export const noWebOutline = { outlineWidth: 0 } as const;
