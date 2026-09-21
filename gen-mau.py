from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()
doc.styles['Normal'].font.name = 'Times New Roman'
doc.styles['Normal'].font.size = Pt(12)

# ─── helper: set paragraph background color ───
def set_para_shading(para, fill):
    pPr = para._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill)
    pPr.append(shd)

def set_para_border(para, color='AAAAAA', sz='4'):
    pPr = para._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    for side in ('top', 'left', 'bottom', 'right'):
        bdr = OxmlElement(f'w:{side}')
        bdr.set(qn('w:val'), 'single')
        bdr.set(qn('w:sz'), sz)
        bdr.set(qn('w:space'), '4')
        bdr.set(qn('w:color'), color)
        pBdr.append(bdr)
    pPr.append(pBdr)

def set_indent(para, left_twips=360):
    pPr = para._p.get_or_add_pPr()
    ind = OxmlElement('w:ind')
    ind.set(qn('w:left'), str(left_twips))
    pPr.append(ind)

# ─── header ───
def heading(text, size=13, color=(0, 70, 180), align=WD_ALIGN_PARAGRAPH.LEFT, shading=None):
    p = doc.add_paragraph()
    p.alignment = align
    if shading:
        set_para_shading(p, shading)
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor(*color)
    return p

def section(letter, title):
    """Tiêu đề phần A, B, C... — nền xanh nhạt"""
    p = doc.add_paragraph()
    set_para_shading(p, 'DDEEFF')
    r = p.add_run(f'  {letter}.  {title.upper()}  ')
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(0, 50, 140)
    return p

def subsection(title, color=(0, 120, 0)):
    p = doc.add_paragraph()
    set_para_shading(p, 'F0FFF0')
    r = p.add_run(f'  ▸  {title}  ')
    r.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(*color)
    return p

def rule(label, text, indent=True):
    p = doc.add_paragraph()
    if indent:
        set_indent(p, 360)
    r1 = p.add_run(f'◆ {label}')
    r1.bold = True
    r1.font.color.rgb = RGBColor(180, 80, 0)
    p.add_run(f'  {text}')
    return p

def warn(text):
    p = doc.add_paragraph()
    set_indent(p, 360)
    set_para_shading(p, 'FFF3CD')
    r = p.add_run(f'⚠  {text}')
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(140, 70, 0)
    return p

def eg(text, indent=True):
    """Dòng ví dụ — font monospace-like, nền xám nhạt"""
    p = doc.add_paragraph()
    if indent:
        set_indent(p, 540)
    set_para_shading(p, 'F5F5F5')
    r = p.add_run(text)
    r.font.name = 'Courier New'
    r.font.size = Pt(10)
    return p

def q(text, indent=360):
    p = doc.add_paragraph()
    set_indent(p, indent)
    p.add_run(text)
    return p

def blank():
    doc.add_paragraph('')

def divider():
    p = doc.add_paragraph()
    set_para_border(p, 'CCCCCC', '4')
    p.add_run('')

def code_block(lines):
    doc.add_paragraph('[CODE]')
    for line in lines:
        doc.add_paragraph(line)
    doc.add_paragraph('[/CODE]')

# ══════════════════════════════════════════════
#  TIÊU ĐỀ
# ══════════════════════════════════════════════
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_para_shading(p, '003087')
r = p.add_run('  MẪU CÂU HỎI — HƯỚNG DẪN SOẠN ĐỀ THI  ')
r.bold = True
r.font.size = Pt(14)
r.font.color.rgb = RGBColor(255, 255, 255)

p2 = doc.add_paragraph()
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_para_shading(p2, 'E8F0FE')
p2.add_run('Hệ thống Trắc Nghiệm LAN').font.size = Pt(11)

blank()

# ══════════════════════════════════════════════
#  A. CẤU TRÚC TỔNG QUÁT
# ══════════════════════════════════════════════
section('A', 'Cấu trúc tổng quát mỗi câu hỏi')
blank()

rule('Dòng câu hỏi:', 'Câu N.  [loại]  Nội dung câu hỏi')
rule('Dòng đáp án:', 'A. ...    B. ...    C. ...    D. ...')
rule('Phân cách câu:', 'Để 1 dòng trắng (Enter) giữa các câu')
blank()

rule('Prefix câu hỏi được chấp nhận:', '')
eg('Câu 1.  Câu 1:  1.  1:      (có hoặc không có chữ "Câu")')
blank()

rule('Prefix đáp án được chấp nhận:', '')
eg('A.  hoặc  A)      (chỉ dùng chữ cái A B C D E...)')
blank()

rule('Tối thiểu:', 'Mỗi câu cần ít nhất 2 đáp án. Tối đa không giới hạn.')
blank()

# ══════════════════════════════════════════════
#  B. LƯU Ý QUAN TRỌNG
# ══════════════════════════════════════════════
section('B', 'Lưu ý quan trọng')
blank()

warn('KHÔNG dùng tính năng Bullets / Numbering của Word.  Chỉ gõ A. B. C. D. như văn bản thường.')
warn('Câu hỏi, mỗi đáp án, [CODE], [/CODE] đều phải là đoạn văn bản riêng (nhấn Enter xuống dòng).')
warn('Hình ảnh: Chèn ảnh trực tiếp vào dòng câu hỏi hoặc đáp án trong Word. Ảnh được nhúng tự động khi import.')
warn('Dòng không bắt đầu bằng "Câu N." hoặc chữ cái + dấu chấm sẽ bị bỏ qua (tiêu đề, mô tả, v.v.).')
blank()

# ══════════════════════════════════════════════
#  C. CÁC LOẠI CÂU HỎI
# ══════════════════════════════════════════════
section('C', 'Các loại câu hỏi')
blank()

# ── C1. Một đáp án ──
subsection('LOẠI 1.  Một đáp án đúng  (mặc định, không cần tag)')
blank()
rule('Đánh dấu đáp án đúng:', 'Thêm dấu  *  sau đáp án đúng (đúng 1 dấu *)')
rule('Hoặc:', 'Viết  (đúng)  hoặc  (dung)  ở cuối đáp án đúng')
rule('Mặc định:', 'Nếu KHÔNG đánh dấu gì cả → hệ thống tự chọn đáp án A làm đáp án đúng')
blank()

eg('Câu 1. Thủ đô của Việt Nam là thành phố nào?')
eg('A. TP. Hồ Chí Minh')
eg('B. Hà Nội *')
eg('C. Đà Nẵng')
eg('D. Cần Thơ')
blank()
eg('Câu 2. Năm nào Việt Nam thống nhất đất nước?')
eg('A. 1954')
eg('B. 1968')
eg('C. 1975 (đúng)')
eg('D. 1986')
blank()
eg('Câu 3. Đây là ví dụ KHÔNG đánh dấu → hệ thống chọn A làm đúng')
eg('A. Đáp án này được chọn tự động là ĐÚNG')
eg('B. Đáp án sai')
eg('C. Đáp án sai')
blank()

divider()
blank()

# ── C2. Nhiều đáp án ──
subsection('LOẠI 2.  Nhiều đáp án đúng  [MULTI]')
blank()
rule('Tag:', 'Thêm  [MULTI]  vào đầu câu hỏi (không phân biệt hoa thường)')
rule('Đánh dấu:', 'Thêm  *  vào cuối MỖI đáp án đúng (ít nhất 2 dấu *)')
blank()

eg('Câu 4. [MULTI] Chọn các thành phố trực thuộc Trung ương của Việt Nam:')
eg('A. Hà Nội *')
eg('B. Nghệ An')
eg('C. TP. Hồ Chí Minh *')
eg('D. Đà Nẵng *')
eg('E. Cần Thơ *')
blank()

divider()
blank()

# ── C3. Đúng/Sai ──
subsection('LOẠI 3.  Đúng / Sai  [DUNG/SAI]')
blank()
rule('Tag chấp nhận:', '[DUNG/SAI]  [ĐÚNG/SAI]  [DUNGSAI]  (không phân biệt hoa thường)')
rule('Quy tắc:', 'MỖI đáp án phải có marker đúng/sai ở cuối dòng')
blank()

rule('Marker ĐÚNG:', '')
eg('(đúng)   (dung)   (Đ)   (đ)   (D)   (d)   (T)   (t)   (Y)   (y)')
blank()
rule('Marker SAI:', '')
eg('(sai)   (S)   (s)   (F)   (f)   (N)   (n)')
blank()

eg('Câu 5. [DUNG/SAI] Xác định tính đúng/sai của các phát biểu:')
eg('A. Hà Nội là thủ đô Việt Nam. (đúng)')
eg('B. Việt Nam không có biên giới với Trung Quốc. (sai)')
eg('C. Sông Hồng chảy qua Hà Nội. (D)')
eg('D. Việt Nam có 63 tỉnh thành. (Y)')
blank()

# ══════════════════════════════════════════════
#  D. CÔNG THỨC TOÁN
# ══════════════════════════════════════════════
section('D', 'Công thức toán  (LaTeX / KaTeX)')
blank()
rule('Inline — trong dòng chữ:', r'\( công_thức \)')
rule('Display — dòng riêng, căn giữa:', r'\[ công_thức \]')
rule('Công thức Word (OMML):', 'Chèn công thức bằng Insert > Equation trong Word — cũng được hỗ trợ')
blank()

eg(r'Câu 6. Giá trị của \(\sqrt{4} + \sqrt{9}\) bằng bao nhiêu?')
eg('A. 2')
eg('B. 3')
eg(r'C. 5 *')
eg('D. 7')
blank()
eg(r'Câu 7. Nghiệm của phương trình \(x^2 - 5x + 6 = 0\) là:')
eg(r'A. \(x = 1\) hoặc \(x = 6\)')
eg(r'B. \(x = 2\) hoặc \(x = 3\) *')
eg(r'C. \(x = -2\) hoặc \(x = -3\)')
eg(r'D. \(x = 0\) hoặc \(x = 5\)')
blank()

# Bảng ký hiệu
p = doc.add_paragraph()
set_indent(p, 360)
p.add_run('Bảng ký hiệu LaTeX thường dùng:').bold = True
blank()

symbols = [
    (r'\(\frac{a}{b}\)',                     'Phân số'),
    (r'\(\dfrac{a}{b}\)',                    'Phân số cỡ lớn (trong display)'),
    (r'\(\sqrt{x}\)',                        'Căn bậc hai'),
    (r'\(\sqrt[n]{x}\)',                     'Căn bậc n'),
    (r'\(x^{2}\)',                           'Lũy thừa'),
    (r'\(x_{i}\)',                           'Chỉ số dưới'),
    (r'\(\sum_{i=1}^{n} i\)',               'Tổng Sigma'),
    (r'\(\prod_{i=1}^{n} i\)',              'Tích Pi'),
    (r'\(\int_{a}^{b} f(x)\,dx\)',          'Tích phân'),
    (r'\(\lim_{x \to 0} f(x)\)',            'Giới hạn'),
    (r'\(\infty\)',                          'Vô cực'),
    (r'\(\pi,\ \alpha,\ \beta,\ \theta\)',   'Chữ Hy Lạp'),
    (r'\(\leq,\ \geq,\ \neq,\ \approx\)',   'So sánh'),
    (r'\(\in,\ \subset,\ \cup,\ \cap\)',     'Tập hợp'),
    (r'\(\vec{a},\ \overrightarrow{AB}\)',   'Vectơ'),
    (r'\(\overline{AB}\)',                   'Đoạn thẳng'),
    (r'\(\angle,\ \triangle\)',              'Góc, tam giác'),
    (r'\(\begin{pmatrix} a & b \\ c & d \end{pmatrix}\)', 'Ma trận'),
]

for latex, desc in symbols:
    p = doc.add_paragraph()
    set_indent(p, 540)
    set_para_shading(p, 'F5F5F5')
    r1 = p.add_run(f'{latex:<50}')
    r1.font.name = 'Courier New'
    r1.font.size = Pt(10)
    r2 = p.add_run(f'→  {desc}')
    r2.font.size = Pt(10)
blank()

# ══════════════════════════════════════════════
#  E. HIỂN THỊ CODE
# ══════════════════════════════════════════════
section('E', 'Hiển thị code  [CODE] / [/CODE]')
blank()
rule('Cú pháp:', 'Viết [CODE] trên dòng riêng → các dòng code → [/CODE] trên dòng riêng')
rule('Vị trí:', 'Đặt block code ngay sau dòng câu hỏi (trước các đáp án)')
rule('Ngôn ngữ:', 'Tự động nhận dạng: Python, C++, Java, HTML, CSS, JavaScript, SQL, v.v.')
blank()
warn('[CODE] và [/CODE] phải là dòng riêng, không có chữ nào khác trên cùng dòng.')
blank()

eg('Câu 8. Xét đoạn code Python sau, kết quả in ra là gì?')
eg('[CODE]')
eg('x = 10')
eg('y = 3')
eg('print(x // y)')
eg('[/CODE]')
eg('A. 3 *')
eg('B. 3.33')
eg('C. 4')
eg('D. 1')
blank()

eg('Câu 9. Đoạn code C++ sau in ra giá trị gì?')
eg('[CODE]')
eg('#include <iostream>')
eg('using namespace std;')
eg('int main() {')
eg('    int x = 5;')
eg('    cout << x * x;')
eg('}')
eg('[/CODE]')
eg('A. 5')
eg('B. 10')
eg('C. 25 *')
eg('D. 55')
blank()

# ══════════════════════════════════════════════
#  F. VÍ DỤ KẾT HỢP
# ══════════════════════════════════════════════
section('F', 'Ví dụ kết hợp nhiều tính năng')
blank()

eg(r'Câu 10. [MULTI] Cho \(f(x) = x^2\). Xét đoạn code Python tính f(3):')
eg('[CODE]')
eg('def f(x):')
eg('    return x ** 2')
eg('print(f(3))')
eg('[/CODE]')
eg('A. Kết quả in ra là 9 *')
eg('B. Hàm f tính bình phương của x *')
eg('C. Kết quả in ra là 6')
eg(r'D. x ** 2 tương đương \(x^2\) trong toán học *')
blank()

eg(r'Câu 11. [DUNG/SAI] Cho \(f(x) = x^2 - 4\), xác định đúng/sai:')
eg(r'A. \(f(0) = -4\) (đúng)')
eg(r'B. \(f(2) = 0\) (đúng)')
eg(r'C. \(f(-2) = 4\) (sai)')
eg(r'D. Hàm số đạt cực tiểu tại \(x = 0\) (đúng)')
blank()

doc.save('data/mau-cau-hoi.docx')
print('OK: data/mau-cau-hoi.docx')
