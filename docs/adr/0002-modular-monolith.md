# 0002 — Backend là modular monolith, mỗi module một PostgreSQL schema

**Trạng thái:** Accepted — 2026-10-15

## Bối cảnh
Hệ thống có nhiều miền nghiệp vụ rõ ràng: Identity, Wallet/Ledger, Transfer, BankLink, Pricing, PFM, Audit, Admin. Tách thành microservices ngay từ đầu sẽ đội chi phí vận hành (deploy, distributed transaction, observability) quá sớm với một team nhỏ.

## Quyết định
- Một ASP.NET Core API và một Worker process, chia module theo miền nghiệp vụ.
- Mỗi module sở hữu một PostgreSQL schema riêng. Module này không đọc/ghi bảng của module khác.
- Module giao tiếp với nhau qua interface công khai (gọi trong process) hoặc qua integration event (RabbitMQ, xem ADR-0003).

## Hệ quả
- Sau này có thể tách một module ra thành service riêng mà không phải gỡ rối dữ liệu dùng chung.
- Không có JOIN xuyên module. Báo cáo cần dữ liệu từ nhiều module thì đi qua read model hoặc truy vấn Dapper đã được cho phép rõ ràng.
