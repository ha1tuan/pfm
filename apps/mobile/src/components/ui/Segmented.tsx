import { Pressable, StyleSheet, View } from 'react-native';
import { colors, fonts, radius, shadows } from '@/theme/tokens';
import { Text } from './Text';

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: string }[];
}

export function Segmented<T extends string>({ value, onChange, items }: SegmentedProps<T>) {
  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {items.map((item) => {
        const on = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(item.value)}
            style={[styles.item, on ? styles.itemOn : null]}
          >
            <Text style={[styles.label, { color: on ? colors.green900 : colors.textMuted }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: 2, padding: 4, borderRadius: radius.pill, backgroundColor: colors.neutral50 },
  item: { flex: 1, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  itemOn: { backgroundColor: '#fff', ...shadows.sm },
  label: { fontFamily: fonts.semibold, fontSize: 14 },
});
