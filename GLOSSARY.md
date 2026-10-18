# Glossary — FFM

## Người dùng & tài sản

**Người dùng (User)**
Người dùng cuối của ứng dụng mobile, sở hữu đúng một Ví.

**Ví (Wallet)**
Số dư VND do hệ thống giữ hộ một Người dùng. Mỗi Người dùng có đúng một Ví.
_Tránh_: "tài khoản" (dễ nhầm với Tài khoản ngân hàng liên kết hoặc tài khoản đăng nhập).

**Tài khoản ngân hàng liên kết (Linked Bank Account)**
Tài khoản tại một ngân hàng bên ngoài mà Người dùng đã liên kết, dùng làm nguồn nạp hoặc đích rút tiền. Hệ thống không giữ số dư của nó.

**Số dư khả dụng (Available Balance)**
Phần số dư Ví mà Người dùng được dùng ngay.

**Số dư tạm giữ (Held Balance)**
Phần số dư Ví đang bị giữ cho các Giao dịch đang xử lý. Số dư Ví = khả dụng + tạm giữ.

**Khoá Ví (Wallet Lock)**
Trạng thái do Nhân viên đặt, chặn mọi Giao dịch làm giảm số dư Ví.

## Tiền & ghi sổ

**Sổ cái (Ledger)**
Nơi ghi nhận theo nguyên tắc kế toán kép mọi biến động tiền. Chỉ ghi thêm, không sửa, không xoá. Số dư Ví được suy ra từ Sổ cái.

**Bút toán (Ledger Entry)**
Một dòng Nợ hoặc Có trên Sổ cái. Các Bút toán của cùng một Giao dịch phải cân nhau.

**Giao dịch (Transaction)**
Một lần biến động tiền thật làm thay đổi Sổ cái (nạp, rút, chuyển...).
_Tránh_: dùng "giao dịch" cho các khoản Người dùng tự ghi tay.

**Nạp tiền (Top-up)**
Giao dịch chuyển tiền từ Tài khoản ngân hàng liên kết vào Ví.

**Rút tiền (Withdrawal)**
Giao dịch chuyển tiền từ Ví về Tài khoản ngân hàng liên kết của chính Người dùng.

**Chuyển nội bộ (P2P Transfer)**
Giao dịch chuyển tiền từ Ví này sang Ví của Người dùng khác, người nhận được xác định qua số điện thoại.

**Chuyển ra ngân hàng (Bank Transfer)**
Giao dịch chuyển tiền từ Ví sang một tài khoản ngân hàng bất kỳ, kể cả tài khoản không phải của Người dùng.

**Đảo giao dịch (Reversal)**
Giao dịch mới ghi ngược các Bút toán của một Giao dịch đã Thành công, dùng để sửa sai. Giao dịch gốc không bị sửa.
_Tránh_: "hoàn tiền", "huỷ giao dịch".

**Phí (Fee)**
Khoản tiền hệ thống thu trên một Giao dịch, xác định theo loại Giao dịch.

**Hạn mức (Limit)**
Mức trần Người dùng được giao dịch, phụ thuộc Cấp KYC và loại Giao dịch. Gồm hạn mức số tiền (mỗi giao dịch / ngày / tháng) và hạn mức số lượng (số Giao dịch tối đa mỗi ngày).

**Phiên bản cấu hình (Config Version)**
Một bản cấu hình Phí hoặc Hạn mức, có thời điểm bắt đầu hiệu lực. Muốn thay đổi thì tạo phiên bản mới, không sửa phiên bản cũ.
Vòng đời: Nháp → Chờ duyệt → Đã duyệt → Có hiệu lực → Hết hiệu lực (khi một phiên bản mới hơn bắt đầu có hiệu lực). Nếu không được duyệt thì chuyển sang Bị từ chối.

**Duyệt hai người (Maker–Checker)**
Quy tắc: Phiên bản cấu hình do một Nhân viên tạo (maker) phải được một Nhân viên khác duyệt (checker) thì mới có hiệu lực.

**Cấp KYC (KYC Level)**
Mức độ xác minh danh tính của Người dùng, quyết định Hạn mức nào được áp dụng.

## Tài chính cá nhân

**Ghi chép thủ công (Manual Entry)**
Khoản thu/chi Người dùng tự ghi tay, ví dụ chi tiền mặt. Không phải Giao dịch và không đi vào Sổ cái.

**Danh mục (Category)**
Nhãn phân loại thu/chi, gán được cho cả Giao dịch lẫn Ghi chép thủ công.

**Ngân sách (Budget)**
Mức chi tối đa mà Người dùng đặt ra cho một Danh mục trong một kỳ.

**Mục tiêu (Goal)**
Số tiền Người dùng muốn tích luỹ. Chỉ dùng để theo dõi, không khoá tiền trong Ví.

## Bảo mật

**Smart OTP**
Mã xác thực giao dịch sinh ngay trên thiết bị đã kích hoạt của Người dùng.

**Thiết bị kích hoạt (Bound Device)**
Thiết bị duy nhất của Người dùng được phép tạo Smart OTP. Kích hoạt thiết bị mới thì thiết bị cũ bị thu hồi.

**PIN giao dịch (Transaction PIN)**
Mã 6 số dùng để mở app và mở khoá Smart OTP. Khác với mật khẩu đăng nhập.

**Nhật ký kiểm toán (Audit Log)**
Bản ghi chỉ ghi thêm (append-only) về các thao tác của Nhân viên và các sự kiện bảo mật của Người dùng. Không dùng để ghi nhận biến động tiền.

## Nhân sự vận hành

**Nhân viên (Staff)**
Người dùng Admin console, có Vai trò. Không phải Người dùng.

**Vai trò (Role)**
Nhóm quyền của Nhân viên: Admin, Vận hành, Kiểm soát/CSKH.
