# 0003 — RabbitMQ + Transactional Outbox tự viết (RabbitMQ.Client)

**Trạng thái:** Accepted — 2026-10-15

## Bối cảnh
Nạp tiền, rút tiền và chuyển ra ngân hàng phải gọi provider bên ngoài và có trạng thái chờ. Nếu ghi DB rồi mới publish message, một lần publish lỗi sẽ để Giao dịch treo vĩnh viễn (dual-write). MassTransit từ v9 chuyển sang license thương mại; Wolverine là framework lớn.

## Quyết định
- Dùng RabbitMQ làm message broker ngay từ đầu.
- Dùng Transactional Outbox: event được ghi vào bảng outbox trong cùng DB transaction với thay đổi nghiệp vụ, sau đó background worker mới publish lên RabbitMQ.
- Tự viết outbox/publisher/consumer trên `RabbitMQ.Client`, không dùng MassTransit hay Wolverine.
- Mọi consumer phải idempotent (bảng inbox / processed-message theo message id).

## Hệ quả
- Phải tự xây và bảo trì phần retry, dead-letter và theo dõi outbox.
- Không phụ thuộc vào license của bên thứ ba, và team hiểu rõ cơ chế bên dưới.
