import { X, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';
import { Text } from './Text';

interface TagProps {
  label: string;
  selected?: boolean;
  icon?: LucideIcon;
  onPress?: () => void;
  onRemove?: () => void;
}

export function Tag({ label, selected, icon: Icon, onPress, onRemove }: TagProps) {
  const fg = selected ? '#fff' : colors.green900;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.tag, selected ? styles.selected : null, onRemove ? styles.withRemove : null]}
    >
      {Icon ? <Icon size={15} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel={label}>
          <View style={[styles.remove, selected ? styles.removeSelected : null]}>
            <X size={12} strokeWidth={2.5} color={fg} />
          </View>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    backgroundColor: '#fff',
  },
  selected: { backgroundColor: colors.green900, borderColor: colors.green900 },
  withRemove: { paddingRight: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
  remove: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral50 },
  removeSelected: { backgroundColor: 'rgba(255,255,255,0.16)' },
});
