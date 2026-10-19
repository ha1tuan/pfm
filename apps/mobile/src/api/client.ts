// The real backend client. queries.ts still calls the mock; each hook switches to `api` once its
// endpoint exists in the backend (see packages/api-client).
import { createApiClient } from '@ffm/api-client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useSession } from '@/stores/session';

const API_PORT = 5080;

// EXPO_PUBLIC_API_URL wins. Otherwise reuse the host Expo serves the bundle from, which a phone or
// emulator can already reach; the backend must then listen on the LAN (launch profile "FFM.Api (LAN)").
function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured;
  if (Platform.OS === 'web') return `http://localhost:${API_PORT}`;
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:${API_PORT}`;
}

export const api = createApiClient({
  baseUrl: resolveBaseUrl(),
  getAccessToken: () => useSession.getState().accessToken,
  onUnauthorized: () => void useSession.getState().signOut(),
});
