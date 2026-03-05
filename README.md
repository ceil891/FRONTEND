# Hệ Thống Quản Lý Chuỗi Cửa Hàng Bán Lẻ Tích Hợp AI-Agent

## Giới Thiệu

Hệ thống quản lý chuỗi cửa hàng bán lẻ với tích hợp AI-Agent để phân tích dữ liệu, dự đoán nhu cầu và hỗ trợ ra quyết định kinh doanh.

## Công Nghệ Sử Dụng

- **Frontend Framework**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Zustand
- **Routing**: React Router v6
- **Charts**: Recharts
- **Build Tool**: Vite

## Cài Đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

## Cấu Trúc Project

```
frontend/
├── src/
│   ├── components/          # Các component tái sử dụng
│   │   └── Layout/         # Layout components
│   ├── pages/              # Các trang chính
│   │   ├── Login/         # Trang đăng nhập
│   │   ├── Dashboard/     # Dashboard chính
│   │   ├── POS/           # Giao diện bán hàng
│   │   ├── Inventory/     # Quản lý kho
│   │   ├── Products/      # Quản lý sản phẩm
│   │   ├── Reports/       # Báo cáo & thống kê
│   │   ├── AIDashboard/   # Dashboard AI-Agent
│   │   ├── Stores/        # Quản lý cửa hàng (Admin)
│   │   └── Users/         # Quản lý người dùng (Admin)
│   ├── store/             # State management (Zustand)
│   ├── types/             # TypeScript types & entities
│   ├── theme/             # MUI theme configuration
│   └── App.tsx            # Main app component
```

## Entities (Database Schema)

Các entity chính đã được định nghĩa trong `src/types/entities.ts`:

- **Store**: Cửa hàng/Chi nhánh
- **User**: Người dùng hệ thống
- **Product**: Sản phẩm
- **Category**: Danh mục sản phẩm
- **Inventory**: Tồn kho theo cửa hàng
- **InventoryTransaction**: Giao dịch kho
- **Order**: Đơn hàng/Hóa đơn
- **OrderDetail**: Chi tiết đơn hàng
- **Promotion**: Khuyến mãi
- **AIRecommendation**: Đề xuất từ AI-Agent
- **Notification**: Thông báo hệ thống
- **ActivityLog**: Nhật ký hoạt động
- **WorkShift**: Ca làm việc

## Tính Năng Chính

### 1. Đăng Nhập & Phân Quyền
- Đăng nhập với email/password
- Phân quyền theo vai trò: Staff, Manager, Admin
- JWT authentication (mock hiện tại)

### 2. POS (Point of Sale)
- Giao diện bán hàng tại quầy
- Tìm kiếm sản phẩm
- Quản lý giỏ hàng
- Thanh toán: Tiền mặt, QR Code, Thẻ
- In hóa đơn

### 3. Quản Lý Kho
- Xem tồn kho theo cửa hàng
- Nhập/Xuất kho
- Điều chuyển kho giữa các chi nhánh
- Cảnh báo tồn kho thấp

### 4. Quản Lý Sản Phẩm
- CRUD sản phẩm
- Quản lý danh mục
- Giá bán/Giá nhập
- Mã vạch

### 5. Báo Cáo & Thống Kê
- Doanh thu theo thời gian
- Bán hàng theo sản phẩm
- So sánh cửa hàng
- Biểu đồ trực quan

### 6. AI-Agent Dashboard
- Đề xuất từ AI
- Dự đoán nhu cầu
- Cảnh báo tồn kho
- Phân tích xu hướng
- Phát hiện bất thường

### 7. Quản Trị Hệ Thống (Admin)
- Quản lý cửa hàng
- Quản lý người dùng
- Phân quyền

## Demo Accounts

Hiện tại hệ thống sử dụng mock authentication. Bạn có thể đăng nhập với:
- `admin@example.com` - Vai trò Admin
- `manager@example.com` - Vai trò Manager
- `staff@example.com` - Vai trò Staff

Mật khẩu: Bất kỳ (mock)

## Kết Nối Backend

Để kết nối với backend Spring Boot:

1. Tạo file `src/services/api.ts` để định nghĩa API client (axios)
2. Thay thế các mock data bằng API calls thực tế
3. Cập nhật `src/store/authStore.ts` để sử dụng API thực tế

## Hướng Phát Triển

- [ ] Tích hợp API backend thực tế
- [ ] Thêm tính năng tìm kiếm nâng cao
- [ ] Export báo cáo PDF/Excel
- [ ] Real-time notifications
- [ ] Responsive design cho mobile
- [ ] Dark mode
- [ ] Đa ngôn ngữ (i18n)

## License

MIT
