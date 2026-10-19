# ADR-0006: Smart OTP được cấp khi cần, không cấp lúc kích hoạt thiết bị

- Trạng thái: Đã chấp nhận (2026-10-19)

## Bối cảnh

Thiết kế ban đầu cấp TOTP secret ngay khi kích hoạt thiết bị (đăng ký UC-01 và kích hoạt thiết bị mới UC-03), đồng thời bắt User đặt Transaction PIN để mã hoá secret và mở app. Như vậy, User nào cũng phải đặt PIN và giữ secret, kể cả khi chỉ dùng tính năng tài chính cá nhân và chưa bao giờ chuyển tiền.

## Quyết định

Kích hoạt thiết bị (Bound Device) chỉ phục vụ đăng nhập: server không cấp TOTP secret, app không bắt đặt PIN. Lần đầu User chạy một lệnh cần Smart OTP (P2P, Chuyển ra ngân hàng, Rút tiền, Nạp tiền, Huỷ liên kết ngân hàng), app mới chạy bước **Đăng ký Smart OTP**: User đặt PIN, server cấp secret gắn với Bound Device hiện tại. PIN chỉ dùng để mở khoá Smart OTP, không dùng để mở app.

Đăng ký Smart OTP cần access token hợp lệ của Bound Device và PIN do User đặt. Server lưu PIN dạng băm, thay cho D14 cũ ("PIN chỉ nằm trên thiết bị"). Phương án nhập lại Mật khẩu đăng nhập hoặc SMS OTP ở bước này đã được cân nhắc và không chọn. Chấp nhận rủi ro: ở lần đăng ký đầu tiên, PIN chưa tồn tại nên chưa chứng minh được gì, và người chỉ có access token vẫn đăng ký được Smart OTP.

## Hệ quả

- `POST /auth/register` và `POST /auth/device-binding` không còn trả `totpSecret`. Bước Đăng ký Smart OTP có endpoint riêng và được làm cùng UC-31.
- Kích hoạt thiết bị mới thì thu hồi thiết bị cũ cùng Smart OTP của nó. Thiết bị mới phải Đăng ký Smart OTP lại.
- Cách server dùng PIN băm khi kiểm lệnh tiền và chính sách khoá sau nhiều lần sai PIN sẽ được chốt trong PRD P2P (UC-31).
- Bound Device có thêm trạng thái "đã kích hoạt nhưng chưa Đăng ký Smart OTP". Mọi lệnh cần Smart OTP phải từ chối khi thiết bị đang ở trạng thái này.
