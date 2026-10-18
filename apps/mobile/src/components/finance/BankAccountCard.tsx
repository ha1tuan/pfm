import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import type { BankBrand, LinkedBankAccount } from '@/domain/types';
import { t } from '@/i18n';
import { colors, fonts, radius, shadows } from '@/theme/tokens';

// Short-code tiles stand in for official bank logos until they are licensed.
export const BANK_COLOR: Record<BankBrand, string> = {
  vcb: '#0B6E4F',
  tcb: '#D9363E',
  mb: '#1F4FB8',
  acb: '#1A56A8',
  vpb: '#00965E',
  tpb: '#6A2C91',
  bidv: '#1C4E9C',
};

export function BankTile({ code, short, size = 48 }: { code: BankBrand; short: string; size?: number }) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: BANK_COLOR[code] }]}>
      <Text style={[styles.tileText, { fontSize: size * 0.26 }]}>{short}</Text>
    </View>
  );
}

/** Linked Bank Account. No balance: PFM does not hold one for external accounts. */
export function BankAccountCard({ account, onPress }: { account: LinkedBankAccount; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}>
      <BankTile code={account.bank.code} short={account.bank.short} />
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text variant="bodyStrong">{account.bank.name}</Text>
          {account.isDefault ? <Text style={styles.default}>{t('accounts.defaultBadge')}</Text> : null}
        </View>
        <Text variant="mono" style={styles.number}>
          {account.maskedNumber} · {account.holderName}
        </Text>
      </View>
      {onPress ? <ChevronRight size={20} color={colors.neutral300} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.xs,
  },
  pressed: { opacity: 0.85 },
  tile: { alignItems: 'center', justifyContent: 'center' },
  tileText: { fontFamily: fonts.extrabold, color: '#fff', letterSpacing: 0.3 },
  text: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  default: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.gold700,
    backgroundColor: colors.gold100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  number: { marginTop: 2 },
});
