import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';
import { Text } from './Text';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  /** Mask digits — used for the Transaction PIN. */
  masked?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  accessibilityLabel: string;
}

export function OtpInput({ value, onChange, length = 6, masked, error, autoFocus = true, accessibilityLabel }: OtpInputProps) {
  const ref = useRef<TextInput>(null);
  const chars = value.split('');
  return (
    <Pressable onPress={() => ref.current?.focus()} style={styles.row} accessibilityLabel={accessibilityLabel}>
      {Array.from({ length }).map((_, i) => {
        const active = i === chars.length;
        const filled = !!chars[i];
        return (
          <View
            key={i}
            style={[
              styles.cell,
              filled ? styles.filled : null,
              { borderColor: error ? colors.red500 : active ? colors.green500 : filled ? colors.borderBrand : colors.borderDefault },
            ]}
          >
            <Text style={styles.digit}>{filled ? (masked ? '•' : chars[i]) : ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  cell: {
    width: 46,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { backgroundColor: colors.green50 },
  digit: { fontFamily: fonts.bold, fontSize: 22, color: colors.green900 },
  hidden: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
});
