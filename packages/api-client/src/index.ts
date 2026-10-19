// Hand-written setup around the generated types (src/generated/, from openapi/ffm-api.json).
// Apps create one client each and keep their TanStack Query hooks in their own src/api/.
import createClient, { type Middleware } from 'openapi-fetch';
import type { components, paths } from './generated/schema';

export type { components, paths };
export type Schemas = components['schemas'];

/** A failed call: `code` is the backend message key (backend/docs/api.md §3) the apps translate. */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly traceId?: string,
    /** Seconds to wait, from `Retry-After` on 429. */
    public readonly retryAfter?: number,
    /** Field errors of a `validationFailed` response. */
    public readonly errors?: Record<string, string[]>,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  /** Origin of the API, e.g. `http://192.168.1.10:5080`; `''` for same origin (admin, via the Vite proxy). */
  baseUrl: string;
  /** Current access token, or null when signed out. Read on every request. */
  getAccessToken?: () => string | null | Promise<string | null>;
  /** Called on any 401, after the error is built; the app clears its Session there. */
  onUnauthorized?: (error: ApiError) => void;
}

export function createApiClient({ baseUrl, getAccessToken, onUnauthorized }: ApiClientOptions) {
  const client = createClient<paths>({ baseUrl });

  const auth: Middleware = {
    async onRequest({ request }) {
      const token = await getAccessToken?.();
      if (token) request.headers.set('Authorization', `Bearer ${token}`);
      return request;
    },
  };
  client.use(auth);

  /** Resolves to the response body, or throws {@link ApiError}. */
  async function call<T>(pending: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
    let result: Awaited<typeof pending>;
    try {
      result = await pending;
    } catch {
      throw new ApiError('networkError', 0);
    }

    const { data, error, response } = result;
    if (response.ok) return data as T;

    const problem = (error ?? {}) as { code?: string; traceId?: string; errors?: Record<string, string[]> };
    const retryAfter = Number(response.headers.get('Retry-After')) || undefined;
    const apiError = new ApiError(problem.code ?? 'internalError', response.status, problem.traceId, retryAfter, problem.errors);
    if (response.status === 401) onUnauthorized?.(apiError);
    throw apiError;
  }

  return { ...client, call };
}

export type ApiClient = ReturnType<typeof createApiClient>;
