import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/theme/tokens';

interface DonutProps {
  parts: { key: string; value: number; color: string }[];
  size?: number;
  stroke?: number;
}

/** Rounded-cap donut with 4px gaps between segments. */
export function Donut({ parts, size = 140, stroke = 18 }: DonutProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const total = parts.reduce((sum, p) => sum + p.value, 0) || 1;
  let offset = 0;
  // Rotate the view (not an SVG group) so segments start at 12 o'clock on native and web alike.
  return (
    <View style={styles.rotated}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.neutral50} strokeWidth={stroke} />
        {parts.map((p) => {
          const len = (p.value / total) * circumference;
          const el = (
            <Circle
              key={p.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len - 4 - stroke / 2)} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += len;
          return el;
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ rotated: { transform: [{ rotate: '-90deg' }] } });
