import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BrandCircles } from '@/components/brand/Brand';
import { Text } from '@/components/ui/Text';
import type { Vnd } from '@/domain/types';
import { t } from '@/i18n';
import { formatVnd } from '@/lib/format';
import { colors, fonts, radius, shadows } from '@/theme/tokens';
import { AmountText } from './AmountText';

export interface BalanceAction {
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  onPress: () => void;
}

interface BalanceCardProps {
  available: Vnd;
  held: Vnd;
  actions: BalanceAction[];
}

export function BalanceCard({ available, held, actions }: BalanceCardProps) {
  const [hidden, setHidden] = useState(false);
  const Toggle = hidden ? EyeOff : Eye;
  return (
    <View style={styles.card}>
      <BrandCircles disc={{ size: 220, right: -70, top: -90 }} coin={{ size: 90, right: 36, bottom: -50 }} />
      <View style={styles.labelRow}>
        <Text variant="caption" color={colors.green200} style={styles.label}>
          {t('home.balance')}
        </Text>
        <Pressable onPress={() => setHidden(!hidden)} hitSlop={10} accessibilityLabel={t('home.toggleBalance')}>
          <Toggle size={16} color={colors.green200} />
        </Pressable>
      </View>
      <AmountText value={available} size="xl" color="#fff" hidden={hidden} style={styles.amount} />
      {held > 0 ? (
        <Text variant="caption" color={colors.green200} style={styles.held}>
          {t('home.held', { amount: hidden ? '••••' : formatVnd(held) })}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {actions.map(({ label, icon: Icon, primary, onPress }) => (
          <Pressable
            key={label}
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}
          >
            <View style={[styles.actionIcon, primary ? styles.actionPrimary : null]}>
              <Icon size={19} color={primary ? colors.green950 : '#fff'} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: radius.xl, padding: 20, backgroundColor: colors.green900, ...shadows.lg },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 13 },
  amount: { marginTop: 6 },
  held: { marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 20 },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    paddingBottom: 10,
    borderRadius: 16,
    backgroundColor: colors.onDarkSoft,
  },
  actionPressed: { transform: [{ scale: 0.97 }] },
  actionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.onDarkMedium },
  actionPrimary: { backgroundColor: colors.gold400 },
  actionLabel: { fontFamily: fonts.semibold, fontSize: 12, color: '#fff' },
});
