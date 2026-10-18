import { ShieldAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AmountText } from '@/components/finance/AmountText';
import { Card } from '@/components/ui/Card';
import { ScrollBody } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import type { Recipient, TransferQuote } from '@/domain/types';
import { t } from '@/i18n';
import { formatPhone, formatVnd } from '@/lib/format';
import { colors, radius } from '@/theme/tokens';

export function SummaryRow({ label, value, accent, last }: { label: string; value: string; accent?: boolean; last?: boolean }) {
  return (
    <View style={[styles.row, last ? null : styles.rowDivider]}>
      <Text variant="bodySm" style={styles.rowLabel}>
        {label}
      </Text>
      <Text variant="bodyStrong" color={accent ? colors.green600 : undefined} style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

export function ScamWarning() {
  return (
    <View style={styles.warning}>
      <ShieldAlert size={20} color={colors.gold700} />
      <Text variant="caption" color={colors.gold700} style={styles.flex}>
        {t('transfer.scamWarning')}
      </Text>
    </View>
  );
}

export function ConfirmStep({ recipient, quote, note }: { recipient: Recipient; quote: TransferQuote; note: string }) {
  const rows: [string, string, boolean?][] = [
    [t('transfer.recipient'), recipient.name],
    ...(recipient.kind === 'bank'
      ? ([
          [t('transfer.bank'), recipient.bank.name],
          [t('transfer.account'), recipient.accountNumber],
        ] as [string, string][])
      : ([[t('transfer.phone'), formatPhone(recipient.phone)]] as [string, string][])),
    [t('transfer.source'), t('common.walletName')],
    ...(note ? ([[t('transfer.note'), note]] as [string, string][]) : []),
    [t('transfer.fee'), quote.fee ? formatVnd(quote.fee) : t('common.free'), !quote.fee],
    [t('transfer.total'), formatVnd(quote.total)],
  ];
  return (
    <ScrollBody>
      <Card padding={20}>
        <View style={styles.hero}>
          <Text variant="label" color={colors.textMuted}>
            {t('transfer.youSend')}
          </Text>
          <AmountText value={quote.amount} size="xl" />
        </View>
        {rows.map(([label, value, accent], i) => (
          <SummaryRow key={label} label={label} value={value} accent={accent} last={i === rows.length - 1} />
        ))}
      </Card>
      <ScamWarning />
    </ScrollBody>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 16,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: colors.borderDefault,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  rowLabel: { fontSize: 14 },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.gold50,
  },
});
