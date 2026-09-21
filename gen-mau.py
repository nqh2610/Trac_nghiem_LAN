from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()
doc.styles['Normal'].font.name = 'Times New Roman'
doc.styles['Normal'].font.size = Pt(12)

# ─── helpers ───────────────────────────────────────────────────────────────

def set_shading(para, fill):
    pPr = para._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill)
    pPr.append(shd)

def set_indent(para, twips=360):
    pPr = para._p.get_or_add_pPr()
    ind = OxmlElement('w:ind')
    ind.set(qn('w:left'), str(twips))
    pPr.append(ind)

def page_break():
    from docx.oxml.ns import qn
    p = doc.add_paragraph()
    r = p.add_run()
    br = OxmlElement('w:br')
    br.set(qn('w:type'), 'page')
    r._r.append(br)

def section_heading(letter, title):
    """Tiêu đề phần — nền xanh. Dùng 【】thay vì 'X.' để parser không nhầm là đáp án"""
    p = doc.add_paragraph()
    set_shading(p, 'DDEEFF')
    r = p.add_run(f'  【{letter}】  {title.upper()}  ')
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(0, 50, 140)

def subsection_heading(title, color=(0, 120, 0), bg='F0FFF0'):
    p = doc.add_paragraph()
    set_shading(p, bg)
    r = p.add_run(f'  ▸  {title}  ')
    r.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(*color)

def rule_line(label, text=''):
    """Dòng quy tắc — KHÔNG dùng A. B. C. D. hay Câu N. để tránh nhầm với câu hỏi"""
    p = doc.add_paragraph()
    set_indent(p, 360)
    r1 = p.add_run(f'◆ {label}')
    r1.bold = True
    r1.font.color.rgb = RGBColor(160, 70, 0)
    if text:
        p.add_run(f'  {text}')

def warn_line(text):
    p = doc.add_paragraph()
    set_indent(p, 360)
    set_shading(p, 'FFF3CD')
    r = p.add_run(f'⚠  {text}')
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(140, 70, 0)

def code_line(text):
    """Dòng ví dụ code — Courier New nền xám"""
    p = doc.add_paragraph()
    set_indent(p, 540)
    set_shading(p, 'F5F5F5')
    r = p.add_run(text)
    r.font.name = 'Courier New'
    r.font.size = Pt(10)

def blank():
    doc.add_paragraph('')

def symbol_row(latex, desc):
    p = doc.add_paragraph()
    set_indent(p, 540)
    set_shading(p, 'F5F5F5')
    r1 = p.add_run(f'{latex:<52}')
    r1.font.name = 'Courier New'
    r1.font.size = Pt(10)
    r2 = p.add_run(f'→  {desc}')
    r2.font.size = Pt(10)

# ─── câu hỏi thật ──────────────────────────────────────────────────────────

def q_line(text):
    """Dòng câu hỏi — giữ nguyên để parser nhận được"""
    doc.add_paragraph(text)

def code_block(lines):
    doc.add_paragraph('[CODE]')
    for line in lines:
        doc.add_paragraph(line)
    doc.add_paragraph('[/CODE]')


# ══════════════════════════════════════════════════════════════════════════════
#  TRANG 1 — HƯỚNG DẪN (không có "Câu N." hay "X. đáp án" để tránh import nhầm)
# ══════════════════════════════════════════════════════════════════════════════

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_shading(p, '003087')
r = p.add_run('  MẪU CÂU HỎI — HƯỚNG DẪN SOẠN ĐỀ THI  ')
r.bold = True; r.font.size = Pt(14); r.font.color.rgb = RGBColor(255, 255, 255)

p2 = doc.add_paragraph()
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_shading(p2, 'E8F0FE')
p2.add_run('Hệ thống Trắc Nghiệm LAN — File này import được bình thường').font.size = Pt(11)
blank()

# ── A. Cấu trúc ──
section_heading('A', 'Cấu trúc tổng quát mỗi câu hỏi')
blank()
rule_line('Dòng câu hỏi:', 'Câu N.  [loại]  Nội dung câu hỏi')
rule_line('Dòng đáp án:', 'Mỗi đáp án trên 1 dòng riêng, bắt đầu bằng  X.  hoặc  X)')
rule_line('Phân cách câu:', '1 dòng trắng giữa các câu (không bắt buộc nhưng nên có)')
blank()
rule_line('Prefix câu hỏi được chấp nhận:')
code_line('→  Câu 1.   /   Câu 1:   /   1.   /   1:       (có hoặc không có chữ "Câu")')
blank()
rule_line('Prefix đáp án được chấp nhận:')
code_line('→  X.   hoặc   X)      (X là chữ cái bất kỳ: A B C D E ...)')
blank()
rule_line('Tối thiểu:', 'Mỗi câu cần ít nhất 2 đáp án.')
blank()

# ── B. Lưu ý ──
section_heading('B', 'Lưu ý quan trọng')
blank()
warn_line('KHÔNG dùng Bullets / Numbering của Word. Chỉ gõ đáp án như văn bản thường.')
warn_line('Câu hỏi, mỗi đáp án, [CODE], [/CODE] đều phải là đoạn văn riêng (nhấn Enter).')
warn_line('Hình ảnh: chèn trực tiếp vào dòng câu hỏi hoặc đáp án — ảnh được nhúng tự động khi import.')
warn_line('Dòng tiêu đề / chú thích không bắt đầu bằng "Câu N." sẽ bị bỏ qua khi import.')
blank()

# ── C. Loại câu hỏi ──
section_heading('C', 'Các loại câu hỏi')
blank()

subsection_heading('LOẠI 1.  Một đáp án đúng  (mặc định, không cần tag)')
blank()
rule_line('Đánh dấu đúng:', 'Thêm  *  sau đáp án đúng  —  hoặc viết  (đúng)  ở cuối')
rule_line('Không đánh dấu gì:', 'Hệ thống tự chọn đáp án đầu tiên (đáp án thứ nhất) làm đúng')
blank()

subsection_heading('LOẠI 2.  Nhiều đáp án đúng  →  thêm [MULTI] vào đầu câu hỏi')
blank()
rule_line('Tag chấp nhận:', '[MULTI]  [multi]  (không phân biệt hoa thường)')
rule_line('Đánh dấu:', 'Thêm  *  sau MỖI đáp án đúng — cần ít nhất 2 dấu *')
blank()

subsection_heading('LOẠI 3.  Đúng / Sai  →  thêm [DUNG/SAI] vào đầu câu hỏi')
blank()
rule_line('Tag chấp nhận:', '[DUNG/SAI]   [ĐÚNG/SAI]   [DUNGSAI]   (không phân biệt hoa thường)')
rule_line('Quy tắc:', 'MỖI đáp án phải có marker đúng/sai ở cuối dòng')
blank()
rule_line('Marker ĐÚNG:')
code_line('(đúng)   (dung)   (Đ)   (đ)   (D)   (d)   (T)   (t)   (Y)   (y)')
rule_line('Marker SAI:')
code_line('(sai)   (S)   (s)   (F)   (f)   (N)   (n)')
blank()

# ── D. Công thức toán ──
section_heading('D', 'Công thức toán  (LaTeX / KaTeX)')
blank()
rule_line('Inline — trong dòng chữ:', r'\( công_thức \)')
rule_line('Display — dòng riêng, căn giữa:', r'\[ công_thức \]')
rule_line('Công thức Word (OMML):', 'Insert > Equation trong Word — cũng được hỗ trợ')
blank()

p = doc.add_paragraph()
set_indent(p, 360)
p.add_run('Ký hiệu LaTeX thường dùng:').bold = True
blank()

symbols = [
    (r'\(\frac{a}{b}\)',                              'Phân số'),
    (r'\(\dfrac{a}{b}\)',                             'Phân số cỡ lớn'),
    (r'\(\sqrt{x}\)',                                 'Căn bậc hai'),
    (r'\(\sqrt[n]{x}\)',                              'Căn bậc n'),
    (r'\(x^{2}\)',                                    'Lũy thừa'),
    (r'\(x_{i}\)',                                    'Chỉ số dưới'),
    (r'\(\sum_{i=1}^{n} i\)',                        'Tổng Sigma'),
    (r'\(\prod_{i=1}^{n} i\)',                       'Tích Pi'),
    (r'\(\int_{a}^{b} f(x)\,dx\)',                   'Tích phân'),
    (r'\(\lim_{x \to 0} f(x)\)',                     'Giới hạn'),
    (r'\(\infty\)',                                   'Vô cực'),
    (r'\(\pi,\ \alpha,\ \beta,\ \theta\)',            'Chữ Hy Lạp'),
    (r'\(\leq,\ \geq,\ \neq,\ \approx\)',            'So sánh'),
    (r'\(\in,\ \subset,\ \cup,\ \cap\)',              'Tập hợp'),
    (r'\(\vec{a},\ \overrightarrow{AB}\)',            'Vectơ'),
    (r'\(\overline{AB}\)',                            'Đoạn thẳng AB'),
    (r'\(\angle,\ \triangle\)',                       'Góc, tam giác'),
    (r'\(\begin{pmatrix} a & b \\ c & d \end{pmatrix}\)', 'Ma trận 2x2'),
]
for latex, desc in symbols:
    symbol_row(latex, desc)
blank()

# ── E. Code ──
section_heading('E', 'Hiển thị code  [CODE] / [/CODE]')
blank()
rule_line('Cú pháp:', 'Dòng [CODE]  →  các dòng code  →  dòng [/CODE]')
rule_line('Vị trí:', 'Đặt block code ngay sau dòng câu hỏi, trước các đáp án')
rule_line('Ngôn ngữ:', 'Tự động nhận dạng: Python, C++, Java, HTML, CSS, JavaScript, SQL...')
warn_line('[CODE] và [/CODE] phải là dòng riêng — không có chữ nào khác trên cùng dòng.')
blank()

# ══════════════════════════════════════════════════════════════════════════════
#  TRANG 2 — CÁC CÂU HỎI MẪU (import được bình thường)
# ══════════════════════════════════════════════════════════════════════════════
page_break()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_shading(p, '003087')
r = p.add_run('  CÁC CÂU HỎI MẪU  ')
r.bold = True; r.font.size = Pt(13); r.font.color.rgb = RGBColor(255, 255, 255)
blank()

# ── Nhóm 1: Một đáp án ──
p = doc.add_paragraph()
set_shading(p, 'DDEEFF')
p.add_run('  Loại 1 — Một đáp án đúng  ').bold = True

blank()
q_line('Câu 1. Thủ đô của Việt Nam là thành phố nào?')
q_line('A. TP. Hồ Chí Minh')
q_line('B. Hà Nội *')
q_line('C. Đà Nẵng')
q_line('D. Cần Thơ')
blank()

q_line('Câu 2. Năm nào Việt Nam thống nhất đất nước?')
q_line('A. 1954')
q_line('B. 1968')
q_line('C. 1975 (đúng)')
q_line('D. 1986')
blank()

q_line('Câu 3. Câu không đánh dấu đáp án đúng → hệ thống tự chọn đáp án đầu tiên làm đúng')
q_line('A. Đây là đáp án đúng (tự động)')
q_line('B. Đáp án sai')
q_line('C. Đáp án sai')
blank()

# ── Nhóm 2: Nhiều đáp án ──
p = doc.add_paragraph()
set_shading(p, 'DDEEFF')
p.add_run('  Loại 2 — Nhiều đáp án đúng [MULTI]  ').bold = True

blank()
q_line('Câu 4. [MULTI] Chọn các thành phố trực thuộc Trung ương của Việt Nam:')
q_line('A. Hà Nội *')
q_line('B. Nghệ An')
q_line('C. TP. Hồ Chí Minh *')
q_line('D. Đà Nẵng *')
q_line('E. Cần Thơ *')
blank()

# ── Nhóm 3: Đúng/Sai ──
p = doc.add_paragraph()
set_shading(p, 'DDEEFF')
p.add_run('  Loại 3 — Đúng / Sai [DUNG/SAI]  ').bold = True

blank()
q_line('Câu 5. [DUNG/SAI] Xác định tính đúng/sai của các phát biểu:')
q_line('A. Hà Nội là thủ đô Việt Nam. (đúng)')
q_line('B. Việt Nam không có biên giới với Trung Quốc. (sai)')
q_line('C. Sông Hồng chảy qua Hà Nội. (D)')
q_line('D. Việt Nam có 63 tỉnh thành. (Y)')
blank()

# ── Nhóm 4: Công thức toán ──
p = doc.add_paragraph()
set_shading(p, 'DDEEFF')
p.add_run('  Công thức toán (LaTeX)  ').bold = True

blank()
q_line(r'Câu 6. Giá trị của \(\sqrt{4} + \sqrt{9}\) bằng bao nhiêu?')
q_line('A. 2')
q_line('B. 3')
q_line('C. 5 *')
q_line('D. 7')
blank()

q_line(r'Câu 7. Nghiệm của phương trình \(x^2 - 5x + 6 = 0\) là:')
q_line(r'A. \(x = 1\) hoặc \(x = 6\)')
q_line(r'B. \(x = 2\) hoặc \(x = 3\) *')
q_line(r'C. \(x = -2\) hoặc \(x = -3\)')
q_line(r'D. \(x = 0\) hoặc \(x = 5\)')
blank()

q_line(r'Câu 8. [DUNG/SAI] Cho hàm số \(f(x) = x^2 - 4\), xác định đúng/sai:')
q_line(r'A. \(f(0) = -4\) (đúng)')
q_line(r'B. \(f(2) = 0\) (đúng)')
q_line(r'C. \(f(-2) = 4\) (sai)')
q_line(r'D. Hàm số đạt cực tiểu tại \(x = 0\) (đúng)')
blank()

# ── Nhóm 5: Code ──
p = doc.add_paragraph()
set_shading(p, 'DDEEFF')
p.add_run('  Hiển thị Code  ').bold = True

blank()
q_line('Câu 9. Xét đoạn code Python sau, kết quả in ra là gì?')
doc.add_paragraph('[CODE]')
doc.add_paragraph('x = 10')
doc.add_paragraph('y = 3')
doc.add_paragraph('print(x // y)')
doc.add_paragraph('[/CODE]')
q_line('A. 3 *')
q_line('B. 3.33')
q_line('C. 4')
q_line('D. 1')
blank()

q_line('Câu 10. Đoạn code C++ sau in ra giá trị gì?')
doc.add_paragraph('[CODE]')
doc.add_paragraph('#include <iostream>')
doc.add_paragraph('using namespace std;')
doc.add_paragraph('int main() {')
doc.add_paragraph('    int x = 5;')
doc.add_paragraph('    cout << x * x;')
doc.add_paragraph('}')
doc.add_paragraph('[/CODE]')
q_line('A. 5')
q_line('B. 10')
q_line('C. 25 *')
q_line('D. 55')
blank()

# ── Nhóm 6: Kết hợp ──
p = doc.add_paragraph()
set_shading(p, 'DDEEFF')
p.add_run('  Kết hợp Toán + Code + Nhiều đáp án  ').bold = True

blank()
q_line(r'Câu 11. [MULTI] Cho \(f(x) = x^2\). Xét đoạn code Python tính f(3):')
doc.add_paragraph('[CODE]')
doc.add_paragraph('def f(x):')
doc.add_paragraph('    return x ** 2')
doc.add_paragraph('print(f(3))')
doc.add_paragraph('[/CODE]')
q_line('A. Kết quả in ra là 9 *')
q_line('B. Hàm f tính bình phương của x *')
q_line('C. Kết quả in ra là 6')
q_line(r'D. x ** 2 tương đương \(x^2\) trong toán học *')
blank()

doc.save('data/mau-cau-hoi.docx')
print('OK: data/mau-cau-hoi.docx')
