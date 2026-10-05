// Tạo đề toán THPT mẫu dùng thư viện docx (chuẩn, Word mở được)
// Công thức viết dạng LaTeX text để test import hệ thống
var docx = require('docx');
var fs = require('fs');

var Document = docx.Document;
var Paragraph = docx.Paragraph;
var TextRun = docx.TextRun;
var Packer = docx.Packer;
var HeadingLevel = docx.HeadingLevel;

function par(text) {
    return new Paragraph({ children: [new TextRun({ text: text || '', size: 24 })] });
}
function bold(text) {
    return new Paragraph({ children: [new TextRun({ text: text, bold: true, size: 26 })] });
}

var children = [];

children.push(bold('DE THI THU TOT NGHIEP THPT MON TOAN'));
children.push(bold('(50 cau trac nghiem - Thoi gian: 90 phut)'));
children.push(par(''));

// ===== PHAN 1: HAM SO =====
children.push(bold('--- PHAN HAM SO VA DO THI ---'));
children.push(par(''));

children.push(par('Cau 1: Ham so nao sau day nghich bien tren R?'));
children.push(par('A. y = 2x + 1'));
children.push(par('B. y = x^3 - 3x'));
children.push(par('C. y = -x^3 *'));
children.push(par('D. y = x^2 - 1'));
children.push(par(''));

children.push(par('Cau 2: Ham so y = x^3 - 3x^2 + 2 co bao nhieu diem cuc tri?'));
children.push(par('A. 0'));
children.push(par('B. 1'));
children.push(par('C. 2 *'));
children.push(par('D. 3'));
children.push(par(''));

children.push(par('Cau 3: Gia tri lon nhat cua ham so y = x^3 - 3x tren [-2; 2] la:'));
children.push(par('A. -2'));
children.push(par('B. 0'));
children.push(par('C. 2 *'));
children.push(par('D. 4'));
children.push(par(''));

children.push(par('Cau 4: Tim m de ham so y = (x+1)/(x+m) dong bien tren tung khoang xac dinh?'));
children.push(par('A. m = 1 *'));
children.push(par('B. m = -1'));
children.push(par('C. m = 0'));
children.push(par('D. m = 2'));
children.push(par(''));

children.push(par('Cau 5: Duong tiet can ngang cua do thi y = (2x-1)/(x+3) la:'));
children.push(par('A. y = 3'));
children.push(par('B. y = 2 *'));
children.push(par('C. y = -1'));
children.push(par('D. y = 1/3'));
children.push(par(''));

children.push(par('Cau 6: Ham so y = x^4 - 2x^2 + 3 co gia tri cuc tieu la:'));
children.push(par('A. 0'));
children.push(par('B. 2 *'));
children.push(par('C. 3'));
children.push(par('D. -1'));
children.push(par(''));

// ===== PHAN 2: MU VA LOGARITHM =====
children.push(bold('--- PHAN MU VA LOGARITHM ---'));
children.push(par(''));

children.push(par('Cau 7: Gia tri cua 27^(2/3) bang:'));
children.push(par('A. 3'));
children.push(par('B. 6'));
children.push(par('C. 9 *'));
children.push(par('D. 18'));
children.push(par(''));

children.push(par('Cau 8: Rut gon P = a^(1/2) * a^(1/3) voi a > 0:'));
children.push(par('A. a^(5/6) *'));
children.push(par('B. a^(1/6)'));
children.push(par('C. a^(2/3)'));
children.push(par('D. a'));
children.push(par(''));

children.push(par('Cau 9: Giai phuong trinh 2^(x+1) = 8:'));
children.push(par('A. x = 1'));
children.push(par('B. x = 2 *'));
children.push(par('C. x = 3'));
children.push(par('D. x = 4'));
children.push(par(''));

children.push(par('Cau 10: Tinh log_2(8):'));
children.push(par('A. 2'));
children.push(par('B. 3 *'));
children.push(par('C. 4'));
children.push(par('D. 6'));
children.push(par(''));

children.push(par('Cau 11: Giai bat phuong trinh log_3(x+1) > 1:'));
children.push(par('A. x > 2 *'));
children.push(par('B. x > 3'));
children.push(par('C. x > 1'));
children.push(par('D. x > 0'));
children.push(par(''));

children.push(par('Cau 12: Gia tri cua log_2(3) + log_2(6) - log_2(9) la:'));
children.push(par('A. log_2(2)'));
children.push(par('B. 1 *'));
children.push(par('C. 2'));
children.push(par('D. 3'));
children.push(par(''));

children.push(par('Cau 13: Nguyen ham cua f(x) = e^x + 1/x la:'));
children.push(par('A. F(x) = e^x + ln|x| + C *'));
children.push(par('B. F(x) = e^x - 1/x^2 + C'));
children.push(par('C. F(x) = e^x + C'));
children.push(par('D. F(x) = xe^x + C'));
children.push(par(''));

// ===== PHAN 3: TICH PHAN =====
children.push(bold('--- PHAN TICH PHAN VA UNG DUNG ---'));
children.push(par(''));

children.push(par('Cau 14: Tinh I = \\int_0^1 (x^2 + 2) dx:'));
children.push(par('A. 4/3'));
children.push(par('B. 7/3 *'));
children.push(par('C. 5/3'));
children.push(par('D. 2'));
children.push(par(''));

children.push(par('Cau 15: Tinh I = \\int_0^{\\pi/2} sin(x) dx:'));
children.push(par('A. 0'));
children.push(par('B. 1 *'));
children.push(par('C. 2'));
children.push(par('D. -1'));
children.push(par(''));

children.push(par('Cau 16: Dien tich hinh phang gioi han boi y = x^2 va y = x la:'));
children.push(par('A. 1/6 *'));
children.push(par('B. 1/3'));
children.push(par('C. 1/2'));
children.push(par('D. 1'));
children.push(par(''));

children.push(par('Cau 17: The tich vat the tron khi quay y = \\sqrt{x} (0 \\leq x \\leq 4) quanh Ox la:'));
children.push(par('A. 4\\pi'));
children.push(par('B. 6\\pi'));
children.push(par('C. 8\\pi *'));
children.push(par('D. 16\\pi'));
children.push(par(''));

children.push(par('Cau 18: Tinh \\int_1^e ln(x) dx:'));
children.push(par('A. 0'));
children.push(par('B. 1 *'));
children.push(par('C. e'));
children.push(par('D. e - 1'));
children.push(par(''));

// ===== PHAN 4: SO PHUC =====
children.push(bold('--- PHAN SO PHUC ---'));
children.push(par(''));

children.push(par('Cau 19: Cho so phuc z = 3 - 4i. Modun cua z la:'));
children.push(par('A. 3'));
children.push(par('B. 4'));
children.push(par('C. 5 *'));
children.push(par('D. 7'));
children.push(par(''));

children.push(par('Cau 20: Tim phan thuc va phan ao cua z = (2+i)(1-3i):'));
children.push(par('A. Phan thuc 5, phan ao -5i *'));
children.push(par('B. Phan thuc 2, phan ao -6i'));
children.push(par('C. Phan thuc -1, phan ao -5i'));
children.push(par('D. Phan thuc 5, phan ao 5i'));
children.push(par(''));

children.push(par('Cau 21: So phuc lien hop cua z = (2+i)/(1-i) la:'));
children.push(par('A. 1/2 + 3i/2'));
children.push(par('B. 1/2 - 3i/2 *'));
children.push(par('C. 1 + i'));
children.push(par('D. 1 - i'));
children.push(par(''));

children.push(par('Cau 22: Diem bieu dien so phuc z = -2 + 3i tren mat phang toa do la:'));
children.push(par('A. M(-2; 3) *'));
children.push(par('B. M(2; -3)'));
children.push(par('C. M(-2; -3)'));
children.push(par('D. M(3; -2)'));
children.push(par(''));

// ===== PHAN 5: HINH HOC KHONG GIAN =====
children.push(bold('--- PHAN HINH HOC KHONG GIAN ---'));
children.push(par(''));

children.push(par('Cau 23: The tich khoi lap phuong canh a la:'));
children.push(par('A. a^3 *'));
children.push(par('B. 3a^3'));
children.push(par('C. 6a^2'));
children.push(par('D. a'));
children.push(par(''));

children.push(par('Cau 24: The tich hinh cau ban kinh R la:'));
children.push(par('A. (4/3)\\pi R^3 *'));
children.push(par('B. 4\\pi R^2'));
children.push(par('C. (2/3)\\pi R^3'));
children.push(par('D. (1/3)\\pi R^3'));
children.push(par(''));

children.push(par('Cau 25: Hinh non co ban kinh R = 3, chieu cao h = 4. The tich la:'));
children.push(par('A. 12\\pi *'));
children.push(par('B. 36\\pi'));
children.push(par('C. 48\\pi'));
children.push(par('D. 9\\pi'));
children.push(par(''));

children.push(par('Cau 26: Trong khong gian Oxyz, khoang cach tu diem M(1,2,3) den goc toa do la:'));
children.push(par('A. \\sqrt{5}'));
children.push(par('B. \\sqrt{14} *'));
children.push(par('C. \\sqrt{13}'));
children.push(par('D. 6'));
children.push(par(''));

children.push(par('Cau 27: Phuong trinh mat phang di qua M(1,0,-1) va co vec-to phap tuyen n=(2,-1,3) la:'));
children.push(par('A. 2x - y + 3z = 0'));
children.push(par('B. 2x - y + 3z - 5 = 0'));
children.push(par('C. 2x - y + 3z + 1 = 0 *'));
children.push(par('D. x - y + z = 0'));
children.push(par(''));

children.push(par('Cau 28: Cho hinh chop S.ABCD co day la hinh vuong canh a, SA vuong goc day, SA = a. Tinh the tich:'));
children.push(par('A. a^3/3 *'));
children.push(par('B. a^3/6'));
children.push(par('C. a^3'));
children.push(par('D. a^3/2'));
children.push(par(''));

// ===== PHAN 6: XAC SUAT =====
children.push(bold('--- PHAN XAC SUAT THONG KE ---'));
children.push(par(''));

children.push(par('Cau 29: Tinh C_5^2 (to hop chap 2 cua 5):'));
children.push(par('A. 5'));
children.push(par('B. 10 *'));
children.push(par('C. 15'));
children.push(par('D. 20'));
children.push(par(''));

children.push(par('Cau 30: Tung mot dong xu 3 lan. Xac suat de duoc dung 2 mat nga la:'));
children.push(par('A. 1/4'));
children.push(par('B. 3/8 *'));
children.push(par('C. 1/2'));
children.push(par('D. 1/8'));
children.push(par(''));

children.push(par('Cau 31: Xac suat de khi tung 2 xuc xac 6 mat co tong = 7 la:'));
children.push(par('A. 1/6 *'));
children.push(par('B. 1/12'));
children.push(par('C. 1/36'));
children.push(par('D. 5/36'));
children.push(par(''));

children.push(par('Cau 32: To co 5 HS gioi va 3 HS kha. Chon ngau nhien 2 HS. Xac suat ca 2 deu gioi la:'));
children.push(par('A. 5/14 *'));
children.push(par('B. 10/28'));
children.push(par('C. 1/4'));
children.push(par('D. 25/64'));
children.push(par(''));

// ===== PHAN 7: DAY SO VA GIOI HAN =====
children.push(bold('--- PHAN DAY SO VA GIOI HAN ---'));
children.push(par(''));

children.push(par('Cau 33: Cap so nhan co u1=2, q=3. Tong 4 so hang dau la:'));
children.push(par('A. 20'));
children.push(par('B. 40'));
children.push(par('C. 80 *'));
children.push(par('D. 160'));
children.push(par(''));

children.push(par('Cau 34: Tinh lim_{x->+inf} (x^2+3)/(2+x^2):'));
children.push(par('A. 1/2 *'));
children.push(par('B. 1'));
children.push(par('C. 3'));
children.push(par('D. +inf'));
children.push(par(''));

children.push(par('Cau 35: Tinh lim_{x->0} sin(x)/x:'));
children.push(par('A. 0'));
children.push(par('B. 1 *'));
children.push(par('C. +inf'));
children.push(par('D. Khong ton tai'));
children.push(par(''));

children.push(par('Cau 36: Tong cua cap so nhan vo han co u1=4, q=1/2 la:'));
children.push(par('A. 4'));
children.push(par('B. 6'));
children.push(par('C. 8 *'));
children.push(par('D. 16'));
children.push(par(''));

// ===== PHAN 8: LUONG GIAC =====
children.push(bold('--- PHAN LUONG GIAC ---'));
children.push(par(''));

children.push(par('Cau 37: Giai phuong trinh sin(x) = \\sqrt{3}/2:'));
children.push(par('A. x = \\pi/3 + k2\\pi hoac x = 2\\pi/3 + k2\\pi (k thuoc Z) *'));
children.push(par('B. x = \\pi/3 + k\\pi'));
children.push(par('C. x = \\pi/6 + k2\\pi'));
children.push(par('D. x = \\pi/3 + k\\pi/2'));
children.push(par(''));

children.push(par('Cau 38: Gia tri cua sin(5\\pi/6) la:'));
children.push(par('A. \\sqrt{3}/2'));
children.push(par('B. 1/2 *'));
children.push(par('C. -1/2'));
children.push(par('D. -\\sqrt{3}/2'));
children.push(par(''));

children.push(par('Cau 39: Cong thuc tinh cos(a+b) la:'));
children.push(par('A. cos(a)cos(b) - sin(a)sin(b) *'));
children.push(par('B. cos(a)cos(b) + sin(a)sin(b)'));
children.push(par('C. sin(a)cos(b) + cos(a)sin(b)'));
children.push(par('D. sin(a)cos(b) - cos(a)sin(b)'));
children.push(par(''));

children.push(par('Cau 40: Tinh I = \\int_0^{\\pi/2} sin^2(x) dx:'));
children.push(par('A. \\pi/4 *'));
children.push(par('B. \\pi/2'));
children.push(par('C. 1'));
children.push(par('D. 0'));
children.push(par(''));

// ===== PHAN 9: TONG HOP KHO =====
children.push(bold('--- PHAN CAU HOI TONG HOP (kho) ---'));
children.push(par(''));

children.push(par('Cau 41: [MULTI] Ham so y = x^3 - 3x co cac tinh chat nao sau day?'));
children.push(par('A. Dong bien tren (-inf,-1) va (1,+inf) *'));
children.push(par('B. Nghich bien tren (-1,1) *'));
children.push(par('C. Dat cuc dai tai x = -1 *'));
children.push(par('D. Dat cuc tieu tai x = 1 *'));
children.push(par(''));

children.push(par('Cau 42: [MULTI] Cap nao sau day la nghiem cua he: x^2+y=2 va x+y=2?'));
children.push(par('A. (0, 2) *'));
children.push(par('B. (1, 1) *'));
children.push(par('C. (2, 0) *'));
children.push(par('D. (-1, 3) *'));
children.push(par(''));

children.push(par('Cau 43: [MULTI] Cac tinh chat nao dung voi tich phan xac dinh?'));
children.push(par('A. \\int_a^b f(x)dx = -\\int_b^a f(x)dx *'));
children.push(par('B. \\int_a^a f(x)dx = 0 *'));
children.push(par('C. \\int_a^b k*f(x)dx = k*\\int_a^b f(x)dx *'));
children.push(par('D. Tich phan cua ham chan tren [-a,a] bang 0 (sai)'));
children.push(par(''));

children.push(par('Cau 44: [DUNG/SAI] Cho A, B la cac bien co. Xac dinh dung/sai:'));
children.push(par('A. P(A hop B) = P(A) + P(B) - P(A giao B). (dung)'));
children.push(par('B. Neu A va B xung khac thi P(A hop B) = P(A)*P(B). (sai)'));
children.push(par('C. P(A) + P(A_bu) = 1. (dung)'));
children.push(par('D. Neu A va B doc lap thi P(A giao B) = P(A)*P(B). (dung)'));
children.push(par(''));

children.push(par('Cau 45: [DUNG/SAI] Cho ham so y = (2x)/(x-1). Xac dinh dung/sai:'));
children.push(par('A. Mien xac dinh D = R\\{1}. (dung)'));
children.push(par('B. Ham so dong bien tren tung khoang xac dinh. (sai)'));
children.push(par('C. Do thi co tiet can ngang y = 2. (dung)'));
children.push(par('D. Do thi co tiet can dung x = 1. (dung)'));
children.push(par(''));

children.push(par('Cau 46: Bat phuong trinh 2^(x^2-3x) < 2^(2x-4) co nghiem la:'));
children.push(par('A. 1 < x < 4 *'));
children.push(par('B. x < 1 hoac x > 4'));
children.push(par('C. -4 < x < -1'));
children.push(par('D. x < -4 hoac x > -1'));
children.push(par(''));

children.push(par('Cau 47: Tinh \\int_0^1 x*e^{x^2} dx:'));
children.push(par('A. (e-1)/2 *'));
children.push(par('B. e - 1'));
children.push(par('C. e/2'));
children.push(par('D. 1'));
children.push(par(''));

children.push(par('Cau 48: So nghiem cua phuong trinh ln(x^2 - 3x + 3) = 0 la:'));
children.push(par('A. 0'));
children.push(par('B. 1'));
children.push(par('C. 2 *'));
children.push(par('D. 3'));
children.push(par(''));

children.push(par('Cau 49: [DUNG/SAI] Xac dinh dung/sai:'));
children.push(par('A. sin(\\pi/6) = 1/2. (dung)'));
children.push(par('B. cos(\\pi/3) = 1/2. (dung)'));
children.push(par('C. tan(\\pi/4) = \\sqrt{3}. (sai)'));
children.push(par('D. sin^2(x) + cos^2(x) = 1. (dung)'));
children.push(par(''));

children.push(par('Cau 50: [MULTI] Ham so f(x) = x^3 - 3x^2 - 9x + 2. Chon cac khang dinh dung:'));
children.push(par("A. f'(x) = 3x^2 - 6x - 9 *"));
children.push(par('B. Cuc dai f(-1) = 7 *'));
children.push(par('C. Cuc tieu f(3) = -25 *'));
children.push(par('D. Ham tang tren (-inf,-1) *'));
children.push(par(''));

// Build
var doc = new Document({ sections: [{ children: children }] });

Packer.toBuffer(doc).then(function(buf) {
    fs.writeFileSync('data/de-toan-thpt-mau2.docx', buf);
    console.log('OK: data/de-toan-thpt-mau2.docx (' + buf.length + ' bytes)');
}).catch(function(err) {
    console.error('ERROR:', err.message);
});
