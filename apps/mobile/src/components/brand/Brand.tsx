import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { colors, fonts } from '@/theme/tokens';

/**
 * Placeholder vector of the PFM wallet mark with gold keyhole.
 * Replace with the official SVG once exported (the design system ships low-res PNG only).
 */
export function Logo({ tone = 'dark', size = 36 }: { tone?: 'dark' | 'light'; size?: number }) {
  return (
    <View style={styles.logo}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Rect x={2} y={8} width={36} height={26} rx={9} fill={colors.green600} />
        <Path d="M2 15h26a10 10 0 0 1 10 10v2H2z" fill={tone === 'light' ? colors.green400 : colors.green500} />
        <Circle cx={28} cy={21} r={4.2} fill={colors.gold400} />
        <Rect x={26.8} y={22} width={2.4} height={6} rx={1.2} fill={colors.gold400} />
      </Svg>
      <Text style={[styles.word, { fontSize: size * 0.67, color: tone === 'light' ? '#fff' : colors.green900 }]}>PFM</Text>
    </View>
  );
}

interface CirclesProps {
  /** Large translucent green disc. */
  disc: ViewStyle & { size: number };
  /** Small solid gold "coin". */
  coin?: ViewStyle & { size: number };
}

/** Signature motif: overlapping circles cropped off deep-green hero surfaces. */
export function BrandCircles({ disc, coin }: CirclesProps) {
  const { size: d, ...discPos } = disc;
  const { size: c = 0, ...coinPos } = coin ?? {};
  return (
    <>
      <View pointerEvents="none" style={[styles.circle, styles.disc, { width: d, height: d, borderRadius: d / 2 }, discPos]} />
      {coin ? (
        <View pointerEvents="none" style={[styles.circle, styles.coin, { width: c, height: c, borderRadius: c / 2 }, coinPos]} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { fontFamily: fonts.extrabold, letterSpacing: -0.5 },
  circle: { position: 'absolute' },
  disc: { backgroundColor: colors.green600, opacity: 0.5 },
  coin: { backgroundColor: colors.gold400 },
});
