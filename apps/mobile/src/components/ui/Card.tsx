import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows } from '@/theme/tokens';

interface CardProps {
  variant?: 'default' | 'tint' | 'sunken' | 'inverse';
  padding?: number | { vertical: number; horizontal: number };
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function Card({ variant = 'default', padding = 16, onPress, style, children }: CardProps) {
  const pad =
    typeof padding === 'number'
      ? { padding }
      : { paddingVertical: padding.vertical, paddingHorizontal: padding.horizontal };
  const body = [styles.base, styles[variant], pad, style];
  if (!onPress) return <View style={body}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [body, pressed ? styles.pressed : null]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg },
  default: { backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, ...shadows.sm },
  tint: { backgroundColor: colors.surfaceTint },
  sunken: { backgroundColor: colors.surfaceSunken },
  inverse: { backgroundColor: colors.surfaceInverse },
  pressed: { opacity: 0.85 },
});
