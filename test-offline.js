/**
 * Test OFFLINE - không cần server chạy
 * Kiểm tra logic đảo đề và chấm điểm
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log('   🧪 KIỂM TRA LOGIC ĐẢO ĐỀ VÀ CHẤM ĐIỂM (OFFLINE)');
console.log('═══════════════════════════════════════════════════════════\n');

// Đọc câu hỏi từ file
const questionsPath = path.join(__dirname, 'data', 'questions.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
console.log(`📋 Đã tải ${questions.length} câu hỏi từ file\n`);

// Copy các hàm shuffle từ index.html
function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function shuffleWithSeed(array, seed) {
    const shuffled = [...array];
    let currentSeed = seed;
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

function generateQuestionOrder(totalQuestions, studentSTT) {
    const seed = studentSTT * 1000;
    const indices = Array.from({ length: totalQuestions }, (_, i) => i);
    return shuffleWithSeed(indices, seed);
}

function generateOptionOrders(totalQuestions, studentSTT) {
    const orders = [];
    for (let i = 0; i < totalQuestions; i++) {
        const seed = studentSTT * 1000 + i + 1;
        const optionIndices = [0, 1, 2, 3];
        orders.push(shuffleWithSeed(optionIndices, seed));
    }
    return orders;
}

// ====== TEST 1: Kiểm tra đảo thứ tự câu hỏi ======
console.log('📋 TEST 1: Đảo thứ tự câu hỏi');
console.log('─────────────────────────────────────────────────────────────');

const stt1 = 1, stt2 = 2, stt3 = 10;
const order1 = generateQuestionOrder(questions.length, stt1);
const order2 = generateQuestionOrder(questions.length, stt2);
const order3 = generateQuestionOrder(questions.length, stt3);

console.log(`STT ${stt1}: [${order1.join(', ')}]`);
console.log(`STT ${stt2}: [${order2.join(', ')}]`);
console.log(`STT ${stt3}: [${order3.join(', ')}]`);

const allOrdersDifferent = JSON.stringify(order1) !== JSON.stringify(order2) &&
                           JSON.stringify(order2) !== JSON.stringify(order3);
console.log(`\n${allOrdersDifferent ? '✅ PASS' : '❌ FAIL'}: Các học sinh có thứ tự câu hỏi khác nhau\n`);

// ====== TEST 2: Kiểm tra đảo thứ tự đáp án ======
console.log('📋 TEST 2: Đảo thứ tự đáp án');
console.log('─────────────────────────────────────────────────────────────');

const opts1 = generateOptionOrders(questions.length, stt1);
const opts2 = generateOptionOrders(questions.length, stt2);

console.log(`STT ${stt1} câu 1-3: [${opts1[0].join(',')}] [${opts1[1].join(',')}] [${opts1[2].join(',')}]`);
console.log(`STT ${stt2} câu 1-3: [${opts2[0].join(',')}] [${opts2[1].join(',')}] [${opts2[2].join(',')}]`);

const optionsDifferent = JSON.stringify(opts1) !== JSON.stringify(opts2);
console.log(`\n${optionsDifferent ? '✅ PASS' : '❌ FAIL'}: Các học sinh có thứ tự đáp án khác nhau\n`);

// ====== TEST 3: Kiểm tra tính nhất quán (deterministic) ======
console.log('📋 TEST 3: Tính nhất quán (cùng STT → cùng đề)');
console.log('─────────────────────────────────────────────────────────────');

const order1_v2 = generateQuestionOrder(questions.length, stt1);
const opts1_v2 = generateOptionOrders(questions.length, stt1);

const isConsistent = JSON.stringify(order1) === JSON.stringify(order1_v2) &&
                     JSON.stringify(opts1) === JSON.stringify(opts1_v2);
console.log(`Lần 1: [${order1.slice(0,5).join(',')}...]`);
console.log(`Lần 2: [${order1_v2.slice(0,5).join(',')}...]`);
console.log(`\n${isConsistent ? '✅ PASS' : '❌ FAIL'}: Cùng STT cho ra cùng thứ tự đề\n`);

// ====== TEST 4: Mô phỏng làm bài và chấm điểm ======
console.log('📋 TEST 4: Mô phỏng làm bài và chấm điểm');
console.log('─────────────────────────────────────────────────────────────');

const testSTT = 5;
const questionOrder = generateQuestionOrder(questions.length, testSTT);
const optionOrders = generateOptionOrders(questions.length, testSTT);

console.log(`\nHọc sinh STT ${testSTT} làm bài:`);
console.log(`Thứ tự câu hỏi: [${questionOrder.join(', ')}]\n`);

// Mô phỏng: học sinh trả lời đúng 10 câu đầu, sai 10 câu sau
const studentDisplayAnswers = [];
let expectedCorrect = 0;

console.log('Chi tiết làm bài (5 câu đầu):');
for (let displayIdx = 0; displayIdx < questions.length; displayIdx++) {
    const origIdx = questionOrder[displayIdx];
    const optOrder = optionOrders[displayIdx];
    const origQ = questions[origIdx];
    
    // Đáp án đúng gốc (0=A, 1=B, 2=C, 3=D)
    const correctOriginal = origQ.correct;
    // Vị trí đáp án đúng sau khi đảo
    const correctDisplay = optOrder.indexOf(correctOriginal);
    
    // Học sinh trả lời: 10 câu đầu đúng, 10 câu sau sai
    let studentAnswer;
    if (displayIdx < 10) {
        studentAnswer = correctDisplay; // Trả lời đúng
        expectedCorrect++;
    } else {
        studentAnswer = (correctDisplay + 1) % 4; // Trả lời sai
    }
    studentDisplayAnswers[displayIdx] = studentAnswer;
    
    if (displayIdx < 5) {
        console.log(`  Câu ${displayIdx+1} (gốc ${origIdx+1}): ĐA đúng gốc=${correctOriginal}, hiển thị=${correctDisplay}, HS chọn=${studentAnswer} → ${studentAnswer === correctDisplay ? '✓' : '✗'}`);
    }
}

console.log(`\nDự kiến: ${expectedCorrect}/${questions.length} câu đúng`);
console.log(`Điểm dự kiến: ${(expectedCorrect / questions.length * 10).toFixed(1)}`);

// ====== TEST 5: Chuyển đổi đáp án và chấm điểm (như server làm) ======
console.log('\n📋 TEST 5: Chuyển đổi đáp án về dạng gốc');
console.log('─────────────────────────────────────────────────────────────');

// Chuyển đổi câu trả lời về index gốc để gửi server
const answersForServer = [];
for (let displayIdx = 0; displayIdx < questions.length; displayIdx++) {
    const origIdx = questionOrder[displayIdx];
    const optOrder = optionOrders[displayIdx];
    const studentDisplayAnswer = studentDisplayAnswers[displayIdx];
    
    // Chuyển từ index hiển thị sang index gốc
    const originalAnswer = optOrder[studentDisplayAnswer];
    answersForServer[origIdx] = originalAnswer;
}

console.log(`Đáp án gửi server (5 câu đầu): [${answersForServer.slice(0,5).join(', ')}]`);
console.log(`Đáp án đúng gốc (5 câu đầu):   [${questions.slice(0,5).map(q => q.correct).join(', ')}]`);

// Chấm điểm như server
let serverCorrectCount = 0;
for (let i = 0; i < questions.length; i++) {
    if (answersForServer[i] === questions[i].correct) {
        serverCorrectCount++;
    }
}

const serverScore = Math.round((serverCorrectCount / questions.length) * 100) / 10;

console.log(`\nServer chấm: ${serverCorrectCount}/${questions.length} đúng, điểm: ${serverScore}`);

const gradingCorrect = serverCorrectCount === expectedCorrect;
console.log(`\n${gradingCorrect ? '✅ PASS' : '❌ FAIL'}: Chấm điểm khớp với dự kiến\n`);

// ====== TỔNG KẾT ======
console.log('═══════════════════════════════════════════════════════════');
console.log('   📊 TỔNG KẾT KIỂM TRA');
console.log('═══════════════════════════════════════════════════════════');
console.log(`   1. Đảo thứ tự câu hỏi:     ${allOrdersDifferent ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   2. Đảo thứ tự đáp án:      ${optionsDifferent ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   3. Tính nhất quán (seed):  ${isConsistent ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   4. Chấm điểm chính xác:    ${gradingCorrect ? '✅ PASS' : '❌ FAIL'}`);
console.log('═══════════════════════════════════════════════════════════');

const allPassed = allOrdersDifferent && optionsDifferent && isConsistent && gradingCorrect;
console.log(`\n${allPassed ? '🎉 TẤT CẢ TEST ĐỀU PASS!' : '⚠️ CÓ TEST FAIL!'}\n`);
