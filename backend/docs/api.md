# API và Service

## 1. Quy ước

| Mục | Quy ước |
|---|---|
| Prefix | `/api/mobile/v1` (audience `mobile`, User), `/api/admin/v1` (audience `admin`, Staff), `/api/internal/v1` (callback từ provider, ký HMAC, không dùng JWT) |
| Tên resource | Theo GLOSSARY, kebab-case, số nhiều: `linked-bank-accounts`, `p2p-transfers`, `manual-entries`, `fee-config-versions` … |
| JSON | camelCase. Enum dạng chuỗi camelCase, khớp với `apps/*/src/domain/types.ts` (`p2pTransfer`, `pendingApproval` …) |
| Tiền | Số nguyên VND (`integer` trong OpenAPI, `long` trong C#). Không gửi chuỗi định dạng |
| Thời gian | ISO 8601 UTC (`2026-10-18T03:15:00Z`) |
| Auth | `Authorization: Bearer <access token>`. Staff có thêm kiểm role theo [ma trận quyền](use-cases.md#4-ma-trận-quyền-staff) |
| Lệnh di chuyển tiền | Header bắt buộc `Idempotency-Key: <uuid>` + `X-Smart-Otp: <6 số>` (mobile). Reversal của admin chỉ cần `Idempotency-Key` |
| Phân trang mobile | Cursor: `?cursor=<opaque>&limit=20` → `{ items, nextCursor }` |
| Phân trang admin | Offset: `?page=1&pageSize=20&sort=createdAt:desc` → `{ items, total }` (khớp `Page<T>`) |
| Lỗi | `application/problem+json` (RFC 9457), có thêm `code` và `traceId` |
| Rate-limit | Policy `auth` (login, gửi OTP), `money-command` (lệnh tiền), mặc định cho phần còn lại. Vượt ngưỡng trả `429 tooManyAttempts` kèm `Retry-After` |

Ví dụ lỗi:

```json
{
  "type": "https://ffm.dev/errors/over-limit",
  "title": "Vượt hạn mức",
  "status": 422,
  "code": "overLimit",
  "traceId": "00-4bf92f…-01",
  "extensions": { "limitKind": "daily", "remaining": 3500000 }
}
```

Response lệnh di chuyển tiền:

| Tình huống | Status |
|---|---|
| P2P thành công | `201 Created` + `Location`, Transaction `succeeded` |
| Bank-facing đã nhận lệnh | `202 Accepted` + `Location`, Transaction `processing` |
| Gửi lại cùng key và cùng payload | Đúng status và body của lần đầu (body có thể có status mới hơn nếu đã settle) |
| Cùng key nhưng payload khác | `409 idempotencyConflict` |

## 2. Endpoint

### 2.1 Mobile — Identity

| Method | Path | Mô tả | UC |
|---|---|---|---|
| POST | `/auth/register/otp` | `{ phone }` → `{ challengeId, expiresAt }`. Gửi SMS OTP | UC-01 |
| POST | `/auth/register` | `{ challengeId, otp, password, fullName, device: { deviceId, model, os } }` → `{ accessToken, refreshToken, user }` | UC-01 |
| POST | `/auth/login` | `{ phone, password, deviceId }` → tokens, hoặc `403 deviceNotBound` kèm `extensions: { challengeId, expiresAt }` (đã gửi SMS OTP kích hoạt thiết bị) | UC-02 |
| POST | `/auth/device-binding` | `{ challengeId, otp, device }` → `{ accessToken, refreshToken }` | UC-03 |
| POST | `/auth/refresh` | `{ refreshToken }` → cặp token mới | UC-04 |
| POST | `/auth/logout` | Revoke family hiện tại | UC-05 |
| GET | `/me` | `{ id, fullName, phone, kycLevel, device }` | — |

### 2.2 Mobile — Wallet

| Method | Path | Mô tả | UC |
|---|---|---|---|
| GET | `/wallet` | `{ id, ownerName, phone, availableBalance, heldBalance, status }`, hoặc `202 walletProvisioning` | UC-10 |
| GET | `/limits/usage` | `[{ transactionType, perTransaction, dailyRemaining, monthlyRemaining, dailyCountRemaining }]` | UC-11 |

### 2.3 Mobile — BankLink

| Method | Path | Mô tả | UC |
|---|---|---|---|
| GET | `/banks` | Danh mục ngân hàng `[{ code, name, short }]` | UC-20 |
| GET | `/linked-bank-accounts` | `[{ id, bank, maskedNumber, holderName, isDefault }]` | UC-20 |
| POST | `/linked-bank-accounts/link-requests` | `{ bankCode, accountNumber, holderName }` → `{ linkRequestId, expiresAt }`. Ngân hàng gửi OTP | UC-20 |
| POST | `/linked-bank-accounts/link-requests/{id}/confirm` | `{ bankOtp }` → `LinkedBankAccount` | UC-20 |
| DELETE | `/linked-bank-accounts/{id}` | Huỷ liên kết. Cần header `X-Smart-Otp` | UC-21 |
| PUT | `/linked-bank-accounts/{id}/default` | Đặt làm mặc định | UC-22 |
| GET | `/recipients/bank-account?bankCode=&accountNumber=` | `{ holderName }` (đã mask một phần) | UC-36 |

### 2.4 Mobile — Transfer

| Method | Path | Mô tả | UC |
|---|---|---|---|
| GET | `/recipients/wallet?phone=` | `{ name, phone }` (tên mask một phần), hoặc `404 recipientNotFound` | UC-36 |
| POST | `/transfer-quotes` | `{ type, amount, recipient? , linkedBankAccountId? }` → `{ quoteId, amount, fee, total, remainingDailyLimit, expiresAt }` | UC-30 |
| POST | `/p2p-transfers` | `{ recipientPhone, amount, note? }` | UC-31 |
| POST | `/bank-transfers` | `{ bankCode, accountNumber, holderName, amount, note? }` | UC-32 |
| POST | `/top-ups` | `{ linkedBankAccountId, amount }` | UC-33 |
| POST | `/withdrawals` | `{ linkedBankAccountId, amount }` | UC-34 |
| GET | `/transactions/{id}` | Chi tiết Transaction theo góc nhìn User: `amount` có dấu (vào > 0, ra < 0), `fee`, `status`, `counterpartyName`, `counterpartyDetail`, `note`, `categoryId` (lấy từ PFM) | UC-37 |

Mọi `POST` di chuyển tiền đều cần `Idempotency-Key` và `X-Smart-Otp`, và trả `TransactionDto` (shape giống `Transaction` trong `apps/mobile/src/domain/types.ts`).

### 2.5 Mobile — PFM

| Method | Path | Mô tả | UC |
|---|---|---|---|
| GET | `/activities?cursor=&limit=&from=&to=&kind=&categoryId=&direction=` | `{ items: ActivityItem[], nextCursor }`, gộp Transaction và Manual Entry, sắp theo `at` giảm dần | UC-40 |
| GET | `/categories` | `[{ id, nameKey, direction }]` | UC-41 |
| PUT | `/transactions/{id}/category` | `{ categoryId }`. Ghi vào `pfm.transaction_categories` | UC-41 |
| GET | `/manual-entries/{id}` | — | UC-42 |
| POST | `/manual-entries` | `{ occurredAt, amount, categoryId, note }` | UC-42 |
| PUT | `/manual-entries/{id}` | Sửa (Manual Entry không phải Sổ cái nên được phép sửa và xoá) | UC-42 |
| DELETE | `/manual-entries/{id}` | — | UC-42 |
| GET | `/budgets?period=2026-10` | `[{ categoryId, limit, spent }]`. `spent` do server tính | UC-43 |
| PUT | `/budgets/{period}/{categoryId}` | `{ limit }` (upsert) | UC-43 |
| DELETE | `/budgets/{period}/{categoryId}` | — | UC-43 |
| GET / POST | `/goals` | — | UC-44 |
| PUT / DELETE | `/goals/{id}` | `{ name, icon, target, saved }` | UC-44 |

`PUT /transactions/{id}/category` là endpoint của feature **PFM**, gắn vào route `transactions` cho tiện phía FE. Handler kiểm Transaction thuộc về User qua `ITransactionQuery`.

### 2.6 Admin

| Method | Path | Mô tả | Role | UC |
|---|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` → `{ mfaChallengeId }` | — | UC-50 |
| POST | `/auth/login/mfa` | `{ mfaChallengeId, totp }` → tokens | — | UC-50 |
| POST | `/auth/refresh`, `/auth/logout` | — | — | — |
| GET | `/me` | `{ id, name, role }` | tất cả | — |
| GET | `/dashboard?range=today\|7d\|30d` | `{ volume, count, activeWallets, failureRatePct, feeRevenue, deltas, series[], mix[], latest[] }` | tất cả | UC-51 |
| GET | `/transactions?page&pageSize&sort&type&status&from&to&q&walletId` | `Page<Transaction>` | tất cả | UC-52 |
| GET | `/transactions/{id}` | Transaction kèm `ledger[]` (bút toán), `statusHistory[]`, `reversalOfId`, `reversedById` | tất cả | UC-53 |
| POST | `/transactions/{id}/reversals` | `{ reason }` + `Idempotency-Key` → Transaction Reversal | Admin, Operations | UC-54 |
| GET | `/wallets?q=&page&pageSize` | Tìm theo SĐT, id Ví hoặc tên | tất cả | UC-55 |
| GET | `/wallets/{id}` | Chi tiết Ví + User + Bound Device + Linked Bank Account. **Ghi audit `view`** | tất cả | UC-55 |
| GET | `/wallets/{id}/limit-usage` | `[{ transactionType, used, limit }]` hôm nay | tất cả | UC-55 |
| POST | `/wallets/{id}/lock` | `{ reason }` | tất cả | UC-56 |
| POST | `/wallets/{id}/unlock` | `{ reason }` | tất cả | UC-56 |
| GET | `/fee-config-versions?status=` | Danh sách version (đang hiệu lực, chờ duyệt, lịch sử) | tất cả | UC-63 |
| GET | `/fee-config-versions/{id}` | Chi tiết + rules + diff với bản đang hiệu lực | tất cả | UC-63 |
| POST | `/fee-config-versions` | `{ effectiveFrom, note, rules[] }` → `draft` | Admin, Operations | UC-60 |
| PUT | `/fee-config-versions/{id}` | Chỉ sửa được khi còn `draft` và người sửa là maker | Admin, Operations | UC-60 |
| POST | `/fee-config-versions/{id}/submit` | `draft → pendingApproval` | maker | UC-61 |
| POST | `/fee-config-versions/{id}/approve` | `pendingApproval → approved` | Admin, Control (≠ maker) | UC-62 |
| POST | `/fee-config-versions/{id}/reject` | `{ reason }` → `rejected` | Admin, Control (≠ maker) | UC-62 |
| * | `/limit-config-versions…` | Giống bộ fee, thêm `kycLevel` khi tạo và lọc `?kycLevel=` | như trên | UC-60..63 |
| GET | `/audit-entries?page&pageSize&keyword&action&role&from&to&targetType&targetId` | `Page<AuditEntry>` | Admin, Control | UC-70 |

Không có `DELETE` cho bất kỳ Config Version, Transaction, bút toán hay Audit Log nào.

### 2.7 Internal

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/internal/v1/bank-callbacks` | Callback từ Bank provider (mock): `{ providerRef, outcome, failureCode?, signedAt }`, header `X-Signature` (HMAC-SHA256). Luôn trả `200` khi chữ ký hợp lệ, kể cả callback trùng |
| GET | `/health/live`, `/health/ready` | Health check cho Docker (Postgres, RabbitMQ, Redis) |

## 3. Mã lỗi

| `code` | HTTP | Khi nào |
|---|---|---|
| `validationFailed` | 400 | Request sai định dạng. `errors` chứa chi tiết theo field |
| `wrongPassword` | 401 | Sai SĐT/email hoặc mật khẩu (không tiết lộ cái nào sai) |
| `invalidToken` | 401 | Access hoặc refresh token không hợp lệ hoặc hết hạn |
| `tokenReuseDetected` | 401 | Refresh token đã bị thay mà vẫn được dùng; cả family bị thu hồi |
| `deviceRevoked` | 401 | `device_id` trong token không còn bound |
| `invalidOtp` | 401 | Sai Smart OTP hoặc OTP đã dùng (không tạo Transaction) |
| `invalidSmsOtp` / `smsOtpExpired` | 400 | Sai hoặc hết hạn SMS OTP |
| `invalidBankOtp` | 400 | Sai OTP ngân hàng khi liên kết |
| `mfaRequired` / `invalidMfa` | 401 | Staff chưa qua hoặc sai TOTP 2FA |
| `forbidden` | 403 | Sai audience hoặc role |
| `deviceNotBound` | 403 | Đăng nhập từ thiết bị chưa kích hoạt. Mật khẩu đã đúng; SMS OTP kích hoạt đã được gửi |
| `userDisabled` | 403 | Mật khẩu đúng nhưng User ở trạng thái `disabled` |
| `makerCannotApprove` | 403 | Checker trùng maker |
| `notFound`, `recipientNotFound`, `linkedBankAccountNotFound` | 404 | — |
| `phoneAlreadyRegistered`, `accountAlreadyLinked` | 409 | — |
| `idempotencyConflict` | 409 | Cùng key nhưng payload khác |
| `feeChanged` | 409 | Phí tính lại khác quote; FE cần quote lại |
| `alreadyLocked`, `notLocked`, `invalidStatusTransition` | 409 | — |
| `overBalance` | 422 | Không đủ số dư khả dụng cho A + F |
| `overLimit` | 422 | Vượt hạn mức. `extensions.limitKind` = `perTransaction` / `daily` / `monthly` / `dailyCount` |
| `walletLocked` | 422 | Ví bị khoá, chặn giao dịch làm giảm số dư |
| `selfTransfer` | 422 | P2P cho chính mình |
| `holderNameMismatch` | 422 | Tên chủ TK không khớp với ngân hàng |
| `notReversible` | 422 | Transaction không ở `succeeded`, đã bị đảo, hoặc là một Reversal |
| `insufficientBalanceForReversal` | 422 | Bên bị trừ không đủ số dư khả dụng |
| `effectiveFromInPast` | 422 | `effective_from` đã qua lúc tạo hoặc lúc duyệt |
| `tooManyAttempts` | 429 | Vượt rate-limit login, OTP hoặc gửi SMS |
| `walletProvisioning` | 202 | Wallet đang được tạo sau khi đăng ký |
| `bankUnavailable` | 503 | Provider không nhận lệnh (chỉ khi gọi đồng bộ: tra cứu tên, liên kết) |
| `internalError` | 500 | Lỗi bất ngờ |

`failure_reason` của Transaction `Failed` dùng các message key `bankRejected`, `bankTimeout`, `bankAccountInvalid`.

## 4. Quy tắc nghiệp vụ trong API

- **Quote và submit**: quote chỉ để hiển thị. Lúc submit, server resolve lại Phí và Hạn mức tại thời điểm đó. FE không tự tính và không tự kiểm hạn mức (`apps/mobile/CLAUDE.md`).
- **Smart OTP**: kiểm *trước* khi tạo Transaction (D8). Mỗi mã chỉ dùng một lần (Redis `SET NX` theo time-step). Sai 5 lần thì khoá Smart OTP 15 phút và ghi audit `otpFailed`.
- **Góc nhìn User**: một Transaction P2P xuất hiện ở cả hai bên. `amount` mang dấu theo Wallet của người đang gọi. Người nhận không thấy `fee`.
- **Dữ liệu nhạy cảm**: số tài khoản chỉ trả bản mask. Tên người nhận khi tra cứu chỉ trả bản mask một phần (`NGUYEN V. A`).
- **Admin xem chi tiết Ví** luôn ghi audit `view`. FE không prefetch dữ liệu này (`apps/admin/CLAUDE.md`).

## 5. Use case, interface và event theo feature

Ký hiệu: **C** = command handler, **Q** = query handler (cả hai ở `Application/UseCases/<Feature>/`), **S** = service CRUD (`Application/Services/<Feature>/`), **I** = interface ở `Application/Interfaces` mà feature khác gọi, **Ev↑** = event phát ra, **Ev↓** = event consume. Tiêu chí chọn handler hay service: [architecture.md §5](architecture.md#5-tầng-application-handler-cho-nghiệp-vụ-service-cho-crud).

### Identity

| Loại | Tên |
|---|---|
| C | `RequestRegistrationOtp`, `RegisterUser`, `LoginUser`, `BindDevice`, `RefreshToken`, `Logout`, `LoginStaff`, `VerifyStaffMfa` |
| Q | `GetCurrentUser`, `GetCurrentStaff` |
| I | `ISmartOtpVerifier.VerifyAsync(userId, deviceId, code, ct) → Result` |
| | `IUserDirectory.GetAsync(userId)`, `FindByPhoneAsync(phone) → UserSummary { id, fullName, phone, kycLevel, status }` |
| | `IStaffDirectory.GetAsync(staffId) → StaffSummary` |
| Adapter | `ISmsSender` (mock), `ITotpService`, `IPasswordHasher` (Identity) |
| Ev↑ | `UserRegistered { userId, phone, fullName, kycLevel }`, `DeviceBound`, `DeviceRevoked { userId, deviceId }` |

### Wallet

| Loại | Tên |
|---|---|
| C | `LockWallet`, `UnlockWallet` (admin) |
| Q | `GetMyWallet`, `GetWalletDetail` (admin), `SearchWallets` (admin, Dapper) |
| I | `ILedgerPosting.PostAsync(JournalRequest, ct) → Result<JournalPosted>`. Chạy trong `IUnitOfWork` hiện tại; caller phải gọi `LockAsync` trước |
| | `IWalletLocking.LockForUpdateAsync(walletIds[], ct) → WalletState[] { id, status, availableBalance, heldBalance }` |
| | `IWalletQuery.GetByUserAsync(userId)`, `GetAsync(walletId)`, `GetLedgerEntriesAsync(transactionId)` |
| Ev↓ | `UserRegistered` → tạo Wallet + 2 tài khoản Sổ cái |
| Ev↑ | `WalletLocked`, `WalletUnlocked` |

### Transfer

| Loại | Tên |
|---|---|
| C | `CreateTransferQuote`, `SubmitP2PTransfer`, `SubmitBankTransfer`, `SubmitTopUp`, `SubmitWithdrawal`, `ReverseTransaction` (admin), `SettleBankTransaction` (nội bộ, từ consumer) |
| Q | `GetTransaction` (User), `GetTransactionDetail` (admin, kèm bút toán qua `IWalletQuery`), `SearchTransactions` (admin, Dapper), `GetLimitUsage`, `LookupWalletRecipient` |
| I | `ITransactionQuery.GetAsync(id)`, `ListForUserAsync(userId, cursor, filter)`, `ListForRebuildAsync(from, to)` |
| Domain | `Transaction` aggregate: `Authorize()`, `StartProcessing()`, `Succeed()`, `Fail(reason)`, `MarkReversed(reversalId)`. Chuyển trạng thái sai lifecycle trả `invalidStatusTransition` |
| | `LimitPolicy.Check(rule, usage, amount) → Result`, `IdempotencyStore` |
| Phụ thuộc | `ISmartOtpVerifier`, `IUserDirectory`, `IPricingQuery`, `IWalletLocking`, `ILedgerPosting`, `ILinkedBankAccountQuery`, `IAuditWriter` |
| Ev↑ | `BankPaymentRequested { transactionId, direction, amount, linkedBankAccountId?, bankCode?, accountNumberEnc? }` |
| | `TransactionSucceeded`, `TransactionFailed`, `TransactionReversed { transactionId, reversalId, type, amount, fee, walletId, counterpartyWalletId?, occurredAt }` |
| Ev↓ | `BankPaymentSettled`, `BankPaymentFailed` |

### BankLink

| Loại | Tên |
|---|---|
| C | `RequestBankLink`, `ConfirmBankLink`, `UnlinkBankAccount`, `HandleBankCallback`, `ExecuteBankPayment` (consumer), `SweepTimedOutPayments` (job) |
| Q | `LookupBankAccountHolder` (gọi `IBankProvider`) |
| S | `IBankCatalogService` (list ngân hàng), `ILinkedBankAccountService` (list, đặt mặc định) |
| I | `ILinkedBankAccountQuery.GetForUserAsync(userId, id) → LinkedBankAccountSummary?`, `ListForUserAsync(userId)` |
| Adapter | `IBankProvider`: `VerifyHolderAsync`, `StartLinkAsync`, `ConfirmLinkAsync`, `DebitAsync`, `CreditAsync`, `GetStatusAsync`. Callback verify bằng `IBankCallbackSignature` |
| Ev↓ | `BankPaymentRequested` |
| Ev↑ | `BankPaymentSettled { transactionId, providerRef }`, `BankPaymentFailed { transactionId, reason }` |

### Pricing

| Loại | Tên |
|---|---|
| C | `CreateFeeConfigVersion`, `UpdateDraftFeeConfigVersion`, `SubmitFeeConfigVersion`, `ApproveFeeConfigVersion`, `RejectFeeConfigVersion` (tương tự với `…LimitConfigVersion`), `ActivateDueConfigVersions` (job) |
| Q | `ListFeeConfigVersions`, `GetFeeConfigVersion` (kèm diff), tương tự với Limit |
| I | `IPricingQuery.ResolveFeeAsync(type, amount, at) → FeeQuote { fee, configVersionId }` |
| | `IPricingQuery.ResolveLimitsAsync(type, kycLevel, at) → LimitRule + configVersionId` |
| Domain | `FeeCalculator` (số nguyên, làm tròn lên), `ConfigVersion` (state machine, maker ≠ checker), `FeeRuleSetValidator` (band không chồng nhau) |
| Ev↑ | `ConfigVersionActivated { kind: fee \| limit, versionId, kycLevel? }` |

### PFM

| Loại | Tên |
|---|---|
| C | `SetTransactionCategory` (kiểm Transaction thuộc User qua `ITransactionQuery`) |
| S | `IManualEntryService` (create, update, delete), `IBudgetService` (get kèm `spent`, upsert, delete), `IGoalService` (list, create, update, delete), `ICategoryService` (list) |
| Q | `ListActivities` (gộp `ITransactionQuery` + `manual_entries` + `transaction_categories`) |
| Ev↓ | `TransactionSucceeded` → tạo `transaction_categories` mặc định cho mỗi Wallet liên quan. `TransactionReversed` → thêm dòng cho Reversal |

### Audit

| Loại | Tên |
|---|---|
| I | `IAuditWriter.WriteAsync(AuditRecord { actor, action, target, before, after, ip, userAgent, correlationId }, ct)`. Ghi trong `IUnitOfWork` hiện tại, nên audit commit cùng use case |
| Q | `SearchAuditEntries` (admin, Dapper) |

`IAuditWriter` được gọi tường minh trong mọi handler của Staff (kể cả query xem chi tiết Ví) và ở các sự kiện bảo mật của User: đăng nhập, kích hoạt hoặc thu hồi thiết bị, sai OTP, phát hiện dùng lại token.

### Admin

| Loại | Tên |
|---|---|
| Q | `GetDashboard` (từ `admin.transaction_stats_hourly`, `admin.wallet_daily_activity`, và `ITransactionQuery` cho `latest`) |
| C | `RebuildStats` (lệnh vận hành) |
| Ev↓ | `TransactionSucceeded`, `TransactionFailed`, `TransactionReversed` → upsert thống kê theo giờ và đánh dấu Ví hoạt động |

Các endpoint admin khác (transactions, wallets, config, audit) nằm ở **feature sở hữu dữ liệu** (`Api/Endpoints/<Feature>/`), gắn vào group `/api/admin/v1` có policy Staff. Feature Admin chỉ giữ Dashboard.

### Bảng tổng hợp event

| Event | Routing key | Phát | Consume |
|---|---|---|---|
| `UserRegistered` | `identity.user-registered` | Identity | Wallet |
| `DeviceBound` / `DeviceRevoked` | `identity.device-bound` / `identity.device-revoked` | Identity | — (dự phòng cho push notification) |
| `WalletLocked` / `WalletUnlocked` | `wallet.wallet-locked` / `wallet.wallet-unlocked` | Wallet | — |
| `BankPaymentRequested` | `transfer.bank-payment-requested` | Transfer | BankLink |
| `BankPaymentSettled` / `BankPaymentFailed` | `banklink.bank-payment-settled` / `banklink.bank-payment-failed` | BankLink | Transfer |
| `TransactionSucceeded` | `transfer.transaction-succeeded` | Transfer | PFM, Admin |
| `TransactionFailed` | `transfer.transaction-failed` | Transfer | Admin |
| `TransactionReversed` | `transfer.transaction-reversed` | Transfer | PFM, Admin |
| `ConfigVersionActivated` | `pricing.config-version-activated` | Pricing | Pricing cache (mọi process, queue tạm theo instance) |

Event là hợp đồng giữa các feature và giữa Api với Worker. Đổi schema event thì thêm field tuỳ chọn. Nếu phải thay đổi phá vỡ tương thích thì tạo event version mới (`…V2`) và chạy song song cho đến khi mọi consumer chuyển xong.
