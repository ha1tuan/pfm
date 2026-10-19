# Sơ đồ activity

Dùng Mermaid `flowchart`. Mỗi `subgraph` là một swimlane (actor, feature hoặc process). `{…}` là điểm rẽ nhánh, `([…])` là điểm bắt đầu và kết thúc. Bước nào có ghi **[DB tx]** thì toàn bộ thay đổi trong lane đó commit cùng nhau, gồm cả outbox và audit (xem [architecture.md §5](architecture.md#một-db-transaction-xuyên-schema)).

Mục lục:

1. [Đăng ký](#1-đăng-ký-uc-01)
2. [Đăng nhập + kích hoạt thiết bị](#2-đăng-nhập--kích-hoạt-thiết-bị-uc-02-uc-03)
3. [Liên kết / huỷ liên kết ngân hàng](#3-liên-kết--huỷ-liên-kết-ngân-hàng-uc-20-uc-21)
4. [P2P Transfer](#4-p2p-transfer-uc-31)
5. [Bank Transfer](#5-bank-transfer-uc-32)
6. [Top-up](#6-top-up-uc-33)
7. [Withdrawal](#7-withdrawal-uc-34)
8. [Config Version theo maker–checker](#8-config-version-makerchecker-uc-60uc-63-uc-83)
9. [Reversal](#9-reversal-uc-54)
10. [Khoá / mở khoá Ví](#10-khoá--mở-khoá-ví-uc-56)
11. [Refresh token rotation](#11-refresh-token-rotation-uc-04)

---

## 1. Đăng ký (UC-01)

```mermaid
flowchart TD
    subgraph APP["📱 Mobile app"]
        S(["Bắt đầu"]) --> A1["Nhập SĐT"]
        A3["Nhập SMS OTP, mật khẩu, họ tên"]
        A5["Đặt Transaction PIN (local)<br/>mã hoá TOTP secret bằng PIN<br/>lưu secure-store"]
        A5 --> E(["Vào Wallet home"])
    end
    subgraph ID["Identity"]
        I1{"SĐT đã đăng ký?"}
        I2{"Rate-limit gửi SMS OK?"}
        I3["Tạo sms_otp_challenge<br/>purpose=register"]
        I4{"OTP đúng và còn hạn?"}
        I5["[DB tx] Tạo users (kyc_level=1)<br/>bound_devices + TOTP secret<br/>refresh token family<br/>audit deviceBound<br/>outbox UserRegistered"]
        IE1["409 phoneAlreadyRegistered"]
        IE2["429 tooManyAttempts"]
        IE3["400 invalidSmsOtp<br/>attempts++"]
    end
    subgraph SMS["✉️ SMS mock"]
        M1["Gửi OTP"]
    end
    subgraph WK["⚙️ Worker → Wallet"]
        W1["Consume UserRegistered<br/>inbox dedupe"]
        W2["[DB tx] Tạo wallets<br/>+ 2 ledger_accounts (available, held)"]
    end

    A1 --> I1
    I1 -- có --> IE1
    I1 -- chưa --> I2
    I2 -- không --> IE2
    I2 -- có --> I3 --> M1 --> A3
    A3 --> I4
    I4 -- sai --> IE3 --> A3
    I4 -- đúng --> I5
    I5 -- "201: tokens + totpSecret" --> A5
    I5 -. event .-> W1 --> W2
```

Wallet được tạo bất đồng bộ. Nếu `GET /wallet` được gọi trước khi Worker xử lý xong thì trả `202 walletProvisioning`, app retry sau khoảng 1 giây.

## 2. Đăng nhập + kích hoạt thiết bị (UC-02, UC-03)

```mermaid
flowchart TD
    subgraph APP["📱 Mobile app"]
        S(["Bắt đầu"]) --> A1["Nhập SĐT + mật khẩu<br/>gửi kèm device_id"]
        A2["Nhập SMS OTP"]
        A3["Đặt PIN, lưu TOTP secret mới"]
        A4(["Vào Wallet home"])
    end
    subgraph ID["Identity"]
        I1{"Rate-limit login OK?"}
        I2{"Mật khẩu đúng?"}
        I3{"device_id = thiết bị đang bound?"}
        I4["Cấp access + refresh token<br/>cập nhật last_login_at"]
        I5["403 deviceNotBound"]
        I6["Tạo sms_otp_challenge<br/>purpose=deviceBinding"]
        I7{"OTP đúng?"}
        I8["[DB tx] Thu hồi thiết bị cũ (revoked_at)<br/>revoke refresh token của thiết bị cũ<br/>tạo bound_devices mới + TOTP secret<br/>audit deviceBound + deviceRevoked<br/>outbox DeviceRevoked"]
        IE1["429 tooManyAttempts"]
        IE2["401 wrongPassword<br/>counter++"]
    end
    subgraph SMS["✉️ SMS mock"]
        M1["Gửi OTP"]
    end

    A1 --> I1
    I1 -- không --> IE1
    I1 -- có --> I2
    I2 -- sai --> IE2
    I2 -- đúng --> I3
    I3 -- đúng --> I4 --> A4
    I3 -- "khác / chưa có" --> I5 --> I6 --> M1 --> A2 --> I7
    I7 -- sai --> A2
    I7 -- đúng --> I8 -- "tokens + totpSecret" --> A3 --> A4
```

Thiết bị cũ ở request kế tiếp sẽ nhận `401 deviceRevoked`. App xoá secure-store và đưa User về màn kích hoạt lại (`apps/mobile/CLAUDE.md`).

## 3. Liên kết / huỷ liên kết ngân hàng (UC-20, UC-21)

```mermaid
flowchart TD
    subgraph APP["📱 Mobile app"]
        S(["Bắt đầu"]) --> A1["Chọn ngân hàng<br/>nhập số TK + tên chủ TK"]
        A2["Nhập OTP do ngân hàng gửi"]
        A3(["Hiển thị Linked Bank Account"])
        U1(["Huỷ liên kết"]) --> U2["Nhập PIN → sinh Smart OTP"]
    end
    subgraph BL["BankLink"]
        B1{"TK đã liên kết?"}
        B2["Tạo link_requests<br/>status=pendingOtp"]
        B3{"Ngân hàng xác nhận OTP?"}
        B4["[DB tx] Tạo linked_bank_accounts<br/>is_default nếu là TK đầu tiên<br/>link_requests=confirmed<br/>audit"]
        BE1["409 accountAlreadyLinked"]
        BE2["400 invalidBankOtp<br/>attempts++ (≥ 5 → failed)"]
        BE3["422 holderNameMismatch"]
        U3{"Smart OTP đúng?<br/>(Identity contract)"}
        U4["[DB tx] status=unlinked<br/>chuyển default sang TK khác nếu có<br/>audit"]
    end
    subgraph BANK["🏦 Bank mock"]
        K1{"Tên chủ TK khớp?"}
        K2["Gửi OTP cho chủ TK"]
        K3["Kiểm OTP<br/>trả provider_link_token"]
    end

    A1 --> B1
    B1 -- có --> BE1
    B1 -- chưa --> K1
    K1 -- không --> BE3
    K1 -- có --> B2 --> K2 --> A2 --> K3 --> B3
    B3 -- không --> BE2 --> A2
    B3 -- có --> B4 --> A3
    U2 --> U3
    U3 -- đúng --> U4
```

Huỷ liên kết không ảnh hưởng tới Transaction đang `Processing` dùng tài khoản đó. Lệnh gửi ngân hàng vẫn chạy đến khi có kết quả.

## 4. P2P Transfer (UC-31)

Đồng bộ: mọi thứ xong trong một request.

```mermaid
flowchart TD
    subgraph APP["📱 Mobile app"]
        S(["Bắt đầu"]) --> A1["Nhập SĐT người nhận"]
        A2["Nhập số tiền + ghi chú"]
        A3["Confirm: hiển thị phí + tổng từ quote<br/>sinh Idempotency-Key"]
        A4["Nhập PIN → sinh Smart OTP"]
        A5(["Result: Succeeded"])
        AE(["Hiển thị lỗi theo code"])
    end
    subgraph TR["Transfer"]
        T0["GET /recipients/wallet?phone"]
        T1["POST /transfer-quotes<br/>resolve Phí + hạn mức còn lại"]
        T2{"Idempotency-Key đã có?"}
        T2a{"request_hash trùng?"}
        T2b["Trả lại response cũ"]
        T2c["409 idempotencyConflict"]
        T3{"Smart OTP đúng?<br/>(Identity: thiết bị bound,<br/>chưa dùng, rate-limit)"}
        T3e["401 invalidOtp<br/>audit otpFailed<br/>không tạo Transaction"]
        T4["BEGIN [DB tx]<br/>lock 2 wallets theo id tăng dần"]
        T5{"Ví nguồn locked?"}
        T6{"Người nhận = chính mình?"}
        T7["Resolve Phí + Hạn mức<br/>theo effective date, KYC Level"]
        T8{"Trong hạn mức<br/>giao dịch / ngày / tháng / số lượng?"}
        T9{"available ≥ A + F?"}
        T10["Tạo Transaction<br/>Initiated → PendingAuth → Processing"]
        T12["Transaction → Succeeded<br/>lưu idempotency_keys + response<br/>outbox TransactionSucceeded<br/>COMMIT"]
        TX["ROLLBACK<br/>422 walletLocked / selfTransfer /<br/>overLimit / overBalance"]
    end
    subgraph WL["Wallet (contract ILedgerPosting)"]
        L1["journal p2p:<br/>Nợ sender:available A+F<br/>Có receiver:available A<br/>Có fee_revenue F<br/>cập nhật snapshot 2 ví"]
    end
    subgraph WK["⚙️ Worker"]
        W1["PFM: gán Category mặc định<br/>cho cả 2 bên"]
        W2["Admin: cộng thống kê"]
    end

    A1 --> T0 --> A2 --> T1 --> A3 --> A4 --> T2
    T2 -- có --> T2a
    T2a -- trùng --> T2b --> A5
    T2a -- khác --> T2c --> AE
    T2 -- chưa --> T3
    T3 -- sai --> T3e --> AE
    T3 -- đúng --> T4 --> T5
    T5 -- có --> TX
    T5 -- không --> T6
    T6 -- có --> TX
    T6 -- không --> T7 --> T8
    T8 -- vượt --> TX
    T8 -- trong --> T9
    T9 -- không --> TX
    T9 -- có --> T10 --> L1 --> T12 --> A5
    TX --> AE
    T12 -. event .-> W1
    T12 -. event .-> W2
```

- Hai request cùng Idempotency-Key đến **song song**: request sau bị chặn bởi unique `(user_id, key)` (insert key ngay sau `BEGIN`), chờ request trước commit rồi trả response cũ.
- Nếu phí tính lại lệch so với quote, trả `409 feeChanged` để FE hiển thị lại màn Confirm (dùng key mới).

## 5. Bank Transfer (UC-32)

Bất đồng bộ: HTTP trả `202 Processing`, kết quả cuối đến qua callback.

```mermaid
flowchart TD
    subgraph APP["📱 Mobile app"]
        S(["Bắt đầu"]) --> A1["Chọn ngân hàng + nhập số TK<br/>tra cứu tên chủ TK"]
        A2["Số tiền → Confirm (quote, Idempotency-Key)<br/>→ PIN → Smart OTP"]
        A3["Result: Processing<br/>poll GET /transactions/{id}"]
        A4(["Succeeded / Failed"])
    end
    subgraph TR["Transfer"]
        T1["Idempotency + Smart OTP<br/>(như P2P)"]
        T2["BEGIN [DB tx], lock wallet<br/>kiểm Khoá Ví, Hạn mức, số dư"]
        T3["Transaction → Processing<br/>Wallet: journal hold<br/>Nợ available A+F, Có held A+F<br/>outbox BankPaymentRequested<br/>COMMIT → 202"]
        T4["Consume BankPaymentSettled / Failed"]
        T5{"Kết quả?"}
        T6["[DB tx] journal settleOut<br/>Nợ held A+F<br/>Có bank_clearing A, Có fee_revenue F<br/>→ Succeeded<br/>outbox TransactionSucceeded"]
        T7["[DB tx] journal release<br/>Nợ held A+F, Có available A+F<br/>→ Failed (failure_reason)<br/>outbox TransactionFailed"]
    end
    subgraph BL["⚙️ Worker → BankLink"]
        B1["Consume BankPaymentRequested<br/>inbox dedupe"]
        B2["[DB tx] Tạo bank_payments<br/>status=pending"]
        B3["IBankProvider.CreditAsync"]
        B4["POST /api/internal/v1/bank-callbacks<br/>kiểm HMAC, lưu bank_callbacks"]
        B5{"bank_payment còn pending?"}
        B6["[DB tx] bank_payments → succeeded/failed<br/>outbox BankPaymentSettled / Failed"]
        B7["Bỏ qua (callback trùng)"]
        B8["Sweeper: pending quá 5 phút<br/>GetStatusAsync, quá 30 phút → failed"]
    end
    subgraph BANK["🏦 Bank mock"]
        K1["Nhận lệnh<br/>outcome: Success | Fail | Timeout | DelayedCallback"]
        K2["Gửi callback sau CallbackDelay"]
    end

    A1 --> A2 --> T1 --> T2 --> T3 --> A3
    T3 -. event .-> B1 --> B2 --> B3 --> K1
    K1 -- "Success / Fail / Delayed" --> K2 --> B4 --> B5
    K1 -- Timeout --> B8 --> B6
    B5 -- có --> B6
    B5 -- không --> B7
    B6 -. event .-> T4 --> T5
    T5 -- thành công --> T6 --> A4
    T5 -- thất bại --> T7 --> A4
```

- Ngân hàng nhận lệnh nhưng lỗi kỹ thuật lúc gọi (`B3` throw): consumer retry theo chính sách messaging. Retry an toàn vì `provider_ref` được gắn idempotent theo `transaction_id`.
- Callback trùng, hoặc callback đến sau khi sweeper đã chốt kết quả: bị bỏ qua ở `B5` và vẫn được lưu lại để đối soát.

## 6. Top-up (UC-33)

```mermaid
flowchart TD
    subgraph APP["📱 Mobile app"]
        S(["Bắt đầu"]) --> A1["Chọn Linked Bank Account + số tiền<br/>quote → Confirm → PIN → Smart OTP"]
        A2["Result: Processing, poll"]
        A3(["Succeeded / Failed"])
    end
    subgraph TR["Transfer"]
        T1["Idempotency + Smart OTP"]
        T2{"Linked Bank Account thuộc User<br/>và status=linked?"}
        T3["BEGIN [DB tx], lock wallet<br/>kiểm Hạn mức Top-up (không kiểm số dư,<br/>Khoá Ví không chặn tiền vào)"]
        T4["Transaction → Processing<br/>(không có bút toán)<br/>outbox BankPaymentRequested direction=debitUserBank<br/>COMMIT → 202"]
        T5{"Kết quả từ BankLink?"}
        T6["[DB tx] journal topUpCredit<br/>Nợ bank_clearing A<br/>Có available A−F, Có fee_revenue F<br/>→ Succeeded"]
        T7["→ Failed (không có bút toán)"]
        TE["404 linkedBankAccountNotFound"]
    end
    subgraph BL["⚙️ Worker → BankLink + 🏦 Bank mock"]
        B1["bank_payments pending<br/>IBankProvider.DebitAsync(provider_link_token)"]
        B2["Callback / sweeper<br/>→ BankPaymentSettled / Failed"]
    end

    A1 --> T1 --> T2
    T2 -- không --> TE
    T2 -- có --> T3 --> T4 --> A2
    T4 -. event .-> B1 --> B2 -. event .-> T5
    T5 -- thành công --> T6 --> A3
    T5 -- thất bại --> T7 --> A3
```

## 7. Withdrawal (UC-34)

Giống Bank Transfer (§5). Chỉ khác ở các điểm sau:

```mermaid
flowchart TD
    S(["Bắt đầu"]) --> A1["Chọn Linked Bank Account của chính User<br/>+ số tiền"]
    A1 --> Q["POST /transfer-quotes type=withdrawal"]
    Q --> C1{"Linked Bank Account thuộc User<br/>và status=linked?"}
    C1 -- không --> E1(["404 linkedBankAccountNotFound"])
    C1 -- có --> C2["Như Bank Transfer:<br/>Smart OTP → lock → Khoá Ví → Hạn mức withdrawal → số dư"]
    C2 --> H["journal hold A+F → Processing → 202"]
    H --> P["BankLink: CreditAsync về TK liên kết<br/>(không cần tra cứu tên chủ TK)"]
    P --> R{"Kết quả"}
    R -- thành công --> OK(["settleOut → Succeeded"])
    R -- "thất bại / quá hạn" --> KO(["release → Failed"])
```

## 8. Config Version: maker–checker (UC-60..UC-63, UC-83)

Áp dụng cho cả Phí và Hạn mức.

```mermaid
flowchart TD
    subgraph MK["👤 Maker (Admin / Operations)"]
        S(["Bắt đầu"]) --> M1["Tạo version mới từ bản đang hiệu lực<br/>sửa rules, effective_from, note"]
        M2["Gửi duyệt"]
    end
    subgraph PR["Pricing"]
        P1{"Rules hợp lệ?<br/>band không chồng nhau, số ≥ 0,<br/>effective_from > now"}
        P2["[DB tx] version status=draft<br/>audit create"]
        P3["[DB tx] draft → pendingApproval<br/>khoá sửa<br/>audit submit"]
        P4{"checker ≠ maker?"}
        P5{"Quyết định"}
        P6{"effective_from vẫn > now?"}
        P7["[DB tx] → approved, checker_id<br/>audit approve (before/after)"]
        P8["[DB tx] → rejected + reject_reason<br/>audit reject"]
        PE1["400 validationFailed"]
        PE2["403 makerCannotApprove"]
        PE3["422 effectiveFromInPast<br/>(maker phải tạo version mới)"]
    end
    subgraph CK["👤 Checker (Admin / Control)"]
        C1["Xem diff với bản đang hiệu lực<br/>Duyệt / Từ chối"]
    end
    subgraph WK["⚙️ Worker: ConfigVersionStatusJob"]
        W1{"now ≥ effective_from<br/>của version approved?"}
        W2["[DB tx] approved → active<br/>bản active cũ → superseded<br/>outbox ConfigVersionActivated"]
        W3["Các process xoá IMemoryCache"]
    end

    M1 --> P1
    P1 -- không --> PE1
    P1 -- có --> P2 --> M2 --> P3 --> C1 --> P4
    P4 -- không --> PE2
    P4 -- có --> P5
    P5 -- duyệt --> P6
    P6 -- không --> PE3
    P6 -- có --> P7 --> W1
    P5 -- từ chối --> P8
    W1 -- chưa --> W1
    W1 -- rồi --> W2 --> W3
```

Phí và Hạn mức có hiệu lực **theo `effective_from`** ngay khi version ở trạng thái `approved` (D12). Job chỉ đồng bộ status để hiển thị và xoá cache. Nếu job chạy trễ thì lệnh chuyển tiền vẫn resolve đúng version.

## 9. Reversal (UC-54)

```mermaid
flowchart TD
    subgraph ST["👤 Staff (Admin / Operations)"]
        S(["Bắt đầu"]) --> S1["Mở chi tiết Transaction<br/>nhập lý do, xác nhận<br/>(Idempotency-Key)"]
        S2(["Hiển thị Transaction gốc: Reversed<br/>+ link sang Reversal"])
        SE(["Hiển thị lỗi"])
    end
    subgraph TR["Transfer"]
        T1{"Role được phép?"}
        T2{"Gốc status=succeeded<br/>và chưa bị đảo<br/>và không phải Reversal?"}
        T3["BEGIN [DB tx]<br/>lock các wallet liên quan"]
        T4{"Bên bị trừ đủ available?"}
        T5["Tạo Transaction Reversal<br/>reversal_of_id = gốc, cùng type,<br/>initiated_by_staff_id"]
        T6["Reversal → Succeeded<br/>gốc → Reversed, reversed_by_id<br/>audit reverse (lý do, before/after)<br/>outbox TransactionReversed<br/>COMMIT"]
        TE1["403 forbidden"]
        TE2["422 notReversible"]
        TE3["ROLLBACK<br/>422 insufficientBalanceForReversal"]
    end
    subgraph WL["Wallet"]
        L1["journal reversal:<br/>đảo Nợ ↔ Có của mọi journal<br/>đã post cho Transaction gốc"]
    end

    S1 --> T1
    T1 -- không --> TE1 --> SE
    T1 -- có --> T2
    T2 -- không --> TE2 --> SE
    T2 -- có --> T3 --> T4
    T4 -- không --> TE3 --> SE
    T4 -- có --> T5 --> L1 --> T6 --> S2
```

- Với Bank Transfer hoặc Withdrawal đã `Succeeded`, Reversal chỉ ghi ngược trên Sổ cái (`bank_clearing` → `wallet:available`). Việc đòi tiền thật từ ngân hàng nằm ngoài hệ thống và ngoài MVP.
- Reversal không cần Smart OTP, vì người thao tác là Staff. Thay vào đó cần role, lý do bắt buộc và audit.

## 10. Khoá / mở khoá Ví (UC-56)

```mermaid
flowchart TD
    subgraph ST["👤 Staff"]
        S(["Bắt đầu"]) --> S1["Mở chi tiết Ví<br/>(GET ghi audit 'view')"]
        S2["Chọn Khoá hoặc Mở khoá + nhập lý do"]
        S3(["Hiển thị trạng thái mới"])
        SE(["Hiển thị lỗi"])
    end
    subgraph WL["Wallet"]
        W1{"Trạng thái hiện tại phù hợp?"}
        W2["[DB tx] lock wallet row<br/>status = locked | active<br/>wallet_lock_events<br/>audit lock/unlock (before/after, lý do)<br/>outbox WalletLocked / WalletUnlocked"]
        WE["409 alreadyLocked / notLocked"]
    end
    subgraph EF["Ảnh hưởng"]
        E1["Lệnh tiếp theo làm giảm số dư<br/>(P2P gửi, Bank Transfer, Withdrawal)<br/>→ 422 walletLocked"]
        E2["Không bị chặn: nhận P2P, Top-up,<br/>settle/release Transaction đang Processing,<br/>Reversal do Staff thực hiện"]
    end

    S1 --> S2 --> W1
    W1 -- không --> WE --> SE
    W1 -- có --> W2 --> S3
    W2 -.-> E1
    W2 -.-> E2
```

## 11. Refresh token rotation (UC-04)

```mermaid
flowchart TD
    subgraph CL["📱 / 🖥️ Client"]
        S(["Access token hết hạn (401)"]) --> C1["POST /auth/refresh<br/>{refreshToken}"]
        C2(["Lưu cặp token mới, gọi lại request"])
        C3(["Xoá phiên → màn đăng nhập"])
    end
    subgraph ID["Identity"]
        I1["Tra token_hash"]
        I2{"Tồn tại và audience khớp?"}
        I3{"Đã bị thay (replaced_by_id)<br/>hoặc đã revoke?"}
        I4{"Hết hạn?"}
        I5{"User: device_id còn bound?"}
        I6["[DB tx] Tạo token mới cùng family_id<br/>token cũ: replaced_by_id, revoked_at,<br/>reason=rotated"]
        I7["[DB tx] REUSE: revoke toàn bộ family<br/>reason=reuseDetected<br/>Redis: đánh dấu family bị thu hồi<br/>audit tokenReuse"]
        IE1["401 invalidToken"]
        IE2["401 tokenReuseDetected"]
        IE3["401 deviceRevoked"]
    end

    C1 --> I1 --> I2
    I2 -- không --> IE1 --> C3
    I2 -- có --> I3
    I3 -- có --> I7 --> IE2 --> C3
    I3 -- không --> I4
    I4 -- có --> IE1
    I4 -- không --> I5
    I5 -- không --> IE3 --> C3
    I5 -- có --> I6 --> C2
```

Hai request refresh song song với cùng một token (thường gặp khi app mở nhiều tab hoặc retry): cho phép một khoảng ân hạn 10 giây. Trong khoảng này, request thứ hai nhận lại đúng cặp token vừa cấp thay vì bị coi là reuse.
