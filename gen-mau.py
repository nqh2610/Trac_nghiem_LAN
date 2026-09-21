# Tạo file mau-cau-hoi.docx với hướng dẫn đầy đủ
from docx import Document
from docx.shared import Pt, RGBColor

doc = Document()
doc.styles['Normal'].font.name = 'Times New Roman'
doc.styles['Normal'].font.size = Pt(12)

def th(text, size=13, color=None):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = RGBColor(*color)

def q(text):
    doc.add_paragraph(text)

def note(label, text):
    p = doc.add_paragraph()
    p.add_run(label).bold = True
    p.add_run(text)

def blank():
    doc.add_paragraph('')

def code_block(lines):
    doc.add_paragraph('[CODE]')
    for line in lines:
        doc.add_paragraph(line)
    doc.add_paragraph('[/CODE]')

# ===== TIÊU ĐỀ =====
th('MẪU CÂU HỎI - HƯỚNG DẪN SOẠN ĐỀ THI', 14)
th('Hệ thống Trắc Nghiệm LAN', 11)
blank()

# ===== CẤU TRÚC TỔNG QUÁT =====
th('A. CẤU TRÚC TỔNG QUÁT MỖI CÂU HỎI', 12, (0, 70, 180))
blank()

q('Mỗi câu hỏi gồm 3 thành phần viết trên các dòng riêng:')
q('   1. Dòng câu hỏi:   Câu N. [loại] Nội dung câu hỏi')
q('   2. Các dòng đáp án: A. ...   B. ...   C. ...   D. ...')
q('   3. Dòng trắng (Enter) để phân cách với câu tiếp theo')
blank()

note('Prefix câu hỏi: ', 'Chấp nhận "Câu 1.", "Câu 1:", "1.", "1:" (có hoặc không có chữ "Câu")')
note('Prefix đáp án: ', 'Chấp nhận "A." hoặc "A)" — chỉ dùng chữ cái A B C D E...')
note('Tối thiểu: ', 'Mỗi câu cần ít nhất 2 đáp án. Không giới hạn số đáp án tối đa.')
blank()

# ===== LƯU Ý QUAN TRỌNG =====
th('B. LƯU Ý QUAN TRỌNG', 12, (180, 0, 0))
blank()

notes = [
    ('⚠ KHÔNG dùng List của Word: ',
     'Không Insert > Bullets/Numbering. Chỉ gõ A. B. C. D. như văn bản thường.'),
    ('⚠ Mỗi dòng là một đoạn riêng: ',
     'Câu hỏi, mỗi đáp án, [CODE], [/CODE] đều phải là đoạn văn bản riêng (Enter xuống dòng).'),
    ('⚠ Dòng trắng giữa các câu: ',
     'Nên có 1 dòng trắng (Enter) giữa các câu để dễ đọc. Không bắt buộc.'),
    ('⚠ Tiêu đề phần không bị import: ',
     'Dòng không bắt đầu bằng "Câu N." và không bắt đầu bằng chữ cái + dấu chấm sẽ bị bỏ qua.'),
    ('⚠ Hình ảnh: ',
     'Chèn ảnh trực tiếp vào dòng câu hỏi hoặc đáp án trong Word. Ảnh được nhúng base64 khi import.'),
]
for label, text in notes:
    note(label, text)
blank()

# ===== PHẦN 1: CÂU HỎI MỘT ĐÁP ÁN =====
th('C. CÁC LOẠI CÂU HỎI', 12, (0, 70, 180))
blank()
th('LOẠI 1. MỘT ĐÁP ÁN ĐÚNG (mặc định)', 11, (0, 100, 0))
blank()

note('Quy tắc: ', 'Thêm dấu * vào cuối đáp án đúng (đúng 1 dấu *). Hoặc viết (đúng) cuối đáp án đúng.')
note('Không cần: ', 'Không cần thêm từ khóa gì vào đầu câu hỏi.')
blank()

q('Câu 1. Thủ đô của Việt Nam là thành phố nào?')
q('A. TP. Hồ Chí Minh')
q('B. Hà Nội *')
q('C. Đà Nẵng')
q('D. Cần Thơ')
blank()

q('Câu 2. Năm nào Việt Nam thống nhất đất nước?')
q('A. 1954')
q('B. 1968')
q('C. 1975 (đúng)')
q('D. 1986')
blank()

# ===== PHẦN 2: NHIỀU ĐÁP ÁN =====
th('LOẠI 2. NHIỀU ĐÁP ÁN ĐÚNG [MULTI]', 11, (0, 100, 0))
blank()

note('Quy tắc: ', 'Thêm [MULTI] vào đầu câu hỏi. Đánh dấu * vào cuối MỖI đáp án đúng (ít nhất 2 dấu *).')
note('Chấp nhận: ', '[MULTI] hoặc [multi] (không phân biệt hoa thường).')
blank()

q('Câu 3. [MULTI] Chọn các thành phố trực thuộc Trung ương của Việt Nam:')
q('A. Hà Nội *')
q('B. Nghệ An')
q('C. TP. Hồ Chí Minh *')
q('D. Đà Nẵng *')
q('E. Cần Thơ *')
blank()

# ===== PHẦN 3: ĐÚNG/SAI =====
th('LOẠI 3. ĐÚNG/SAI [DUNG/SAI]', 11, (0, 100, 0))
blank()

note('Quy tắc: ', 'Thêm [DUNG/SAI] vào đầu câu hỏi. MỖI đáp án phải có marker đúng/sai ở cuối.')
note('Marker đúng: ', '(đúng)  (dung)  (Đ)  (đ)  (D)  (d)  (T)  (t)  (Y)  (y)')
note('Marker sai: ', '(sai)  (S)  (s)  (F)  (f)  (N)  (n)')
note('Chấp nhận: ', '[DUNG/SAI]  [ĐÚNG/SAI]  [DUNGSAI]  (không phân biệt hoa thường)')
blank()

q('Câu 4. [DUNG/SAI] Xác định tính đúng/sai của các phát biểu:')
q('A. Hà Nội là thủ đô Việt Nam. (đúng)')
q('B. Việt Nam không có biên giới với Trung Quốc. (sai)')
q('C. Sông Hồng chảy qua Hà Nội. (đúng)')
q('D. Việt Nam có 63 tỉnh thành. (đúng)')
blank()

# ===== PHẦN 4: CÔNG THỨC TOÁN =====
th('D. CÔNG THỨC TOÁN (LaTeX / KaTeX)', 12, (0, 70, 180))
blank()

note('Cú pháp inline: ', '\\( công_thức \\)  — hiển thị trong dòng chữ')
note('Cú pháp dòng riêng: ', '\\[ công_thức \\]  — hiển thị to, căn giữa')
note('Lưu ý: ', 'Có thể viết LaTeX trực tiếp trong câu hỏi, đáp án, hoặc dùng công thức Word (OMML) — cả hai đều được nhận.')
blank()

q('Câu 5. Giá trị của \\(\\sqrt{4} + \\sqrt{9}\\) bằng bao nhiêu?')
q('A. 2')
q('B. 3')
q('C. 5 *')
q('D. 7')
blank()

q('Câu 6. Nghiệm của phương trình \\(x^2 - 5x + 6 = 0\\) là:')
q('A. \\(x = 1\\) hoặc \\(x = 6\\)')
q('B. \\(x = 2\\) hoặc \\(x = 3\\) *')
q('C. \\(x = -2\\) hoặc \\(x = -3\\)')
q('D. \\(x = 0\\) hoặc \\(x = 5\\)')
blank()

q('Câu 7. [DUNG/SAI] Cho hàm số \\(f(x) = x^2 - 4\\), xác định đúng/sai:')
q('A. \\(f(0) = -4\\) (đúng)')
q('B. \\(f(2) = 0\\) (đúng)')
q('C. \\(f(-2) = 4\\) (sai)')
q('D. Hàm số đạt cực tiểu tại \\(x = 0\\) (đúng)')
blank()

p2 = doc.add_paragraph()
p2.add_run('Bảng ký hiệu LaTeX thường dùng:').bold = True
symbols = [
    ('\\(\\frac{a}{b}\\)', 'phân số'),
    ('\\(\\sqrt{x}\\)', 'căn bậc hai'),
    ('\\(\\sqrt[n]{x}\\)', 'căn bậc n'),
    ('\\(x^{2}\\)', 'lũy thừa'),
    ('\\(x_{i}\\)', 'chỉ số dưới'),
    ('\\(\\dfrac{a}{b}\\)', 'phân số cỡ lớn'),
    ('\\(\\sum_{i=1}^{n} i\\)', 'tổng sigma'),
    ('\\(\\prod_{i=1}^{n} i\\)', 'tích pi'),
    ('\\(\\int_{a}^{b} f(x)dx\\)', 'tích phân'),
    ('\\(\\lim_{x \\to 0} f(x)\\)', 'giới hạn'),
    ('\\(\\infty\\)', 'vô cực'),
    ('\\(\\pi, \\alpha, \\beta, \\gamma, \\theta\\)', 'chữ Hy Lạp'),
    ('\\(\\leq, \\geq, \\neq, \\approx\\)', 'so sánh'),
    ('\\(\\in, \\notin, \\subset, \\cup, \\cap\\)', 'tập hợp'),
    ('\\(\\vec{a}, \\overrightarrow{AB}\\)', 'vectơ'),
    ('\\(\\overline{AB}\\)', 'đoạn thẳng AB'),
    ('\\(\\angle, \\triangle\\)', 'góc, tam giác'),
    ('\\(\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\)', 'ma trận'),
]
for latex, desc in symbols:
    doc.add_paragraph('   ' + latex + '   -->   ' + desc)
blank()

# ===== PHẦN 5: CODE =====
th('E. HIỂN THỊ CODE ([CODE] / [/CODE])', 12, (0, 70, 180))
blank()

note('Cú pháp: ', 'Viết [CODE] trên một dòng riêng, sau đó viết từng dòng code, rồi [/CODE] trên dòng riêng.')
note('Vị trí: ', 'Đặt block code sau dòng câu hỏi (hoặc sau đáp án nếu muốn code trong đáp án).')
note('Ngôn ngữ: ', 'Tự động nhận dạng: Python, C++, Java, HTML, CSS, JavaScript, SQL, v.v.')
note('Lưu ý: ', 'KHÔNG đặt [CODE] ngay sau A. B. C. D. trên cùng dòng — phải là dòng riêng.')
blank()

q('Câu 8. Xét đoạn code Python sau, kết quả in ra là gì?')
code_block([
    'x = 10',
    'y = 3',
    'print(x // y)',
])
q('A. 3 *')
q('B. 3.33')
q('C. 4')
q('D. 1')
blank()

q('Câu 9. Đoạn code C++ sau in ra giá trị gì?')
code_block([
    '#include <iostream>',
    'using namespace std;',
    'int main() {',
    '    int x = 5;',
    '    cout << x * x;',
    '}',
])
q('A. 5')
q('B. 10')
q('C. 25 *')
q('D. 55')
blank()

q('Câu 10. [MULTI] Xét đoạn HTML sau, khẳng định nào đúng?')
code_block([
    '<div class="box">',
    '  <p>Hello World</p>',
    '</div>',
])
q('A. Thẻ div chứa thẻ p *')
q('B. Thuộc tính class có giá trị "box" *')
q('C. Thẻ p không cần đóng')
q('D. Đây là HTML5 hợp lệ *')
blank()

# ===== PHẦN 6: VÍ DỤ KẾT HỢP =====
th('F. VÍ DỤ KẾT HỢP NHIỀU TÍNH NĂNG', 12, (0, 70, 180))
blank()

q('Câu 11. [MULTI] Cho \\(f(x) = x^2\\). Xét đoạn code Python tính f(3):')
code_block([
    'def f(x):',
    '    return x ** 2',
    'print(f(3))',
])
q('A. Kết quả in ra là 9 *')
q('B. Hàm f tính bình phương của x *')
q('C. Kết quả in ra là 6')
q('D. x ** 2 tương đương \\(x^2\\) trong toán học *')
blank()

doc.save('data/mau-cau-hoi.docx')
print('OK: data/mau-cau-hoi.docx')
