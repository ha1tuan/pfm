import type { TextStyle } from 'react-native';
import { colors, fonts } from './tokens';

/** Type scale from the design system; amounts always use tabular figures. */
export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -0.68, color: colors.textHeading },
  h2: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.22, color: colors.textHeading },
  h3: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, color: colors.textHeading },
  title: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, letterSpacing: -0.17, color: colors.textHeading },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textBody },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.textStrong },
  bodySm: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.textHeading },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  overline: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1.1, color: colors.textSubtle, textTransform: 'uppercase' },
  mono: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16, color: colors.textMuted },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
