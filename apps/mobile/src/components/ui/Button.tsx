import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, motion, radius, shadows } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'dark' | 'danger' | 'glass';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, { bg: string; pressed: string; fg: string; border?: string; shadow?: ViewStyle }> = {
  primary: { bg: colors.green600, pressed: colors.green700, fg: '#fff', shadow: shadows.brand },
  secondary: { bg: colors.green50, pressed: colors.green100, fg: colors.green800 },
  outline: { bg: '#fff', pressed: colors.neutral25, fg: colors.green900, border: colors.borderDefault },
  ghost: { bg: 'transparent', pressed: colors.green50, fg: colors.green700 },
  gold: { bg: colors.gold400, pressed: colors.gold300, fg: colors.green950, shadow: shadows.gold },
  dark: { bg: colors.green900, pressed: colors.green800, fg: '#fff' },
  danger: { bg: colors.red50, pressed: '#FBDDDF', fg: colors.red600 },
  glass: { bg: colors.onDarkSoft, pressed: colors.onDarkMedium, fg: '#fff' },
};

const SIZES: Record<Size, { height: number; px: number; font: number; icon: number }> = {
  sm: { height: 36, px: 14, font: 13, icon: 16 },
  md: { height: 44, px: 20, font: 15, icon: 18 },
  lg: { height: 52, px: 24, font: 16, icon: 20 },
};

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  iconLeft: IconLeft,
  iconRight: IconRight,
  loading,
  disabled,
  fullWidth,
  style,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const off = disabled || loading;
  const fg = off ? colors.neutral400 : v.fg;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height: s.height, paddingHorizontal: s.px, backgroundColor: off ? colors.neutral100 : pressed ? v.pressed : v.bg },
        v.border ? { borderWidth: 1.5, borderColor: v.border } : null,
        !off && !pressed && v.shadow ? v.shadow : null,
        pressed && !off ? { transform: [{ scale: motion.pressScale }] } : null,
        fullWidth ? styles.full : null,
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : IconLeft ? <IconLeft size={s.icon} color={fg} /> : null}
      <Text style={[styles.label, { fontSize: s.font, color: fg }]} numberOfLines={1}>
        {label}
      </Text>
      {IconRight && !loading ? <IconRight size={s.icon} color={fg} /> : null}
    </Pressable>
  );
}

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  variant?: 'outline' | 'ghost' | 'glass' | 'tint';
  size?: number;
  badge?: boolean;
}

export function IconButton({ icon: Icon, label, onPress, variant = 'ghost', size = 44, badge }: IconButtonProps) {
  const bg = { outline: '#fff', ghost: 'transparent', glass: colors.onDarkSoft, tint: colors.green50 }[variant];
  const fg = variant === 'glass' ? '#fff' : colors.green900;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, backgroundColor: pressed ? colors.green50 : bg },
        variant === 'outline' ? styles.iconOutline : null,
      ]}
    >
      <Icon size={Math.round(size * 0.45)} color={fg} />
      {badge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  full: { alignSelf: 'stretch', flexGrow: 1, flexBasis: 0 },
  label: { fontFamily: fonts.semibold, letterSpacing: -0.08 },
  iconButton: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  iconOutline: { borderWidth: 1, borderColor: colors.borderSubtle },
  badge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red500,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
