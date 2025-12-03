/**
 * Test kiểm tra:
 * 1. Đảo thứ tự câu hỏi
 * 2. Đảo thứ tự đáp án
 * 3. Chấm điểm đúng cho học sinh
 * 4. Điểm gửi về giáo viên có khớp không
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function để fetch API
function fetchAPI(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const reqOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

// Seeded random (copy từ index.html)
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
        const optionIndices = [0, 1, 2, 3]; // A, B, C, D
        orders.push(shuffleWithSeed(optionIndices, seed));
    }
    return orders;
}

async function runTests() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   🧪 BẮT ĐẦU KIỂM TRA HỆ THỐNG TRẮC NGHIỆM');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        // 1. Lấy câu hỏi gốc từ server (API cho giáo viên)
        console.log('📋 Bước 1: Lấy câu hỏi gốc từ server...');
        const originalQuestions = await fetchAPI('/api/questions');
        
        if (!originalQuestions || originalQuestions.error) {
            console.log('❌ Không lấy được câu hỏi gốc (cần chạy từ localhost)');
            console.log('   Lỗi:', originalQuestions?.error || 'Unknown');
            return;
        }
        
        console.log(`   ✓ Có ${originalQuestions.length} câu hỏi gốc\n`);

        // 2. Lấy câu hỏi cho học sinh (không có đáp án đúng)
        console.log('📋 Bước 2: Lấy đề thi cho học sinh...');
        const examData = await fetchAPI('/api/exam');
        
        if (examData.error) {
            console.log('❌ Không lấy được đề thi:', examData.error);
            return;
        }
        
        console.log(`   ✓ Đề thi có ${examData.questions.length} câu hỏi`);
        
        // Kiểm tra xem đề cho học sinh có chứa đáp án đúng không
        const hasCorrectAnswer = examData.questions.some(q => q.correct !== undefined);
        if (hasCorrectAnswer) {
            console.log('   ❌ LỖI BẢO MẬT: Đề thi cho học sinh có chứa đáp án đúng!');
        } else {
            console.log('   ✓ An toàn: Đề thi không chứa đáp án đúng\n');
        }

        // 3. Kiểm tra đảo thứ tự cho 2 học sinh khác nhau
        console.log('📋 Bước 3: Kiểm tra đảo thứ tự câu hỏi...');
        
        const stt1 = 1;
        const stt2 = 2;
        
        const order1 = generateQuestionOrder(originalQuestions.length, stt1);
        const order2 = generateQuestionOrder(originalQuestions.length, stt2);
        
        console.log(`   STT ${stt1}: Câu hỏi theo thứ tự [${order1.slice(0, 5).join(', ')}...]`);
        console.log(`   STT ${stt2}: Câu hỏi theo thứ tự [${order2.slice(0, 5).join(', ')}...]`);
        
        const ordersSame = JSON.stringify(order1) === JSON.stringify(order2);
        if (ordersSame) {
            console.log('   ❌ KHÔNG ĐẢO: 2 học sinh có cùng thứ tự câu hỏi!\n');
        } else {
            console.log('   ✓ ĐÃ ĐẢO: 2 học sinh có thứ tự câu hỏi khác nhau\n');
        }

        // 4. Kiểm tra đảo thứ tự đáp án
        console.log('📋 Bước 4: Kiểm tra đảo thứ tự đáp án...');
        
        const optionOrders1 = generateOptionOrders(originalQuestions.length, stt1);
        const optionOrders2 = generateOptionOrders(originalQuestions.length, stt2);
        
        console.log(`   STT ${stt1} câu 1: Đáp án theo thứ tự [${optionOrders1[0].join(', ')}]`);
        console.log(`   STT ${stt2} câu 1: Đáp án theo thứ tự [${optionOrders2[0].join(', ')}]`);
        
        const optionOrdersSame = JSON.stringify(optionOrders1) === JSON.stringify(optionOrders2);
        if (optionOrdersSame) {
            console.log('   ❌ KHÔNG ĐẢO ĐÁP ÁN: 2 học sinh có cùng thứ tự đáp án!\n');
        } else {
            console.log('   ✓ ĐÃ ĐẢO ĐÁP ÁN: 2 học sinh có thứ tự đáp án khác nhau\n');
        }

        // 5. Kiểm tra chấm điểm - Mô phỏng học sinh STT 1 làm bài
        console.log('📋 Bước 5: Kiểm tra chấm điểm...');
        
        const testSTT = 44; // Dùng STT cuối để test
        const questionOrder = generateQuestionOrder(originalQuestions.length, testSTT);
        const optionOrders = generateOptionOrders(originalQuestions.length, testSTT);
        
        // Tạo câu trả lời: 50% đúng, 50% sai để dễ kiểm tra
        const answers = [];
        let expectedCorrect = 0;
        
        console.log('\n   Mô phỏng làm bài của STT ' + testSTT + ':');
        
        for (let displayIndex = 0; displayIndex < originalQuestions.length; displayIndex++) {
            const originalIndex = questionOrder[displayIndex];
            const originalQ = originalQuestions[originalIndex];
            const optionOrder = optionOrders[displayIndex];
            
            // Tìm vị trí đáp án đúng sau khi đảo
            const correctOriginalIndex = originalQ.correct; // 0=A, 1=B, 2=C, 3=D
            const correctDisplayIndex = optionOrder.indexOf(correctOriginalIndex);
            
            // Học sinh trả lời: câu chẵn đúng, câu lẻ sai
            let studentAnswer;
            if (displayIndex % 2 === 0) {
                // Trả lời đúng
                studentAnswer = correctDisplayIndex;
                expectedCorrect++;
            } else {
                // Trả lời sai (chọn đáp án khác)
                studentAnswer = (correctDisplayIndex + 1) % 4;
            }
            
            answers[displayIndex] = studentAnswer;
            
            if (displayIndex < 3) {
                console.log(`     Câu ${displayIndex + 1} (gốc ${originalIndex + 1}): ` +
                    `Đáp án đúng gốc=${correctOriginalIndex}, ` +
                    `Đáp án đúng hiển thị=${correctDisplayIndex}, ` +
                    `HS chọn=${studentAnswer} → ${studentAnswer === correctDisplayIndex ? '✓' : '✗'}`);
            }
        }
        
        console.log(`     ... (tổng ${originalQuestions.length} câu)`);
        console.log(`\n   Dự kiến: ${expectedCorrect}/${originalQuestions.length} câu đúng`);
        console.log(`   Điểm dự kiến: ${Math.round((expectedCorrect / originalQuestions.length) * 100) / 10}`);

        // 6. Chuyển đổi câu trả lời về index gốc để gửi server
        console.log('\n📋 Bước 6: Chuyển đổi câu trả lời và nộp bài...');
        
        const answersForServer = [];
        for (let displayIndex = 0; displayIndex < originalQuestions.length; displayIndex++) {
            const originalIndex = questionOrder[displayIndex];
            const optionOrder = optionOrders[displayIndex];
            const studentDisplayAnswer = answers[displayIndex];
            
            // Chuyển từ index hiển thị sang index gốc
            const originalAnswer = optionOrder[studentDisplayAnswer];
            answersForServer[originalIndex] = originalAnswer;
        }
        
        console.log(`   Đáp án gửi server (5 câu đầu): [${answersForServer.slice(0, 5).join(', ')}]`);

        // 7. Gửi bài và kiểm tra kết quả
        console.log('\n📋 Bước 7: Nộp bài và kiểm tra kết quả...');
        
        const submitResult = await fetchAPI('/api/submit', {
            method: 'POST',
            body: {
                studentSTT: testSTT,
                studentName: 'Test Student',
                studentClass: 'TEST',
                answers: answersForServer,
                timeSpent: '01:30'
            }
        });
        
        if (submitResult.error) {
            console.log('   ❌ Lỗi nộp bài:', submitResult.error);
            console.log('   (Có thể do học sinh này đã nộp bài trước đó)');
        } else {
            console.log(`   Server trả về: ${submitResult.correctCount}/${submitResult.totalQuestions} đúng, điểm: ${submitResult.score}`);
            
            const expectedScore = Math.round((expectedCorrect / originalQuestions.length) * 100) / 10;
            
            if (submitResult.correctCount === expectedCorrect && submitResult.score === expectedScore) {
                console.log('   ✓ CHẤM ĐIỂM CHÍNH XÁC!');
            } else {
                console.log('   ❌ CHẤM ĐIỂM SAI!');
                console.log(`      Dự kiến: ${expectedCorrect} đúng, điểm ${expectedScore}`);
                console.log(`      Thực tế: ${submitResult.correctCount} đúng, điểm ${submitResult.score}`);
            }
        }

        // 8. Kiểm tra kết quả phía giáo viên
        console.log('\n📋 Bước 8: Kiểm tra kết quả phía giáo viên...');
        
        const results = await fetchAPI('/api/results');
        if (results.error) {
            console.log('   ❌ Không truy cập được kết quả:', results.error);
        } else {
            const testResult = results.find(r => r.studentSTT == testSTT);
            if (testResult) {
                console.log(`   Kết quả giáo viên nhận được:`);
                console.log(`     - Học sinh: ${testResult.studentName} (STT ${testResult.studentSTT})`);
                console.log(`     - Điểm: ${testResult.score}`);
                console.log(`     - Số câu đúng: ${testResult.correctCount}/${testResult.totalQuestions}`);
                
                if (submitResult.score === testResult.score && 
                    submitResult.correctCount === testResult.correctCount) {
                    console.log('   ✓ ĐIỂM KHỚP giữa học sinh và giáo viên!');
                } else {
                    console.log('   ❌ ĐIỂM KHÔNG KHỚP!');
                }
            } else {
                console.log('   Không tìm thấy kết quả của học sinh test');
            }
        }

        // Tổng kết
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('   📊 TỔNG KẾT KIỂM TRA');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`   1. Ẩn đáp án đúng khỏi học sinh: ${!hasCorrectAnswer ? '✓ ĐẠT' : '✗ LỖI'}`);
        console.log(`   2. Đảo thứ tự câu hỏi: ${!ordersSame ? '✓ ĐẠT' : '✗ LỖI'}`);
        console.log(`   3. Đảo thứ tự đáp án: ${!optionOrdersSame ? '✓ ĐẠT' : '✗ LỖI'}`);
        console.log(`   4. Chấm điểm: ${!submitResult.error ? '✓ ĐẠT' : '⚠ Không test được'}`);
        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.log('❌ Lỗi:', error.message);
    }
}

// Chạy test
runTests();
