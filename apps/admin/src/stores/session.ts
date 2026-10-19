import { create } from 'zustand';

// Staff Session lives in memory only; a reload signs the Staff out. Filled by Staff login (UC-50).
interface SessionState {
  accessToken: string | null;
  signIn: (token: string) => void;
  signOut: () => void;
}

export const useSession = create<SessionState>((set) => ({
  accessToken: null,
  signIn: (token) => set({ accessToken: token }),
  signOut: () => set({ accessToken: null }),
}));
