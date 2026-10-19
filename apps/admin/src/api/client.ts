// The real backend client. queries.ts still calls the mock; each hook switches to `api` once its
// endpoint exists in the backend (see packages/api-client).
import { createApiClient } from '@ffm/api-client';
import { useSession } from '@/stores/session';

// Same origin: the Vite dev server proxies /api to the backend, so no CORS is involved.
export const api = createApiClient({
  baseUrl: '',
  getAccessToken: () => useSession.getState().accessToken,
  onUnauthorized: () => useSession.getState().signOut(),
});
