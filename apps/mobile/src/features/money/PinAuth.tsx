import { ScanFace, ShieldCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { ScrollBody } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { t } from '@/i18n';
import { authenticateWithBiometrics, biometricsAvailable, generateSmartOtp } from '@/lib/security';
import { colors, radius } from '@/theme/tokens';

interface PinAuthProps {
  /** Receives the Smart OTP generated after the PIN or biometrics unlock it. */
  onAuthorized: (smartOtp: string) => Promise<void>;
  error?: string;
}

/**
 * Transaction PIN (or biometrics) unlocks the device-bound Smart OTP secret;
 * the generated code is what the server verifies.
 */
export function PinAuth({ onAuthorized, error }: PinAuthProps) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [canBiometric, setCanBiometric] = useState(false);

  useEffect(() => {
    biometricsAvailable().then(setCanBiometric);
  }, []);

  const authorize = async () => {
    setBusy(true);
    try {
      await onAuthorized(await generateSmartOtp());
    } finally {
      setBusy(false);
      setPin('');
    }
  };

  useEffect(() => {
    if (pin.length === 6) authorize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const biometric = async () => {
    if (await authenticateWithBiometrics(t('transfer.titleAuth'))) await authorize();
  };

  return (
    <ScrollBody>
      <View style={styles.head}>
        <View style={styles.icon}>
          <ShieldCheck size={30} color={colors.green600} />
        </View>
        <Text variant="h3" align="center">
          {t('transfer.authHeading')}
        </Text>
        <Text variant="bodySm" align="center" style={styles.body}>
          {t('transfer.authBody')}
        </Text>
      </View>
      <OtpInput value={pin} onChange={setPin} masked error={!!error} accessibilityLabel={t('transfer.authHeading')} />
      {error ? (
        <Text variant="caption" align="center" color={colors.red600} style={styles.error}>
          {error}
        </Text>
      ) : null}
      {busy ? <ActivityIndicator color={colors.green600} style={styles.spinner} /> : null}
      {canBiometric && !busy ? (
        <Button label={t('transfer.useBiometric')} variant="ghost" iconLeft={ScanFace} onPress={biometric} style={styles.biometric} />
      ) : null}
    </ScrollBody>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', paddingTop: 32, paddingBottom: 28 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  body: { marginTop: 6, maxWidth: 300, fontSize: 14, lineHeight: 20 },
  error: { marginTop: 12 },
  spinner: { marginTop: 20 },
  biometric: { alignSelf: 'center', marginTop: 20, borderRadius: radius.pill },
});
