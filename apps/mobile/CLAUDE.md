# Mobile — Expo (iOS/Android)

Design frame: 390pt wide. Audience: User. Online-only.

## Screens

Login, Wallet home, Linked Bank Accounts (list + link/unlink), Transfer flow, Statement (filters), Transaction detail, Personal finance (Budgets, Goals, Manual Entries).

## Transfer flow

Recipient → Amount → Confirm (fee + total from the server quote) → Smart OTP → Result.

- Generate the idempotency key when the user lands on Confirm and reuse it for every retry of that submission; a new key only for a new transfer.
- Result screen reflects server status. A bank-facing transfer can come back `Processing`; show it as pending and poll/refresh, never as success.
- Limit/fee errors come from the server; show its message key, do not pre-validate against cached limits.

## Security

- Tokens, Smart OTP secret and device id live in `expo-secure-store` only.
- App unlock and Smart OTP generation require Transaction PIN or biometrics (`expo-local-authentication`).
- One Bound Device per User: on a "device revoked" response, clear secure storage and route to re-binding (phone + password + SMS OTP).
- Hide sensitive screens in the app switcher; never log amounts, tokens or OTPs.

## Stack

Expo Router (file-based routes under `app/`, screens' building blocks in `src/features/*`, primitives in `src/components/ui`). Tests: Jest + React Native Testing Library. Builds via EAS.

## Running and checking

- `corepack pnpm mobile` from the repo root; `w` opens the web build, which is how screens get checked at 390pt without a device.
- Backend URL: `EXPO_PUBLIC_API_URL` if set (see `.env.example`); otherwise the host Expo serves from, port 5080 (`localhost` on web). A phone or emulator needs the backend on the LAN: run it with the `FFM.Api (LAN)` launch profile. Expo web calls the API cross-origin; Development CORS allows `http://localhost:8081`.
- Mock behaviour: any password of 6+ characters signs in; any 6-digit PIN authorizes; any 6-digit bank OTP links a bank. Bank Transfers and Withdrawals stay `Processing` for ~4 s, then settle.
- `expo-secure-store` and biometrics are native-only; on web the session lives in memory and the biometric button is hidden.
