# FFM — E-wallet & personal finance

Production-grade **demo** e-wallet: real architecture and business rules (ledger, OTP, fees, limits, audit), with **mocked** external providers (banks, SMS). VND only. Online-only clients.

## Repo map

Each folder has its own `CLAUDE.md` with area-specific rules.

```
backend/              ASP.NET Core, Clean Architecture (Domain · Application · Infrastructure · Api + Worker)
apps/                 shared frontend rules
apps/mobile/          Expo app for Users (iOS/Android)
apps/admin/           React + Vite console for Staff
packages/api-client/  generated from backend OpenAPI
docs/adr/             architecture decisions
GLOSSARY.md           domain language
```

Package manager is pnpm via corepack (`corepack pnpm …`; `corepack enable` needs admin on this machine). Root scripts: `corepack pnpm admin` (Vite, :5173) and `corepack pnpm mobile` (Expo). Each app has `typecheck`.

## Domain language

Read `GLOSSARY.md` before naming anything — classes, tables, endpoints, UI strings. Use its canonical terms; when a needed term is missing or ambiguous, stop and ask rather than invent one. Key distinctions agents get wrong:

- **Wallet** (balance we hold) ≠ **Linked Bank Account** (external, we hold no balance).
- **Transaction** (moves money, hits the Ledger) ≠ **Manual Entry** (user-typed, never touches the Ledger).
- **User** (mobile end-user) ≠ **Staff** (admin console operator).

Read the relevant ADR in `docs/adr/` before changing ledger, layer boundaries, or messaging. Propose a new ADR when a change is hard to reverse, surprising, and the result of a real trade-off.

## Money invariants (hard guardrails)

These hold in every change; a violation is a bug regardless of tests passing. See ADR-0001.

- Money is integer VND (`long` in C#, integer in TS). Never floating-point for amounts.
- Every balance change is a Transaction with balanced debit/credit Ledger Entries. Wallet balance is derived from the Ledger (snapshot allowed, updated in the same DB transaction).
- Ledger is append-only. Corrections are reversal Transactions.
- Every money-moving command carries an idempotency key.
- Transaction lifecycle: `Initiated → PendingAuth → Processing → Succeeded | Failed | Reversed`.
- Fees and Limits are resolved by effective date (and KYC Level for limits). Changes create a new Config Version that a second Staff must approve (maker–checker) before it can take effect; history is kept.
- Out of MVP: QR/merchant payments, bill pay, phone top-up, merchants. Design-kit mocks that show them are not scope.

## Deployment

Docker Compose on AWS EC2 (api, worker, postgres, rabbitmq, redis). CI on GitHub Actions. Mobile builds via EAS.

## Future: AI service

A separate Python service (FastAPI + LangGraph) for auto-categorization, spending Q&A, anomaly alerts. It is **read-only** over our data (API or read replica) and never creates Transactions. Build nothing for it yet.

## Conventions

- Code, comments, commit messages and `CLAUDE.md` files: English. `GLOSSARY.md` is bilingual; use the English name in code.
- C#: Microsoft naming, async/await end to end, built-in DI.
- Commits: Conventional Commits.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues for `ha1tuan/pfm`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.
