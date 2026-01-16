# Hệ thống Quản lý Trạm Y Tế - PNT Health Station Manager

**Sáng kiến cải tiến năm 2026 của Trạm Y tế - Phòng khám đa khoa Trường Đại học Y khoa Phạm Ngọc Thạch**

Hệ thống ứng dụng web giúp quản lý quy trình cấp phát thuốc, vật tư y tế, theo dõi tồn kho và báo cáo thống kê một cách tự động, minh bạch và hiệu quả.

---

## 🚀 Tính năng Chính

1.  **Dành cho Cán bộ - Nhân viên - Giảng viên (Người dùng)**:
    -   Đăng nhập bằng Gmail trường (`@pnt.edu.vn`).
    -   Gửi yêu cầu cấp phát thuốc trực tuyến.
    -   Xem lịch sử yêu cầu và trạng thái xử lý.
    -   Cập nhật hồ sơ cá nhân (Đơn vị, Số điện thoại).
    -   Nhận thông báo (Push Notification) khi yêu cầu được duyệt/từ chối.

2.  **Dành cho Nhân viên Y tế (Staff/Admin)**:
    -   **Quản lý Yêu cầu**: Duyệt/Từ chối yêu cầu, chỉ định thuốc và số lượng cấp phát.
    -   **Quản lý Kho**: Theo dõi tồn kho thực tế tại 2 cơ sở (Tân Nhựt, Hòa Hưng).
        -   Cập nhật kho an toàn (chặn giảm số lượng vô ý).
        -   **Điều chuyển kho**: Công cụ kéo thả để chuyển thuốc giữa các cơ sở.
    -   **Báo cáo**:
        -   Xem bảng kê chi tiết thuốc đã cấp.
        -   Lọc nhanh theo Tên thuốc, Người nhận, Kho, Thời gian.
        -   Xuất báo cáo Excel hàng tháng.

---

## 🛠️ Yêu cầu Hệ thống

-   **Node.js**: Phiên bản 18 trở lên.
-   **Google Cloud Platform**: Để sử dụng Google Sheets API.
-   **Vercel** (Khuyên dùng): Để triển khai ứng dụng.

---

## ⚙️ Cài đặt & Cấu hình

### 1. Chuẩn bị Google Sheets (Cơ sở dữ liệu)

Hệ thống sử dụng Google Sheets làm nơi lưu trữ dữ liệu. Bạn cần tạo một file Google Sheet mới và chia sẻ quyền **Editor** cho `Service Account Email` (xem bước 2).

Cấu trúc các Sheet (Tab) bắt buộc:

1.  **`Users`**: Lưu thông tin người dùng.
    -   Cột A: Email
    -   Cột B: Name
    -   Cột C: Role (`EMPLOYEE`, `STAFF`, `ADMIN`)
    -   Cột D: Phone
    -   Cột E: Unit

2.  **`Medications`**: Danh mục thuốc và tồn kho.
    -   Cột A: ID
    -   Cột B: Name (Tên thuốc)
    -   Cột C: Unit (Đơn vị tính)
    -   Cột D: StockTanNhut (Số lượng tại Tân Nhựt)
    -   Cột E: StockHoaHung (Số lượng tại Hòa Hưng)
    -   Cột F: MinThreshold (Ngưỡng báo động)

3.  **`Requests`**: Danh sách yêu cầu.
    -   Cột A: RequestID
    -   Cột B: UserEmail
    -   Cột C: CreatedAt
    -   Cột D: Status (`PENDING`, `APPROVED`, `REJECTED`)
    -   Cột E: Reason (Lý do/Triệu chứng)
    -   Cột F: StaffNote (Ghi chú của Y tế)
    -   Cột G: DispensedAt
    -   Cột H: DispensedBy

4.  **`RequestItems`**: Chi tiết thuốc trong mỗi yêu cầu.
    -   Cột A: RequestID
    -   Cột B: MedicationID
    -   Cột C: Quantity
    -   Cột D: Area (`TAN_NHUT` hoặc `HOA_HUNG`)

5.  **`PushSubscriptions`**: Lưu thông tin đăng ký nhận thông báo.
    -   Cột A: Email
    -   Cột B: SubscriptionJSON

6.  **`Logs`**: Nhật ký hoạt động hệ thống.
    -   Cột A: Timestamp
    -   Cột B: Email
    -   Cột C: Action
    -   Cột D: Details

### 2. Cấu hình Môi trường (.env)

Tạo file `.env.local` (local) hoặc thêm vào Environment Variables trên Vercel:

```env
# URL của trang web (Local: http://localhost:3000, Web: https://your-domain.vercel.app)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string

# Google OAuth (Để đăng nhập @pnt.edu.vn)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Sheets API (Service Account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SHEET_ID=your_google_spreadsheet_id

# Web Push Notifications (Tạo bằng web-push library)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 3. Cài đặt và Chạy Local

```bash
# Cài đặt thư viện
npm install

# Chạy server development
npm run dev
```

Truy cập `http://localhost:3000` để kiểm tra.

### 4. Triển khai lên Vercel

1.  Push code lên GitHub.
2.  Tạo Project mới trên Vercel, Import từ GitHub repo.
3.  Vào **Settings > Environment Variables**, nhập toàn bộ các biến môi trường ở bước 2.
4.  Deploy!

---

## 📝 Bản quyền & Liên hệ

**Copyright © 2026 TRINH TRUNG TIEN**
-   **Tác giả**: BS. Trịnh Trung Tiến
-   **Email**: bstien@pnt.edu.vn

Mọi thắc mắc kỹ thuật hoặc góp ý cải tiến, vui lòng liên hệ trực tiếp qua email hoặc Phòng khám Đa khoa Trường ĐH Y khoa Phạm Ngọc Thạch.
