import { MessageCircle } from 'lucide-react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRemainingLimit, useWallet } from '@/api/queries';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ScrollBody } from '@/components/ui/Screen';
import { Tag } from '@/components/ui/Tag';
import { Text } from '@/components/ui/Text';
import type { Recipient, Vnd } from '@/domain/types';
import { t } from '@/i18n';
import { formatVnd, formatVndCompact, formatVndDigits, parseDigits } from '@/lib/format';
import { colors, fonts, noWebOutline } from '@/theme/tokens';
import { recipientDetail } from './RecipientStep';

const QUICK_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000];

export const MIN_AMOUNT = 1_000;

interface AmountStepProps {
  recipient: Recipient;
  amount: Vnd;
  note: string;
  onAmount: (v: Vnd) => void;
  onNote: (v: string) => void;
  /** Balance/limit rejection returned by the server; the client never pre-validates those. */
  serverError?: string;
}

export function AmountStep({ recipient, amount, note, onAmount, onNote, serverError }: AmountStepProps) {
  const { data: wallet } = useWallet();
  const { data: remaining = 0 } = useRemainingLimit();
  const error = serverError ?? (amount > 0 && amount < MIN_AMOUNT ? t('transfer.minAmount') : undefined);

  return (
    <ScrollBody>
      <Card variant="sunken" padding={14} style={styles.recipient}>
        <Avatar name={recipient.name} size={44} />
        <View style={styles.flex}>
          <Text variant="bodyStrong">{recipient.name}</Text>
          <Text variant="mono">{recipientDetail(recipient)}</Text>
        </View>
      </Card>

      <View style={styles.amountBlock}>
        <Text variant="label" color={colors.textMuted} align="center">
          {t('transfer.amountLabel')}
        </Text>
        <TextInput
          value={amount ? formatVndDigits(amount) : ''}
          onChangeText={(v) => onAmount(parseDigits(v))}
          placeholder="0"
          placeholderTextColor={colors.neutral300}
          keyboardType="number-pad"
          autoFocus
          style={[styles.amountInput, error ? styles.amountError : null]}
          accessibilityLabel={t('transfer.amountLabel')}
        />
        <Text variant="caption" align="center" color={error ? colors.red600 : colors.textMuted}>
          {error ?? t('transfer.remaining', { amount: formatVnd(remaining) })}
        </Text>
      </View>

      <View style={styles.quick}>
        {QUICK_AMOUNTS.map((v) => (
          <Tag key={v} label={formatVndCompact(v)} selected={amount === v} onPress={() => onAmount(v)} />
        ))}
      </View>

      <Input label={t('transfer.note')} icon={MessageCircle} value={note} onChangeText={onNote} maxLength={140} />

      <View style={styles.source}>
        <Text variant="label">{t('transfer.source')}</Text>
        <Text variant="bodySm">{t('transfer.sourceValue', { balance: formatVnd(wallet?.availableBalance ?? 0) })}</Text>
      </View>
    </ScrollBody>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  recipient: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amountBlock: { paddingTop: 32, paddingBottom: 8, gap: 4 },
  amountInput: {
    ...noWebOutline,
    fontFamily: fonts.extrabold,
    fontSize: 44,
    letterSpacing: -0.88,
    color: colors.textHeading,
    textAlign: 'center',
    paddingVertical: 4,
  },
  amountError: { color: colors.red500 },
  quick: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20, marginTop: 8 },
  source: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
});
