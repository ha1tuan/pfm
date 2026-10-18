import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { Text } from './Text';

const TONES = {
  brand: [colors.green50, colors.green700],
  gold: [colors.gold50, colors.gold600],
  neutral: [colors.neutral50, colors.neutral600],
  danger: [colors.red50, colors.red500],
  info: [colors.blue50, colors.blue500],
} as const;

interface ListItemProps {
  icon?: LucideIcon;
  iconTone?: keyof typeof TONES;
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  chevron?: boolean;
  divider?: boolean;
  onPress?: () => void;
}

export function ListItem({ icon: Icon, iconTone = 'brand', leading, title, subtitle, trailing, chevron, divider, onPress }: ListItemProps) {
  const [bg, fg] = TONES[iconTone];
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, divider ? styles.divider : null, pressed ? styles.pressed : null]}
    >
      {leading ??
        (Icon ? (
          <View style={[styles.tile, { backgroundColor: bg }]}>
            <Icon size={22} color={fg} />
          </View>
        ) : null)}
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text variant="bodySm">{subtitle}</Text> : null}
      </View>
      {trailing}
      {chevron ? <ChevronRight size={20} color={colors.neutral300} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  pressed: { opacity: 0.85 },
  tile: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0, gap: 2 },
});
