const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');

async function createSampleDoc() {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "MẪU CÂU HỎI TRẮC NGHIỆM SQL",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "HƯỚNG DẪN SOẠN CÂU HỎI:", bold: true }),
                    ]
                }),
                new Paragraph({ text: "• Mỗi câu hỏi bắt đầu bằng \"Câu X:\" hoặc \"Câu X.\" (X là số thứ tự)" }),
                new Paragraph({ text: "• Các đáp án bắt đầu bằng A. B. C. D." }),
                new Paragraph({ text: "• Đánh dấu đáp án đúng bằng dấu * sau đáp án" }),
                new Paragraph({ text: "• Nếu KHÔNG có dấu *, hệ thống sẽ mặc định đáp án A là đúng" }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" }),
                new Paragraph({ text: "" }),
                
                // Câu 1
                new Paragraph({
                    children: [
                        new TextRun({ text: "Câu 1: ", bold: true }),
                        new TextRun("Lệnh SQL nào dùng để tạo bảng mới trong cơ sở dữ liệu?"),
                    ]
                }),
                new Paragraph({ text: "A. CREATE TABLE" }),
                new Paragraph({ text: "B. NEW TABLE" }),
                new Paragraph({ text: "C. MAKE TABLE" }),
                new Paragraph({ text: "D. ADD TABLE" }),
                new Paragraph({ text: "" }),
                
                // Câu 2
                new Paragraph({
                    children: [
                        new TextRun({ text: "Câu 2: ", bold: true }),
                        new TextRun("Để thêm dữ liệu mới vào bảng, ta sử dụng lệnh nào?"),
                    ]
                }),
                new Paragraph({ text: "A. INSERT INTO" }),
                new Paragraph({ text: "B. ADD INTO" }),
                new Paragraph({ text: "C. UPDATE INTO" }),
                new Paragraph({ text: "D. PUT INTO" }),
                new Paragraph({ text: "" }),
                
                // Câu 3
                new Paragraph({
                    children: [
                        new TextRun({ text: "Câu 3: ", bold: true }),
                        new TextRun("Lệnh nào dùng để cập nhật dữ liệu trong bảng?"),
                    ]
                }),
                new Paragraph({ text: "A. UPDATE" }),
                new Paragraph({ text: "B. MODIFY" }),
                new Paragraph({ text: "C. CHANGE" }),
                new Paragraph({ text: "D. ALTER" }),
                new Paragraph({ text: "" }),
                
                // Câu 4
                new Paragraph({
                    children: [
                        new TextRun({ text: "Câu 4: ", bold: true }),
                        new TextRun("Để xóa dữ liệu từ bảng, ta sử dụng lệnh nào?"),
                    ]
                }),
                new Paragraph({ text: "A. DELETE FROM" }),
                new Paragraph({ text: "B. REMOVE FROM" }),
                new Paragraph({ text: "C. DROP FROM" }),
                new Paragraph({ text: "D. ERASE FROM" }),
                new Paragraph({ text: "" }),
                
                // Câu 5
                new Paragraph({
                    children: [
                        new TextRun({ text: "Câu 5: ", bold: true }),
                        new TextRun("Lệnh nào dùng để xóa hoàn toàn một bảng khỏi CSDL?"),
                    ]
                }),
                new Paragraph({ text: "A. DROP TABLE" }),
                new Paragraph({ text: "B. DELETE TABLE" }),
                new Paragraph({ text: "C. REMOVE TABLE" }),
                new Paragraph({ text: "D. DESTROY TABLE" }),
                new Paragraph({ text: "" }),
                
                new Paragraph({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "LƯU Ý:", bold: true, color: "FF0000" }),
                    ]
                }),
                new Paragraph({ text: "1. Nếu không đánh dấu *, đáp án A sẽ được chọn làm đáp án đúng mặc định" }),
                new Paragraph({ text: "2. Mỗi câu phải có đủ 4 đáp án A, B, C, D" }),
                new Paragraph({ text: "3. Lưu file định dạng .docx" }),
            ]
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(__dirname, 'data', 'mau-cau-hoi.docx');
    fs.writeFileSync(outputPath, buffer);
    console.log('✅ Đã tạo file mẫu:', outputPath);
}

createSampleDoc();
