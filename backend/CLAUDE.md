# Backend — ASP.NET Core, Clean Architecture

Money invariants and domain language live in the root `CLAUDE.md` and `GLOSSARY.md`; they bind every line here.

## Design docs

`docs/` is the system design. Read the matching file before you:

- add or change a table, column or Ledger posting → `docs/erd.md` (schemas, Ledger accounts, standard journals)
- add or change an endpoint, DTO, error code, use case or integration event → `docs/api.md`
- implement a flow (registration, device binding, bank linking, any money command, Reversal, maker–checker, Wallet Lock, token refresh) → `docs/activities.md`
- touch solution layout, DI, messaging, caching, jobs or configuration → `docs/architecture.md`

`docs/README.md` indexes decisions D1–D18. Code and docs move together: a change that departs from a doc updates that doc in the same change.

## Solution layout (ADR-0004)

Four layer projects plus a background host; dependencies point inward only:

- `FFM.Domain` — `Common/` (`Result`, `Error`, `ErrorCodes`), `Entities/<Feature>/`, `ValueObjects/`, `Interfaces/` (`I<Aggregate>Repository`), `Errors/<Feature>Errors`, `Exceptions/` (invariant breaches only). References nothing but the BCL.
- `FFM.Application` — `Interfaces/` (handler abstractions, `IUnitOfWork`, `ILedgerPosting`, `IAuditWriter`, `IOutbox`, providers, `I<Feature>Query`, `I<Name>Service`), `UseCases/<Feature>/Commands|Queries/`, `Services/<Feature>/`, `DTOs/<Feature>/`, `Validators/<Feature>/`. References Domain and FluentValidation only — no ASP.NET Core, EF Core, Npgsql, Dapper, RabbitMQ, Redis or Serilog.
- `FFM.Infrastructure` — `Data/` (one `FfmDbContext`, `Configurations/<Feature>/`, `Repositories/`, `Queries/` for Dapper, `UnitOfWork`, `LedgerPosting`), `Caching/`, `Messaging/`, `External/` (provider mocks), `Jobs/`, `Health/`, `Logging/`, `DependencyInjection/`.
- `FFM.Api` — `Endpoints/<Feature>/`, `Middleware/`, `Filters/`, `Errors/`, `Auth/`, `Program.cs`. Types are `internal`.
- `FFM.Worker` — host only. Consumers and jobs are registered by `AddWorkerServices()`, which only the Worker calls.
- Features (Identity, Wallet, Transfer, BankLink, Pricing, PFM, Audit, Admin) are subfolders repeated in each layer, not projects. `FFM.ArchitectureTests` enforces the layer references and where handlers and services live.

## Feature ownership

Nothing in the compiler enforces these anymore, so review for them:

- **Transfer** owns `Transaction` and its lifecycle for every type, Reversal included; only `UseCases/Transfer/` changes Transaction status.
- **Wallet** owns the Ledger; nothing writes Ledger rows except `ILedgerPosting`.
- **PFM** owns Category assignment for Transactions.
- **Admin** owns only Dashboard stats; every other admin endpoint lives under the feature that owns the data.
- Each feature keeps its PostgreSQL schema: `identity`, `wallet`, `transfer`, `banklink`, `pricing`, `pfm`, `audit`, `admin`, plus `messaging` for outbox/inbox. Writes go through the owning feature's repository; Dapper read queries may JOIN across schemas. FKs stay within one schema.

## Application layer

- **Business use cases are handlers**: one class per use case implementing `ICommandHandler<TCommand, TResult>` / `IQueryHandler<TQuery, TResult>`, under `UseCases/<Feature>/`, named `*Handler`, injected straight into the endpoint. Hand-written; MediatR is commercial from v13, same reasoning as ADR-0003.
- **Plain CRUD is a service**: `I<Name>Service` / `<Name>Service` under `Services/<Feature>/` for create/read/update/delete on one User-owned entity (Manual Entry, Budget, Goal, Category list, bank catalog, Linked Bank Account list).
- A use case is a handler if it touches balances, Transactions, the Ledger or Wallet Lock; needs an idempotency key, OTP or maker–checker; writes audit or outbox; spans several aggregates; or has a lifecycle. A service that grows any of these becomes a handler. When unsure, use a handler. Full table: `docs/architecture.md` §5.
- Business failures return `Result<T>` / `Result` carrying `Error(Code, Kind)`. `Code` is the message key the apps display (`overLimit`, `walletLocked` …; full list in `docs/api.md`). Endpoints map it to ProblemDetails with `code`. Exceptions are for the unexpected and end at the global handler as `500 internalError`.
- Request validation: FluentValidation via an endpoint filter at the API boundary.
- DB transaction, outbox write and audit write are explicit calls inside the handler. Services never open `IUnitOfWork`, write audit or write outbox.
- Minimal API with one `MapGroup` per audience: `/api/mobile/v1`, `/api/admin/v1`, plus `/api/internal/v1` for HMAC-signed provider callbacks. Endpoints use only Application types (handlers, services, DTOs), never repositories or the DbContext. DTOs are `record`s.

## Data access

- EF Core through per-aggregate repositories for writes and aggregate loading (no generic `IRepository<T>`); Dapper behind `I<Feature>Query` for reports, statements and admin list/filter queries.
- One `FfmDbContext`; each entity maps to its feature schema with `ToTable(name, schema)`. One migration set.
- One unit of work spans schemas: `IUnitOfWork` wraps the `FfmDbContext` transaction, and Dapper queries share its connection and transaction. This is how Transfer, Wallet, Audit and outbox rows commit atomically.
- Ledger posting: lock wallet rows with `SELECT ... FOR UPDATE` in ascending id order, inside that one transaction with the balance snapshot and outbox write.
- Column types: `uuid` (UUIDv7) keys, `bigint` money, `timestamptz` in UTC. Day/month boundaries for Limits and Budgets use `Asia/Ho_Chi_Minh`.

## Ledger (ADR-0001)

- Each Wallet has two Ledger accounts, `available` and `held`; system accounts are `bank_clearing` and `fee_revenue`. Holding funds is itself a journal (available → held). Standard journals per flow: `docs/erd.md` §3.2.
- Balances stay ≥ 0. A Reversal whose debited side lacks Available Balance fails with `insufficientBalanceForReversal`.

## Money commands

- One request carrying `Idempotency-Key` and `X-Smart-Otp` headers (Reversal: `Idempotency-Key` only). Handler order: idempotency lookup → Smart OTP verify → lock → Wallet Lock / Limits / balance → post → commit.
- A wrong Smart OTP creates no Transaction; it writes an `otpFailed` audit record and counts toward the 5-attempt lockout.
- Idempotency keys live in `transfer.idempotency_keys`, written in the same DB transaction. Same key + same payload replays the stored response; different payload → `409 idempotencyConflict`.
- Quotes are display-only. Submit re-resolves the Fee; a mismatch returns `409 feeChanged`.
- Fees and Limits resolve by `effective_from` over approved versions. The Worker's status job (`Approved → Active → Superseded`) is for display and cache invalidation; correctness never waits on it.
- Wallet Lock blocks only balance-decreasing User commands. Incoming money, settle/release of `Processing` Transactions and Staff Reversals still run.

## Messaging (ADR-0003)

- `RabbitMQ.Client` only. `IOutbox` is an Application interface; outbox, inbox, publisher and consumers live in `Infrastructure/Messaging`, tables in the `messaging` schema.
- State change + outbox row commit together; the Worker publishes.
- Topology: topic exchange `ffm.events`, routing key `<feature>.<event-kebab>`, one durable queue per consumer `<consumer-feature>.<event-kebab>`.
- Consumers dedupe by message id via the inbox table, then act. After 3 retries with backoff, messages go to `ffm.dlx` → `<queue>.dlq`.
- Bank-facing Transactions (Top-up, Withdrawal, Bank Transfer) move `Processing → Succeeded | Failed` from provider callbacks/consumer results, never synchronously in the HTTP request. A sweeper job resolves payments with no callback.

## External providers

Bank and SMS sit behind `IBankProvider` / `ISmsSender` in `Application/Interfaces`; adapters live in `Infrastructure/External/Bank|Sms`. Only mock adapters exist, registered as keyed services and selected by `BankProvider:Mode` / `Sms:Mode`. They must simulate success, failure, timeout and delayed callback so the lifecycle can be exercised.

## Caching

- Redis: rate limits, Smart OTP replay guard, revoked refresh-token families.
- `IMemoryCache`: Config Versions in effect, cleared on `ConfigVersionActivated`.
- Balances and Limit usage are always read from the database inside the wallet lock.

## Auth

- ASP.NET Core Identity + JWT: short-lived access token, rotating refresh token (reuse of a rotated token revokes the family).
- Two separate audiences: `mobile` (User) and `admin` (Staff). An admin endpoint rejects a User token and vice versa.
- Smart OTP: TOTP secret issued at device binding, one Bound Device per User; verifying a transfer checks the code against the currently bound device only.
- Transaction PIN stays on the device (it unlocks the Smart OTP secret); the server stores and receives no PIN.
- Staff: seeded accounts, password + mandatory TOTP 2FA. Authorization is role-based (Admin, Operations, Control/CS) and enforced server-side on every endpoint; role matrix in `docs/use-cases.md` §4.
- Rate-limit OTP verification and login attempts via Redis.

## Audit

Staff actions — viewing Wallet detail included — and User security events go through `IAuditWriter` (before/after, actor, IP, timestamp). Writing an audit record is part of the same use case and the same DB transaction — a Staff config change without its audit record is incomplete.

## Testing

xUnit v3 (Microsoft.Testing.Platform, opted in via `global.json`) + Testcontainers (PostgreSQL, RabbitMQ, Redis), NSubstitute for test doubles, NetArchTest plus assembly-reference checks for layer rules and handler/service placement. Integration tests run on real PostgreSQL so `FOR UPDATE`, transactions and constraints behave as in production. Ledger, Transfer and Pricing changes ship with tests covering: idempotent replay, concurrent debits on one wallet, limit boundaries (per-transaction/day/month, per KYC Level), and fee/limit resolution by effective date.

## API

OpenAPI is the contract for `packages/api-client`. Endpoint, DTO or enum changes alter the generated client — keep names in Glossary terms and regenerate the client in the same change.
