import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  ApiError,
  quoteWithdrawalFee,
  useLinkedBanks,
  useSubmitTopUp,
  useSubmitWithdrawal,
} from '@/api/queries';
import { BankTile } from '@/components/finance/BankAccountCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BottomBar, Screen, ScreenHeader, ScrollBody } from '@/components/ui/Screen';
import { Tag } from '@/components/ui/Tag';
import { Text } from '@/components/ui/Text';
import type { LinkedBankAccount, Transaction } from '@/domain/types';
import { PinAuth } from '@/features/money/PinAuth';
import { ResultView } from '@/features/money/ResultView';
import { SummaryRow } from '@/features/transfer/ConfirmStep';
import { t } from '@/i18n';
import { formatVnd, formatVndCompact, formatVndDigits, parseDigits } from '@/lib/format';
import { newIdempotencyKey } from '@/lib/security';
import { colors, fonts, noWebOutline, radius } from '@/theme/tokens';

type Mode = 'topUp' | 'withdrawal';
const QUICK = [500_000, 1_000_000, 2_000_000, 5_000_000];

export default function MoveMoneyScreen() {
  const { mode = 'topUp' } = useLocalSearchParams<{ mode?: Mode }>();
  const isTopUp = mode === 'topUp';
  const { data: banks } = useLinkedBanks();
  const topUp = useSubmitTopUp();
  const withdraw = useSubmitWithdrawal();

  const [account, setAccount] = useState<LinkedBankAccount | null>(null);
  const [amount, setAmount] = useState(0);
  const [step, setStep] = useState<'form' | 'auth'>('form');
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  /** Balance/limit rejection from the server; never pre-validated on the client. */
  const [amountError, setAmountError] = useState<string>();
  const [result, setResult] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!account && banks?.length) setAccount(banks.find((b) => b.isDefault) ?? banks[0]);
  }, [banks, account]);

  if (result) {
    return (
      <ResultView
        initial={result}
        successTitle={isTopUp ? t('moveMoney.topUpDone') : t('transfer.successTitle')}
        processingTitle={t('moveMoney.withdrawProcessing')}
      />
    );
  }

  const fee = isTopUp ? 0 : quoteWithdrawalFee(amount);
  const changeAmount = (v: number) => {
    setAmount(v);
    setAmountError(undefined);
  };
  const invalid = !account || amount < 10_000 || !!amountError;
  const title = t(isTopUp ? 'moveMoney.topUpTitle' : 'moveMoney.withdrawTitle');

  const authorize = async (smartOtp: string) => {
    if (!account || !key) return;
    setError(undefined);
    try {
      const cmd = { bankAccount: account, amount, idempotencyKey: key, smartOtp };
      setResult(await (isTopUp ? topUp : withdraw).mutateAsync(cmd));
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'overBalance' || e.code === 'overLimit')) {
        setAmountError(t(e.code === 'overBalance' ? 'transfer.overBalance' : 'transfer.overLimit'));
        setStep('form');
      } else setError(t('common.retry'));
    }
  };

  if (banks && !banks.length) {
    return (
      <Screen>
        <ScreenHeader title={title} />
        <View style={styles.empty}>
          <Text variant="body" align="center">
            {t('moveMoney.noLinkedBank')}
          </Text>
          <Button label={t('moveMoney.linkFirst')} onPress={() => router.replace('/accounts')} style={styles.center} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={title} onBack={step === 'auth' ? () => setStep('form') : undefined} />
      {step === 'auth' ? (
        <PinAuth onAuthorized={authorize} error={error} />
      ) : (
        <>
          <ScrollBody>
            <Text variant="label" style={styles.label}>
              {t(isTopUp ? 'moveMoney.from' : 'moveMoney.to')}
            </Text>
            <Card padding={{ vertical: 4, horizontal: 14 }}>
              {(banks ?? []).map((b, i, all) => {
                const on = account?.id === b.id;
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => setAccount(b)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    style={[styles.bankRow, i < all.length - 1 ? styles.divider : null]}
                  >
                    <BankTile code={b.bank.code} short={b.bank.short} size={40} />
                    <View style={styles.flex}>
                      <Text variant="bodyStrong">{b.bank.name}</Text>
                      <Text variant="mono">{b.maskedNumber}</Text>
                    </View>
                    <View style={[styles.radio, on ? styles.radioOn : null]}>{on ? <View style={styles.radioDot} /> : null}</View>
                  </Pressable>
                );
              })}
            </Card>

            <View style={styles.amountBlock}>
              <Text variant="label" color={colors.textMuted} align="center">
                {t('moveMoney.amount')}
              </Text>
              <TextInput
                value={amount ? formatVndDigits(amount) : ''}
                onChangeText={(v) => changeAmount(parseDigits(v))}
                placeholder="0"
                placeholderTextColor={colors.neutral300}
                keyboardType="number-pad"
                style={styles.amountInput}
                accessibilityLabel={t('moveMoney.amount')}
              />
              {amountError ? (
                <Text variant="caption" align="center" color={colors.red600}>
                  {amountError}
                </Text>
              ) : null}
            </View>
            <View style={styles.quick}>
              {QUICK.map((v) => (
                <Tag key={v} label={formatVndCompact(v)} selected={amount === v} onPress={() => changeAmount(v)} />
              ))}
            </View>

            {amount > 0 ? (
              <Card padding={{ vertical: 4, horizontal: 16 }}>
                <SummaryRow label={t('transfer.fee')} value={fee ? formatVnd(fee) : t('common.free')} accent={!fee} />
                <SummaryRow label={t('transfer.total')} value={formatVnd(amount + fee)} last />
              </Card>
            ) : null}
          </ScrollBody>
          <BottomBar>
            <Button
              label={t(isTopUp ? 'moveMoney.topUpCta' : 'moveMoney.withdrawCta')}
              size="lg"
              fullWidth
              disabled={invalid}
              onPress={() => {
                setKey(newIdempotencyKey());
                setStep('auth');
              }}
            />
          </BottomBar>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { marginBottom: 8, marginTop: 4 },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.neutral300, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.green600 },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green600 },
  amountBlock: { paddingTop: 28, gap: 4 },
  amountInput: { ...noWebOutline, fontFamily: fonts.extrabold, fontSize: 40, letterSpacing: -0.8, color: colors.textHeading, textAlign: 'center' },
  quick: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  center: { alignSelf: 'center', borderRadius: radius.pill },
});
