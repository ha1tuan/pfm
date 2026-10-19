# api-client — generated from backend OpenAPI

Types are generated from the backend's OpenAPI document with `openapi-typescript`; requests go through `openapi-fetch`. Change the backend contract and regenerate; hand edits to generated files are overwritten.

## Regenerate

1. `dotnet build backend/src/FFM.Api` writes `openapi/ffm-api.json` (build-time document generation).
2. `corepack pnpm api-client` (root script) writes `src/generated/schema.ts`.

Commit both files in the same change as the backend endpoint/DTO/enum change, so apps and backend never drift. An endpoint without `Produces<T>()` has no response type here: fix it in the backend, not with a cast.

## Layout

- `openapi/` and `src/generated/`: generated only.
- `src/index.ts`: the hand-written setup. `createApiClient` (base URL, Bearer token from the app's Session, `onUnauthorized`) and `ApiError` (ProblemDetails `code`, `traceId`, `Retry-After`, field errors; `networkError` when the request never got an answer). Token refresh (UC-04) goes here once the backend has it.
- Apps never call `fetch` directly; they call `api.call(api.GET|POST(...))`, which returns the body or throws `ApiError`.
- `typescript@5` is a dev dependency of this package only: `openapi-typescript` needs the TypeScript 5 JS API.
