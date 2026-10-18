# Tài liệu thiết kế Backend — FFM

Tài liệu thiết kế hệ thống backend (ASP.NET Core modular monolith), suy ra từ code FE hiện có (`apps/*/src/domain/types.ts`, `apps/*/src/mocks/server.ts`, danh sách màn hình trong `apps/*/CLAUDE.md`), `GLOSSARY.md` và các ADR trong `docs/adr/`.

Thuật ngữ theo `GLOSSARY.md`. Giải thích viết tiếng Việt, định danh (bảng, cột, class, endpoint) viết tiếng Anh. Sơ đồ dùng Mermaid, xem được trên GitHub và VS Code (Markdown Preview Mermaid Support).

| File | Nội dung |
|---|---|
| [architecture.md](architecture.md) | Kiến trúc tổng thể, cấu trúc solution, module, pattern (DI, Result, handler, options, cache), messaging, bảo mật, testing |
| [erd.md](erd.md) | ERD theo từng schema PostgreSQL, mô hình tài khoản Sổ cái, các bút toán chuẩn |
| [use-cases.md](use-cases.md) | Actor, sơ đồ use-case cho User / Staff / hệ thống, ma trận quyền Staff |
| [activities.md](activities.md) | 11 sơ đồ activity cho các luồng nghiệp vụ chính |
| [api.md](api.md) | Quy ước API, danh sách endpoint mobile/admin, mã lỗi, service/contract/event của từng module |

## Quyết định thiết kế chính

Các quyết định đã chốt khi lập tài liệu. Những cái khó đảo ngược nên được nâng thành ADR khi bắt đầu code.

| # | Quyết định |
|---|---|
| D1 | Mỗi module gồm 2 project: `FFM.Modules.<X>` (internal) và `FFM.Modules.<X>.Contracts` (public). |
| D2 | Endpoint dùng Minimal API, chia `MapGroup` theo audience `mobile` / `admin`. |
| D3 | Tầng Application dùng một handler cho mỗi use case, interface tự viết. **Không dùng MediatR** vì license thương mại từ v13, cùng lý do với ADR-0003. |
| D4 | Lỗi nghiệp vụ trả `Result<T>`, endpoint map sang ProblemDetails có field `code`. Exception chỉ dành cho lỗi bất ngờ. |
| D5 | Module **Transfer** sở hữu `Transaction` và lifecycle của nó. Module **Wallet** sở hữu Sổ cái và chỉ post bút toán khi được gọi qua contract. |
| D6 | Mỗi Wallet có 2 tài khoản Sổ cái: `available` và `held`. Tạm giữ tiền cũng là bút toán. |
| D7 | Idempotency key lưu trong bảng Postgres `transfer.idempotency_keys`, ghi cùng DB transaction với lệnh. |
| D8 | Chuyển tiền là một request duy nhất, gồm header `Idempotency-Key` và `X-Smart-Otp`. Sai OTP thì không tạo Transaction. |
| D9 | PFM sở hữu việc gán Category cho Transaction (`pfm.transaction_categories`). |
| D10 | Màn Statement lấy dữ liệu từ `GET /activities` do PFM cung cấp, phân trang bằng cursor. Bên admin phân trang offset. |
| D11 | Dashboard admin đọc bảng thống kê riêng (`admin.*`), cập nhật qua integration event. |
| D12 | Phí và Hạn mức luôn resolve theo `effective_from`. Job trong Worker chỉ cập nhật status để hiển thị. |
| D13 | Redis chỉ dùng cho rate-limit, thu hồi token và chống dùng lại OTP. Không cache số dư, không đếm hạn mức trên Redis. |
| D14 | Transaction PIN chỉ nằm trên thiết bị. Server chỉ kiểm Smart OTP (TOTP) với Bound Device. |
| D15 | Mock provider (Bank, SMS) là keyed service, chọn qua `IOptions`, giả lập được Success / Fail / Timeout / DelayedCallback. |
| D16 | KYC chỉ có cột `kyc_level` (1 hoặc 2). Luồng nâng cấp KYC nằm ngoài MVP. |
| D17 | Staff được seed sẵn, đăng nhập bằng mật khẩu và TOTP 2FA bắt buộc. Không có API quản lý Staff trong MVP. |
| D18 | Package mới được duyệt: FluentValidation, NSubstitute, NetArchTest. |
