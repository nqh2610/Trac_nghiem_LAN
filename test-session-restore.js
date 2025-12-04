/**
 * Test Session Restore và Multi-Student trên cùng máy
 * 
 * Kiểm tra:
 * 1. Học sinh 1 vào làm bài, F5 → còn trạng thái + thời gian tiếp tục
 * 2. Học sinh 1 nộp bài → không vào làm được nữa
 * 3. Học sinh 2 vào cùng máy → làm bình thường, thời gian tính riêng
 * 4. Học sinh 2 F5 → còn trạng thái của HS2 (không lẫn với HS1)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper functions
function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Simulate localStorage for testing
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = value; }
    removeItem(key) { delete this.store[key]; }
    clear() { this.store = {}; }
}

// Test functions
async function testSessionRestore() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST: Session Restore và Multi-Student cùng máy');
    console.log('='.repeat(60));
    
    let passed = 0;
    let failed = 0;
    
    // ============ SETUP ============
    console.log('\n📋 SETUP: Kiểm tra server và mở bài thi...');
    
    // Check server
    try {
        const settingsRes = await request('GET', '/api/settings');
        if (settingsRes.status !== 200) {
            console.log('❌ Server không hoạt động!');
            return;
        }
        console.log('✅ Server đang chạy');
    } catch (e) {
        console.log('❌ Không kết nối được server:', e.message);
        return;
    }
    
    // Mở bài thi (tắt yêu cầu password để test đơn giản)
    await request('POST', '/api/settings', {
        isOpen: true,
        requirePassword: false,
        timeLimit: 30
    });
    console.log('✅ Đã mở bài thi (30 phút, không cần password)');
    
    // Lấy danh sách học sinh
    const studentsRes = await request('GET', '/api/students');
    const studentsList = studentsRes.data;
    if (!Array.isArray(studentsList) || studentsList.length < 2) {
        console.log('❌ Cần ít nhất 2 học sinh trong danh sách!');
        console.log('   Dữ liệu nhận được:', typeof studentsList, Array.isArray(studentsList) ? studentsList.length : 'N/A');
        return;
    }
    const student1 = studentsList[0];
    const student2 = studentsList[1];
    console.log(`✅ Học sinh 1: STT ${student1.stt} - ${student1.ho} ${student1.ten}`);
    console.log(`✅ Học sinh 2: STT ${student2.stt} - ${student2.ho} ${student2.ten}`);
    
    // Reset trạng thái học sinh
    await request('POST', '/api/reset-all-students');
    console.log('✅ Đã reset trạng thái tất cả học sinh');
    
    // ============ TEST CASE 1: Học sinh 1 chọn tên ============
    console.log('\n' + '-'.repeat(50));
    console.log('📝 TEST 1: Học sinh 1 chọn tên và bắt đầu làm bài');
    console.log('-'.repeat(50));
    
    const select1Res = await request('POST', '/api/select-student', { 
        stt: student1.stt,
        socketId: 'test-socket-hs1'
    });
    
    if (select1Res.data.success) {
        console.log('✅ PASS: Học sinh 1 chọn tên thành công');
        passed++;
    } else {
        console.log('❌ FAIL: Học sinh 1 không chọn được tên:', select1Res.data.error);
        failed++;
    }
    
    // ============ TEST CASE 2: Kiểm tra trạng thái selected ============
    console.log('\n' + '-'.repeat(50));
    console.log('📝 TEST 2: Kiểm tra trạng thái "đang làm bài" của HS1');
    console.log('-'.repeat(50));
    
    const status1Res = await request('GET', '/api/students');
    const students1List = status1Res.data;
    const hs1Status = students1List.find(s => s.stt === student1.stt);
    
    if (hs1Status && hs1Status.status.selected) {
        console.log('✅ PASS: Học sinh 1 có trạng thái "đang làm bài"');
        passed++;
    } else {
        console.log('❌ FAIL: Trạng thái không đúng');
        failed++;
    }
    
    // ============ TEST CASE 3: Mô phỏng F5 - lấy câu hỏi lại ============
    console.log('\n' + '-'.repeat(50));
    console.log('📝 TEST 3: Mô phỏng F5 - HS1 có thể lấy lại câu hỏi');
    console.log('-'.repeat(50));
    
    // Giả sử học sinh đã lưu progress vào localStorage trước khi F5
    // Server vẫn cho phép lấy câu hỏi vì bài thi đang mở
    const examRes = await request('GET', '/api/exam');
    
    if (examRes.data.questions && examRes.data.questions.length > 0) {
        console.log(`✅ PASS: Có thể lấy ${examRes.data.questions.length} câu hỏi`);
        passed++;
    } else {
        console.log('❌ FAIL: Không lấy được câu hỏi:', examRes.data.error);
        failed++;
    }
    
    // ============ TEST CASE 4: Kiểm tra HS1 chưa nộp bài ============
    console.log('\n' + '-'.repeat(50));
    console.log('📝 TEST 4: Kiểm tra HS1 chưa nộp bài (trước F5)');
    console.log('-'.repeat(50));
    
    const checkSubmit1 = await request('GET', `/api/check-submitted/${student1.stt}`);
    
    if (!checkSubmit1.data.submitted) {
        console.log('✅ PASS: HS1 chưa nộp bài - có thể tiếp tục làm');
        passed++;
    } else {
        console.log('❌ FAIL: HS1 đã nộp bài (không đúng)');
        failed++;
    }
    
    // ============ TEST CASE 5: HS1 nộp bài ============
    console.log('\n' + '-'.repeat(50));
    console.log('📝 TEST 5: Học sinh 1 nộp bài');
    console.log('-'.repeat(50));
    
    // Tạo câu trả lời ngẫu nhiên
    const numQuestions = examRes.data.questions.length;
    const answers1 = Array(numQuestions).fill(0).map(() => Math.floor(Math.random() * 4));
    
    const submit1Res = await request('POST', '/api/submit', {
        studentSTT: student1.stt,
        studentName: `${student1.ho} ${student1.ten}`,
        studentClass: '11A4',
        answers: answers1,
        timeSpent: '5 phút 30 giây'
    });
    
    if (submit1Res.data.success !== false && submit1Res.data.score !== undefined) {
        console.log(`✅ PASS: HS1 nộp bài thành công - Điểm: ${submit1Res.data.score}`);
        passed++;
    } else {
        console.log('❌ FAIL: HS1 không nộp được bài:', submit1Res.data.error);
        failed++;
    }
    
    // ============ TEST CASE 6: HS1 không vào làm lại được ============
    console.log('\n' + '-'.repeat(50));
    console.log('📝 TEST 6: Học sinh 1 KHÔNG vào làm lại được');
    console.log('-'.repeat(50));
    
    // Kiểm tra trạng thái đã nộp
    const checkSubmit1After = await request('GET', `/api/check-submitted/${student1.stt}`);
    
    if (checkSubmit1After.data.submitted) {
        console.log('✅ PASS: HS1 đã nộp bài - hệ thống nhận diện đúng');
        passed++;
    } else {
        console.log('❌ FAIL: Hệ thống không nhận diện HS1 đã nộp bài');
        failed++;
    }
    
    // Thử chọn lại tên HS1
    const reselect1Res = await request('POST', '/api/select-student', { 
        stt: student1.stt,
        socketId: 'test-socket-hs1-retry'
    });
    
    if (!reselect1Res.data.success && reselect1Res.data.error) {
        console.log('✅ PASS: HS1 bị từ chối làm lại - ' + reselect1Res.data.error);
        passed++;
    } else {
        console.log('❌ FAIL: HS1 vẫn chọn được tên sau khi đã nộp bài');
        failed++;
    }
    
    // ============ TEST CASE 7: HS2 vào làm bình thường ============
    console.log('\n' + '-'.repeat(50));
    console.log('📝 TEST 7: Học sinh 2 vào làm bài bình thường');
    console.log('-'.repeat(50));
    
    const select2Res = await request('POST', '/api/select-student', { 
        stt: student2.stt,
        socketId: 'test-socket-hs2'
    });
    
    if (select2Res.data.success) {
        console.log('✅ PASS: Học sinh 2 chọn tên thành công');
        passed++;
    } else {
        console.log('❌ FAIL: Học sinh 2 không chọn được tên:', select2Res.data.error);
        failed++;
    }
    
    // ============ TEST CASE 8: Kiểm tra HS2 chưa nộp bài ============
    console.log('\n' + '-'.repeat(50));
    console.log('📝 TEST 8: Kiểm tra HS2 chưa nộp bài');
    console.log('-'.repeat(50));
    
    const checkSubmit2 = await request('GET', `/api/check-submitted/${student2.stt}`);
    
    if (!checkSubmit2.data.submitted) {
        console.log('✅ PASS: HS2 chưa nộp bài - có thể làm bài');
        passed++;
    } else {
        console.log('❌ FAIL: HS2 bị đánh dấu đã nộp (không đúng)');
        failed++;
    }
    
    // ============ TEST CASE 9: Mô phỏng F5 của HS2 ============
    console.log('\n' + '-'.repeat(50));
    console.log('📝 TEST 9: Mô phỏng F5 của HS2 - vẫn lấy được câu hỏi');
    console.log('-'.repeat(50));
    
    const examRes2 = await request('GET', '/api/exam');
    
    if (examRes2.data.questions && examRes2.data.questions.length > 0) {
        console.log(`✅ PASS: HS2 có thể lấy ${examRes2.data.questions.length} câu hỏi sau F5`);
        passed++;
    } else {
        console.log('❌ FAIL: HS2 không lấy được câu hỏi');
        failed++;
    }
    
    // ============ TEST CASE 10: HS2 nộp bài ============
    console.log('\n' + '-'.repeat(50));
    console.log('📝 TEST 10: Học sinh 2 nộp bài');
    console.log('-'.repeat(50));
    
    const answers2 = Array(numQuestions).fill(0).map(() => Math.floor(Math.random() * 4));
    
    const submit2Res = await request('POST', '/api/submit', {
        studentSTT: student2.stt,
        studentName: `${student2.ho} ${student2.ten}`,
        studentClass: '11A4',
        answers: answers2,
        timeSpent: '10 phút 15 giây'
    });
    
    if (submit2Res.data.success !== false && submit2Res.data.score !== undefined) {
        console.log(`✅ PASS: HS2 nộp bài thành công - Điểm: ${submit2Res.data.score}`);
        passed++;
    } else {
        console.log('❌ FAIL: HS2 không nộp được bài:', submit2Res.data.error);
        failed++;
    }
    
    // ============ TEST CASE 11: Cả 2 đều không làm lại được ============
    console.log('\n' + '-'.repeat(50));
    console.log('📝 TEST 11: Cả 2 học sinh đều không làm lại được');
    console.log('-'.repeat(50));
    
    const finalStatus = await request('GET', '/api/students');
    const finalStudentsList = finalStatus.data;
    const hs1Final = finalStudentsList.find(s => s.stt === student1.stt);
    const hs2Final = finalStudentsList.find(s => s.stt === student2.stt);
    
    if (hs1Final.status.completed && hs2Final.status.completed) {
        console.log('✅ PASS: Cả 2 học sinh đều có trạng thái "completed"');
        passed++;
    } else {
        console.log('❌ FAIL: Trạng thái không đúng');
        console.log('   HS1 completed:', hs1Final.status.completed);
        console.log('   HS2 completed:', hs2Final.status.completed);
        failed++;
    }
    
    // ============ KẾT QUẢ ============
    console.log('\n' + '='.repeat(60));
    console.log('📊 KẾT QUẢ TỔNG HỢP');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Tỷ lệ: ${Math.round(passed/(passed+failed)*100)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 TẤT CẢ TEST ĐỀU PASS!');
    } else {
        console.log('\n⚠️ Có một số test thất bại, cần kiểm tra lại.');
    }
    
    // ============ GHI CHÚ VỀ CLIENT-SIDE ============
    console.log('\n' + '='.repeat(60));
    console.log('📝 GHI CHÚ VỀ TEST CLIENT-SIDE (localStorage)');
    console.log('='.repeat(60));
    console.log(`
Các test trên chỉ kiểm tra SERVER-SIDE APIs.

Phần CLIENT-SIDE (localStorage) hoạt động như sau:
1. Khi HS bắt đầu làm bài:
   - Lưu vào localStorage: stt, answers, timeRemaining, startTime, examId
   - Key: quiz_exam_progress[stt_examId]

2. Khi F5/tắt mở trình duyệt:
   - Đọc từ localStorage, kiểm tra examId có khớp không
   - Nếu khớp và chưa nộp → Khôi phục answers + tính lại timeRemaining
   - startTime được giữ nguyên → Thời gian làm bài chính xác

3. Sau khi nộp bài:
   - Xóa progress khỏi localStorage
   - Server đánh dấu completed = true
   - Học sinh không chọn lại được tên đó

4. Học sinh khác trên cùng máy:
   - Chọn STT khác → Key localStorage khác (stt2_examId)
   - Không bị ảnh hưởng bởi dữ liệu của HS trước
   - startTime riêng → Thời gian tính riêng
`);
}

// Run test
testSessionRestore().catch(console.error);
