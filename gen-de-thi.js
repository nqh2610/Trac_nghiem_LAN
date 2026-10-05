// Tạo đề toán tốt nghiệp THPT mẫu - 50 câu, nhiều dạng công thức OMML
var JSZip = require('./node_modules/jszip');
var fs = require('fs');

// Namespace khai báo một lần duy nhất trên root element
var ROOT_NS = 'xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"'
    + ' xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"'
    + ' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"'
    + ' xmlns:o="urn:schemas-microsoft-com:office:office"'
    + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
    + ' xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
    + ' xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"'
    + ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';

// ===== DOM helpers =====
function p(t) { return '<w:p><w:r><w:t xml:space="preserve">'+(t||'')+'</w:t></w:r></w:p>'; }
function pBold(t) { return '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">'+t+'</w:t></w:r></w:p>'; }
function pInline(before, omml, after) {
    var s = '';
    if (before) s += '<w:r><w:t xml:space="preserve">'+before+'</w:t></w:r>';
    s += '<m:oMath>'+omml+'</m:oMath>';
    if (after) s += '<w:r><w:t xml:space="preserve">'+after+'</w:t></w:r>';
    return '<w:p>'+s+'</w:p>';
}
function pDisplay(omml) {
    return '<w:p><m:oMathPara><m:oMath>'+omml+'</m:oMath></m:oMathPara></w:p>';
}

// ===== OMML helpers =====
function mt(t) { return '<m:r><m:t xml:space="preserve">'+t+'</m:t></m:r>'; }
function mi(t) { return '<m:r><m:rPr><m:sty m:val="i"/></m:rPr><m:t>'+t+'</m:t></m:r>'; }
function mn(t) { return '<m:r><m:t>'+t+'</m:t></m:r>'; }
function frac(n,d) { return '<m:f><m:fPr><m:ctrlPr/></m:fPr><m:num>'+n+'</m:num><m:den>'+d+'</m:den></m:f>'; }
function msup(b,e) { return '<m:sSup><m:sSupPr><m:ctrlPr/></m:sSupPr><m:e>'+b+'</m:e><m:sup>'+e+'</m:sup></m:sSup>'; }
function msub(b,e) { return '<m:sSub><m:sSubPr><m:ctrlPr/></m:sSubPr><m:e>'+b+'</m:e><m:sub>'+e+'</m:sub></m:sSub>'; }
function msubsup(b,lo,hi) { return '<m:sSubSup><m:sSubSupPr><m:ctrlPr/></m:sSubSupPr><m:e>'+b+'</m:e><m:sub>'+lo+'</m:sub><m:sup>'+hi+'</m:sup></m:sSubSup>'; }
function sqrt(e) { return '<m:rad><m:radPr><m:degHide m:val="1"/><m:ctrlPr/></m:radPr><m:deg/><m:e>'+e+'</m:e></m:rad>'; }
function nroot(n,e) { return '<m:rad><m:radPr><m:ctrlPr/></m:radPr><m:deg>'+n+'</m:deg><m:e>'+e+'</m:e></m:rad>'; }
function paren(e) { return '<m:d><m:dPr><m:begChr m:val="("/><m:endChr m:val=")"/><m:ctrlPr/></m:dPr><m:e>'+e+'</m:e></m:d>'; }
function bracket(e) { return '<m:d><m:dPr><m:begChr m:val="["/><m:endChr m:val="]"/><m:ctrlPr/></m:dPr><m:e>'+e+'</m:e></m:d>'; }
function abs(e) { return '<m:d><m:dPr><m:begChr m:val="|"/><m:endChr m:val="|"/><m:ctrlPr/></m:dPr><m:e>'+e+'</m:e></m:d>'; }
function integral(lo,hi,expr,dx) {
    return '<m:nary><m:naryPr><m:chr m:val="∫"/><m:limLoc m:val="subSup"/><m:ctrlPr/></m:naryPr>'
         + '<m:sub>'+(lo||'')+'</m:sub><m:sup>'+(hi||'')+'</m:sup>'
         + '<m:e>'+expr+(dx?mt(' '+dx):'')+'</m:e></m:nary>';
}
function sigma(from,to,expr) {
    return '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/><m:ctrlPr/></m:naryPr>'
         + '<m:sub>'+from+'</m:sub><m:sup>'+to+'</m:sup><m:e>'+expr+'</m:e></m:nary>';
}
function limLow(e,lim) { return '<m:limLow><m:limLowPr><m:ctrlPr/></m:limLowPr><m:e>'+e+'</m:e><m:lim>'+lim+'</m:lim></m:limLow>'; }
function overline(e) { return '<m:bar><m:barPr><m:pos m:val="top"/><m:ctrlPr/></m:barPr><m:e>'+e+'</m:e></m:bar>'; }

// log_a(x)
function log(base,arg) { return msub(mt('log'),mn(base))+paren(arg); }
// ln(x)
function ln(arg) { return mt('ln')+paren(arg); }
// lim_{x->a} f(x)
function lim(to,expr) { return limLow(mt('lim'),mi('x')+mt('→'+to))+expr; }

// ===== Build questions =====
var body = '';
body += pBold('DE THI THU TOT NGHIEP THPT MON TOAN');
body += pBold('(50 cau trac nghiem - Thoi gian: 90 phut)');
body += p('');

// ========== PHAN 1: HAM SO (cau 1-12) ==========
body += pBold('--- PHAN HAM SO VA DO THI ---');
body += p('');

// Cau 1
body += p('Cau 1: Ham so nao sau day nghich bien tren R?');
body += p('A. y = 2x + 1');
body += pInline('B. y = ', msup(mi('x'),mt('3')), ' - 3x');
body += pInline('C. y = -', msup(mi('x'),mt('3')), ' *');
body += p('D. y = x^2 - 1');
body += p('');

// Cau 2
body += pInline('Cau 2: Ham so y = ', msup(mi('x'),mt('3')), ' - 3', msup(mi('x'),mt('2')), ' + 2 co bao nhieu diem cuc tri?');
body += p('A. 0');
body += p('B. 1');
body += p('C. 2 *');
body += p('D. 3');
body += p('');

// Cau 3
body += pInline('Cau 3: Gia tri lon nhat cua ham so y = ', msup(mi('x'),mt('3')), ' - 3', mi('x'), ' tren doan ', bracket(mt('-2')+mt(', ')+mt('2')), ' la:');
body += p('A. -2');
body += p('B. 0');
body += p('C. 2 *');
body += p('D. 4');
body += p('');

// Cau 4
body += pInline('Cau 4: Tim m de ham so y = ', frac(mi('x')+mt('+1'),mi('x')+mt('+m')), ' dong bien tren tung khoang xac dinh?');
body += p('A. m = 1 *');
body += p('B. m = -1');
body += p('C. m = 0');
body += p('D. m = 2');
body += p('');

// Cau 5
body += pInline('Cau 5: Duong tiet can ngang cua do thi ham so y = ', frac(mt('2')+mi('x')+mt('-1'),mi('x')+mt('+3')), ' la:');
body += p('A. y = 3');
body += p('B. y = 2 *');
body += p('C. y = -1');
body += p('D. y = 1/3');
body += p('');

// Cau 6
body += pInline('Cau 6: Ham so y = ', msup(mi('x'),mt('4')), ' - 2', msup(mi('x'),mt('2')), ' + 3 co gia tri cuc tieu la:');
body += p('A. 0');
body += p('B. 2 *');
body += p('C. 3');
body += p('D. -1');
body += p('');

// ========== PHAN 2: MU VA LOGARITHM (cau 7-16) ==========
body += pBold('--- PHAN MU VA LOGARITHM ---');
body += p('');

// Cau 7
body += pInline('Cau 7: Gia tri cua ', msup(mt('27'),frac(mt('2'),mt('3'))), ' bang:');
body += p('A. 3');
body += p('B. 6');
body += p('C. 9 *');
body += p('D. 18');
body += p('');

// Cau 8
body += pInline('Cau 8: Rut gon bieu thuc P = ', msup(mi('a'),frac(mt('1'),mt('2'))), mt(' · '), msup(mi('a'),frac(mt('1'),mt('3'))), ' (a > 0):');
body += pInline('A. ', msup(mi('a'),frac(mt('5'),mt('6'))), ' *');
body += pInline('B. ', msup(mi('a'),frac(mt('1'),mt('6'))));
body += pInline('C. ', msup(mi('a'),frac(mt('2'),mt('3'))));
body += p('D. a');
body += p('');

// Cau 9
body += pInline('Cau 9: Giai phuong trinh ', msup(mt('2'),mi('x')+mt('+1')), ' = 8:');
body += p('A. x = 1');
body += p('B. x = 2 *');
body += p('C. x = 3');
body += p('D. x = 4');
body += p('');

// Cau 10
body += pInline('Cau 10: Tinh ', log('2','8'), ':');
body += p('A. 2');
body += p('B. 3 *');
body += p('C. 4');
body += p('D. 6');
body += p('');

// Cau 11
body += pInline('Cau 11: Giai bat phuong trinh ', log('3',mi('x')+mt('+1')), ' > 1:');
body += p('A. x > 2 *');
body += p('B. x > 3');
body += p('C. x > 1');
body += p('D. x > 0');
body += p('');

// Cau 12
body += pInline('Cau 12: Gia tri cua bieu thuc ', log('2','3'), ' + ', log('2','6'), ' - ', log('2','9'), ' la:');
body += pInline('A. ', log('2','2'));
body += p('B. 1 *');
body += p('C. 2');
body += p('D. 3');
body += p('');

// Cau 13
body += pInline('Cau 13: Nguyen ham cua ham so f(x) = e^x + ', frac(mt('1'),mi('x')), ' la:');
body += pInline('A. F(x) = e^x + ', ln(abs(mi('x'))), ' + C *');
body += pInline('B. F(x) = e^x - ', frac(mt('1'),msup(mi('x'),mt('2'))), ' + C');
body += p('C. F(x) = e^x + C');
body += p('D. F(x) = xe^x + C');
body += p('');

// ========== PHAN 3: TICH PHAN (cau 14-20) ==========
body += pBold('--- PHAN TICH PHAN VA UNG DUNG ---');
body += p('');

// Cau 14
body += pInline('Cau 14: Tinh I = ', integral(mt('0'),mt('1'),msup(mi('x'),mt('2'))+mt('+2'),mi('x')+'d'+mi('x')), ':');
body += pInline('A. ', frac(mt('4'),mt('3')));
body += pInline('B. ', frac(mt('7'),mt('3')), ' *');
body += pInline('C. ', frac(mt('5'),mt('3')));
body += p('D. 2');
body += p('');

// Cau 15
body += pInline('Cau 15: Tinh I = ', integral(mt('0'),frac(mi('π'),mt('2')),mt('sin(')+mi('x')+mt(')'),mi('x')+'d'+mi('x')), ':');
body += p('A. 0');
body += p('B. 1 *');
body += p('C. 2');
body += p('D. -1');
body += p('');

// Cau 16
body += pInline('Cau 16: Dien tich hinh phang gioi han boi y = ', msup(mi('x'),mt('2')), ' va y = x la:');
body += pInline('A. ', frac(mt('1'),mt('6')), ' *');
body += pInline('B. ', frac(mt('1'),mt('3')));
body += pInline('C. ', frac(mt('1'),mt('2')));
body += p('D. 1');
body += p('');

// Cau 17
body += pInline('Cau 17: The tich vat the tron khi quay y = ', sqrt(mi('x')), ' (0 <= x <= 4) quanh Ox la:');
body += p('A. 4π');
body += p('B. 6π');
body += p('C. 8π *');
body += p('D. 16π');
body += p('');

// Cau 18
body += pInline('Cau 18: Tinh ', integral(mt('1'),mt('e'),ln(mi('x')),mi('x')+'d'+mi('x')), ':');
body += p('A. 0');
body += p('B. 1 *');
body += p('C. e');
body += p('D. e-1');
body += p('');

// ========== PHAN 4: SO PHUC (cau 19-24) ==========
body += pBold('--- PHAN SO PHUC ---');
body += p('');

// Cau 19
body += pInline('Cau 19: Cho so phuc z = 3 - 4i. Modun cua z la:');
body += p('A. 3');
body += p('B. 4');
body += p('C. 5 *');
body += p('D. 7');
body += p('');

// Cau 20
body += pInline('Cau 20: Tim phan thuc va phan ao cua z = (2+i)(1-3i):');
body += p('A. Phan thuc 5, phan ao -5i *');
body += p('B. Phan thuc 2, phan ao -6i');
body += p('C. Phan thuc -1, phan ao -5i');
body += p('D. Phan thuc 5, phan ao 5i');
body += p('');

// Cau 21
body += pInline('Cau 21: So phuc lien hop cua z = ', frac(mt('2+i'),mt('1-i')), ' la:');
body += pInline('A. ', frac(mt('1'),mt('2')), ' + ', frac(mt('3'),mt('2')), 'i');
body += pInline('B. ', frac(mt('1'),mt('2')), ' - ', frac(mt('3'),mt('2')), 'i *');
body += p('C. 1 + i');
body += p('D. 1 - i');
body += p('');

// Cau 22
body += pInline('Cau 22: Diem bieu dien so phuc z = -2 + 3i tren mat phang toa do la:');
body += p('A. M(-2; 3) *');
body += p('B. M(2; -3)');
body += p('C. M(-2; -3)');
body += p('D. M(3; -2)');
body += p('');

// ========== PHAN 5: HINH HOC KHONG GIAN (cau 23-34) ==========
body += pBold('--- PHAN HINH HOC KHONG GIAN ---');
body += p('');

// Cau 23
body += pInline('Cau 23: The tich khoi lap phuong canh a la:');
body += pInline('A. ', msup(mi('a'),mt('3')), ' *');
body += pInline('B. 3', msup(mi('a'),mt('3')));
body += pInline('C. 6', msup(mi('a'),mt('2')));
body += p('D. a');
body += p('');

// Cau 24
body += pInline('Cau 24: The tich hinh cau ban kinh R la:');
body += pInline('A. ', frac(mt('4'),mt('3')), 'π', msup(mi('R'),mt('3')), ' *');
body += pInline('B. 4π', msup(mi('R'),mt('2')));
body += pInline('C. ', frac(mt('2'),mt('3')), 'π', msup(mi('R'),mt('3')));
body += pInline('D. ', frac(mt('1'),mt('3')), 'π', msup(mi('R'),mt('3')));
body += p('');

// Cau 25
body += pInline('Cau 25: Hinh non co ban kinh R = 3, chieu cao h = 4. The tich la:');
body += p('A. 12π *');
body += p('B. 36π');
body += p('C. 48π');
body += p('D. 9π');
body += p('');

// Cau 26
body += pInline('Cau 26: Trong khong gian Oxyz, khoang cach tu diem M(1,2,3) den goc toa do la:');
body += pInline('A. ', sqrt(mt('5')));
body += pInline('B. ', sqrt(mt('14')), ' *');
body += pInline('C. ', sqrt(mt('13')));
body += p('D. 6');
body += p('');

// Cau 27
body += pInline('Cau 27: Phuong trinh mat phang di qua M(1,0,-1) va co vec-to phap tuyen n = (2,-1,3) la:');
body += p('A. 2x - y + 3z = 0');
body += p('B. 2x - y + 3z - 5 = 0 (wrong)');
body += p('C. 2x - y + 3z + 1 = 0 *');
body += p('D. x - y + z = 0');
body += p('');

// Cau 28
body += pInline('Cau 28: Hinh lang tru dung co dien tich day la S va chieu cao h. Dien tich xung quanh la:');
body += p('A. S.h');
body += p('B. 2S + C.h');
body += p('C. C.h *');
body += p('D. 2S');
body += p('');

// ========== PHAN 6: XAC SUAT THONG KE (cau 29-36) ==========
body += pBold('--- PHAN XAC SUAT THONG KE ---');
body += p('');

// Cau 29
body += pInline('Cau 29: Tinh ', msup(mi('C'),mt('2'),''), ':', '');
body += pInline('Cau 29: Tinh ', msubsup(mi('C'),mt('5'),mt('2')), ' (chap 2 tu 5):');
body += p('A. 5');
body += p('B. 10 *');
body += p('C. 15');
body += p('D. 20');
body += p('');

// Cau 30
body += p('Cau 30: Tung mot dong xu 3 lan. Xac suat de duoc dung 2 mat nga la:');
body += pInline('A. ', frac(mt('1'),mt('4')));
body += pInline('B. ', frac(mt('3'),mt('8')), ' *');
body += pInline('C. ', frac(mt('1'),mt('2')));
body += pInline('D. ', frac(mt('1'),mt('8')));
body += p('');

// Cau 31
body += p('Cau 31: Xac suat de khi tung 2 xuc xac 6 mat co tong = 7 la:');
body += pInline('A. ', frac(mt('1'),mt('6')), ' *');
body += pInline('B. ', frac(mt('1'),mt('12')));
body += pInline('C. ', frac(mt('1'),mt('36')));
body += pInline('D. ', frac(mt('5'),mt('36')));
body += p('');

// Cau 32
body += p('Cau 32: Mot to co 5 hoc sinh gioi va 3 hoc sinh kha. Chon ngau nhien 2 HS. Xac suat ca 2 deu gioi la:');
body += pInline('A. ', frac(mt('5'),mt('14')), ' *');
body += pInline('B. ', frac(mt('10'),mt('28')));
body += pInline('C. ', frac(mt('1'),mt('4')));
body += pInline('D. ', frac(mt('25'),mt('64')));
body += p('');

// ========== PHAN 7: DAY SO - GIOI HAN (cau 33-40) ==========
body += pBold('--- PHAN DAY SO VA GIOI HAN ---');
body += p('');

// Cau 33
body += pInline('Cau 33: Cap so nhan co u1 = 2, q = 3. Tong 4 so hang dau la:');
body += p('A. 20');
body += p('B. 40');
body += p('C. 80 *');
body += p('D. 160');
body += p('');

// Cau 34
body += pInline('Cau 34: Tinh ', lim('+∞', frac(msup(mi('x'),mt('2'))+mt('3'),mt('2')+msup(mi('x'),mt('2')))), ':');
body += pInline('A. ', frac(mt('1'),mt('2')), ' *');
body += p('B. 1');
body += p('C. 3');
body += p('D. +∞');
body += p('');

// Cau 35
body += pInline('Cau 35: Tinh ', lim(mt('0'), frac(mt('sin ')+mi('x'),mi('x'))), ':');
body += p('A. 0');
body += p('B. 1 *');
body += p('C. +∞');
body += p('D. Khong ton tai');
body += p('');

// Cau 36
body += pInline('Cau 36: Tong cua cap so nhan vo han co u1 = 4, q = ', frac(mt('1'),mt('2')), ' la:');
body += p('A. 4');
body += p('B. 6');
body += p('C. 8 *');
body += p('D. 16');
body += p('');

// ========== PHAN 8: LUONG GIAC (cau 37-44) ==========
body += pBold('--- PHAN LUONG GIAC ---');
body += p('');

// Cau 37
body += pInline('Cau 37: Giai phuong trinh sin(x) = ', frac(sqrt(mt('3')),mt('2')), ':');
body += pInline('A. x = ', frac(mi('π'),mt('3')), ' + k2π hoac x = ', frac(mt('2π'),mt('3')), ' + k2π (k∈Z) *');
body += p('B. x = π/3 + kπ');
body += p('C. x = π/6 + k2π');
body += p('D. x = π/3 + kπ/2');
body += p('');

// Cau 38
body += pInline('Cau 38: Gia tri cua sin(', frac(mt('5π'),mt('6')), ') la:');
body += pInline('A. ', frac(sqrt(mt('3')),mt('2')));
body += pInline('B. ', frac(mt('1'),mt('2')), ' *');
body += pInline('C. -', frac(mt('1'),mt('2')));
body += p('D. -√3/2');
body += p('');

// Cau 39
body += pInline('Cau 39: Cong thuc tinh cos(a+b) la:');
body += p('A. cos(a)cos(b) - sin(a)sin(b) *');
body += p('B. cos(a)cos(b) + sin(a)sin(b)');
body += p('C. sin(a)cos(b) + cos(a)sin(b)');
body += p('D. sin(a)cos(b) - cos(a)sin(b)');
body += p('');

// Cau 40
body += pInline('Cau 40: Tinh I = ', integral(mt('0'),frac(mi('π'),mt('2')),msup(mt('sin'),mt('2'))+paren(mi('x')),mi('x')+'d'+mi('x')), ':');
body += pInline('A. ', frac(mi('π'),mt('4')), ' *');
body += pInline('B. ', frac(mi('π'),mt('2')));
body += p('C. 1');
body += p('D. 0');
body += p('');

// ========== PHAN 9: CAU HOI TONG HOP KHO (cau 41-50) ==========
body += pBold('--- PHAN CAU HOI TONG HOP (kho) ---');
body += p('');

// Cau 41: MULTI
body += pInline('Cau 41: [MULTI] Ham so y = ', msup(mi('x'),mt('3')), ' - 3x co cac tinh chat nao sau day?');
body += p('A. Dong bien tren (-∞,-1) va (1,+∞) *');
body += p('B. Nghich bien tren (-1,1) *');
body += p('C. Dat cuc dai tai x = -1 *');
body += p('D. Dat cuc tieu tai x = 1 *');
body += p('');

// Cau 42: MULTI
body += pInline('Cau 42: [MULTI] Cap nao sau day la nghiem cua he ', msup(mi('x'),mt('2'))+mt('+y=2'), ' va ', mi('x')+mt('+y=2'), '?');
body += p('A. (0, 2) *');
body += p('B. (1, 1) *');
body += p('C. (2, 0) *');
body += p('D. (-1, 3) *');
body += p('');

// Cau 43: MULTI
body += p('Cau 43: [MULTI] Cac tinh chat nao dung voi tich phan xac dinh?');
body += pInline('A. ', integral(mt('a'),mt('b'),mi('f')+paren(mi('x')),mi('x')+'d'+mi('x')), ' = - ', integral(mt('b'),mt('a'),mi('f')+paren(mi('x')),mi('x')+'d'+mi('x')), ' *');
body += pInline('B. ', integral(mt('a'),mt('a'),mi('f')+paren(mi('x')),mi('x')+'d'+mi('x')), ' = 0 *');
body += pInline('C. ', integral(mt('a'),mt('b'),mi('k')+mi('f')+paren(mi('x')),mi('x')+'d'+mi('x')), ' = k', integral(mt('a'),mt('b'),mi('f')+paren(mi('x')),mi('x')+'d'+mi('x')), ' *');
body += p('D. Tich phan cua ham chan tren [-a,a] bang 0');
body += p('');

// Cau 44: DUNG/SAI
body += p('Cau 44: [DUNG/SAI] Cho A, B la cac bien co. Xac dinh dung/sai:');
body += p('A. P(A∪B) = P(A) + P(B) - P(A∩B). (dung)');
body += p('B. Neu A va B xung khac thi P(A∪B) = P(A).P(B). (sai)');
body += p('C. P(A) + P(A_comp) = 1. (dung)');
body += p('D. Neu A va B doc lap thi P(A∩B) = P(A).P(B). (dung)');
body += p('');

// Cau 45: DUNG/SAI
body += pInline('Cau 45: [DUNG/SAI] Cho ham so y = ', frac(mt('2')+mi('x'),mi('x')+mt('-1')), '. Xac dinh dung/sai:');
body += p('A. Mien xac dinh D = R\\{1}. (dung)');
body += p('B. Ham so dong bien tren tung khoang xac dinh. (sai)');
body += p('C. Do thi co tiet can ngang y = 2. (dung)');
body += p('D. Do thi co tiet can dung x = 1. (dung)');
body += p('');

// Cau 46
body += pInline('Cau 46: Bat phuong trinh ', msup(mt('2'),msup(mi('x'),mt('2'))+mt('-3')+mi('x')), ' < ', msup(mt('2'),mt('2')+mi('x')+mt('-4')), ' co nghiem la:');
body += p('A. 1 < x < 4 *');
body += p('B. x < 1 hoac x > 4');
body += p('C. -4 < x < -1');
body += p('D. x < -4 hoac x > -1');
body += p('');

// Cau 47
body += pInline('Cau 47: Tinh ', integral(mt('0'),mt('1'),mi('x')+msup(mt('e'),msup(mi('x'),mt('2'))),mi('x')+'d'+mi('x')), ':');
body += pInline('A. ', frac(mt('e-1'),mt('2')), ' *');
body += p('B. e - 1');
body += pInline('C. ', frac(mt('e'),mt('2')));
body += p('D. 1');
body += p('');

// Cau 48
body += pInline('Cau 48: So nghiem cua phuong trinh ', ln(msup(mi('x'),mt('2'))+mt('-3')+mi('x')+mt('+3')), ' = 0 la:');
body += p('A. 0');
body += p('B. 1');
body += p('C. 2 *');
body += p('D. 3');
body += p('');

// Cau 49: DUNG/SAI - luong giac
body += pInline('Cau 49: [DUNG/SAI] Cho ', mi('x'), ' la goc nho. Xac dinh dung/sai:');
body += pInline('A. sin(', frac(mi('π'),mt('6')), ') = ', frac(mt('1'),mt('2')), '. (dung)');
body += pInline('B. cos(', frac(mi('π'),mt('3')), ') = ', frac(mt('1'),mt('2')), '. (dung)');
body += pInline('C. tan(', frac(mi('π'),mt('4')), ') = ', sqrt(mt('3')), '. (sai)');
body += pInline('D. sin²(x) + cos²(x) = 1. (dung)');
body += p('');

// Cau 50: MULTI kho
body += pInline('Cau 50: [MULTI] Ham so f(x) = ', msup(mi('x'),mt('3')), ' - 3', msup(mi('x'),mt('2')), ' - 9', mi('x'), ' + 2. Chon cac khang dinh dung:');
body += p('A. f\'(x) = 3x² - 6x - 9 *');
body += p('B. Cuc dai f(-1) = 7 *');
body += p('C. Cuc tieu f(3) = -25 *');
body += p('D. Ham tang tren (-∞,-1) *');
body += p('');

// Build docx
var docXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:document '+ROOT_NS+'>'
    + '<w:body>'+body+'</w:body></w:document>';

var settingsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + '<w:defaultTabStop w:val="708"/>'
    + '</w:settings>';

var zip = new JSZip();
zip.file('word/document.xml', docXml);
zip.file('word/settings.xml', settingsXml);
zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>'
    + '</Types>');
zip.file('_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '</Relationships>');
zip.file('word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>'
    + '</Relationships>');

zip.generateAsync({ type: 'nodebuffer' }).then(function(buf) {
    fs.writeFileSync('data/de-toan-thpt-mau2.docx', buf);
    console.log('OK: data/de-toan-thpt-mau2.docx (' + buf.length + ' bytes)');
});
