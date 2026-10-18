import { router } from 'expo-router';
import { Check, Clock, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransaction } from '@/api/queries';
import { BrandCircles } from '@/components/brand/Brand';
import { AmountText } from '@/components/finance/AmountText';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { Transaction } from '@/domain/types';
import { t } from '@/i18n';
import { formatDate, formatTime } from '@/lib/format';
import { colors, radius, shadows } from '@/theme/tokens';

interface ResultViewProps {
  /** The transaction as returned by the submit call; live status is re-fetched. */
  initial: Transaction;
  successTitle: string;
  processingTitle: string;
}

/** Result screen reflects the server status: a bank-facing transaction can still be processing. */
export function ResultView({ initial, successTitle, processingTitle }: ResultViewProps) {
  const { data } = useTransaction(initial.id);
  const tx = data ?? initial;
  const state = tx.status === 'succeeded' ? 'success' : tx.status === 'failed' ? 'failed' : 'processing';
  const Icon = { success: Check, processing: Clock, failed: X }[state];
  const title = { success: successTitle, processing: processingTitle, failed: t('transfer.failedTitle') }[state];

  return (
    <View style={styles.screen}>
      <BrandCircles disc={{ size: 340, left: 25, top: 60 }} />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.body} accessibilityLiveRegion="polite">
          <View style={[styles.medal, state === 'failed' ? styles.medalFailed : null]}>
            <Icon size={46} strokeWidth={3} color={state === 'failed' ? '#fff' : colors.green950} />
          </View>
          <Text variant="bodyStrong" color={colors.green200} style={styles.title}>
            {title}
          </Text>
          <AmountText value={Math.abs(tx.amount)} size="xl" color="#fff" style={styles.amount} />
          <Text variant="body" color={colors.green200} align="center" style={styles.to}>
            {t('transfer.toLine', { name: tx.counterpartyName })}
          </Text>
          {state === 'processing' ? (
            <Text variant="caption" color={colors.green200} align="center" style={styles.note}>
              {t('transfer.processingBody')}
            </Text>
          ) : null}
          <Text variant="mono" color={colors.green300} style={styles.ref}>
            {t('transfer.refLine', { ref: tx.id, time: `${formatDate(tx.createdAt)} ${formatTime(tx.createdAt)}` })}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            label={t('transfer.viewDetail')}
            variant="glass"
            size="lg"
            fullWidth
            onPress={() => router.replace({ pathname: '/activity/[kind]/[id]', params: { kind: 'transaction', id: tx.id } })}
          />
          <Button label={t('common.goHome')} variant="gold" size="lg" fullWidth onPress={() => router.dismissTo('/')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.green900, overflow: 'hidden' },
  safe: { flex: 1 },
  body: { flex: 1, alignItems: 'center', paddingTop: 70, paddingHorizontal: 24 },
  medal: {
    width: 88,
    height: 88,
    borderRadius: 32,
    backgroundColor: colors.gold400,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.gold,
  },
  medalFailed: { backgroundColor: colors.red500 },
  title: { marginTop: 28 },
  amount: { marginTop: 8 },
  to: { marginTop: 8 },
  note: { marginTop: 10, maxWidth: 280 },
  ref: { marginTop: 16 },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 16, borderRadius: radius.pill },
});
