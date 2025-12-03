# 🎓 HƯỚNG DẪN SỬ DỤNG HỆ THỐNG THI TRẮC NGHIỆM

## 📋 YÊU CẦU

### Cài đặt Node.js (chỉ cần làm 1 lần)
1. Truy cập: https://nodejs.org/
2. Tải phiên bản **LTS** (khuyên dùng)
3. Cài đặt theo hướng dẫn (Next → Next → Finish)
4. Khởi động lại máy tính

---

## 🚀 CÁCH SỬ DỤNG

### Bước 1: Chuẩn bị dữ liệu

**Danh sách học sinh:**
- Mở file `danhsach/danhsach.xlsx`
- Nhập danh sách học sinh với các cột: STT, Họ, Tên
- Lưu file

**Câu hỏi:**
- Có thể import từ file Word qua trang giáo viên
- Hoặc thêm trực tiếp trên giao diện

### Bước 2: Chạy server

**Double-click vào file:** `Chay_Server.bat`

Màn hình sẽ hiển thị:
```
📌 Giáo viên truy cập (chỉ trên máy này):
   http://localhost:3000/teacher

📌 Gửi link này cho học sinh:
   http://192.168.x.x:3000
```

### Bước 3: Truy cập trang giáo viên

1. Mở trình duyệt (Chrome, Edge, Firefox...)
2. Nhập địa chỉ: `http://localhost:3000/teacher`
3. Cài đặt bài thi:
   - Tiêu đề bài thi
   - Thời gian làm bài
   - Bật/tắt hiển thị điểm
4. Bật "Mở bài thi"

### Bước 4: Cho học sinh làm bài

1. Gửi link cho học sinh (link hiện trên màn hình server)
2. Học sinh mở link trên trình duyệt
3. Chọn tên → Xác nhận → Nhập lớp → Làm bài

### Bước 5: Theo dõi kết quả

- Tab **Kết quả**: Xem điểm real-time
- Tab **Học sinh**: Xem ai đang làm, ai đã nộp
- Nút **Xuất CSV**: Tải kết quả về Excel

---

## 🛑 DỪNG SERVER

Có 2 cách:
1. **Double-click** vào file `Dung_Server.bat`
2. Hoặc nhấn `Ctrl + C` trong cửa sổ server

---

## ❓ XỬ LÝ SỰ CỐ

### "Không kết nối được server"
- Kiểm tra server đã chạy chưa
- Kiểm tra học sinh có cùng mạng WiFi/LAN không
- Tắt tường lửa Windows tạm thời

### "Học sinh không thấy tên"
- Kiểm tra file `danhsach/danhsach.xlsx`
- Khởi động lại server

### "Học sinh bị mất bài"
- Bài làm được lưu tự động trên máy học sinh
- Học sinh chỉ cần F5 hoặc mở lại link

### "Cổng 3000 bị chiếm"
- Chạy file `Dung_Server.bat` rồi chạy lại `Chay_Server.bat`

---

## 📁 CẤU TRÚC THƯ MỤC

```
Trac_Nghiem/
├── Chay_Server.bat      ← Double-click để chạy
├── Dung_Server.bat      ← Double-click để dừng
├── HUONG_DAN.md         ← File này
├── server.js            ← Code server (không cần sửa)
├── danhsach/
│   └── danhsach.xlsx    ← Danh sách học sinh
├── data/
│   ├── questions.json   ← Câu hỏi (tự động tạo)
│   └── results.json     ← Kết quả (tự động tạo)
└── public/
    ├── index.html       ← Trang học sinh
    └── teacher.html     ← Trang giáo viên
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, hãy kiểm tra:
1. Node.js đã cài đúng chưa (mở CMD, gõ `node -v`)
2. Máy tính và học sinh có cùng mạng không
3. Server có báo lỗi gì không

---

**Chúc thầy/cô tổ chức thi thành công! 🎉**
