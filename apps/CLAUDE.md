# Apps — shared frontend rules (mobile + admin)

Applies to `mobile/` and `admin/`; each has its own `CLAUDE.md` for app-specific rules.

- TypeScript strict. All HTTP goes through `packages/api-client`; types come from it, not hand-written duplicates.
- Until the backend exists, each app's `src/api/queries.ts` hooks call an in-memory mock (`src/mocks/server.ts`) and `src/domain/types.ts` stands in for generated types. UI imports data only through `src/api/*`, so switching to the real client touches only that folder.
- Server state: TanStack Query. Local UI state: Zustand. Forms: React Hook Form + Zod.
- The server is the source of truth for money: balances, fees and limits are displayed from API responses, never computed client-side. Amounts are integer VND; format only at render time (`1.000.000 ₫`).
- UI copy is Vietnamese via i18n keys; no literal strings in components.
- Name screens, components and hooks with Glossary terms (`Wallet`, `LinkedBankAccount`, `ManualEntry`, ...).

## Design system

Source of truth: the claude.ai design project "PFM Design System" (`14f63a7f-4bc4-41de-9d75-e891c8b1effb`) — tokens, component specs, copy rules (`readme.md`) and click-through UI kits. Its UI kits are visual references, not scope: where they contradict `GLOSSARY.md` (linked-bank balances, QR/bill pay, "Chờ duyệt" transaction status, Merchant tier), the glossary wins.

- Tokens are mirrored in `admin/src/styles/_variables.scss` + `admin/src/theme/antdTheme.ts` and `mobile/src/theme/tokens.ts`; change all three together.
- The logo is a placeholder SVG (the design system only ships low-res PNGs); swap in the official vector when it exists.
- Gold is for prosperity moments only (keyhole, primary quick action, success medallion, goals). Amounts use tabular figures; negative amounts use the true minus `−`.
