import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import type { Vnd } from '@/domain/types';
import { formatVndDigits, signPrefix } from '@/lib/format';
import { colors, fonts } from '@/theme/tokens';

const SIZES = {
  xl: { main: 36, currency: 20, family: fonts.extrabold },
  lg: { main: 28, currency: 16, family: fonts.extrabold },
  md: { main: 17, currency: 13, family: fonts.bold },
  sm: { main: 14, currency: 12, family: fonts.semibold },
} as const;

interface AmountTextProps {
  value: Vnd;
  size?: keyof typeof SIZES;
  /** Show "+" and colour money-in green. */
  signed?: boolean;
  hidden?: boolean;
  color?: string;
  struck?: boolean;
  style?: StyleProp<TextStyle>;
}

export function AmountText({ value, size = 'md', signed, hidden, color, struck, style }: AmountTextProps) {
  const s = SIZES[size];
  const tone = color ?? (signed && value > 0 ? colors.moneyIn : colors.moneyOut);
  return (
    <Text
      style={[
        styles.amount,
        { fontFamily: s.family, fontSize: s.main, color: tone, letterSpacing: s.main >= 28 ? -0.02 * s.main : -0.08 },
        struck ? styles.struck : null,
        style,
      ]}
      numberOfLines={1}
    >
      {hidden ? '••••••' : `${signPrefix(value, !!signed)}${formatVndDigits(value)}`}
      <Text style={[styles.currency, { fontSize: s.currency }]}> ₫</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  amount: { fontVariant: ['tabular-nums'] },
  currency: { fontFamily: fonts.semibold, opacity: 0.6 },
  struck: { textDecorationLine: 'line-through', opacity: 0.5 },
});
