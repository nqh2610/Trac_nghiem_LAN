# Tạo đề toán THPT 50 câu bằng python-docx
# Công thức dạng LaTeX text (để test import + KaTeX render)
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document()

# Style chung
style = doc.styles['Normal']
style.font.name = 'Times New Roman'
style.font.size = Pt(12)

def h(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(13)
    return p

def q(text):
    return doc.add_paragraph(text)

def blank():
    doc.add_paragraph('')

h('ĐỀ THI THỬ TỐT NGHIỆP THPT QUỐC GIA MÔN TOÁN')
h('Thời gian làm bài: 90 phút (50 câu trắc nghiệm)')
blank()

# ===== PHẦN I: HÀM SỐ =====
h('PHẦN I. HÀM SỐ VÀ ĐỒ THỊ (Câu 1-8)')
blank()

q('Câu 1. Hàm số \\(y = x^3 - 3x\\) nghịch biến trên khoảng nào?')
q('A. \\((-1; 1)\\) *')
q('B. \\((-\\infty; -1)\\)')
q('C. \\((1; +\\infty)\\)')
q('D. \\((-1; 0)\\)')
blank()

q('Câu 2. Hàm số \\(y = x^4 - 2x^2 + 3\\) đạt cực tiểu tại:')
q('A. \\(x = 0\\), giá trị cực tiểu là 3')
q('B. \\(x = \\pm 1\\), giá trị cực tiểu là 2 *')
q('C. \\(x = 0\\), giá trị cực tiểu là 0')
q('D. \\(x = \\pm 1\\), giá trị cực tiểu là 0')
blank()

q('Câu 3. Tìm \\(m\\) để hàm số \\(y = \\dfrac{x+m}{x-2}\\) đồng biến trên từng khoảng xác định?')
q('A. \\(m > 2\\)')
q('B. \\(m < -2\\)')
q('C. \\(m \\neq 2\\)')
q('D. \\(m \\neq -2\\) *')
blank()

q('Câu 4. Đường tiệm cận ngang của đồ thị \\(y = \\dfrac{3x-1}{2x+5}\\) là:')
q('A. \\(y = \\dfrac{3}{2}\\) *')
q('B. \\(y = -\\dfrac{1}{5}\\)')
q('C. \\(y = 3\\)')
q('D. \\(y = 2\\)')
blank()

q('Câu 5. Giá trị lớn nhất của hàm số \\(y = x^3 - 3x\\) trên đoạn \\([-2; 2]\\) là:')
q('A. 2 *')
q('B. 4')
q('C. -2')
q('D. -4')
blank()

q('Câu 6. Hàm số nào sau đây có đúng 3 điểm cực trị?')
q('A. \\(y = x^4 - 2x^2\\) *')
q('B. \\(y = x^3 + 3x\\)')
q('C. \\(y = \\dfrac{x+1}{x-1}\\)')
q('D. \\(y = x^2 - 4x + 3\\)')
blank()

q('Câu 7. Phương trình tiếp tuyến của đồ thị \\(y = x^3 - 3x^2\\) tại điểm có hoành độ \\(x = 2\\) là:')
q('A. \\(y = -4\\) *')
q('B. \\(y = 0\\)')
q('C. \\(y = 4\\)')
q('D. \\(y = -8\\)')
blank()

q('Câu 8. Số điểm cực trị của hàm số \\(y = (x^2 - 1)^3\\) là:')
q('A. 1')
q('B. 2')
q('C. 3 *')
q('D. 0')
blank()

# ===== PHẦN II: MŨ VÀ LOGARIT =====
h('PHẦN II. HÀM SỐ MŨ VÀ LOGARIT (Câu 9-18)')
blank()

q('Câu 9. Rút gọn biểu thức \\(P = a^{\\frac{2}{3}} \\cdot a^{\\frac{1}{6}}\\) (\\(a > 0\\)):')
q('A. \\(a^{\\frac{5}{6}}\\) *')
q('B. \\(a^{\\frac{1}{4}}\\)')
q('C. \\(a^{\\frac{1}{2}}\\)')
q('D. \\(a\\)')
blank()

q('Câu 10. Giá trị của \\(27^{\\frac{2}{3}}\\) bằng:')
q('A. 3')
q('B. 6')
q('C. 9 *')
q('D. 18')
blank()

q('Câu 11. Giải phương trình \\(4^x = 2^{x+3}\\):')
q('A. \\(x = 1\\)')
q('B. \\(x = 2\\)')
q('C. \\(x = 3\\) *')
q('D. \\(x = 4\\)')
blank()

q('Câu 12. Tính \\(\\log_2 8 + \\log_2 4 - \\log_2 16\\):')
q('A. 1 *')
q('B. 2')
q('C. 3')
q('D. 0')
blank()

q('Câu 13. Giải bất phương trình \\(\\log_3(x-1) \\geq 2\\):')
q('A. \\(x \\geq 10\\) *')
q('B. \\(x \\geq 9\\)')
q('C. \\(x \\geq 7\\)')
q('D. \\(x \\geq 4\\)')
blank()

q('Câu 14. Giải phương trình \\(\\log_2(x+1) + \\log_2(x-1) = 3\\):')
q('A. \\(x = 3\\) *')
q('B. \\(x = \\sqrt{10}\\)')
q('C. \\(x = 2\\)')
q('D. \\(x = \\sqrt{7}\\)')
blank()

q('Câu 15. Giải bất phương trình \\(2^{x^2-4} < 2^{2x-3}\\):')
q('A. \\(1 < x < 3\\) *')
q('B. \\(x < 1\\) hoặc \\(x > 3\\)')
q('C. \\(-3 < x < 1\\)')
q('D. \\(x < -3\\) hoặc \\(x > 1\\)')
blank()

q('Câu 16. Tập xác định của hàm số \\(y = \\ln(3x - 6)\\) là:')
q('A. \\((2; +\\infty)\\) *')
q('B. \\([-2; +\\infty)\\)')
q('C. \\((-2; +\\infty)\\)')
q('D. \\((3; +\\infty)\\)')
blank()

q("Câu 17. Đạo hàm của hàm số \\(y = e^{x^2+1}\\) là:")
q("A. \\(y' = 2x \\cdot e^{x^2+1}\\) *")
q("B. \\(y' = e^{x^2+1}\\)")
q("C. \\(y' = x^2+1\\)")
q("D. \\(y' = 2x\\)")
blank()

q('Câu 18. Nguyên hàm của \\(f(x) = \\dfrac{1}{x+2}\\) là:')
q('A. \\(F(x) = \\ln|x+2| + C\\) *')
q('B. \\(F(x) = -\\dfrac{1}{(x+2)^2} + C\\)')
q('C. \\(F(x) = \\ln(x+2)\\)')
q('D. \\(F(x) = (x+2)\\ln(x+2) + C\\)')
blank()

# ===== PHẦN III: TÍCH PHÂN =====
h('PHẦN III. TÍCH PHÂN VÀ ỨNG DỤNG (Câu 19-26)')
blank()

q('Câu 19. Tính \\(I = \\int_0^1 x^2\\,dx\\):')
q('A. \\(\\dfrac{1}{3}\\) *')
q('B. \\(\\dfrac{1}{2}\\)')
q('C. 1')
q('D. \\(\\dfrac{2}{3}\\)')
blank()

q('Câu 20. Tính \\(I = \\int_0^1 (x^2 + 2x + 1)\\,dx\\):')
q('A. \\(\\dfrac{7}{3}\\) *')
q('B. \\(\\dfrac{5}{3}\\)')
q('C. \\(\\dfrac{4}{3}\\)')
q('D. 2')
blank()

q('Câu 21. Tính \\(I = \\int_0^{\\frac{\\pi}{2}} \\sin x\\,dx\\):')
q('A. 0')
q('B. 1 *')
q('C. 2')
q('D. -1')
blank()

q('Câu 22. Tính \\(I = \\int_1^e \\ln x\\,dx\\):')
q('A. 0')
q('B. 1 *')
q('C. e')
q('D. e - 1')
blank()

q('Câu 23. Tính \\(I = \\int_0^1 x e^{x^2}\\,dx\\):')
q('A. \\(\\dfrac{e-1}{2}\\) *')
q('B. \\(e - 1\\)')
q('C. \\(\\dfrac{e}{2}\\)')
q('D. 1')
blank()

q('Câu 24. Diện tích hình phẳng giới hạn bởi \\(y = \\sqrt{x}\\) và \\(y = x\\) là:')
q('A. \\(\\dfrac{1}{6}\\) *')
q('B. \\(\\dfrac{1}{3}\\)')
q('C. \\(\\dfrac{1}{2}\\)')
q('D. 1')
blank()

q('Câu 25. Thể tích vật thể tròn xoay khi quay \\(y = \\sqrt{x}\\), \\(0 \\leq x \\leq 4\\) quanh \\(Ox\\) là:')
q('A. \\(4\\pi\\)')
q('B. \\(6\\pi\\)')
q('C. \\(8\\pi\\) *')
q('D. \\(16\\pi\\)')
blank()

q('Câu 26. Diện tích hình phẳng giới hạn bởi \\(y = x^2 - 4\\) và trục hoành là:')
q('A. \\(\\dfrac{32}{3}\\) *')
q('B. \\(\\dfrac{16}{3}\\)')
q('C. 8')
q('D. 16')
blank()

# ===== PHẦN IV: SỐ PHỨC =====
h('PHẦN IV. SỐ PHỨC (Câu 27-31)')
blank()

q('Câu 27. Cho số phức \\(z = 3 - 4i\\). Môđun \\(|z|\\) bằng:')
q('A. 3')
q('B. 4')
q('C. 5 *')
q('D. 7')
blank()

q('Câu 28. Tính \\((2 + 3i)(1 - 2i)\\):')
q('A. \\(8 - i\\) *')
q('B. \\(2 - 6i\\)')
q('C. \\(8 + i\\)')
q('D. \\(2 + 6i\\)')
blank()

q('Câu 29. Số phức liên hợp của \\(z = \\dfrac{2+i}{1-i}\\) là:')
q('A. \\(\\dfrac{1}{2} - \\dfrac{3}{2}i\\) *')
q('B. \\(\\dfrac{1}{2} + \\dfrac{3}{2}i\\)')
q('C. \\(1 + i\\)')
q('D. \\(1 - i\\)')
blank()

q('Câu 30. Điểm biểu diễn số phức \\(z = -2 + 3i\\) trên mặt phẳng tọa độ là:')
q('A. \\(M(-2;\\, 3)\\) *')
q('B. \\(M(2;\\, -3)\\)')
q('C. \\(M(-2;\\, -3)\\)')
q('D. \\(M(3;\\, -2)\\)')
blank()

q('Câu 31. Giải phương trình \\(z^2 + 2z + 5 = 0\\):')
q('A. \\(z = -1 \\pm 2i\\) *')
q('B. \\(z = 1 \\pm 2i\\)')
q('C. \\(z = -1 \\pm i\\)')
q('D. Vô nghiệm trong \\(\\mathbb{C}\\)')
blank()

# ===== PHẦN V: HÌNH HỌC KHÔNG GIAN =====
h('PHẦN V. HÌNH HỌC KHÔNG GIAN (Câu 32-38)')
blank()

q('Câu 32. Thể tích khối chóp S.ABCD có đáy là hình vuông cạnh \\(a\\), \\(SA \\perp\\) đáy, \\(SA = a\\) là:')
q('A. \\(\\dfrac{a^3}{3}\\) *')
q('B. \\(\\dfrac{a^3}{6}\\)')
q('C. \\(a^3\\)')
q('D. \\(\\dfrac{a^3}{2}\\)')
blank()

q('Câu 33. Thể tích hình cầu bán kính \\(R\\) là:')
q('A. \\(\\dfrac{4}{3}\\pi R^3\\) *')
q('B. \\(4\\pi R^2\\)')
q('C. \\(\\dfrac{2}{3}\\pi R^3\\)')
q('D. \\(\\dfrac{1}{3}\\pi R^3\\)')
blank()

q('Câu 34. Trong không gian \\(Oxyz\\), khoảng cách từ \\(M(1, 2, 3)\\) đến gốc tọa độ là:')
q('A. \\(\\sqrt{5}\\)')
q('B. \\(\\sqrt{14}\\) *')
q('C. \\(\\sqrt{13}\\)')
q('D. 6')
blank()

q('Câu 35. Phương trình mặt phẳng qua \\(M(1, 0, -1)\\), vectơ pháp tuyến \\(\\vec{n} = (2, -1, 3)\\) là:')
q('A. \\(2x - y + 3z = 0\\)')
q('B. \\(2x - y + 3z - 5 = 0\\)')
q('C. \\(2x - y + 3z + 1 = 0\\) *')
q('D. \\(x - y + z = 0\\)')
blank()

q('Câu 36. Hình nón có bán kính \\(R = 3\\), chiều cao \\(h = 4\\). Thể tích là:')
q('A. \\(12\\pi\\) *')
q('B. \\(36\\pi\\)')
q('C. \\(48\\pi\\)')
q('D. \\(9\\pi\\)')
blank()

q('Câu 37. Cho hình hộp chữ nhật \\(ABCD.A\'B\'C\'D\'\\) có \\(AB = a\\), \\(AD = b\\), \\(AA\' = c\\). Đường chéo \\(AG\\) có độ dài:')
q('A. \\(\\sqrt{a^2 + b^2 + c^2}\\) *')
q('B. \\(\\sqrt{a^2 + b^2}\\)')
q('C. \\(\\sqrt{b^2 + c^2}\\)')
q('D. \\(a + b + c\\)')
blank()

q('Câu 38. Mặt cầu tâm \\(I(1, -1, 2)\\), bán kính \\(R = 3\\) có phương trình:')
q('A. \\((x-1)^2 + (y+1)^2 + (z-2)^2 = 9\\) *')
q('B. \\((x-1)^2 + (y+1)^2 + (z-2)^2 = 3\\)')
q('C. \\(x^2 + y^2 + z^2 = 9\\)')
q('D. \\((x+1)^2 + (y-1)^2 + (z+2)^2 = 9\\)')
blank()

# ===== PHẦN VI: XÁC SUẤT =====
h('PHẦN VI. XÁC SUẤT THỐNG KÊ (Câu 39-42)')
blank()

q('Câu 39. Tính \\(C_5^2\\):')
q('A. 5')
q('B. 10 *')
q('C. 15')
q('D. 20')
blank()

q('Câu 40. Tung đồng xu 3 lần. Xác suất được đúng 2 mặt ngửa là:')
q('A. \\(\\dfrac{1}{4}\\)')
q('B. \\(\\dfrac{3}{8}\\) *')
q('C. \\(\\dfrac{1}{2}\\)')
q('D. \\(\\dfrac{1}{8}\\)')
blank()

q('Câu 41. Tổ có 5 HS giỏi và 3 HS khá. Chọn ngẫu nhiên 2 HS. Xác suất cả 2 đều giỏi là:')
q('A. \\(\\dfrac{5}{14}\\) *')
q('B. \\(\\dfrac{25}{64}\\)')
q('C. \\(\\dfrac{1}{4}\\)')
q('D. \\(\\dfrac{10}{28}\\)')
blank()

q('Câu 42. Xác suất khi tung 2 xúc xắc có tổng = 7 là:')
q('A. \\(\\dfrac{1}{6}\\) *')
q('B. \\(\\dfrac{1}{12}\\)')
q('C. \\(\\dfrac{1}{36}\\)')
q('D. \\(\\dfrac{5}{36}\\)')
blank()

# ===== PHẦN VII: CÂU HỎI TỔNG HỢP =====
h('PHẦN VII. CÂU HỎI TỔNG HỢP (Câu 43-50)')
blank()

q('Câu 43. [MULTI] Hàm số \\(y = x^3 - 3x\\) có các tính chất nào sau đây đúng?')
q('A. Đồng biến trên \\((-\\infty; -1)\\) và \\((1; +\\infty)\\) *')
q('B. Nghịch biến trên \\((-1; 1)\\) *')
q('C. Đạt cực đại tại \\(x = -1\\) *')
q('D. Đạt cực tiểu tại \\(x = 1\\) *')
blank()

q('Câu 44. [MULTI] Các khẳng định nào đúng về tích phân?')
q('A. \\(\\int_a^b f(x)\\,dx = -\\int_b^a f(x)\\,dx\\) *')
q('B. \\(\\int_a^a f(x)\\,dx = 0\\) *')
q('C. \\(\\int_a^b k f(x)\\,dx = k\\int_a^b f(x)\\,dx\\) *')
q('D. Tích phân của hàm chẵn trên \\([-a, a]\\) bằng 0 (sai)')
blank()

q('Câu 45. [DUNG/SAI] Xác định đúng/sai:')
q('A. \\(\\log_2 8 = 3\\). (đúng)')
q('B. \\(\\log_3 1 = 1\\). (sai)')
q('C. \\(\\log_a 1 = 0\\) với mọi \\(a > 0, a \\neq 1\\). (đúng)')
q('D. \\(\\log_a a^n = n\\) với \\(a > 0, a \\neq 1\\). (đúng)')
blank()

q('Câu 46. [DUNG/SAI] Cho hàm số \\(y = \\dfrac{2x}{x-1}\\). Xác định đúng/sai:')
q('A. Miền xác định \\(D = \\mathbb{R} \\setminus \\{1\\}\\). (đúng)')
q('B. Hàm số đồng biến trên từng khoảng xác định. (sai)')
q('C. Đồ thị có tiệm cận ngang \\(y = 2\\). (đúng)')
q('D. Đồ thị có tiệm cận đứng \\(x = 1\\). (đúng)')
blank()

q('Câu 47. Bất phương trình \\(2^{x^2-3x} < 2^{2x-4}\\) có nghiệm là:')
q('A. \\(1 < x < 4\\) *')
q('B. \\(x < 1\\) hoặc \\(x > 4\\)')
q('C. \\(-4 < x < -1\\)')
q('D. \\(x < -4\\) hoặc \\(x > -1\\)')
blank()

q('Câu 48. Số nghiệm của phương trình \\(\\ln(x^2 - 3x + 3) = 0\\) là:')
q('A. 0')
q('B. 1')
q('C. 2 *')
q('D. 3')
blank()

q("Câu 49. [MULTI] Hàm số \\(f(x) = x^3 - 3x^2 - 9x + 2\\). Chọn các khẳng định đúng:")
q("A. \\(f'(x) = 3x^2 - 6x - 9\\) *")
q('B. Cực đại \\(f(-1) = 7\\) *')
q('C. Cực tiểu \\(f(3) = -25\\) *')
q('D. Hàm tăng trên \\((-\\infty; -1)\\) *')
blank()

q('Câu 50. Giới hạn \\(\\lim_{x \\to +\\infty} \\dfrac{\\sqrt{x^2+1}}{x+2}\\) bằng:')
q('A. 0')
q('B. 1 *')
q('C. 2')
q('D. \\(+\\infty\\)')
blank()

doc.save('data/de-toan-thpt-mau2.docx')
print('OK: data/de-toan-thpt-mau2.docx')
