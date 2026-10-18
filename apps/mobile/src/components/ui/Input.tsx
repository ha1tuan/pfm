import type { LucideIcon } from 'lucide-react-native';
import { forwardRef, useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, noWebOutline, radius } from '@/theme/tokens';
import { Text } from './Text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  icon?: LucideIcon;
  suffix?: ReactNode;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, icon: Icon, suffix, hint, error, size = 'md', onFocus, onBlur, ...rest },
  ref,
) {
  const [focus, setFocus] = useState(false);
  const height = size === 'lg' ? 56 : size === 'sm' ? 40 : 48;
  const border = error ? colors.red500 : focus ? colors.green500 : colors.borderDefault;
  return (
    <View style={styles.wrap}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View style={[styles.field, { height, borderColor: border }, focus && !error ? styles.focus : null]}>
        {Icon ? <Icon size={18} color={focus ? colors.green600 : colors.neutral400} /> : null}
        <TextInput
          ref={ref}
          {...rest}
          placeholderTextColor={colors.neutral400}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          style={styles.input}
        />
        {suffix}
      </View>
      {error || hint ? (
        <Text variant="caption" color={error ? colors.red600 : colors.textMuted}>
          {error ?? hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  focus: { shadowColor: colors.green500, shadowOpacity: 0.28, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } },
  input: { flex: 1, minWidth: 0, height: '100%', fontFamily: fonts.medium, fontSize: 15, color: colors.textStrong, ...noWebOutline },
});
