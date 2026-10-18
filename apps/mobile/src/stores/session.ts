import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

const TOKEN_KEY = 'pfm.accessToken';

// SecureStore is native-only; the web preview keeps the token in memory.
const secure = {
  set: (value: string) => (Platform.OS === 'web' ? Promise.resolve() : SecureStore.setItemAsync(TOKEN_KEY, value)),
  clear: () => (Platform.OS === 'web' ? Promise.resolve() : SecureStore.deleteItemAsync(TOKEN_KEY)),
};

interface SessionState {
  accessToken: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  accessToken: null,
  signIn: async (token) => {
    await secure.set(token);
    set({ accessToken: token });
  },
  signOut: async () => {
    await secure.clear();
    set({ accessToken: null });
  },
}));
