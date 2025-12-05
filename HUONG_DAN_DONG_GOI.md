# 📦 HƯỚNG DẪN ĐÓNG GÓI & BẢO VỆ BẢN QUYỀN

## 🚀 Cách đóng gói thành file cài đặt

### Bước 1: Cài đặt công cụ
```bash
# Cài pkg để đóng gói Node.js thành .exe
npm install -g pkg

# Cài Inno Setup để tạo installer (tải tại)
# https://jrsoftware.org/isinfo.php
```

### Bước 2: Chạy build
```bash
npm run build
```

### Kết quả:
- `build/` - Thư mục chứa file đã compile
- `dist/TracNghiemLAN.exe` - File executable
- `dist/TracNghiemLAN_Setup_v1.0.0.exe` - File installer

---

## 🔐 Hệ thống License

### Tạo License cho khách hàng

```bash
# Chế độ tương tác (dễ dùng)
npm run admin

# Hoặc dùng command line
node license/admin-tool.js generate --name "Trường ABC" --email "abc@school.edu.vn" --type school --days 365
```

### Các loại License:

| Loại | Học sinh | Máy | Giá đề xuất |
|------|----------|-----|-------------|
| Personal | 30 | 1 | 500,000đ |
| School | 200 | 3 | 2,000,000đ |
| Enterprise | Unlimited | Unlimited | 5,000,000đ |

### Gửi cho khách hàng:
1. **License Key**: `TNLN-XXXX-XXXX-XXXX-XXXX`
2. **License Data**: (chuỗi base64 dài)

---

## 🔄 Hệ thống cập nhật

### Cách hoạt động:
1. App kiểm tra server cập nhật khi khởi động
2. Nếu có bản mới → hiện thông báo
3. User chọn cập nhật → tải và cài tự động

### Setup Update Server:
Bạn cần deploy một API server với các endpoint:

```
GET /api/check-update?app=TracNghiemLAN&version=1.0.0
→ Trả về: { latestVersion, downloadUrl, changelog, ... }

GET /api/download-update
→ Trả về file installer mới
```

---

## 📋 Quy trình phát hành bản mới

1. Sửa code, test kỹ
2. Tăng version trong `package.json`
3. Chạy `npm run build`
4. Upload installer lên server
5. Cập nhật API check-update với version mới
6. Khách hàng sẽ nhận được thông báo cập nhật

---

## 🛡️ Bảo vệ bản quyền

### Đã triển khai:
- ✅ License Key với signature
- ✅ Hardware ID binding (gắn máy)
- ✅ Mã hóa file activation
- ✅ Kiểm tra hết hạn
- ✅ Giới hạn số học sinh

### Khuyến nghị thêm:
- Obfuscate code trước khi build
- Sử dụng bytenode để compile sang bytecode
- Thêm online check định kỳ (nếu có Internet)

---

## 📞 Hỗ trợ

Liên hệ: [email của bạn]
Website: [website của bạn]
