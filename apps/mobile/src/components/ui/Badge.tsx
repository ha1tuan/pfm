import { StyleSheet, View } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';
import { Text } from './Text';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' | 'gold';

const TONES: Record<BadgeTone, [bg: string, fg: string, dot: string]> = {
  success: [colors.green50, colors.green700, colors.green600],
  warning: [colors.gold50, colors.gold700, colors.gold500],
  danger: [colors.red50, colors.red600, colors.red500],
  info: [colors.blue50, colors.blue600, colors.blue500],
  neutral: [colors.neutral50, colors.neutral600, colors.neutral400],
  brand: [colors.green900, '#fff', colors.green400],
  gold: [colors.gold400, colors.green950, colors.green900],
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function Badge({ label, tone = 'neutral', dot, size = 'md' }: BadgeProps) {
  const [bg, fg, dotColor] = TONES[tone];
  const sm = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: bg, height: sm ? 20 : 24, paddingHorizontal: sm ? 8 : 10 }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={[styles.label, { color: fg, fontSize: sm ? 11 : 12 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: fonts.semibold, lineHeight: 14 },
});
