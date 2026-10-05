# Tạo đề toán demo3: công thức OMML thật (hiển thị đẹp trong Word + web KaTeX)
# Dùng python-docx tạo file hợp lệ, sau đó inject OMML vào XML

from docx import Document
from docx.shared import Pt
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from lxml import etree
import copy, re

# Namespace
W  = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
M  = 'http://schemas.openxmlformats.org/officeDocument/2006/math'

def w(tag): return '{%s}%s' % (W, tag)
def m(tag): return '{%s}%s' % (M, tag)

# ===== OMML builders (lxml elements) =====
def mt(text):
    r = etree.Element(m('r'))
    t = etree.SubElement(r, m('t'))
    t.text = text
    return r

def mi(text):
    r = etree.Element(m('r'))
    rpr = etree.SubElement(r, m('rPr'))
    sty = etree.SubElement(rpr, m('sty'))
    sty.set(m('val'), 'i')
    t = etree.SubElement(r, m('t'))
    t.text = text
    return r

def frac(num_els, den_els):
    f = etree.Element(m('f'))
    fpr = etree.SubElement(f, m('fPr'))
    etree.SubElement(fpr, m('ctrlPr'))
    num = etree.SubElement(f, m('num'))
    for e in (num_els if isinstance(num_els, list) else [num_els]):
        num.append(copy.deepcopy(e))
    den = etree.SubElement(f, m('den'))
    for e in (den_els if isinstance(den_els, list) else [den_els]):
        den.append(copy.deepcopy(e))
    return f

def sup(base_els, exp_els):
    s = etree.Element(m('sSup'))
    spr = etree.SubElement(s, m('sSupPr'))
    etree.SubElement(spr, m('ctrlPr'))
    e = etree.SubElement(s, m('e'))
    for x in (base_els if isinstance(base_els, list) else [base_els]):
        e.append(copy.deepcopy(x))
    sp = etree.SubElement(s, m('sup'))
    for x in (exp_els if isinstance(exp_els, list) else [exp_els]):
        sp.append(copy.deepcopy(x))
    return s

def sub(base_els, sub_els):
    s = etree.Element(m('sSub'))
    spr = etree.SubElement(s, m('sSubPr'))
    etree.SubElement(spr, m('ctrlPr'))
    e = etree.SubElement(s, m('e'))
    for x in (base_els if isinstance(base_els, list) else [base_els]):
        e.append(copy.deepcopy(x))
    sb = etree.SubElement(s, m('sub'))
    for x in (sub_els if isinstance(sub_els, list) else [sub_els]):
        sb.append(copy.deepcopy(x))
    return s

def subsup(base_els, sub_els, sup_els):
    s = etree.Element(m('sSubSup'))
    spr = etree.SubElement(s, m('sSubSupPr'))
    etree.SubElement(spr, m('ctrlPr'))
    e = etree.SubElement(s, m('e'))
    for x in (base_els if isinstance(base_els, list) else [base_els]):
        e.append(copy.deepcopy(x))
    sb = etree.SubElement(s, m('sub'))
    for x in (sub_els if isinstance(sub_els, list) else [sub_els]):
        sb.append(copy.deepcopy(x))
    sp = etree.SubElement(s, m('sup'))
    for x in (sup_els if isinstance(sup_els, list) else [sup_els]):
        sp.append(copy.deepcopy(x))
    return s

def sqrt(els):
    r = etree.Element(m('rad'))
    rpr = etree.SubElement(r, m('radPr'))
    dh = etree.SubElement(rpr, m('degHide'))
    dh.set(m('val'), '1')
    etree.SubElement(rpr, m('ctrlPr'))
    etree.SubElement(r, m('deg'))
    e = etree.SubElement(r, m('e'))
    for x in (els if isinstance(els, list) else [els]):
        e.append(copy.deepcopy(x))
    return r

def nroot(n_els, els):
    r = etree.Element(m('rad'))
    rpr = etree.SubElement(r, m('radPr'))
    etree.SubElement(rpr, m('ctrlPr'))
    deg = etree.SubElement(r, m('deg'))
    for x in (n_els if isinstance(n_els, list) else [n_els]):
        deg.append(copy.deepcopy(x))
    e = etree.SubElement(r, m('e'))
    for x in (els if isinstance(els, list) else [els]):
        e.append(copy.deepcopy(x))
    return r

def paren(els):
    d = etree.Element(m('d'))
    dpr = etree.SubElement(d, m('dPr'))
    bc = etree.SubElement(dpr, m('begChr')); bc.set(m('val'), '(')
    ec = etree.SubElement(dpr, m('endChr')); ec.set(m('val'), ')')
    etree.SubElement(dpr, m('ctrlPr'))
    e = etree.SubElement(d, m('e'))
    for x in (els if isinstance(els, list) else [els]):
        e.append(copy.deepcopy(x))
    return d

def absval(els):
    d = etree.Element(m('d'))
    dpr = etree.SubElement(d, m('dPr'))
    bc = etree.SubElement(dpr, m('begChr')); bc.set(m('val'), '|')
    ec = etree.SubElement(dpr, m('endChr')); ec.set(m('val'), '|')
    etree.SubElement(dpr, m('ctrlPr'))
    e = etree.SubElement(d, m('e'))
    for x in (els if isinstance(els, list) else [els]):
        e.append(copy.deepcopy(x))
    return d

def flatten(els):
    """Flatten nested lists of elements into a flat list."""
    result = []
    items = els if isinstance(els, list) else [els]
    for x in items:
        if isinstance(x, list):
            result.extend(flatten(x))
        else:
            result.append(x)
    return result

def intg(lo_els, hi_els, body_els):
    n = etree.Element(m('nary'))
    npr = etree.SubElement(n, m('naryPr'))
    ch = etree.SubElement(npr, m('chr')); ch.set(m('val'), '∫')
    ll = etree.SubElement(npr, m('limLoc')); ll.set(m('val'), 'subSup')
    etree.SubElement(npr, m('ctrlPr'))
    lo = etree.SubElement(n, m('sub'))
    for x in flatten(lo_els):
        lo.append(copy.deepcopy(x))
    hi = etree.SubElement(n, m('sup'))
    for x in flatten(hi_els):
        hi.append(copy.deepcopy(x))
    body = etree.SubElement(n, m('e'))
    for x in flatten(body_els):
        body.append(copy.deepcopy(x))
    return n

def lim_expr(to_text, body_els):
    ll = etree.Element(m('limLow'))
    lpr = etree.SubElement(ll, m('limLowPr'))
    etree.SubElement(lpr, m('ctrlPr'))
    e = etree.SubElement(ll, m('e'))
    e.append(mt('lim'))
    lim = etree.SubElement(ll, m('lim'))
    lim.append(mi('x'))
    lim.append(mt('→' + to_text))
    result = [ll]
    for x in flatten(body_els):
        result.append(copy.deepcopy(x))
    return result

def logb(base_text, arg_els):
    return [sub(mt('log'), mt(base_text)), paren(arg_els)]

def ln_func(arg_els):
    return [mt('ln'), paren(arg_els)]

# ===== oMath paragraph builder =====
def make_omath(*parts):
    """parts: list of (text_before, [omml_elements], text_after) or just text"""
    om = etree.Element(m('oMath'))
    for part in parts:
        if isinstance(part, str):
            om.append(mt(part))
        elif isinstance(part, list):
            for el in part:
                om.append(copy.deepcopy(el))
        else:
            om.append(copy.deepcopy(part))
    return om

def add_math_para(doc, *segments):
    """Add a paragraph mixing text runs and oMath elements."""
    para = doc.add_paragraph()
    para._p.clear()

    for seg in segments:
        if isinstance(seg, str):
            r = OxmlElement('w:r')
            t = OxmlElement('w:t')
            t.text = seg
            t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
            r.append(t)
            para._p.append(r)
        else:
            om = etree.Element(m('oMath'))
            for el in flatten(seg):
                om.append(copy.deepcopy(el))
            para._p.append(om)
    return para

def tp(doc, text):
    return doc.add_paragraph(text)

def th(doc, text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(13)
    return p

def blank(doc):
    doc.add_paragraph('')

# ===== Build document =====
doc = Document()
doc.styles['Normal'].font.name = 'Times New Roman'
doc.styles['Normal'].font.size = Pt(12)

th(doc, 'ĐỀ THI THỬ TỐT NGHIỆP THPT QUỐC GIA MÔN TOÁN')
th(doc, 'Thời gian làm bài: 90 phút (50 câu trắc nghiệm)')
blank(doc)

# ===== PHẦN I: HÀM SỐ =====
th(doc, 'PHẦN I. HÀM SỐ VÀ ĐỒ THỊ (Câu 1-8)')
blank(doc)

# Câu 1
add_math_para(doc, 'Câu 1. Hàm số ', [sup(mi('x'), mt('3')), mt('−3'), mi('x')], ' nghịch biến trên khoảng nào?')
tp(doc, 'A. (−1; 1) *')
tp(doc, 'B. (−∞; −1)')
tp(doc, 'C. (1; +∞)')
tp(doc, 'D. (−1; 0)')
blank(doc)

# Câu 2
add_math_para(doc, 'Câu 2. Hàm số ', [sup(mi('x'), mt('4')), mt('−2'), sup(mi('x'), mt('2')), mt('+3')], ' đạt cực tiểu bằng:')
add_math_para(doc, 'A. x = ±1, giá trị cực tiểu là 2 *')
tp(doc, 'B. x = 0, giá trị cực tiểu là 3')
tp(doc, 'C. x = 0, giá trị cực tiểu là 0')
tp(doc, 'D. x = ±1, giá trị cực tiểu là 0')
blank(doc)

# Câu 3
add_math_para(doc, 'Câu 3. Tìm m để hàm số ', frac([mi('x'), mt('+m')], [mi('x'), mt('−2')]), ' đồng biến trên từng khoảng xác định?')
tp(doc, 'A. m > 2')
tp(doc, 'B. m < −2')
tp(doc, 'C. m ≠ 2')
tp(doc, 'D. m ≠ −2 *')
blank(doc)

# Câu 4
add_math_para(doc, 'Câu 4. Đường tiệm cận ngang của đồ thị ', frac([mt('3'), mi('x'), mt('−1')], [mt('2'), mi('x'), mt('+5')]), ' là:')
add_math_para(doc, 'A. y = ', frac(mt('3'), mt('2')), ' *')
add_math_para(doc, 'B. y = −', frac(mt('1'), mt('5')))
tp(doc, 'C. y = 3')
tp(doc, 'D. y = 2')
blank(doc)

# Câu 5
add_math_para(doc, 'Câu 5. Giá trị lớn nhất của ', [sup(mi('x'), mt('3')), mt('−3'), mi('x')], ' trên đoạn [−2; 2] là:')
tp(doc, 'A. 2 *')
tp(doc, 'B. 4')
tp(doc, 'C. −2')
tp(doc, 'D. −4')
blank(doc)

# Câu 6
tp(doc, 'Câu 6. Hàm số nào sau đây có đúng 3 điểm cực trị?')
add_math_para(doc, 'A. y = ', [sup(mi('x'), mt('4')), mt('−2'), sup(mi('x'), mt('2'))], ' *')
add_math_para(doc, 'B. y = ', [sup(mi('x'), mt('3')), mt('+3'), mi('x')])
add_math_para(doc, 'C. y = ', frac([mi('x'), mt('+1')], [mi('x'), mt('−1')]))
add_math_para(doc, 'D. y = ', [sup(mi('x'), mt('2')), mt('−4'), mi('x'), mt('+3')])
blank(doc)

# Câu 7
add_math_para(doc, 'Câu 7. Tiếp tuyến của ', [sup(mi('x'), mt('3')), mt('−3'), sup(mi('x'), mt('2'))], ' tại x = 2 là:')
tp(doc, 'A. y = −4 *')
tp(doc, 'B. y = 0')
tp(doc, 'C. y = 4')
tp(doc, 'D. y = −8')
blank(doc)

# Câu 8
add_math_para(doc, 'Câu 8. Số điểm cực trị của ', sup(paren([sup(mi('x'), mt('2')), mt('−1')]), mt('3')), ':')
tp(doc, 'A. 1')
tp(doc, 'B. 2')
tp(doc, 'C. 3 *')
tp(doc, 'D. 0')
blank(doc)

# ===== PHẦN II: MŨ VÀ LOGARIT =====
th(doc, 'PHẦN II. HÀM SỐ MŨ VÀ LOGARIT (Câu 9-18)')
blank(doc)

# Câu 9
add_math_para(doc, 'Câu 9. Rút gọn ', [sup(mi('a'), frac(mt('2'), mt('3'))), mt('⋅'), sup(mi('a'), frac(mt('1'), mt('6')))], ' (a > 0):')
add_math_para(doc, 'A. ', sup(mi('a'), frac(mt('5'), mt('6'))), ' *')
add_math_para(doc, 'B. ', sup(mi('a'), frac(mt('1'), mt('4'))))
add_math_para(doc, 'C. ', sup(mi('a'), frac(mt('1'), mt('2'))))
tp(doc, 'D. a')
blank(doc)

# Câu 10
add_math_para(doc, 'Câu 10. Giá trị của ', sup(mt('27'), frac(mt('2'), mt('3'))), ' bằng:')
tp(doc, 'A. 3')
tp(doc, 'B. 6')
tp(doc, 'C. 9 *')
tp(doc, 'D. 18')
blank(doc)

# Câu 11
add_math_para(doc, 'Câu 11. Giải phương trình ', sup(mt('4'), mi('x')), ' = ', sup(mt('2'), [mi('x'), mt('+3')]), ':')
tp(doc, 'A. x = 1')
tp(doc, 'B. x = 2')
tp(doc, 'C. x = 3 *')
tp(doc, 'D. x = 4')
blank(doc)

# Câu 12
add_math_para(doc, 'Câu 12. Tính ', logb('2', mt('8')), ' + ', logb('2', mt('4')), ' − ', logb('2', mt('16')), ':')
tp(doc, 'A. 1 *')
tp(doc, 'B. 2')
tp(doc, 'C. 3')
tp(doc, 'D. 0')
blank(doc)

# Câu 13
add_math_para(doc, 'Câu 13. Giải bất phương trình ', logb('3', [mi('x'), mt('−1')]), ' ≥ 2:')
tp(doc, 'A. x ≥ 10 *')
tp(doc, 'B. x ≥ 9')
tp(doc, 'C. x ≥ 7')
tp(doc, 'D. x ≥ 4')
blank(doc)

# Câu 14
add_math_para(doc, 'Câu 14. Phương trình ', logb('2', [mi('x'), mt('+1')]), ' + ', logb('2', [mi('x'), mt('−1')]), ' = 3:')
tp(doc, 'A. x = 3 *')
add_math_para(doc, 'B. x = ', sqrt(mt('10')))
tp(doc, 'C. x = 2')
add_math_para(doc, 'D. x = ', sqrt(mt('7')))
blank(doc)

# Câu 15
add_math_para(doc, 'Câu 15. Bất phương trình ', sup(mt('2'), [sup(mi('x'), mt('2')), mt('−4')]), ' < ', sup(mt('2'), [mt('2'), mi('x'), mt('−3')]), ':')
tp(doc, 'A. 1 < x < 3 *')
tp(doc, 'B. x < 1 hoặc x > 3')
tp(doc, 'C. −3 < x < 1')
tp(doc, 'D. x < −3 hoặc x > 1')
blank(doc)

# Câu 16
add_math_para(doc, 'Câu 16. Tập xác định của ', ln_func([mt('3'), mi('x'), mt('−6')]), ':')
tp(doc, 'A. (2; +∞) *')
tp(doc, 'B. [−2; +∞)')
tp(doc, 'C. (−2; +∞)')
tp(doc, 'D. (3; +∞)')
blank(doc)

# Câu 17
add_math_para(doc, 'Câu 17. Đạo hàm của ', sup(mt('e'), [sup(mi('x'), mt('2')), mt('+1')]), ' là:')
add_math_para(doc, 'A. y’ = 2x⋅', sup(mt('e'), [sup(mi('x'), mt('2')), mt('+1')]), ' *')
add_math_para(doc, 'B. y’ = ', sup(mt('e'), [sup(mi('x'), mt('2')), mt('+1')]))
tp(doc, 'C. y’ = x²+1')
tp(doc, 'D. y’ = 2x')
blank(doc)

# Câu 18
add_math_para(doc, 'Câu 18. Nguyên hàm của ', frac(mt('1'), [mi('x'), mt('+2')]), ' là:')
add_math_para(doc, 'A. F(x) = ', ln_func(absval([mi('x'), mt('+2')])), ' + C *')
add_math_para(doc, 'B. F(x) = −', frac(mt('1'), sup(paren([mi('x'), mt('+2')]), mt('2'))), ' + C')
tp(doc, 'C. F(x) = ln(x+2)')
tp(doc, 'D. F(x) = (x+2)⋅ln(x+2) + C')
blank(doc)

# ===== PHẦN III: TÍCH PHÂN =====
th(doc, 'PHẦN III. TÍCH PHÂN VÀ ỨNG DỤNG (Câu 19-26)')
blank(doc)

# Câu 19
add_math_para(doc, 'Câu 19. Tính I = ', intg(mt('0'), mt('1'), [sup(mi('x'), mt('2')), mt(' d'), mi('x')]), ':')
add_math_para(doc, 'A. ', frac(mt('1'), mt('3')), ' *')
add_math_para(doc, 'B. ', frac(mt('1'), mt('2')))
tp(doc, 'C. 1')
add_math_para(doc, 'D. ', frac(mt('2'), mt('3')))
blank(doc)

# Câu 20
add_math_para(doc, 'Câu 20. Tính I = ', intg(mt('0'), mt('1'), [paren([sup(mi('x'), mt('2')), mt('+2'), mi('x'), mt('+1')]), mt(' d'), mi('x')]), ':')
add_math_para(doc, 'A. ', frac(mt('7'), mt('3')), ' *')
add_math_para(doc, 'B. ', frac(mt('5'), mt('3')))
add_math_para(doc, 'C. ', frac(mt('4'), mt('3')))
tp(doc, 'D. 2')
blank(doc)

# Câu 21
add_math_para(doc, 'Câu 21. Tính I = ', intg(mt('0'), frac(mt('π'), mt('2')), [mt('sin x d'), mi('x')]), ':')
tp(doc, 'A. 0')
tp(doc, 'B. 1 *')
tp(doc, 'C. 2')
tp(doc, 'D. −1')
blank(doc)

# Câu 22
add_math_para(doc, 'Câu 22. Tính I = ', intg(mt('1'), mt('e'), [ln_func(mi('x')), mt(' d'), mi('x')]), ':')
tp(doc, 'A. 0')
tp(doc, 'B. 1 *')
tp(doc, 'C. e')
tp(doc, 'D. e − 1')
blank(doc)

# Câu 23
add_math_para(doc, 'Câu 23. Tính I = ', intg(mt('0'), mt('1'), [mi('x'), sup(mt('e'), sup(mi('x'), mt('2'))), mt(' d'), mi('x')]), ':')
add_math_para(doc, 'A. ', frac([mt('e'), mt('−1')], mt('2')), ' *')
tp(doc, 'B. e − 1')
add_math_para(doc, 'C. ', frac(mt('e'), mt('2')))
tp(doc, 'D. 1')
blank(doc)

# Câu 24
add_math_para(doc, 'Câu 24. Diện tích giới hạn bởi y = ', sqrt(mi('x')), ' và y = x:')
add_math_para(doc, 'A. ', frac(mt('1'), mt('6')), ' *')
add_math_para(doc, 'B. ', frac(mt('1'), mt('3')))
add_math_para(doc, 'C. ', frac(mt('1'), mt('2')))
tp(doc, 'D. 1')
blank(doc)

# Câu 25
add_math_para(doc, 'Câu 25. Thể tích khi quay y = ', sqrt(mi('x')), ' (0 ≤ x ≤ 4) quanh Ox:')
tp(doc, 'A. 4π')
tp(doc, 'B. 6π')
tp(doc, 'C. 8π *')
tp(doc, 'D. 16π')
blank(doc)

# Câu 26
add_math_para(doc, 'Câu 26. Diện tích giới hạn bởi y = ', [sup(mi('x'), mt('2')), mt('−4')], ' và trục hoành:')
add_math_para(doc, 'A. ', frac(mt('32'), mt('3')), ' *')
add_math_para(doc, 'B. ', frac(mt('16'), mt('3')))
tp(doc, 'C. 8')
tp(doc, 'D. 16')
blank(doc)

# ===== PHẦN IV: SỐ PHỨC =====
th(doc, 'PHẦN IV. SỐ PHỨC (Câu 27-31)')
blank(doc)

tp(doc, 'Câu 27. Cho z = 3 − 4i. Môđun |z| bằng:')
tp(doc, 'A. 3')
tp(doc, 'B. 4')
tp(doc, 'C. 5 *')
tp(doc, 'D. 7')
blank(doc)

tp(doc, 'Câu 28. Tính (2 + 3i)(1 − 2i):')
tp(doc, 'A. 8 − i *')
tp(doc, 'B. 2 − 6i')
tp(doc, 'C. 8 + i')
tp(doc, 'D. 2 + 6i')
blank(doc)

add_math_para(doc, 'Câu 29. Số phức liên hợp của z = ', frac([mt('2+'), mi('i')], [mt('1−'), mi('i')]), ' là:')
add_math_para(doc, 'A. ', frac(mt('1'), mt('2')), ' − ', frac(mt('3'), mt('2')), 'i *')
add_math_para(doc, 'B. ', frac(mt('1'), mt('2')), ' + ', frac(mt('3'), mt('2')), 'i')
tp(doc, 'C. 1 + i')
tp(doc, 'D. 1 − i')
blank(doc)

tp(doc, 'Câu 30. Điểm biểu diễn z = −2 + 3i trên mặt phẳng tọa độ là:')
tp(doc, 'A. M(−2; 3) *')
tp(doc, 'B. M(2; −3)')
tp(doc, 'C. M(−2; −3)')
tp(doc, 'D. M(3; −2)')
blank(doc)

add_math_para(doc, 'Câu 31. Giải ', [sup(mi('z'), mt('2')), mt('+2'), mi('z'), mt('+5=0')], ':')
tp(doc, 'A. z = −1 ± 2i *')
tp(doc, 'B. z = 1 ± 2i')
tp(doc, 'C. z = −1 ± i')
tp(doc, 'D. Vô nghiệm trong C')
blank(doc)

# ===== PHẦN V: HÌNH HỌC KHÔNG GIAN =====
th(doc, 'PHẦN V. HÌNH HỌC KHÔNG GIAN (Câu 32-38)')
blank(doc)

tp(doc, 'Câu 32. Thể tích khối chóp S.ABCD đáy hình vuông cạnh a, SA ⊥ đáy, SA = a:')
add_math_para(doc, 'A. ', frac(sup(mi('a'), mt('3')), mt('3')), ' *')
add_math_para(doc, 'B. ', frac(sup(mi('a'), mt('3')), mt('6')))
add_math_para(doc, 'C. ', sup(mi('a'), mt('3')))
add_math_para(doc, 'D. ', frac(sup(mi('a'), mt('3')), mt('2')))
blank(doc)

tp(doc, 'Câu 33. Thể tích hình cầu bán kính R:')
add_math_para(doc, 'A. ', frac(mt('4'), mt('3')), 'π', sup(mi('R'), mt('3')), ' *')
add_math_para(doc, 'B. 4π', sup(mi('R'), mt('2')))
add_math_para(doc, 'C. ', frac(mt('2'), mt('3')), 'π', sup(mi('R'), mt('3')))
add_math_para(doc, 'D. ', frac(mt('1'), mt('3')), 'π', sup(mi('R'), mt('3')))
blank(doc)

tp(doc, 'Câu 34. Khoảng cách từ M(1, 2, 3) đến gốc tọa độ:')
add_math_para(doc, 'A. ', sqrt(mt('5')))
add_math_para(doc, 'B. ', sqrt(mt('14')), ' *')
add_math_para(doc, 'C. ', sqrt(mt('13')))
tp(doc, 'D. 6')
blank(doc)

tp(doc, 'Câu 35. Phương trình mặt phẳng qua M(1,0,−1), pháp tuyến n⃗=(2,−1,3):')
tp(doc, 'A. 2x − y + 3z = 0')
tp(doc, 'B. 2x − y + 3z − 5 = 0')
tp(doc, 'C. 2x − y + 3z + 1 = 0 *')
tp(doc, 'D. x − y + z = 0')
blank(doc)

tp(doc, 'Câu 36. Hình nón R = 3, h = 4. Thể tích:')
tp(doc, 'A. 12π *')
tp(doc, 'B. 36π')
tp(doc, 'C. 48π')
tp(doc, 'D. 9π')
blank(doc)

tp(doc, "Câu 37. Hình hộp chữ nhật ABCD.A'B'C'D', AB=a, AD=b, AA'=c. Đường chéo AG:")
add_math_para(doc, 'A. ', sqrt([sup(mi('a'), mt('2')), mt('+'), sup(mi('b'), mt('2')), mt('+'), sup(mi('c'), mt('2'))]), ' *')
add_math_para(doc, 'B. ', sqrt([sup(mi('a'), mt('2')), mt('+'), sup(mi('b'), mt('2'))]))
add_math_para(doc, 'C. ', sqrt([sup(mi('b'), mt('2')), mt('+'), sup(mi('c'), mt('2'))]))
tp(doc, 'D. a + b + c')
blank(doc)

tp(doc, 'Câu 38. Mặt cầu tâm I(1,−1,2), R=3:')
tp(doc, 'A. (x−1)²+(y+1)²+(z−2)²=9 *')
tp(doc, 'B. (x−1)²+(y+1)²+(z−2)²=3')
tp(doc, 'C. x²+y²+z²=9')
tp(doc, 'D. (x+1)²+(y−1)²+(z+2)²=9')
blank(doc)

# ===== PHẦN VI: XÁC SUẤT =====
th(doc, 'PHẦN VI. XÁC SUẤT THỐNG KÊ (Câu 39-42)')
blank(doc)

add_math_para(doc, 'Câu 39. Tính ', subsup(mi('C'), mt('5'), mt('2')), ':')
tp(doc, 'A. 5')
tp(doc, 'B. 10 *')
tp(doc, 'C. 15')
tp(doc, 'D. 20')
blank(doc)

tp(doc, 'Câu 40. Tung đồng xu 3 lần. Xác suất được đúng 2 mặt ngửa:')
add_math_para(doc, 'A. ', frac(mt('1'), mt('4')))
add_math_para(doc, 'B. ', frac(mt('3'), mt('8')), ' *')
add_math_para(doc, 'C. ', frac(mt('1'), mt('2')))
add_math_para(doc, 'D. ', frac(mt('1'), mt('8')))
blank(doc)

tp(doc, 'Câu 41. Tổ có 5 HS giỏi, 3 HS khá. Chọn 2 HS. Xác suất cả 2 giỏi:')
add_math_para(doc, 'A. ', frac(mt('5'), mt('14')), ' *')
add_math_para(doc, 'B. ', frac(mt('25'), mt('64')))
add_math_para(doc, 'C. ', frac(mt('1'), mt('4')))
add_math_para(doc, 'D. ', frac(mt('10'), mt('28')))
blank(doc)

tp(doc, 'Câu 42. Xác suất tung 2 xúc xắc có tổng = 7:')
add_math_para(doc, 'A. ', frac(mt('1'), mt('6')), ' *')
add_math_para(doc, 'B. ', frac(mt('1'), mt('12')))
add_math_para(doc, 'C. ', frac(mt('1'), mt('36')))
add_math_para(doc, 'D. ', frac(mt('5'), mt('36')))
blank(doc)

# ===== PHẦN VII: TỔNG HỢP =====
th(doc, 'PHẦN VII. CÂU HỎI TỔNG HỢP (Câu 43-50)')
blank(doc)

add_math_para(doc, 'Câu 43. [MULTI] Hàm số y = ', [sup(mi('x'), mt('3')), mt('−3'), mi('x')], ' có tính chất nào đúng?')
tp(doc, 'A. Đồng biến trên (−∞;−1) và (1;+∞) *')
tp(doc, 'B. Nghịch biến trên (−1;1) *')
tp(doc, 'C. Đạt cực đại tại x = −1 *')
tp(doc, 'D. Đạt cực tiểu tại x = 1 *')
blank(doc)

tp(doc, 'Câu 44. [MULTI] Khẳng định nào đúng về tích phân?')
add_math_para(doc, 'A. ', intg(mt('a'), mt('b'), mt('f(x)dx')), ' = −', intg(mt('b'), mt('a'), mt('f(x)dx')), ' *')
add_math_para(doc, 'B. ', intg(mt('a'), mt('a'), mt('f(x)dx')), ' = 0 *')
add_math_para(doc, 'C. ', intg(mt('a'), mt('b'), [mt('k⋅f(x)dx')]), ' = k⋅', intg(mt('a'), mt('b'), mt('f(x)dx')), ' *')
tp(doc, 'D. Tích phân hàm chẵn trên [-a,a] bằng 0 (sai)')
blank(doc)

tp(doc, 'Câu 45. [DUNG/SAI] Xác định đúng/sai:')
add_math_para(doc, 'A. ', logb('2', mt('8')), ' = 3. (đúng)')
add_math_para(doc, 'B. ', logb('3', mt('1')), ' = 1. (sai)')
add_math_para(doc, 'C. ', logb('a', mt('1')), ' = 0 với a>0, a≠1. (đúng)')
add_math_para(doc, 'D. ', logb('a', sup(mi('a'), mt('n'))), ' = n. (đúng)')
blank(doc)

add_math_para(doc, 'Câu 46. [DUNG/SAI] Cho y = ', frac([mt('2'), mi('x')], [mi('x'), mt('−1')]), '. Xác định đúng/sai:')
tp(doc, 'A. Miền xác định D = R\\{1}. (đúng)')
tp(doc, 'B. Hàm đồng biến trên từng khoảng xác định. (sai)')
tp(doc, 'C. Tiệm cận ngang y = 2. (đúng)')
tp(doc, 'D. Tiệm cận đứng x = 1. (đúng)')
blank(doc)

add_math_para(doc, 'Câu 47. Bất phương trình ', sup(mt('2'), [sup(mi('x'), mt('2')), mt('−3'), mi('x')]), ' < ', sup(mt('2'), [mt('2'), mi('x'), mt('−4')]), ':')
tp(doc, 'A. 1 < x < 4 *')
tp(doc, 'B. x < 1 hoặc x > 4')
tp(doc, 'C. −4 < x < −1')
tp(doc, 'D. x < −4 hoặc x > −1')
blank(doc)

add_math_para(doc, 'Câu 48. Số nghiệm của ', ln_func([sup(mi('x'), mt('2')), mt('−3'), mi('x'), mt('+3')]), ' = 0:')
tp(doc, 'A. 0')
tp(doc, 'B. 1')
tp(doc, 'C. 2 *')
tp(doc, 'D. 3')
blank(doc)

add_math_para(doc, 'Câu 49. [MULTI] f(x) = ', [sup(mi('x'), mt('3')), mt('−3'), sup(mi('x'), mt('2')), mt('−9'), mi('x'), mt('+2')], '. Khẳng định đúng:')
tp(doc, "A. f'(x) = 3x² − 6x − 9 *")
tp(doc, 'B. Cực đại f(−1) = 7 *')
tp(doc, 'C. Cực tiểu f(3) = −25 *')
tp(doc, 'D. Hàm tăng trên (−∞;−1) *')
blank(doc)

add_math_para(doc, 'Câu 50. Giới hạn ', lim_expr('+∞', frac(sqrt([sup(mi('x'), mt('2')), mt('+1')]), [mi('x'), mt('+2')])), ' bằng:')
tp(doc, 'A. 0')
tp(doc, 'B. 1 *')
tp(doc, 'C. 2')
tp(doc, 'D. +∞')
blank(doc)

doc.save('data/de-toan-demo3.docx')
print('OK: data/de-toan-demo3.docx')
