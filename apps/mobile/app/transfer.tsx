import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ApiError, quoteTransfer, useSubmitTransfer } from '@/api/queries';
import { Button } from '@/components/ui/Button';
import { BottomBar, Screen, ScreenHeader } from '@/components/ui/Screen';
import type { Recipient, Transaction, TransferQuote } from '@/domain/types';
import { AmountStep, MIN_AMOUNT } from '@/features/transfer/AmountStep';
import { ConfirmStep } from '@/features/transfer/ConfirmStep';
import { PinAuth } from '@/features/money/PinAuth';
import { RecipientStep } from '@/features/transfer/RecipientStep';
import { ResultView } from '@/features/money/ResultView';
import { t, type I18nKey } from '@/i18n';
import { newIdempotencyKey } from '@/lib/security';
import { colors } from '@/theme/tokens';

type Step = 'recipient' | 'amount' | 'confirm' | 'auth';
const STEPS: Step[] = ['recipient', 'amount', 'confirm', 'auth'];
const TITLES: Record<Step, I18nKey> = {
  recipient: 'transfer.titleRecipient',
  amount: 'transfer.titleAmount',
  confirm: 'transfer.titleConfirm',
  auth: 'transfer.titleAuth',
};

export default function TransferScreen() {
  const [step, setStep] = useState<Step>('recipient');
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [quote, setQuote] = useState<TransferQuote | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string>();
  const [result, setResult] = useState<Transaction | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [amountError, setAmountError] = useState<string>();

  const submit = useSubmitTransfer();

  const index = STEPS.indexOf(step);
  const back = () => (index === 0 ? router.back() : setStep(STEPS[index - 1]));

  const toConfirm = async () => {
    if (!recipient) return;
    setQuoting(true);
    setQuote(await quoteTransfer(recipient, amount));
    // One key per submission attempt; kept across retries of this confirm.
    setIdempotencyKey(newIdempotencyKey());
    setQuoting(false);
    setStep('confirm');
  };

  const authorize = async (smartOtp: string) => {
    if (!recipient || !idempotencyKey) return;
    setAuthError(undefined);
    try {
      setResult(await submit.mutateAsync({ recipient, amount, note, idempotencyKey, smartOtp }));
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'overBalance' || e.code === 'overLimit')) {
        setAmountError(t(e.code === 'overBalance' ? 'transfer.overBalance' : 'transfer.overLimit'));
        setStep('amount');
        return;
      }
      setAuthError(t('common.retry'));
    }
  };

  if (result) {
    return <ResultView initial={result} successTitle={t('transfer.successTitle')} processingTitle={t('transfer.processingTitle')} />;
  }


  return (
    <Screen edges={['top']}>
      <ScreenHeader title={t(TITLES[step])} onBack={back} />
      <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 4, now: index + 1 }}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.segment, i <= index ? styles.segmentOn : null]} />
        ))}
      </View>

      {step === 'recipient' ? (
        <RecipientStep
          onPick={(r) => {
            setRecipient(r);
            setStep('amount');
          }}
        />
      ) : null}
      {step === 'amount' && recipient ? (
        <AmountStep
          recipient={recipient}
          amount={amount}
          note={note}
          onAmount={(v) => {
            setAmount(v);
            setAmountError(undefined);
          }}
          onNote={setNote}
          serverError={amountError}
        />
      ) : null}
      {step === 'confirm' && recipient && quote ? <ConfirmStep recipient={recipient} quote={quote} note={note} /> : null}
      {step === 'auth' ? <PinAuth onAuthorized={authorize} error={authError} /> : null}

      {step === 'amount' ? (
        <BottomBar>
          <Button label={t('common.continue')} size="lg" fullWidth disabled={amount < MIN_AMOUNT || !!amountError} loading={quoting} onPress={toConfirm} />
        </BottomBar>
      ) : null}
      {step === 'confirm' ? (
        <BottomBar>
          <Button label={t('transfer.confirm')} size="lg" fullWidth iconRight={ShieldCheck} onPress={() => setStep('auth')} />
        </BottomBar>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: 12 },
  segment: { flex: 1, height: 4, borderRadius: 4, backgroundColor: colors.neutral100 },
  segmentOn: { backgroundColor: colors.green500 },
});
