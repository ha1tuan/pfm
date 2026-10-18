import { StyleSheet, View } from 'react-native';
import { colors, fonts } from '@/theme/tokens';
import { Text } from './Text';

const TONES = [
  [colors.green100, colors.green800],
  [colors.gold100, colors.gold700],
  [colors.blue50, colors.blue600],
  [colors.violet50, colors.violet500],
  [colors.coral50, colors.coral500],
] as const;

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export function Avatar({ name, size = 44, ring }: { name: string; size?: number; ring?: boolean }) {
  const [bg, fg] = TONES[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TONES.length];
  const inner = (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={{ fontFamily: fonts.bold, fontSize: Math.round(size * 0.36), color: fg }}>{initials(name)}</Text>
    </View>
  );
  if (!ring) return inner;
  return <View style={[styles.ring, { borderRadius: size / 2 + 4 }]}>{inner}</View>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  ring: { padding: 2, borderWidth: 2, borderColor: colors.green400, backgroundColor: '#fff' },
});
