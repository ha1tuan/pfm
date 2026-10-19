# Use-case

Mermaid không có kiểu sơ đồ use-case riêng, nên ở đây dùng `flowchart`. Actor là node hình chữ nhật có biểu tượng 👤 hoặc ⚙️, use-case là node hình bầu dục, `subgraph` đóng vai ranh giới hệ thống (system boundary). Mã `UC-xx` được dùng lại trong [activities.md](activities.md) và [api.md](api.md).

## 1. Actor

| Actor | Loại | Mô tả |
|---|---|---|
| User | Chính | Người dùng mobile, sở hữu một Wallet |
| Staff — Admin | Chính | Toàn quyền console, kể cả duyệt cấu hình |
| Staff — Operations | Chính | Vận hành: tra cứu, Reversal, Khoá Ví, tạo Config Version (maker) |
| Staff — Control/CS | Chính | Kiểm soát/CSKH: tra cứu, Khoá Ví khi có báo gian lận, duyệt Config Version (checker), xem Audit Log |
| Bank Provider (mock) | Phụ | Xác nhận liên kết bằng OTP ngân hàng, trích nợ hoặc ghi có, gửi callback |
| SMS Provider (mock) | Phụ | Gửi SMS OTP |
| Worker (System) | Phụ | Publish outbox, consume event, chạy job định kỳ |

## 2. User (mobile)

```mermaid
flowchart LR
    U["👤 User"]
    BANK["🏦 Bank Provider<br/>(mock)"]
    SMS["✉️ SMS Provider<br/>(mock)"]

    subgraph FFM["FFM — Mobile API"]
        direction TB
        subgraph ID["Identity"]
            UC01(["UC-01 Đăng ký"])
            UC02(["UC-02 Đăng nhập"])
            UC03(["UC-03 Kích hoạt thiết bị (Bound Device)"])
            UC04(["UC-04 Làm mới phiên (refresh token)"])
            UC05(["UC-05 Đăng xuất"])
        end
        subgraph WL["Wallet"]
            UC10(["UC-10 Xem số dư Ví"])
            UC11(["UC-11 Xem hạn mức còn lại"])
        end
        subgraph BL["Linked Bank Account"]
            UC20(["UC-20 Liên kết tài khoản ngân hàng"])
            UC21(["UC-21 Huỷ liên kết"])
            UC22(["UC-22 Đặt tài khoản mặc định"])
        end
        subgraph TR["Money movement"]
            UC30(["UC-30 Báo giá phí (quote)"])
            UC31(["UC-31 Chuyển nội bộ (P2P)"])
            UC32(["UC-32 Chuyển ra ngân hàng"])
            UC33(["UC-33 Nạp tiền (Top-up)"])
            UC34(["UC-34 Rút tiền (Withdrawal)"])
            UC35(["UC-35 Xác thực Smart OTP"])
            UC36(["UC-36 Tra cứu người nhận"])
            UC37(["UC-37 Xem chi tiết Giao dịch"])
        end
        subgraph PF["Personal finance"]
            UC40(["UC-40 Xem Statement (activities)"])
            UC41(["UC-41 Đổi Category"])
            UC42(["UC-42 Quản lý Manual Entry"])
            UC43(["UC-43 Quản lý Budget"])
            UC44(["UC-44 Quản lý Goal"])
        end
    end

    U --- UC01 & UC02 & UC03 & UC04 & UC05
    U --- UC10 & UC11
    U --- UC20 & UC21 & UC22
    U --- UC30 & UC31 & UC32 & UC33 & UC34 & UC37
    U --- UC40 & UC41 & UC42 & UC43 & UC44

    UC01 -.->|include| UC03
    UC31 -.->|include| UC35
    UC32 -.->|include| UC35
    UC33 -.->|include| UC35
    UC34 -.->|include| UC35
    UC21 -.->|include| UC35
    UC31 -.->|include| UC36
    UC32 -.->|include| UC36
    UC02 -.->|"extend: thiết bị chưa bound"| UC03

    UC01 --- SMS
    UC03 --- SMS
    UC20 --- BANK
    UC32 --- BANK
    UC33 --- BANK
    UC34 --- BANK
```

## 3. Staff (admin console) và hệ thống

```mermaid
flowchart LR
    SA["👤 Admin"]
    SO["👤 Operations"]
    SC["👤 Control/CS"]
    W["⚙️ Worker"]
    BANK["🏦 Bank Provider<br/>(mock)"]

    subgraph FFM["FFM — Admin API + Worker"]
        direction TB
        subgraph AU["Auth"]
            UC50(["UC-50 Đăng nhập Staff + TOTP 2FA"])
        end
        subgraph OPS["Tra cứu và vận hành"]
            UC51(["UC-51 Xem Dashboard"])
            UC52(["UC-52 Tra cứu Giao dịch"])
            UC53(["UC-53 Xem chi tiết Giao dịch + bút toán"])
            UC54(["UC-54 Đảo giao dịch (Reversal)"])
            UC55(["UC-55 Tra cứu Ví / xem chi tiết Ví"])
            UC56(["UC-56 Khoá / mở khoá Ví"])
        end
        subgraph CFG["Cấu hình Phí và Hạn mức"]
            UC60(["UC-60 Tạo Config Version (maker)"])
            UC61(["UC-61 Gửi duyệt"])
            UC62(["UC-62 Duyệt / từ chối (checker)"])
            UC63(["UC-63 Xem version hiệu lực, chờ duyệt, lịch sử"])
        end
        subgraph AUD["Audit"]
            UC70(["UC-70 Xem Audit Log"])
        end
        subgraph SYS["Hệ thống"]
            UC80(["UC-80 Publish outbox"])
            UC81(["UC-81 Xử lý callback ngân hàng"])
            UC82(["UC-82 Quét lệnh ngân hàng quá hạn"])
            UC83(["UC-83 Kích hoạt Config Version đến hạn"])
            UC84(["UC-84 Cập nhật thống kê Dashboard"])
            UC85(["UC-85 Gán Category mặc định"])
            UC86(["UC-86 Kiểm tra toàn vẹn Sổ cái"])
        end
    end

    SA --- UC50 & UC51 & UC52 & UC53 & UC54 & UC55 & UC56 & UC60 & UC61 & UC62 & UC63 & UC70
    SO --- UC50 & UC51 & UC52 & UC53 & UC54 & UC55 & UC56 & UC60 & UC61 & UC63
    SC --- UC50 & UC51 & UC52 & UC53 & UC55 & UC56 & UC62 & UC63 & UC70

    UC60 -.->|include| UC61
    UC55 -.->|"include: ghi Audit 'view'"| UC70

    W --- UC80 & UC82 & UC83 & UC84 & UC85 & UC86
    BANK --- UC81
    UC82 --- BANK
```

## 4. Ma trận quyền Staff

Server kiểm quyền ở mọi endpoint. FE chỉ ẩn nút cho đỡ rối, đó là UX chứ không phải bảo mật.

| Use-case | Admin | Operations | Control/CS |
|---|:-:|:-:|:-:|
| UC-51 Dashboard | ✅ | ✅ | ✅ |
| UC-52/53 Tra cứu Giao dịch | ✅ | ✅ | ✅ |
| UC-54 Reversal | ✅ | ✅ | — |
| UC-55 Xem Ví (có ghi Audit) | ✅ | ✅ | ✅ |
| UC-56 Khoá / mở khoá Ví | ✅ | ✅ | ✅ |
| UC-60/61 Tạo và gửi duyệt Config Version | ✅ | ✅ | — |
| UC-62 Duyệt / từ chối Config Version | ✅ (không phải maker) | — | ✅ (không phải maker) |
| UC-63 Xem cấu hình | ✅ | ✅ | ✅ |
| UC-70 Audit Log | ✅ | — | ✅ |

Quy tắc bổ sung:

- Ở UC-62, người duyệt phải khác maker. Kiểm ở handler và bằng `CHECK` trong DB.
- Ở UC-54, một Transaction chỉ được đảo một lần. Không đảo được chính một Reversal. Lý do (`reason`) là bắt buộc.

## 5. Đặc tả tóm tắt

| UC | Tiền điều kiện | Kết quả chính | Ngoại lệ chính |
|---|---|---|---|
| UC-01 Đăng ký | SĐT chưa tồn tại | User + Bound Device + Wallet (async qua `UserRegistered`), trả token (Smart OTP đăng ký sau, ADR-0006) | `phoneAlreadyRegistered`, `invalidSmsOtp`, `smsOtpExpired`, `tooManyAttempts` |
| UC-02 Đăng nhập | User active | Token nếu `device_id` là thiết bị đang bound | `wrongPassword`, `deviceNotBound` (chuyển sang UC-03), `tooManyAttempts` |
| UC-03 Kích hoạt thiết bị | Đúng mật khẩu + SMS OTP | Thiết bị mới active, thiết bị cũ bị thu hồi, `DeviceRevoked` | `invalidSmsOtp` |
| UC-04 Refresh | Token hợp lệ | Cặp token mới, token cũ bị thay | `tokenReuseDetected` (thu hồi cả family) |
| UC-20 Liên kết ngân hàng | Thiết bị bound | Linked Bank Account `linked` | `invalidBankOtp`, `accountAlreadyLinked`, `holderNameMismatch` |
| UC-31 P2P | Wallet active, đủ số dư, trong hạn mức | Transaction `Succeeded` ngay | `overBalance`, `overLimit`, `walletLocked`, `recipientNotFound`, `selfTransfer`, `invalidOtp` |
| UC-32/34 Bank Transfer / Withdrawal | Như trên | Transaction `Processing`, sau đó `Succeeded` hoặc `Failed` theo callback | như trên, cộng `bankUnavailable` |
| UC-33 Top-up | Có Linked Bank Account | Transaction `Processing`, sau đó `Succeeded` hoặc `Failed` | `overLimit`, `invalidOtp` |
| UC-54 Reversal | Transaction `Succeeded`, chưa bị đảo | Transaction Reversal `Succeeded`, gốc chuyển `Reversed` | `notReversible`, `insufficientBalanceForReversal` |
| UC-56 Khoá Ví | — | Wallet `locked`, mọi Transaction làm giảm số dư bị chặn | `alreadyLocked` |
| UC-62 Duyệt | Version `pendingApproval`, checker ≠ maker | `approved`, có hiệu lực từ `effective_from` | `makerCannotApprove`, `effectiveFromInPast` |

Khoá Ví **không** chặn tiền vào (nhận P2P, Top-up đang xử lý) và không chặn việc settle hay release của các Transaction đang `Processing`.
