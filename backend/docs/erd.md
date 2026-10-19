# ERD — Mô hình dữ liệu

PostgreSQL, mỗi feature một schema, tất cả map trong một `FfmDbContext` (ADR-0004). Quy ước chung:

- Khoá chính `uuid` (UUIDv7). Tiền dùng `bigint` (VND nguyên). Thời gian dùng `timestamptz` (UTC). Enum lưu `text` kèm `CHECK`.
- **FK chỉ có trong cùng một schema.** Tham chiếu sang schema khác là *tham chiếu logic*: chỉ lưu id, không có FK. Trong sơ đồ, chúng được ghi chú dạng `→ schema.table`.
- Outbox và inbox là một cặp bảng chung trong schema `messaging` (§9).

## 1. Tổng quan và tham chiếu logic giữa schema

```mermaid
flowchart LR
    identity[identity<br/>users · staff · bound_devices]
    wallet[wallet<br/>wallets · ledger]
    transfer[transfer<br/>transactions]
    banklink[banklink<br/>linked_bank_accounts · bank_payments]
    pricing[pricing<br/>fee/limit config versions]
    pfm[pfm<br/>manual_entries · budgets · goals]
    audit[audit<br/>audit_entries]
    admin[admin<br/>stats]

    wallet -- user_id --> identity
    transfer -- wallet_id --> wallet
    transfer -- user_id --> identity
    transfer -- linked_bank_account_id --> banklink
    transfer -- fee/limit_config_version_id --> pricing
    wallet -- transaction_id --> transfer
    banklink -- transaction_id --> transfer
    banklink -- user_id --> identity
    pfm -- transaction_id --> transfer
    pfm -- user_id --> identity
    pricing -- maker_id/checker_id --> identity
    audit -. actor_id .-> identity
    admin -. wallet_id .-> wallet
```

## 2. `identity`

```mermaid
erDiagram
    users ||--o{ bound_devices : "binds"
    users ||--o{ refresh_tokens : "owns (subject_type=user)"
    staff ||--o{ refresh_tokens : "owns (subject_type=staff)"

    users {
        uuid id PK
        text phone UK "E.164, đăng nhập"
        text password_hash "ASP.NET Identity hasher"
        text full_name
        text email "nullable"
        smallint kyc_level "1 | 2"
        text status "active | disabled"
        timestamptz created_at
        timestamptz last_login_at
    }
    bound_devices {
        uuid id PK
        uuid user_id FK
        text device_id "do app sinh, lưu secure-store"
        text model
        text os
        bytea totp_secret_enc "Data Protection"
        timestamptz bound_at
        timestamptz revoked_at "null = đang active"
    }
    sms_otp_challenges {
        uuid id PK
        text phone
        text purpose "register | deviceBinding"
        text code_hash
        int attempts
        timestamptz expires_at
        timestamptz consumed_at
    }
    refresh_tokens {
        uuid id PK
        text subject_type "user | staff"
        uuid subject_id
        text audience "mobile | admin"
        uuid family_id
        text token_hash UK "SHA-256"
        uuid device_id "nullable, chỉ User"
        timestamptz expires_at
        uuid replaced_by_id "nullable"
        timestamptz revoked_at
        text revoke_reason "rotated | reuseDetected | logout | deviceRevoked"
    }
    staff {
        uuid id PK
        text email UK
        text password_hash
        text full_name
        text role "admin | operations | control"
        bytea totp_secret_enc "2FA bắt buộc"
        text status "active | disabled"
        timestamptz last_login_at
    }
```

- Unique index một phần `bound_devices (user_id) WHERE revoked_at IS NULL` bảo đảm mỗi User chỉ có **một** Bound Device đang active.
- `users` là bảng của ASP.NET Core Identity: `FfmDbContext` kế thừa `IdentityUserContext<UserIdentity, Guid>`, vẫn là **một** DbContext (ADR-0004). Ngoài các cột ở trên, Identity có thêm cột riêng (`user_name`, `normalized_user_name`, `security_stamp`, `concurrency_stamp`, `lockout_*`, `access_failed_count` …) và ba bảng `user_claims`, `user_logins`, `user_tokens` trong schema `identity`. `user_name` bằng `phone`. Không dùng tên mặc định `AspNet*`.
- Staff không dùng Identity store, vì một Identity context chỉ có một loại TUser. Bảng `staff` tự map và hash mật khẩu bằng `PasswordHasher<Staff>`.

## 3. `wallet` — Ví và Sổ cái

```mermaid
erDiagram
    wallets ||--|{ ledger_accounts : "has available + held"
    journal_entries ||--|{ ledger_entries : "balanced lines"
    ledger_accounts ||--o{ ledger_entries : "posted to"
    wallets ||--o{ wallet_lock_events : "history"

    wallets {
        uuid id PK
        uuid user_id UK "→ identity.users, 1 User = 1 Wallet"
        text status "active | locked"
        bigint available_balance "snapshot"
        bigint held_balance "snapshot"
        bigint version "optimistic concurrency, tăng mỗi lần post"
        timestamptz created_at
    }
    ledger_accounts {
        uuid id PK
        text code UK "vd wallet:{id}:available, system:fee_revenue"
        text kind "walletAvailable | walletHeld | system"
        uuid wallet_id FK "null với tài khoản hệ thống"
        text normal_side "debit | credit"
        timestamptz created_at
    }
    journal_entries {
        uuid id PK
        uuid transaction_id "→ transfer.transactions"
        text posting_kind "p2p | hold | settleOut | release | topUpCredit | reversal"
        text description
        timestamptz posted_at
    }
    ledger_entries {
        uuid id PK
        uuid journal_entry_id FK
        uuid ledger_account_id FK
        bigint debit "≥ 0"
        bigint credit "≥ 0"
        timestamptz posted_at
    }
    wallet_lock_events {
        uuid id PK
        uuid wallet_id FK
        text action "lock | unlock"
        text reason
        uuid staff_id "→ identity.staff"
        timestamptz at
    }
```

Ràng buộc:

- `ledger_entries`: `CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))`.
- Mỗi `journal_entry_id` phải có Σdebit = Σcredit. Kiểm ở Domain và bằng một deferred constraint trigger lúc commit.
- `journal_entries`, `ledger_entries`, `wallet_lock_events` là **append-only**: role của ứng dụng không có quyền `UPDATE` / `DELETE` trên chúng.
- Unique `(transaction_id, posting_kind)` để không post trùng một bước khi consumer chạy lại.
- `available_balance ≥ 0` và `held_balance ≥ 0` (`CHECK`).

### 3.1 Tài khoản Sổ cái

| Code | Kind | Normal side | Ý nghĩa |
|---|---|---|---|
| `wallet:{id}:available` | walletAvailable | credit | Số dư khả dụng. Đây là nợ phải trả của hệ thống với User |
| `wallet:{id}:held` | walletHeld | credit | Số dư tạm giữ cho Giao dịch đang xử lý |
| `system:bank_clearing` | system | debit | Tiền đang chờ đối soát với ngân hàng (tài sản) |
| `system:fee_revenue` | system | credit | Doanh thu phí |

Số dư Wallet = available + held = Σcredit − Σdebit trên hai tài khoản của Wallet. Snapshot được cập nhật trong cùng DB transaction với bút toán (ADR-0001).

### 3.2 Bút toán chuẩn

Ký hiệu: A = amount, F = fee. *Nợ* làm giảm tài khoản có normal side là credit.

| Luồng | Bước (`posting_kind`) | Nợ | Có |
|---|---|---|---|
| **P2P Transfer** | `p2p` (một journal) | sender:available A+F | receiver:available A · fee_revenue F |
| **Bank Transfer / Withdrawal** | `hold` (khi gửi lệnh) | wallet:available A+F | wallet:held A+F |
| | `settleOut` (ngân hàng báo thành công) | wallet:held A+F | bank_clearing A · fee_revenue F |
| | `release` (ngân hàng báo thất bại) | wallet:held A+F | wallet:available A+F |
| **Top-up** | `topUpCredit` (ngân hàng báo thành công) | bank_clearing A | wallet:available A − F |
| | | | fee_revenue F (nếu F > 0) |
| **Reversal** | `reversal` (journal mới) | các dòng *Có* của journal gốc | các dòng *Nợ* của journal gốc |

- Top-up thất bại thì không có bút toán, vì tiền chưa vào hệ thống.
- Reversal chỉ áp dụng cho Transaction `Succeeded`. Nếu người phải bị trừ (ví dụ người nhận P2P) không đủ số dư khả dụng thì Reversal bị từ chối với lỗi `insufficientBalanceForReversal`. Sổ cái không cho số dư âm.

## 4. `transfer`

```mermaid
erDiagram
    transactions ||--o{ transaction_status_history : "lifecycle"
    transactions ||--o| idempotency_keys : "created by"
    transactions ||--o| transactions : "reversal_of"
    transactions ||--o{ transfer_quotes : "quoted by"

    transactions {
        uuid id PK
        text reference UK "mã hiển thị, vd FFM2610180001"
        text type "topUp | withdrawal | p2pTransfer | bankTransfer"
        text status "initiated | pendingAuth | processing | succeeded | failed | reversed"
        uuid user_id "→ identity.users (người khởi tạo)"
        uuid wallet_id "→ wallet.wallets (ví nguồn hoặc ví nhận với topUp)"
        bigint amount "> 0, không dấu"
        bigint fee "≥ 0"
        uuid counterparty_wallet_id "→ wallet.wallets, chỉ p2p"
        text counterparty_name
        text counterparty_detail "đã mask"
        uuid linked_bank_account_id "→ banklink, topUp/withdrawal"
        text bank_code "bankTransfer"
        bytea bank_account_number_enc "bankTransfer"
        text note
        text failure_reason "message key"
        uuid reversal_of_id FK "nullable"
        uuid reversed_by_id FK "nullable"
        uuid fee_config_version_id "→ pricing"
        uuid limit_config_version_id "→ pricing"
        text channel "mobile | admin"
        inet client_ip
        uuid initiated_by_staff_id "Reversal: → identity.staff"
        timestamptz created_at
        timestamptz completed_at
    }
    transaction_status_history {
        uuid id PK
        uuid transaction_id FK
        text from_status
        text to_status
        text reason
        timestamptz at
    }
    idempotency_keys {
        uuid user_id PK "hoặc staff_id với Reversal"
        uuid key PK
        text request_hash "SHA-256 của payload chuẩn hoá"
        uuid transaction_id FK
        int response_status
        jsonb response_body
        timestamptz created_at
    }
    transfer_quotes {
        uuid id PK
        uuid user_id
        text type
        bigint amount
        bigint fee
        uuid fee_config_version_id
        timestamptz expires_at
    }
```

- Index `(wallet_id, created_at DESC)` và `(counterparty_wallet_id, created_at DESC)` phục vụ statement và tính hạn mức đã dùng.
- Hạn mức đã dùng trong ngày/tháng = `SUM(amount)` và `COUNT(*)` các Transaction đi ra của Wallet theo `type`, với `status NOT IN ('failed')`, tính trong khoảng ngày/tháng theo giờ Việt Nam. Truy vấn chạy sau khi đã lock Wallet.
- `transaction_status_history` là append-only. Chuyển trạng thái chỉ được đi theo lifecycle: `Initiated → PendingAuth → Processing → Succeeded | Failed`, `Succeeded → Reversed`.
- `transfer_quotes` chỉ để hiển thị và đối chiếu. Lúc submit, server **tính lại** phí. Nếu phí lệch với quote thì trả `feeChanged` để FE hiển thị lại.

## 5. `banklink`

```mermaid
erDiagram
    banks ||--o{ linked_bank_accounts : "at"
    banks ||--o{ link_requests : "at"
    linked_bank_accounts ||--o{ bank_payments : "source/destination"
    bank_payments ||--o{ bank_callbacks : "received"

    banks {
        text code PK "vcb | tcb | mb | acb | vpb | tpb | bidv"
        text name
        text short_name
        boolean supports_linking
        boolean is_active
    }
    linked_bank_accounts {
        uuid id PK
        uuid user_id "→ identity.users"
        text bank_code FK
        bytea account_number_enc
        text masked_number "•••• 1234"
        text holder_name
        boolean is_default
        text status "linked | unlinked"
        text provider_link_token "token ủy quyền trích nợ từ ngân hàng"
        timestamptz linked_at
        timestamptz unlinked_at
    }
    link_requests {
        uuid id PK
        uuid user_id
        text bank_code FK
        bytea account_number_enc
        text holder_name
        text provider_ref
        text status "pendingOtp | confirmed | failed | expired"
        int attempts
        timestamptz expires_at
    }
    bank_payments {
        uuid id PK
        uuid transaction_id UK "→ transfer.transactions"
        text direction "debitUserBank (topUp) | creditBank (withdrawal, bankTransfer)"
        uuid linked_bank_account_id FK "nullable với bankTransfer"
        text bank_code
        bytea account_number_enc
        bigint amount
        text provider_ref UK
        text status "pending | succeeded | failed | timedOut"
        int attempts
        text last_error
        timestamptz requested_at
        timestamptz settled_at
    }
    bank_callbacks {
        uuid id PK
        uuid bank_payment_id FK
        text provider_ref
        text outcome
        jsonb raw_payload
        boolean signature_valid
        timestamptz received_at
    }
```

- Unique index một phần `(user_id) WHERE is_default AND status = 'linked'`.
- Unique index một phần `(user_id, bank_code, masked_number) WHERE status = 'linked'`, để không liên kết trùng một tài khoản.
- Huỷ liên kết là soft (`status = unlinked`), vì Transaction cũ vẫn tham chiếu tới nó.
- `bank_callbacks` lưu mọi callback, kể cả bản trùng hoặc sai chữ ký, để đối soát.

## 6. `pricing`

```mermaid
erDiagram
    fee_config_versions ||--|{ fee_rules : "contains"
    limit_config_versions ||--|{ limit_rules : "contains"

    fee_config_versions {
        uuid id PK
        int version UK
        text status "draft | pendingApproval | approved | active | superseded | rejected"
        timestamptz effective_from
        uuid maker_id "→ identity.staff"
        uuid checker_id "→ identity.staff, ≠ maker_id"
        text note
        text reject_reason
        timestamptz created_at
        timestamptz submitted_at
        timestamptz decided_at
    }
    fee_rules {
        uuid id PK
        uuid version_id FK
        text transaction_type
        bigint min_amount "bao gồm"
        bigint max_amount "bao gồm, null = không trần"
        text kind "free | fixed | percent | percentPlusFixed"
        bigint fixed
        int percent_bps "20 = 0,2%"
        bigint min_fee
    }
    limit_config_versions {
        uuid id PK
        smallint kyc_level "1 | 2"
        int version "unique theo (kyc_level, version)"
        text status
        timestamptz effective_from
        uuid maker_id
        uuid checker_id
        text note
        text reject_reason
        timestamptz created_at
        timestamptz submitted_at
        timestamptz decided_at
    }
    limit_rules {
        uuid id PK
        uuid version_id FK
        text transaction_type
        bigint per_transaction
        bigint daily
        bigint monthly
        int daily_count
    }
```

- `CHECK (checker_id IS NULL OR checker_id <> maker_id)`: maker không thể tự duyệt.
- Một version đã rời trạng thái `draft` thì không sửa được. Trigger chặn `UPDATE` lên rule của version không còn ở `draft`.
- **Resolve** (D12): chọn version có `status IN ('approved','active','superseded')` và `effective_from ≤ t`, lấy `effective_from` lớn nhất (với Hạn mức thì lọc thêm theo `kyc_level`). Không phụ thuộc job đã đổi status hay chưa.
- Phí tính bằng số nguyên: `fee = max(min_fee, fixed + amount * percent_bps / 10000)`, làm tròn **lên** đến đồng. Trong một version, các band `[min_amount, max_amount]` của cùng một loại giao dịch không được chồng nhau.

## 7. `pfm`

```mermaid
erDiagram
    categories ||--o{ manual_entries : "labels"
    categories ||--o{ transaction_categories : "labels"
    categories ||--o{ budgets : "caps"

    categories {
        text id PK "food | shopping | transport | bills | fun | saving | transfer | income | topUp"
        text name_key "i18n key"
        text direction "expense | income | neutral"
        boolean is_system
    }
    manual_entries {
        uuid id PK
        uuid user_id "→ identity.users"
        timestamptz occurred_at
        bigint amount "có dấu: thu > 0, chi < 0"
        text category_id FK
        text note
        timestamptz created_at
        timestamptz updated_at
    }
    transaction_categories {
        uuid transaction_id PK "→ transfer.transactions"
        uuid user_id PK "P2P: mỗi bên một dòng"
        text category_id FK
        text source "default | user"
        bigint signed_amount "projection, theo góc nhìn User"
        text transaction_type "projection"
        timestamptz occurred_at "projection"
    }
    budgets {
        uuid id PK
        uuid user_id
        text category_id FK
        text period "YYYY-MM"
        bigint limit_amount
    }
    goals {
        uuid id PK
        uuid user_id
        text name
        text icon "plane | laptop | home | gift"
        bigint target
        bigint saved "User tự ghi, không khoá tiền Ví"
        timestamptz created_at
    }
```

- `transaction_categories` được tạo khi consume `TransactionSucceeded` (Category mặc định suy từ `type` và hướng tiền). Khi User đổi Category thì `source = user`, và event đến sau không ghi đè nữa. Khi nhận `TransactionReversed` thì PFM tạo thêm dòng cho Transaction Reversal.
- `budgets` có unique `(user_id, category_id, period)`. Chi tiêu của Budget = Σ |signed_amount| các khoản chi trong kỳ, từ `transaction_categories` cộng `manual_entries`. Mọi thứ tính trong schema `pfm`, không gọi sang Transfer.
- Manual Entry **không bao giờ** chạm Sổ cái hay số dư Wallet.

## 8. `audit` và `admin`

```mermaid
erDiagram
    audit_entries {
        uuid id PK
        timestamptz at
        text actor_type "staff | user | system"
        uuid actor_id "nullable với system"
        text actor_name "snapshot"
        text actor_role "admin | operations | control | null"
        text action "login | view | create | submit | approve | reject | lock | unlock | reverse | deviceBound | deviceRevoked | otpFailed | tokenReuse"
        text target_type "wallet | transaction | feeConfigVersion | limitConfigVersion | user | staff"
        text target_id
        jsonb before
        jsonb after
        inet ip
        text user_agent
        uuid correlation_id
    }
    transaction_stats_hourly {
        timestamptz bucket_hour PK
        text transaction_type PK
        text status PK "succeeded | failed | reversed"
        bigint tx_count
        bigint volume
        bigint fee_total
    }
    wallet_daily_activity {
        date day PK "giờ Việt Nam"
        uuid wallet_id PK "→ wallet.wallets"
    }
```

- `audit.audit_entries` là append-only (không cấp quyền `UPDATE`/`DELETE`), có index `(at DESC)`, `(actor_id, at)`, `(target_type, target_id)`.
- Bảng `admin.*` cập nhật bằng upsert `ON CONFLICT … DO UPDATE SET tx_count = tx_count + 1, …` khi consume event Transaction, có inbox để tránh cộng trùng. Lệnh `admin rebuild-stats` tính lại từ `ITransactionQuery`.

## 9. Bảng chung: outbox và inbox (schema `messaging`)

Một cặp bảng cho mọi feature, hiện thực ở `Infrastructure/Messaging`.

```mermaid
erDiagram
    outbox_messages {
        uuid id PK "= messageId"
        text type "vd transfer.transaction-succeeded"
        jsonb payload
        uuid correlation_id
        timestamptz occurred_at
        timestamptz published_at "null = chưa gửi"
        int attempts
        text last_error
    }
    inbox_messages {
        uuid message_id PK
        text consumer PK "tên consumer"
        timestamptz processed_at
    }
```

Index một phần `outbox_messages (occurred_at) WHERE published_at IS NULL`. Publisher đọc bằng `FOR UPDATE SKIP LOCKED`, nên chạy nhiều instance Worker vẫn an toàn.
