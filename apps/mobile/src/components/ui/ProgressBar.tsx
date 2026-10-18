import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme/tokens';

interface ProgressBarProps {
  value: number;
  max?: number;
  height?: number;
  /** Fixed colour; otherwise auto-tones green → gold (≥80%) → red (≥100%). */
  color?: string;
  track?: string;
  style?: StyleProp<ViewStyle>;
}

export function progressTone(pct: number) {
  if (pct >= 100) return colors.red500;
  if (pct >= 80) return colors.gold400;
  return colors.green500;
}

export function ProgressBar({ value, max = 100, height = 8, color, track = colors.neutral100, style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      style={[styles.track, { height, backgroundColor: track }, style]}
    >
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color ?? progressTone((value / max) * 100) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
});
