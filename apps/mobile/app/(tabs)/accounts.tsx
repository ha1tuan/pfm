import { zodResolver } from '@hookform/resolvers/zod';
import { BellRing, Check, CreditCard, IdCard, LogOut, MessageSquareLock, Plus, Smartphone, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { z } from 'zod';
import { useBankCatalog, useLinkBank, useLinkedBanks, useWallet } from '@/api/queries';
import { BankAccountCard, BankTile } from '@/components/finance/BankAccountCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ListItem } from '@/components/ui/ListItem';
import { OtpInput } from '@/components/ui/OtpInput';
import { Screen, ScreenHeader, ScrollBody, SectionTitle } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import type { Bank } from '@/domain/types';
import { t } from '@/i18n';
import { maskPhone } from '@/lib/format';
import { useSession } from '@/stores/session';
import { colors, fonts, radius } from '@/theme/tokens';

const linkSchema = z.object({
  accountNumber: z.string().regex(/^[\d\s]{8,19}$/, t('accounts.accountRequired')),
  holderName: z.string().trim().min(3),
  idNumber: z.string().regex(/^\d{12}$/, t('accounts.idRequired')),
  agree: z.literal(true),
});
type LinkForm = z.infer<typeof linkSchema>;

type Step = 'pick' | 'form' | 'otp' | null;

function LinkBankFlow({ step, setStep }: { step: Step; setStep: (s: Step) => void }) {
  const { data: catalog = [] } = useBankCatalog();
  const { data: wallet } = useWallet();
  const link = useLinkBank();
  const toast = useToast((s) => s.show);
  const [bank, setBank] = useState<Bank | null>(null);
  const [otp, setOtp] = useState('');
  const { control, handleSubmit, formState, getValues, reset } = useForm<LinkForm>({
    resolver: zodResolver(linkSchema),
    defaultValues: { accountNumber: '', holderName: wallet?.ownerName.toUpperCase() ?? '', idNumber: '', agree: true },
  });

  useEffect(() => {
    if (otp.length !== 6 || !bank) return;
    const { accountNumber, holderName } = getValues();
    link.mutateAsync({ bank, accountNumber, holderName, bankOtp: otp }).then(() => {
      setStep(null);
      setOtp('');
      reset();
      toast(t('accounts.linkedToast', { bank: bank.name }), t('accounts.linkedToastBody'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <>
      <Sheet open={step === 'pick'} onClose={() => setStep(null)} title={t('accounts.pickBank')} description={t('accounts.pickBankSub')}>
        <View style={styles.bankGrid}>
          {catalog.map((b) => (
            <Pressable
              key={b.code}
              onPress={() => {
                setBank(b);
                setStep('form');
              }}
              style={styles.bankCell}
              accessibilityRole="button"
            >
              <BankTile code={b.code} short={b.short} size={40} />
              <Text style={styles.bankName}>{b.name}</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet
        open={step === 'form'}
        onClose={() => setStep(null)}
        title={t('accounts.formTitle', { bank: bank?.name ?? '' })}
        actions={<Button label={t('accounts.sendOtp')} size="lg" fullWidth onPress={handleSubmit(() => setStep('otp'))} />}
      >
        <View style={styles.form}>
          <Controller
            control={control}
            name="accountNumber"
            render={({ field }) => (
              <Input
                label={t('accounts.accountNumber')}
                icon={CreditCard}
                keyboardType="number-pad"
                value={field.value}
                onChangeText={field.onChange}
                error={formState.errors.accountNumber?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="holderName"
            render={({ field }) => (
              <Input label={t('accounts.holder')} autoCapitalize="characters" value={field.value} onChangeText={field.onChange} hint={t('accounts.holderHint')} />
            )}
          />
          <Controller
            control={control}
            name="idNumber"
            render={({ field }) => (
              <Input
                label={t('accounts.idNumber')}
                icon={IdCard}
                keyboardType="number-pad"
                maxLength={12}
                value={field.value}
                onChangeText={field.onChange}
                error={formState.errors.idNumber?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="agree"
            render={({ field }) => (
              <Pressable
                onPress={() => field.onChange(!field.value)}
                style={styles.agree}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: field.value }}
              >
                <View style={[styles.checkbox, field.value ? styles.checkboxOn : null]}>
                  {field.value ? <Check size={14} strokeWidth={3} color="#fff" /> : null}
                </View>
                <Text variant="bodySm" color={colors.textBody}>
                  {t('accounts.agree')}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Sheet>

      <Sheet
        open={step === 'otp'}
        onClose={() => setStep(null)}
        icon={MessageSquareLock}
        title={t('accounts.otpTitle', { bank: bank?.name ?? '' })}
        description={t('accounts.otpBody', { phone: maskPhone(wallet?.phone ?? '') })}
      >
        <OtpInput value={otp} onChange={setOtp} accessibilityLabel={t('accounts.otpTitle', { bank: bank?.name ?? '' })} />
      </Sheet>
    </>
  );
}

export default function AccountsScreen() {
  const { data: banks = [] } = useLinkedBanks();
  const signOut = useSession((s) => s.signOut);
  const [step, setStep] = useState<Step>(null);
  const [notify, setNotify] = useState(true);
  const defaultBank = banks.find((b) => b.isDefault);

  return (
    <Screen>
      <ScreenHeader showBack={false} title={t('accounts.title')} />
      <ScrollBody>
        <Card variant="tint" padding={16}>
          <Text variant="bodySm" color={colors.green800}>
            {t('accounts.intro')}
          </Text>
        </Card>

        <SectionTitle title={t('accounts.linked')} />
        <View style={styles.list}>
          {banks.map((b) => (
            <BankAccountCard key={b.id} account={b} />
          ))}
        </View>
        <Pressable onPress={() => setStep('pick')} style={styles.linkNew} accessibilityRole="button">
          <Plus size={20} color={colors.green700} />
          <Text style={styles.linkNewText}>{t('accounts.linkNew')}</Text>
        </Pressable>

        <SectionTitle title={t('accounts.settings')} />
        <Card padding={{ vertical: 0, horizontal: 16 }}>
          <ListItem
            icon={Star}
            iconTone="gold"
            title={t('accounts.default')}
            subtitle={defaultBank ? `${defaultBank.bank.name} ${defaultBank.maskedNumber}` : undefined}
            chevron
            divider
          />
          <ListItem
            icon={BellRing}
            iconTone="info"
            title={t('accounts.notifications')}
            divider
            trailing={
              <Switch
                value={notify}
                onValueChange={setNotify}
                trackColor={{ true: colors.green600, false: colors.neutral200 }}
                thumbColor="#fff"
              />
            }
          />
          <ListItem icon={Smartphone} title={t('accounts.device')} subtitle={t('accounts.deviceValue')} divider />
          <ListItem icon={LogOut} iconTone="danger" title={t('accounts.signOut')} onPress={signOut} />
        </Card>
      </ScrollBody>

      <LinkBankFlow step={step} setStep={setStep} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  linkNew: {
    marginTop: 10,
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.green300,
    backgroundColor: colors.green50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  linkNewText: { fontFamily: fonts.bold, fontSize: 15, color: colors.green700 },
  bankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bankCell: {
    width: '31%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: '#fff',
  },
  bankName: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textBody },
  form: { gap: 14 },
  agree: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.neutral300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.green600, borderColor: colors.green600 },
});
