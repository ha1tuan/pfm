# 0001 — Số dư Ví được suy ra từ Sổ cái kế toán kép

**Trạng thái:** Accepted — 2026-10-15

## Bối cảnh
Ứng dụng xử lý tiền (nạp, rút, chuyển, phí). Cách đơn giản nhất là lưu cột `balance` rồi cộng trừ trực tiếp, nhưng cách này không truy vết được, dễ lệch số khi lỗi giữa chừng và không đối soát được với ngân hàng.

## Quyết định
- Mọi biến động tiền là một Giao dịch, sinh ra các Bút toán Nợ/Có cân nhau trên Sổ cái.
- Sổ cái chỉ được ghi thêm (append-only). Muốn sửa sai thì ghi Giao dịch đảo (reversal).
- Có các tài khoản hệ thống: doanh thu phí, tiền đang chờ xử lý với ngân hàng, ...
- Số dư Ví = tổng Bút toán; được phép giữ snapshot số dư để đọc nhanh, nhưng cập nhật cùng transaction DB với Bút toán.
- Mọi lệnh tạo Giao dịch bắt buộc có idempotency key.
- Tiền lưu dạng số nguyên VND (không dùng float/decimal lẻ).

## Hệ quả
- Phức tạp hơn khi code, nhưng đối soát và audit được, và không bao giờ "mất tiền" trong im lặng.
- Báo cáo và Admin console phải đọc từ Sổ cái hoặc từ snapshot, không có nguồn số dư nào khác.
