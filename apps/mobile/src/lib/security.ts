import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/** A fresh key per money-moving submission; reused verbatim on retries of that submission. */
export const newIdempotencyKey = () => Crypto.randomUUID();

export async function biometricsAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && enrolled;
}

export async function authenticateWithBiometrics(prompt: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, disableDeviceFallback: true });
  return result.success;
}

/**
 * Mock Smart OTP: the real one is a TOTP derived from the device-bound secret,
 * unlocked by the Transaction PIN or biometrics. Here we derive 6 digits from the time window.
 */
export async function generateSmartOtp(): Promise<string> {
  const window = Math.floor(Date.now() / 30_000).toString();
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `mock-device-secret:${window}`);
  return (parseInt(digest.slice(0, 8), 16) % 1_000_000).toString().padStart(6, '0');
}
