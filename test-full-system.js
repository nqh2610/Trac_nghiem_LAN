/**
 * 🧪 TEST TOÀN BỘ HỆ THỐNG TRẮC NGHIỆM
 * Chạy: node test-full-system.js
 * Yêu cầu: Server phải đang chạy tại localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// ========== UTILITIES ==========
let testResults = { passed: 0, failed: 0, tests: [] };

function log(msg, type = 'info') {
    const icons = { info: 'ℹ️', pass: '✅', fail: '❌', warn: '⚠️', section: '📋' };
    console.log(`${icons[type] || ''} ${msg}`);
}

function assert(condition, testName) {
    if (condition) {
        testResults.passed++;
        testResults.tests.push({ name: testName, status: 'PASS' });
        log(`${testName}`, 'pass');
        return true;
    } else {
        testResults.failed++;
        testResults.tests.push({ name: testName, status: 'FAIL' });
        log(`${testName}`, 'fail');
        return false;
    }
}

async function request(method, endpoint, body = null, isBuffer = false) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {}
        };

        if (body && !isBuffer) {
            options.headers['Content-Type'] = 'application/json';
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            if (isBuffer) {
                req.write(body);
            } else {
                req.write(JSON.stringify(body));
            }
        }
        req.end();
    });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== TEST CASES ==========

async function testServerConnection() {
    log('\n========== TEST KẾT NỐI SERVER ==========', 'section');
    try {
        const res = await request('GET', '/api/session');
        assert(res.status === 200, 'Server phản hồi thành công');
        assert(res.data.currentSession !== undefined, 'API trả về currentSession');
        return true;
    } catch (e) {
        assert(false, 'Kết nối server thất bại: ' + e.message);
        return false;
    }
}

async function testClassesAPI() {
    log('\n========== TEST API QUẢN LÝ LỚP ==========', 'section');
    
    // 1. Lấy danh sách lớp
    let res = await request('GET', '/api/classes');
    assert(res.status === 200, 'GET /api/classes - Lấy danh sách lớp');
    assert(Array.isArray(res.data.classes), 'Danh sách lớp là mảng');
    
    const initialCount = res.data.classes.length;
    
    // 2. Tạo lớp mới
    const testClassName = `Test_${Date.now()}`;
    res = await request('POST', '/api/classes', { name: testClassName });
    assert(res.status === 200 && res.data.success, `POST /api/classes - Tạo lớp "${testClassName}"`);
    
    const newClassId = res.data.class?.id;
    assert(newClassId !== undefined, 'Lớp mới có ID');
    
    // 3. Kiểm tra lớp đã được tạo
    res = await request('GET', '/api/classes');
    assert(res.data.classes.length === initialCount + 1, 'Số lớp tăng thêm 1');
    
    // 4. Tạo lớp trùng tên (phải thất bại)
    res = await request('POST', '/api/classes', { name: testClassName });
    assert(!res.data.success, 'Không cho tạo lớp trùng tên');
    
    // 5. Xóa lớp test
    if (newClassId) {
        res = await request('DELETE', `/api/classes/${newClassId}`);
        assert(res.data.success, `DELETE /api/classes/${newClassId} - Xóa lớp test`);
    }
    
    // 6. Kiểm tra đã xóa
    res = await request('GET', '/api/classes');
    assert(res.data.classes.length === initialCount, 'Số lớp trở về ban đầu');
}

async function testExamsAPI() {
    log('\n========== TEST API QUẢN LÝ BÀI KIỂM TRA ==========', 'section');
    
    // 1. Lấy danh sách bài kiểm tra
    let res = await request('GET', '/api/exams');
    assert(res.status === 200, 'GET /api/exams - Lấy danh sách bài');
    assert(Array.isArray(res.data.exams), 'Danh sách bài là mảng');
    
    const initialCount = res.data.exams.length;
    
    // 2. Tạo bài kiểm tra mới
    const testExamName = `BaiTest_${Date.now()}`;
    res = await request('POST', '/api/exams', { name: testExamName });
    assert(res.status === 200 && res.data.success, `POST /api/exams - Tạo bài "${testExamName}"`);
    
    const newExamId = res.data.examId;
    assert(newExamId !== undefined, 'Bài mới có ID');
    
    // 3. Kiểm tra bài đã được tạo
    res = await request('GET', '/api/exams');
    assert(res.data.exams.length === initialCount + 1, 'Số bài tăng thêm 1');
    
    // 4. Chuyển sang bài mới
    res = await request('POST', '/api/session', { examId: newExamId });
    assert(res.data.success, 'Chuyển sang bài test thành công');
    
    // 5. Kiểm tra session đã cập nhật
    res = await request('GET', '/api/session');
    assert(res.data.currentSession.examId === newExamId, 'Session examId đúng');
    
    // 6. Chuyển về bài mặc định để có thể xóa bài test
    const exams = (await request('GET', '/api/exams')).data.exams;
    const defaultExam = exams.find(e => e.id !== newExamId);
    if (defaultExam) {
        await request('POST', '/api/session', { examId: defaultExam.id });
    }
    
    // 7. Xóa bài test
    if (newExamId) {
        res = await request('DELETE', `/api/exams/${newExamId}`);
        assert(res.data.success, `DELETE /api/exams/${newExamId} - Xóa bài test`);
    }
}

async function testQuestionsAPI() {
    log('\n========== TEST API QUẢN LÝ CÂU HỎI ==========', 'section');
    
    // 1. Lấy danh sách câu hỏi
    let res = await request('GET', '/api/questions');
    assert(res.status === 200, 'GET /api/questions - Lấy danh sách câu hỏi');
    assert(Array.isArray(res.data), 'Danh sách câu hỏi là mảng');
    
    const initialCount = res.data.length;
    
    // 2. Thêm câu hỏi mới
    const testQuestion = {
        question: 'Câu hỏi test tự động: 1 + 1 = ?',
        options: ['1', '2', '3', '4'],
        correct: 1
    };
    res = await request('POST', '/api/questions', testQuestion);
    assert(res.data.success, 'POST /api/questions - Thêm câu hỏi');
    
    // 3. Kiểm tra câu hỏi đã được thêm
    res = await request('GET', '/api/questions');
    assert(res.data.length === initialCount + 1, 'Số câu hỏi tăng thêm 1');
    
    // 4. Xóa câu hỏi test
    const lastIndex = res.data.length - 1;
    res = await request('DELETE', `/api/questions/${lastIndex}`);
    assert(res.data.success, `DELETE /api/questions/${lastIndex} - Xóa câu hỏi test`);
    
    // 5. Kiểm tra đã xóa
    res = await request('GET', '/api/questions');
    assert(res.data.length === initialCount, 'Số câu hỏi trở về ban đầu');
}

async function testSessionAPI() {
    log('\n========== TEST API SESSION ==========', 'section');
    
    // 1. Lấy session hiện tại
    let res = await request('GET', '/api/session');
    assert(res.status === 200, 'GET /api/session - Lấy session');
    assert(res.data.currentSession !== undefined, 'Có currentSession');
    assert(res.data.examSettings !== undefined, 'Có examSettings');
    assert(typeof res.data.studentCount === 'number', 'Có studentCount');
    
    // 2. Lấy danh sách học sinh
    res = await request('GET', '/api/students');
    assert(res.status === 200, 'GET /api/students - Lấy danh sách học sinh');
    assert(Array.isArray(res.data), 'Danh sách học sinh là mảng');
}

async function testExamSettings() {
    log('\n========== TEST CÀI ĐẶT BÀI THI ==========', 'section');
    
    // 1. Lấy cài đặt hiện tại
    let res = await request('GET', '/api/settings');
    assert(res.status === 200, 'GET /api/settings - Lấy cài đặt');
    const originalSettings = res.data;
    
    // 2. Cập nhật cài đặt
    res = await request('POST', '/api/settings', {
        title: 'Test Settings',
        timeLimit: 15,
        showScore: true
    });
    assert(res.data.success, 'POST /api/settings - Cập nhật cài đặt');
    
    // 3. Kiểm tra đã cập nhật
    res = await request('GET', '/api/settings');
    assert(res.data.timeLimit === 15, 'timeLimit đã cập nhật');
    
    // 4. Khôi phục cài đặt gốc
    res = await request('POST', '/api/settings', originalSettings);
    assert(res.data.success, 'Khôi phục cài đặt gốc');
}

async function testExamOpenClose() {
    log('\n========== TEST MỞ/ĐÓNG BÀI THI ==========', 'section');
    
    // 1. Lấy trạng thái hiện tại
    let res = await request('GET', '/api/settings');
    const wasOpen = res.data.isOpen;
    
    // 2. Mở bài thi
    res = await request('POST', '/api/exam/open');
    assert(res.data.success || res.data.error?.includes('câu hỏi'), 'POST /api/exam/open');
    
    // 3. Đóng bài thi
    res = await request('POST', '/api/exam/close');
    assert(res.data.success, 'POST /api/exam/close - Đóng bài thi');
    
    // 4. Kiểm tra đã đóng
    res = await request('GET', '/api/settings');
    assert(res.data.isOpen === false, 'Bài thi đã đóng');
}

async function testStudentFlow() {
    log('\n========== TEST FLOW HỌC SINH ==========', 'section');
    
    // 1. Lấy danh sách học sinh
    let res = await request('GET', '/api/students');
    if (res.data.length === 0) {
        log('Không có học sinh để test', 'warn');
        return;
    }
    
    const testStudent = res.data[0];
    assert(testStudent.stt !== undefined, 'Học sinh có STT');
    
    // 2. Kiểm tra API exam khi đóng
    res = await request('POST', '/api/exam/close');
    res = await request('GET', '/api/exam');
    assert(res.data.error !== undefined, 'API /api/exam báo lỗi khi bài thi đóng');
    
    // 3. Mở bài thi và lấy đề
    res = await request('POST', '/api/exam/open');
    if (res.data.success) {
        res = await request('GET', '/api/exam');
        if (res.data.questions) {
            assert(Array.isArray(res.data.questions), 'Đề thi có danh sách câu hỏi');
            assert(res.data.timeLimit !== undefined, 'Đề thi có thời gian');
        }
    }
    
    // 4. Đóng bài thi
    await request('POST', '/api/exam/close');
}

async function testResultsAPI() {
    log('\n========== TEST API KẾT QUẢ ==========', 'section');
    
    // 1. Lấy kết quả
    let res = await request('GET', '/api/results');
    assert(res.status === 200, 'GET /api/results - Lấy kết quả');
    assert(Array.isArray(res.data), 'Kết quả là mảng');
    
    // 2. Lấy báo cáo
    res = await request('GET', '/api/reports');
    assert(res.status === 200, 'GET /api/reports - Lấy báo cáo');
}

async function testSecurityRestrictions() {
    log('\n========== TEST BẢO MẬT ==========', 'section');
    
    // Test các API yêu cầu localhost
    // (Các API này sẽ hoạt động vì test chạy trên localhost)
    
    let res = await request('GET', '/api/questions');
    assert(res.status === 200, 'API questions cho phép từ localhost');
    
    res = await request('GET', '/api/classes');
    assert(res.status === 200, 'API classes cho phép từ localhost');
}

async function testDataIntegrity() {
    log('\n========== TEST TÍNH TOÀN VẸN DỮ LIỆU ==========', 'section');
    
    // 1. Tạo và xóa nhiều lớp liên tiếp
    const classIds = [];
    for (let i = 0; i < 3; i++) {
        const res = await request('POST', '/api/classes', { name: `IntegrityTest_${Date.now()}_${i}` });
        if (res.data.success) classIds.push(res.data.class.id);
        await sleep(10);
    }
    assert(classIds.length === 3, 'Tạo 3 lớp liên tiếp thành công');
    
    // 2. Xóa tất cả
    for (const id of classIds) {
        await request('DELETE', `/api/classes/${id}`);
    }
    
    // 3. Kiểm tra không còn
    const res = await request('GET', '/api/classes');
    const remaining = res.data.classes.filter(c => c.name.includes('IntegrityTest_'));
    assert(remaining.length === 0, 'Xóa sạch các lớp test');
}

// ========== MAIN ==========

async function runAllTests() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     🧪 TEST TỰ ĐỘNG HỆ THỐNG TRẮC NGHIỆM                   ║');
    console.log('║     Server: ' + BASE_URL.padEnd(44) + '║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    const startTime = Date.now();
    
    // Kiểm tra kết nối server
    const connected = await testServerConnection();
    if (!connected) {
        console.log('\n❌ Không thể kết nối server! Hãy chạy: node server.js');
        process.exit(1);
    }
    
    // Chạy các test
    try {
        await testClassesAPI();
        await testExamsAPI();
        await testQuestionsAPI();
        await testSessionAPI();
        await testExamSettings();
        await testExamOpenClose();
        await testStudentFlow();
        await testResultsAPI();
        await testSecurityRestrictions();
        await testDataIntegrity();
    } catch (e) {
        log(`Lỗi không mong đợi: ${e.message}`, 'fail');
        testResults.failed++;
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Báo cáo kết quả
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    📊 KẾT QUẢ TEST                         ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  ✅ Passed: ${String(testResults.passed).padEnd(5)} | ❌ Failed: ${String(testResults.failed).padEnd(5)} | ⏱️ ${duration}s`.padEnd(61) + '║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    
    if (testResults.failed > 0) {
        console.log('║  ❌ CÁC TEST THẤT BẠI:                                      ║');
        testResults.tests.filter(t => t.status === 'FAIL').forEach(t => {
            console.log(`║  - ${t.name.substring(0, 55).padEnd(55)}║`);
        });
    } else {
        console.log('║  🎉 TẤT CẢ TEST ĐỀU PASSED!                                ║');
    }
    
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    // Lưu kết quả ra file
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        duration: duration + 's',
        summary: {
            passed: testResults.passed,
            failed: testResults.failed,
            total: testResults.passed + testResults.failed
        },
        tests: testResults.tests
    }, null, 2));
    console.log(`\n📄 Báo cáo chi tiết: ${reportPath}`);
    
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Chạy test
runAllTests().catch(e => {
    console.error('Lỗi nghiêm trọng:', e);
    process.exit(1);
});
