// Tạo đề toán THPT 50 câu với OMML thật - cấu trúc giống de-toan-mau.docx
var JSZip = require('./node_modules/jszip');
var fs = require('fs');

var MNS = 'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"';

// ===== Paragraph helpers =====
function p(t) {
    return '<w:p><w:r><w:t xml:space="preserve">'+(t||'')+'</w:t></w:r></w:p>';
}
function pBold(t) {
    return '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">'+t+'</w:t></w:r></w:p>';
}
// paragraph với text trước, OMML giữa, text sau (tất cả optional)
function pm(parts) {
    // parts: array of {text:'...'} hoặc {math:'omml string'}
    var runs = '';
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part.text !== undefined && part.text !== '') {
            runs += '<w:r><w:t xml:space="preserve">'+part.text+'</w:t></w:r>';
        }
        if (part.math !== undefined) {
            runs += '<m:oMath '+MNS+'>'+part.math+'</m:oMath>';
        }
    }
    return '<w:p>'+runs+'</w:p>';
}

// ===== OMML element builders =====
function mt(t) { return '<m:r><m:t xml:space="preserve">'+t+'</m:t></m:r>'; }
function mi(t) { return '<m:r><m:rPr><m:sty m:val="i"/></m:rPr><m:t>'+t+'</m:t></m:r>'; }
function frac(n, d) {
    return '<m:f><m:fPr><m:ctrlPr/></m:fPr><m:num>'+n+'</m:num><m:den>'+d+'</m:den></m:f>';
}
function sup(b, e) {
    return '<m:sSup><m:sSupPr><m:ctrlPr/></m:sSupPr><m:e>'+b+'</m:e><m:sup>'+e+'</m:sup></m:sSup>';
}
function sub(b, e) {
    return '<m:sSub><m:sSubPr><m:ctrlPr/></m:sSubPr><m:e>'+b+'</m:e><m:sub>'+e+'</m:sub></m:sSub>';
}
function subsup(b, lo, hi) {
    return '<m:sSubSup><m:sSubSupPr><m:ctrlPr/></m:sSubSupPr><m:e>'+b+'</m:e><m:sub>'+lo+'</m:sub><m:sup>'+hi+'</m:sup></m:sSubSup>';
}
function sqrt(e) {
    return '<m:rad><m:radPr><m:degHide m:val="1"/><m:ctrlPr/></m:radPr><m:deg/><m:e>'+e+'</m:e></m:rad>';
}
function nroot(n, e) {
    return '<m:rad><m:radPr><m:ctrlPr/></m:radPr><m:deg>'+n+'</m:deg><m:e>'+e+'</m:e></m:rad>';
}
function paren(e) {
    return '<m:d><m:dPr><m:begChr m:val="("/><m:endChr m:val=")"/><m:ctrlPr/></m:dPr><m:e>'+e+'</m:e></m:d>';
}
function brack(e) {
    return '<m:d><m:dPr><m:begChr m:val="["/><m:endChr m:val="]"/><m:ctrlPr/></m:dPr><m:e>'+e+'</m:e></m:d>';
}
function abs(e) {
    return '<m:d><m:dPr><m:begChr m:val="|"/><m:endChr m:val="|"/><m:ctrlPr/></m:dPr><m:e>'+e+'</m:e></m:d>';
}
function intg(lo, hi, expr) {
    return '<m:nary><m:naryPr><m:chr m:val="∫"/><m:limLoc m:val="subSup"/><m:ctrlPr/></m:naryPr>'
         + '<m:sub>'+(lo||'')+'</m:sub><m:sup>'+(hi||'')+'</m:sup>'
         + '<m:e>'+expr+'</m:e></m:nary>';
}
function lim(to, expr) {
    return '<m:limLow><m:limLowPr><m:ctrlPr/></m:limLowPr>'
         + '<m:e>'+mt('lim')+'</m:e>'
         + '<m:lim>'+mi('x')+mt('→'+to)+'</m:lim></m:limLow>'+expr;
}
function logb(base, arg) {
    return sub(mt('log'), mt(base)) + paren(arg);
}
function ln(arg) { return mt('ln') + paren(arg); }

// ===== Build body =====
var body = '';

body += pBold('ĐỀ THI THỬ TỐT NGHIỆP THPT QUỐC GIA MÔN TOÁN');
body += pBold('Thời gian làm bài: 90 phút (50 câu trắc nghiệm)');
body += p('');

// ==================== PHẦN I: HÀM SỐ ====================
body += pBold('PHẦN I. HÀM SỐ VÀ ĐỒ THỊ (Câu 1-8)');
body += p('');

// Câu 1
body += pm([{text:'Câu 1. Hàm số '},{math: sup(mi('x'),mt('3'))+mt('−3')+mi('x')},{text:' nghịch biến trên khoảng nào?'}]);
body += p('A. (−1; 1) *');
body += p('B. (−∞; −1)');
body += p('C. (1; +∞)');
body += p('D. (−1; 0)');
body += p('');

// Câu 2
body += pm([{text:'Câu 2. Hàm số '},{math: sup(mi('x'),mt('4'))+mt('−2')+sup(mi('x'),mt('2'))+mt('+3')},{text:' đạt cực tiểu tại:'}]);
body += pm([{text:'A. x = 0, giá trị cực tiểu là 3'},{math:''},{text:''}]);
body += pm([{text:'B. x = ±1, giá trị cực tiểu là 2 *'}]);
body += p('C. x = 0, giá trị cực tiểu là 0');
body += p('D. x = ±1, giá trị cực tiểu là 0');
body += p('');

// Câu 3
body += pm([{text:'Câu 3. Tìm m để hàm số '},{math: frac(mi('x')+mt('+m'),mi('x')+mt('−2'))},{text:' đồng biến trên từng khoảng xác định?'}]);
body += p('A. m > 2');
body += p('B. m < −2');
body += p('C. m ≠ 2');
body += p('D. m ≠ −2 *');
body += p('');

// Câu 4
body += pm([{text:'Câu 4. Đường tiệm cận ngang của đồ thị '},{math: frac(mt('3')+mi('x')+mt('−1'),mt('2')+mi('x')+mt('+5'))},{text:' là:'}]);
body += pm([{text:'A. y = '},{math: frac(mt('3'),mt('2'))},{text:' *'}]);
body += pm([{text:'B. y = −'},{math: frac(mt('1'),mt('5'))}]);
body += p('C. y = 3');
body += p('D. y = 2');
body += p('');

// Câu 5
body += pm([{text:'Câu 5. Giá trị lớn nhất của hàm số y = '},{math: sup(mi('x'),mt('3'))+mt('−3')+mi('x')},{text:' trên đoạn [−2; 2] là:'}]);
body += p('A. 2');
body += p('B. 4');
body += p('C. −2 *');
body += p('D. −4');
body += p('');

// Câu 6
body += pm([{text:'Câu 6. Hàm số nào sau đây có đúng 3 điểm cực trị?'}]);
body += pm([{text:'A. y = '},{math: sup(mi('x'),mt('4'))+mt('−2')+sup(mi('x'),mt('2'))},{text:' *'}]);
body += pm([{text:'B. y = '},{math: sup(mi('x'),mt('3'))+mt('+3')+mi('x')}]);
body += pm([{text:'C. y = '},{math: frac(mi('x')+mt('+1'),mi('x')+mt('−1'))}]);
body += pm([{text:'D. y = '},{math: sup(mi('x'),mt('2'))+mt('−4')+mi('x')+mt('+3')}]);
body += p('');

// Câu 7
body += pm([{text:'Câu 7. Phương trình tiếp tuyến của đồ thị y = '},{math: sup(mi('x'),mt('3'))+mt('−3')+sup(mi('x'),mt('2'))},{text:' tại điểm có hoành độ x = 2 là:'}]);
body += p('A. y = −4');
body += p('B. y = −4 *');
body += p('C. y = 0');
body += p('D. y = 4');
body += p('');

// Câu 8
body += pm([{text:'Câu 8. Số điểm cực trị của hàm số y = '},{math: sup(paren(sup(mi('x'),mt('2'))+mt('−1')),mt('3'))},{text:' là:'}]);
body += p('A. 1');
body += p('B. 2');
body += p('C. 3 *');
body += p('D. 0');
body += p('');

// ==================== PHẦN II: MŨ VÀ LOGARIT ====================
body += pBold('PHẦN II. HÀM SỐ MŨ VÀ LOGARIT (Câu 9-18)');
body += p('');

// Câu 9
body += pm([{text:'Câu 9. Rút gọn biểu thức P = '},{math: sup(mi('a'),frac(mt('2'),mt('3')))+mt('⋅')+sup(mi('a'),frac(mt('1'),mt('6')))},{text:' (a > 0):'}]);
body += pm([{text:'A. '},{math: sup(mi('a'),frac(mt('5'),mt('6')))},{text:' *'}]);
body += pm([{text:'B. '},{math: sup(mi('a'),frac(mt('1'),mt('4')))}]);
body += pm([{text:'C. '},{math: sup(mi('a'),frac(mt('1'),mt('2')))}]);
body += p('D. a');
body += p('');

// Câu 10
body += pm([{text:'Câu 10. Giá trị của '},{math: sup(mt('27'),frac(mt('2'),mt('3')))},{text:' bằng:'}]);
body += p('A. 3');
body += p('B. 6');
body += p('C. 9 *');
body += p('D. 18');
body += p('');

// Câu 11
body += pm([{text:'Câu 11. Giải phương trình '},{math: sup(mt('4'),mi('x'))},{text:' = '},{math: sup(mt('2'),mi('x')+mt('+3'))},{text:':'}]);
body += p('A. x = 1');
body += p('B. x = 2');
body += p('C. x = 3 *');
body += p('D. x = 4');
body += p('');

// Câu 12
body += pm([{text:'Câu 12. Tính '},{math: logb('2','8')},{text:' + '},{math: logb('2','4')},{text:' − '},{math: logb('2','16')},{text:':'}]);
body += p('A. 1 *');
body += p('B. 2');
body += p('C. 3');
body += p('D. 0');
body += p('');

// Câu 13
body += pm([{text:'Câu 13. Giải bất phương trình '},{math: logb('3',mi('x')+mt('−1'))},{text:' ≥ 2:'}]);
body += p('A. x ≥ 10 *');
body += p('B. x ≥ 9');
body += p('C. x ≥ 7');
body += p('D. x ≥ 4');
body += p('');

// Câu 14
body += pm([{text:'Câu 14. Giải phương trình '},{math: logb('2',mi('x')+mt('+1'))},{text:' + '},{math: logb('2',mi('x')+mt('−1'))},{text:' = 3:'}]);
body += pm([{text:'A. x = '},{math: sqrt(mt('10'))},{text:' *'}]);
body += p('B. x = 3');
body += p('C. x = 2');
body += pm([{text:'D. x = '},{math: sqrt(mt('7'))}]);
body += p('');

// Câu 15
body += pm([{text:'Câu 15. Giải bất phương trình '},{math: sup(mt('2'),sup(mi('x'),mt('2'))+mt('−4'))},{text:' < '},{math: sup(mt('2'),mt('2')+mi('x')+mt('−3'))},{text:':'}]);
body += p('A. 1 < x < 3 *');
body += p('B. x < 1 hoặc x > 3');
body += p('C. −3 < x < 1');
body += p('D. x < −3 hoặc x > 1');
body += p('');

// Câu 16
body += pm([{text:'Câu 16. Tập xác định của hàm số y = '},{math: ln(mt('3')+mi('x')+mt('−6'))},{text:' là:'}]);
body += p('A. (2; +∞) *');
body += p('B. [−2; +∞)');
body += p('C. (−2; +∞)');
body += p('D. (3; +∞)');
body += p('');

// Câu 17
body += pm([{text:'Câu 17. Đạo hàm của hàm số y = '},{math: sup(mt('e'),sup(mi('x'),mt('2'))+mt('+1'))},{text:' là:'}]);
body += pm([{text:'A. y’ = 2x⋅'},{math: sup(mt('e'),sup(mi('x'),mt('2'))+mt('+1'))},{text:' *'}]);
body += pm([{text:'B. y’ = '},{math: sup(mt('e'),sup(mi('x'),mt('2'))+mt('+1'))}]);
body += pm([{text:'C. y’ = '},{math: sup(mi('x'),mt('2'))+mt('+1')}]);
body += p('D. y’ = 2x');
body += p('');

// Câu 18
body += pm([{text:'Câu 18. Nguyên hàm của f(x) = '},{math: frac(mt('1'),mi('x')+mt('+2'))},{text:' là:'}]);
body += pm([{text:'A. F(x) = '},{math: ln(abs(mi('x')+mt('+2')))},{text:' + C *'}]);
body += pm([{text:'B. F(x) = −'},{math: frac(mt('1'),sup(paren(mi('x')+mt('+2')),mt('2')))},{text:' + C'}]);
body += pm([{text:'C. F(x) = '},{math: ln(mi('x')+mt('+2'))}]);
body += p('D. F(x) = (x+2)⋅ln(x+2) + C');
body += p('');

// ==================== PHẦN III: TÍCH PHÂN ====================
body += pBold('PHẦN III. TÍCH PHÂN VÀ ỨNG DỤNG (Câu 19-26)');
body += p('');

// Câu 19
body += pm([{text:'Câu 19. Tính I = '},{math: intg(mt('0'),mt('1'),sup(mi('x'),mt('2'))+mt('d')+mi('x'))},{text:':'}]);
body += pm([{text:'A. '},{math: frac(mt('1'),mt('3'))},{text:' *'}]);
body += pm([{text:'B. '},{math: frac(mt('1'),mt('2'))}]);
body += p('C. 1');
body += pm([{text:'D. '},{math: frac(mt('2'),mt('3'))}]);
body += p('');

// Câu 20
body += pm([{text:'Câu 20. Tính I = '},{math: intg(mt('0'),mt('1'),mt('(')+sup(mi('x'),mt('2'))+mt('+2')+mi('x')+mt('+1')+mt(')d')+mi('x'))},{text:':'}]);
body += pm([{text:'A. '},{math: frac(mt('7'),mt('3'))},{text:' *'}]);
body += pm([{text:'B. '},{math: frac(mt('5'),mt('3'))}]);
body += pm([{text:'C. '},{math: frac(mt('4'),mt('3'))}]);
body += p('D. 2');
body += p('');

// Câu 21
body += pm([{text:'Câu 21. Tính I = '},{math: intg(mt('0'),frac(mi('π'),mt('2')),mt('sin(x)d')+mi('x'))},{text:':'}]);
body += p('A. 0');
body += p('B. 1 *');
body += p('C. 2');
body += p('D. −1');
body += p('');

// Câu 22
body += pm([{text:'Câu 22. Tính I = '},{math: intg(mt('1'),mt('e'),ln(mi('x'))+mt('d')+mi('x'))},{text:':'}]);
body += p('A. 0');
body += p('B. 1 *');
body += p('C. e');
body += p('D. e − 1');
body += p('');

// Câu 23
body += pm([{text:'Câu 23. Tính I = '},{math: intg(mt('0'),mt('1'),mi('x')+sup(mt('e'),sup(mi('x'),mt('2')))+mt('d')+mi('x'))},{text:':'}]);
body += pm([{text:'A. '},{math: frac(mt('e−1'),mt('2'))},{text:' *'}]);
body += p('B. e − 1');
body += pm([{text:'C. '},{math: frac(mt('e'),mt('2'))}]);
body += p('D. 1');
body += p('');

// Câu 24
body += pm([{text:'Câu 24. Diện tích hình phẳng giới hạn bởi y = '},{math: sqrt(mi('x'))},{text:' và y = x là:'}]);
body += pm([{text:'A. '},{math: frac(mt('1'),mt('6'))},{text:' *'}]);
body += pm([{text:'B. '},{math: frac(mt('1'),mt('3'))}]);
body += pm([{text:'C. '},{math: frac(mt('1'),mt('2'))}]);
body += p('D. 1');
body += p('');

// Câu 25
body += pm([{text:'Câu 25. Thể tích vật thể tròn xoay khi quay y = '},{math: sqrt(mi('x'))},{text:' (0 ≤ x ≤ 4) quanh Ox là:'}]);
body += p('A. 4π');
body += p('B. 6π');
body += p('C. 8π *');
body += p('D. 16π');
body += p('');

// Câu 26
body += pm([{text:'Câu 26. Diện tích hình phẳng giới hạn bởi y = '},{math: sup(mi('x'),mt('2'))+mt('−4')},{text:' và trục hoành là:'}]);
body += pm([{text:'A. '},{math: frac(mt('32'),mt('3'))},{text:' *'}]);
body += pm([{text:'B. '},{math: frac(mt('16'),mt('3'))}]);
body += p('C. 8');
body += p('D. 16');
body += p('');

// ==================== PHẦN IV: SỐ PHỨC ====================
body += pBold('PHẦN IV. SỐ PHỨC (Câu 27-31)');
body += p('');

// Câu 27
body += p('Câu 27. Cho số phức z = 3 − 4i. Môđun |z| bằng:');
body += p('A. 3');
body += p('B. 4');
body += p('C. 5 *');
body += p('D. 7');
body += p('');

// Câu 28
body += p('Câu 28. Tính (2 + 3i)(1 − 2i):');
body += p('A. 8 − i *');
body += p('B. 2 − 6i');
body += p('C. 8 + i');
body += p('D. 2 + 6i');
body += p('');

// Câu 29
body += pm([{text:'Câu 29. Số phức liên hợp của z = '},{math: frac(mt('2+i'),mt('1−i'))},{text:' là:'}]);
body += pm([{text:'A. '},{math: frac(mt('1'),mt('2'))},{text:' − '},{math: frac(mt('3'),mt('2'))},{text:'i *'}]);
body += pm([{text:'B. '},{math: frac(mt('1'),mt('2'))},{text:' + '},{math: frac(mt('3'),mt('2'))},{text:'i'}]);
body += p('C. 1 + i');
body += p('D. 1 − i');
body += p('');

// Câu 30
body += p('Câu 30. Điểm nào biểu diễn số phức z = −2 + 3i trên mặt phẳng tọa độ?');
body += p('A. M(−2; 3) *');
body += p('B. M(2; −3)');
body += p('C. M(−2; −3)');
body += p('D. M(3; −2)');
body += p('');

// Câu 31
body += p('Câu 31. Giải phương trình z² + 2z + 5 = 0:');
body += p('A. z = −1 ± 2i *');
body += p('B. z = 1 ± 2i');
body += p('C. z = −1 ± i');
body += p('D. Vô nghiệm trong C');
body += p('');

// ==================== PHẦN V: HÌNH HỌC KHÔNG GIAN ====================
body += pBold('PHẦN V. HÌNH HỌC KHÔNG GIAN (Câu 32-38)');
body += p('');

// Câu 32
body += pm([{text:'Câu 32. Thể tích khối chóp S.ABCD có đáy là hình vuông cạnh a, SA ⊥ đáy, SA = a là:'}]);
body += pm([{text:'A. '},{math: frac(sup(mi('a'),mt('3')),mt('3'))},{text:' *'}]);
body += pm([{text:'B. '},{math: frac(sup(mi('a'),mt('3')),mt('6'))}]);
body += pm([{text:'C. '},{math: sup(mi('a'),mt('3'))}]);
body += pm([{text:'D. '},{math: frac(sup(mi('a'),mt('3')),mt('2'))}]);
body += p('');

// Câu 33
body += pm([{text:'Câu 33. Thể tích hình cầu bán kính R là:'}]);
body += pm([{text:'A. '},{math: frac(mt('4'),mt('3'))},{text:'π'},{math: sup(mi('R'),mt('3'))},{text:' *'}]);
body += pm([{text:'B. 4π'},{math: sup(mi('R'),mt('2'))}]);
body += pm([{text:'C. '},{math: frac(mt('2'),mt('3'))},{text:'π'},{math: sup(mi('R'),mt('3'))}]);
body += pm([{text:'D. '},{math: frac(mt('1'),mt('3'))},{text:'π'},{math: sup(mi('R'),mt('3'))}]);
body += p('');

// Câu 34
body += pm([{text:'Câu 34. Trong không gian Oxyz, khoảng cách từ M(1, 2, 3) đến gốc tọa độ là:'}]);
body += pm([{text:'A. '},{math: sqrt(mt('5'))}]);
body += pm([{text:'B. '},{math: sqrt(mt('14'))},{text:' *'}]);
body += pm([{text:'C. '},{math: sqrt(mt('13'))}]);
body += p('D. 6');
body += p('');

// Câu 35
body += p('Câu 35. Phương trình mặt phẳng qua M(1, 0, −1), vectơ pháp tuyến ₠n = (2, −1, 3) là:');
body += p('A. 2x − y + 3z = 0');
body += p('B. 2x − y + 3z − 5 = 0');
body += p('C. 2x − y + 3z + 1 = 0 *');
body += p('D. x − y + z = 0');
body += p('');

// Câu 36
body += p('Câu 36. Hình nón có bán kính R = 3, chiều cao h = 4. Thể tích là:');
body += p('A. 12π *');
body += p('B. 36π');
body += p('C. 48π');
body += p('D. 9π');
body += p('');

// Câu 37
body += pm([{text:'Câu 37. Cho hình hộp chữ nhật ABCD.A’B’C’D’ có AB = a, AD = b, AA’ = c. Đường chéo AG có độ dài:'}]);
body += pm([{text:'A. '},{math: sqrt(sup(mi('a'),mt('2'))+mt('+')+sup(mi('b'),mt('2'))+mt('+')+sup(mi('c'),mt('2')))},{text:' *'}]);
body += pm([{text:'B. '},{math: sqrt(sup(mi('a'),mt('2'))+mt('+')+sup(mi('b'),mt('2')))}]);
body += pm([{text:'C. '},{math: sqrt(sup(mi('b'),mt('2'))+mt('+')+sup(mi('c'),mt('2')))}]);
body += p('D. a + b + c');
body += p('');

// Câu 38
body += p('Câu 38. Mặt cầu tâm I(1, −1, 2) bán kính R = 3 có phương trình:');
body += p('A. (x−1)² + (y+1)² + (z−2)² = 9 *');
body += p('B. (x−1)² + (y+1)² + (z−2)² = 3');
body += p('C. x² + y² + z² = 9');
body += p('D. (x+1)² + (y−1)² + (z+2)² = 9');
body += p('');

// ==================== PHẦN VI: XÁC SUẤT ====================
body += pBold('PHẦN VI. XÁC SUẤT THỐNG KÊ (Câu 39-42)');
body += p('');

// Câu 39
body += pm([{text:'Câu 39. Tính '},{math: subsup(mi('C'),mt('5'),mt('2'))},{text:':'}]);
body += p('A. 5');
body += p('B. 10 *');
body += p('C. 15');
body += p('D. 20');
body += p('');

// Câu 40
body += p('Câu 40. Tung đồng xu 3 lần. Xác suất được đúng 2 mặt ngửa là:');
body += pm([{text:'A. '},{math: frac(mt('1'),mt('4'))}]);
body += pm([{text:'B. '},{math: frac(mt('3'),mt('8'))},{text:' *'}]);
body += pm([{text:'C. '},{math: frac(mt('1'),mt('2'))}]);
body += pm([{text:'D. '},{math: frac(mt('1'),mt('8'))}]);
body += p('');

// Câu 41
body += p('Câu 41. Tổ có 5 HS giỏi và 3 HS khá. Chọn ngẫu nhiên 2 HS. Xác suất cả 2 đều giỏi là:');
body += pm([{text:'A. '},{math: frac(mt('5'),mt('14'))},{text:' *'}]);
body += pm([{text:'B. '},{math: frac(mt('25'),mt('64'))}]);
body += pm([{text:'C. '},{math: frac(mt('1'),mt('4'))}]);
body += pm([{text:'D. '},{math: frac(mt('10'),mt('28'))}]);
body += p('');

// Câu 42
body += p('Câu 42. Xác suất khi tung 2 xúc xắc có tổng = 7 là:');
body += pm([{text:'A. '},{math: frac(mt('1'),mt('6'))},{text:' *'}]);
body += pm([{text:'B. '},{math: frac(mt('1'),mt('12'))}]);
body += pm([{text:'C. '},{math: frac(mt('1'),mt('36'))}]);
body += pm([{text:'D. '},{math: frac(mt('5'),mt('36'))}]);
body += p('');

// ==================== PHẦN VII: CÂU HỎI TỔNG HỢP ====================
body += pBold('PHẦN VII. CÂU HỎI TỔNG HỢP (Câu 43-50)');
body += p('');

// Câu 43
body += pm([{text:'Câu 43. [MULTI] Hàm số y = '},{math: sup(mi('x'),mt('3'))+mt('−3')+mi('x')},{text:' có các tính chất nào sau đây đúng?'}]);
body += p('A. Đồng biến trên (−∞; −1) và (1; +∞) *');
body += p('B. Nghịch biến trên (−1; 1) *');
body += p('C. Đạt cực đại tại x = −1 *');
body += p('D. Đạt cực tiểu tại x = 1 *');
body += p('');

// Câu 44
body += pm([{text:'Câu 44. [MULTI] Các khẳng định nào đúng về tích phân?'}]);
body += pm([{text:'A. '},{math: intg(mt('a'),mt('b'),mt('f(x)dx'))},{text:' = −'},{math: intg(mt('b'),mt('a'),mt('f(x)dx'))},{text:' *'}]);
body += pm([{text:'B. '},{math: intg(mt('a'),mt('a'),mt('f(x)dx'))},{text:' = 0 *'}]);
body += pm([{text:'C. '},{math: intg(mt('a'),mt('b'),mt('kf(x)dx'))},{text:' = k'},{math: intg(mt('a'),mt('b'),mt('f(x)dx'))},{text:' *'}]);
body += p('D. Tích phân của hàm chẵn trên [−a, a] bằng 0 (sai)');
body += p('');

// Câu 45
body += pm([{text:'Câu 45. [DUNG/SAI] Xác định đúng/sai:'}]);
body += pm([{text:'A. '},{math: logb('2',mt('8'))},{text:' = 3. (đúng)'}]);
body += pm([{text:'B. '},{math: logb('3',mt('1'))},{text:' = 1. (sai)'}]);
body += pm([{text:'C. '},{math: logb('a',mt('1'))},{text:' = 0 với mọi a > 0, a ≠ 1. (đúng)'}]);
body += pm([{text:'D. '},{math: logb('a',sup(mi('a'),mt('n')))},{text:' = n với a > 0, a ≠ 1. (đúng)'}]);
body += p('');

// Câu 46
body += pm([{text:'Câu 46. [DUNG/SAI] Cho hàm số y = '},{math: frac(mt('2')+mi('x'),mi('x')+mt('−1'))},{text:'. Xác định đúng/sai:'}]);
body += p('A. Miền xác định D = R\\{1}. (đúng)');
body += p('B. Hàm số đồng biến trên từng khoảng xác định. (sai)');
body += p('C. Đồ thị có tiệm cận ngang y = 2. (đúng)');
body += p('D. Đồ thị có tiệm cận đứng x = 1. (đúng)');
body += p('');

// Câu 47
body += pm([{text:'Câu 47. Bất phương trình '},{math: sup(mt('2'),sup(mi('x'),mt('2'))+mt('−3')+mi('x'))},{text:' < '},{math: sup(mt('2'),mt('2')+mi('x')+mt('−4'))},{text:' có nghiệm là:'}]);
body += p('A. 1 < x < 4 *');
body += p('B. x < 1 hoặc x > 4');
body += p('C. −4 < x < −1');
body += p('D. x < −4 hoặc x > −1');
body += p('');

// Câu 48
body += pm([{text:'Câu 48. Số nghiệm của phương trình '},{math: ln(sup(mi('x'),mt('2'))+mt('−3')+mi('x')+mt('+3'))},{text:' = 0 là:'}]);
body += p('A. 0');
body += p('B. 1');
body += p('C. 2 *');
body += p('D. 3');
body += p('');

// Câu 49
body += pm([{text:'Câu 49. [MULTI] Hàm số f(x) = '},{math: sup(mi('x'),mt('3'))+mt('−3')+sup(mi('x'),mt('2'))+mt('−9')+mi('x')+mt('+2')},{text:'. Chọn các khẳng định đúng:'}]);
body += pm([{text:"A. f'(x) = 3x² − 6x − 9 *"}]);
body += pm([{text:'B. Cực đại f(−1) = 7 *'}]);
body += pm([{text:'C. Cực tiểu f(3) = −25 *'}]);
body += pm([{text:'D. Hàm tăng trên (−∞; −1) *'}]);
body += p('');

// Câu 50
body += pm([{text:'Câu 50. Giới hạn '},{math: lim('+∞', frac(sqrt(sup(mi('x'),mt('2'))+mt('+1')),mi('x')+mt('+2')))},{text:' bằng:'}]);
body += p('A. 0');
body += p('B. 1 *');
body += p('C. 2');
body += p('D. +∞');
body += p('');

// ===== Build docx =====
var docXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
    + ' xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">'
    + '<w:body>'+body+'</w:body></w:document>';

var zip = new JSZip();
zip.file('word/document.xml', docXml);
zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '</Types>');
zip.file('_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '</Relationships>');
zip.file('word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');

zip.generateAsync({ type: 'nodebuffer' }).then(function(buf) {
    fs.writeFileSync('data/de-toan-thpt-mau2.docx', buf);
    console.log('OK: data/de-toan-thpt-mau2.docx (' + buf.length + ' bytes)');
}).catch(function(err) {
    console.error('ERROR:', err.message);
});
