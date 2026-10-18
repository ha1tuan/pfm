import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, ScanFace, Smartphone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { ApiError, login } from '@/api/queries';
import { BrandCircles, Logo } from '@/components/brand/Brand';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { t } from '@/i18n';
import { authenticateWithBiometrics, biometricsAvailable } from '@/lib/security';
import { useSession } from '@/stores/session';
import { colors, radius } from '@/theme/tokens';

const schema = z.object({
  phone: z.string().regex(/^0\d{9}$/, t('login.phoneInvalid')),
  password: z.string().min(1, t('login.passwordRequired')),
});
type LoginForm = z.infer<typeof schema>;

export default function LoginScreen() {
  const signIn = useSession((s) => s.signIn);
  const [showPassword, setShowPassword] = useState(false);
  const [canBiometric, setCanBiometric] = useState(false);
  const { control, handleSubmit, formState, setError } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '0912345678', password: '' },
  });

  useEffect(() => {
    biometricsAvailable().then(setCanBiometric);
  }, []);

  const submit = handleSubmit(async ({ phone, password }) => {
    try {
      const { accessToken } = await login(phone, password);
      await signIn(accessToken);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'wrongPassword') setError('password', { message: t('login.wrongPassword') });
      else throw e;
    }
  });

  // Biometrics unlock a previously bound device; the mock grants the session directly.
  const biometric = async () => {
    if (await authenticateWithBiometrics(t('login.biometricPrompt'))) await signIn('mock.biometric');
  };

  return (
    <View style={styles.screen}>
      <BrandCircles disc={{ size: 320, right: -140, top: -80 }} coin={{ size: 120, right: 40, top: 210 }} />
      <SafeAreaView edges={['top']} style={styles.hero}>
        <Logo tone="light" size={40} />
        <Text variant="display" color="#fff" style={styles.headline}>
          {t('login.headline')}
        </Text>
        <Text variant="body" color={colors.green200} style={styles.sub}>
          {t('login.sub')}
        </Text>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <Text variant="h2">{t('login.welcome')}</Text>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <Input
              label={t('login.phone')}
              icon={Smartphone}
              size="lg"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={formState.errors.phone?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Input
              label={t('login.password')}
              icon={Lock}
              size="lg"
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={submit}
              error={formState.errors.password?.message}
              suffix={
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10} accessibilityLabel={t('login.showPassword')}>
                  {showPassword ? <EyeOff size={18} color={colors.neutral400} /> : <Eye size={18} color={colors.neutral400} />}
                </Pressable>
              }
            />
          )}
        />
        <Pressable style={styles.forgot} hitSlop={8}>
          <Text variant="label" color={colors.green600}>
            {t('login.forgot')}
          </Text>
        </Pressable>
        <View style={styles.row}>
          <Button label={t('login.submit')} size="lg" fullWidth loading={formState.isSubmitting} onPress={submit} />
          {canBiometric ? (
            <Pressable onPress={biometric} style={styles.biometric} accessibilityLabel={t('login.biometric')}>
              <ScanFace size={24} color={colors.green700} />
            </Pressable>
          ) : null}
        </View>
        <Text variant="bodySm" align="center">
          {t('login.noAccount')}{' '}
          <Text variant="label" color={colors.green600}>
            {t('login.register')}
          </Text>
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.green900, overflow: 'hidden' },
  hero: { paddingHorizontal: 28, paddingTop: 24 },
  headline: { marginTop: 56, maxWidth: 280 },
  // Narrow enough to clear the gold coin on a 390pt screen.
  sub: { marginTop: 10, maxWidth: 196 },
  sheet: {
    marginTop: 'auto',
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  forgot: { alignSelf: 'flex-end' },
  row: { flexDirection: 'row', gap: 10 },
  biometric: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
