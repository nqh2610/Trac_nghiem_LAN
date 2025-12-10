const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const os = require('os');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const multer = require('multer');

// ========== HỆ THỐNG LICENSE & UPDATE ==========
// Tải license module với error handling cho Node.js cũ
let LicenseManager, TrialManager, UpdateManager, MockUpdateServer;
let licenseManager, trialManager, updateManager;
let LICENSE_ENABLED = true;

const APP_VERSION = '1.0.0';

try {
    const licenseModule = require('./license/license-manager');
    const updateModule = require('./license/update-manager');
    LicenseManager = licenseModule.LicenseManager;
    TrialManager = licenseModule.TrialManager;
    UpdateManager = updateModule.UpdateManager;
    MockUpdateServer = updateModule.MockUpdateServer;
    
    licenseManager = new LicenseManager(path.join(__dirname, 'data'));
    trialManager = new TrialManager(path.join(__dirname, 'data'));
    updateManager = new UpdateManager({
        currentVersion: APP_VERSION,
        appName: 'TracNghiemLAN',
        updateServerUrl: 'http://localhost:3456/api',
        dataDir: path.join(__dirname, 'data')
    });
} catch (e) {
    console.log('[!] Khong the tai module license (Node.js version cu?)');
    console.log('    Chay o che do khong co license check');
    LICENSE_ENABLED = false;
}

// Cấu hình multer để lưu file trong memory
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3456;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve thư mục data để download file mẫu
app.use('/data', express.static('data'));

// ========== API LICENSE ==========
// Lấy thông tin license hiện tại
app.get('/api/license/info', function(req, res) {
    if (!LICENSE_ENABLED) {
        return res.json({
            version: APP_VERSION,
            license: { activated: true, type: 'development', customerName: 'Dev Mode' },
            trial: null,
            hardwareId: 'N/A'
        });
    }
    
    var licenseInfo = licenseManager.getLicenseInfo();
    var trialInfo = trialManager.getTrialInfo();
    
    res.json({
        version: APP_VERSION,
        license: licenseInfo,
        trial: !licenseInfo.activated ? trialInfo : null,
        hardwareId: licenseManager.getHardwareId()
    });
});

// Kích hoạt license
app.post('/api/license/activate', function(req, res) {
    if (!LICENSE_ENABLED) {
        return res.json({ success: true, message: 'License disabled in dev mode' });
    }
    
    var licenseKey = req.body.licenseKey;
    var licenseData = req.body.licenseData;
    
    if (!licenseKey || !licenseData) {
        return res.status(400).json({ success: false, error: 'Thiếu thông tin license' });
    }
    
    var result = licenseManager.activate(licenseKey, licenseData);
    res.json(result);
});

// Hủy kích hoạt
app.post('/api/license/deactivate', function(req, res) {
    if (!LICENSE_ENABLED) {
        return res.json({ success: true });
    }
    var result = licenseManager.deactivate();
    res.json(result);
});

// ========== API UPDATE ==========
// Kiểm tra cập nhật
app.get('/api/update/check', function(req, res) {
    if (!LICENSE_ENABLED || !updateManager) {
        return res.json({ 
            updateAvailable: false, 
            currentVersion: APP_VERSION
        });
    }
    
    updateManager.checkForUpdates()
        .then(function(updateInfo) {
            res.json(updateInfo);
        })
        .catch(function(e) {
            res.json({ 
                updateAvailable: false, 
                error: e.message,
                currentVersion: APP_VERSION
            });
        });
});

// Mock update server (cho development) - chỉ khi có module
if (LICENSE_ENABLED && MockUpdateServer) {
    new MockUpdateServer(app, APP_VERSION);
}

// Middleware kiểm tra quyền truy cập trang giáo viên
function isLocalhost(req) {
    var ip = req.ip || req.connection.remoteAddress || '';
    // Kiểm tra localhost (127.0.0.1, ::1, ::ffff:127.0.0.1)
    return ip === '127.0.0.1' || 
           ip === '::1' || 
           ip === '::ffff:127.0.0.1' ||
           ip.includes('127.0.0.1');
}

// Route cho trang giáo viên - chỉ cho localhost
app.get('/teacher', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Từ chối truy cập</title>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        min-height: 100vh; 
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .box {
                        background: white;
                        padding: 40px;
                        border-radius: 20px;
                        text-align: center;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    }
                    .icon { font-size: 4em; margin-bottom: 20px; }
                    h1 { color: #dc3545; margin-bottom: 10px; }
                    p { color: #666; }
                </style>
            </head>
            <body>
                <div class="box">
                    <div class="icon">🚫</div>
                    <h1>Từ chối truy cập</h1>
                    <p>Trang này chỉ dành cho giáo viên trên máy chủ.</p>
                    <p>Học sinh vui lòng truy cập trang làm bài.</p>
                </div>
            </body>
            </html>
        `);
    }
    res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

// Lưu trữ dữ liệu
let questions = [];
let results = [];
let students = []; // Danh sách học sinh từ Excel
let studentStatus = {}; // Trạng thái học sinh: { stt: { selected: false, selectedBy: null, completed: false, canRetry: false } }
let reports = []; // Báo cáo chọn nhầm

// ========== HỆ THỐNG QUẢN LÝ LỚP & BÀI KIỂM TRA ==========
// Mỗi lớp có thể làm nhiều bài kiểm tra
// Mỗi bài kiểm tra có thể cho nhiều lớp làm
// Kết quả lưu theo cặp: classId + examId

let currentSession = {
    classId: null,   // ID lớp hiện tại
    className: null, // Tên lớp hiện tại 
    examId: null,    // ID bài kiểm tra hiện tại
    examName: null   // Tên bài kiểm tra hiện tại
};

let classesData = {};  // { classId: { id, name, studentFile, studentCount, createdAt } }

let examSettings = {
    title: 'Bài kiểm tra trắc nghiệm',
    timeLimit: 30, // phút
    isOpen: false,
    showScore: true, // Cho học sinh xem điểm sau khi nộp bài
    practiceMode: false, // Chế độ ôn tập - hiển thị đúng/sai ngay khi chọn đáp án
    examPassword: '', // Mật khẩu để bắt đầu làm bài (để trống = không cần mật khẩu)
    requirePassword: false // Yêu cầu nhập mật khẩu trước khi làm bài
};

// ========== QUẢN LÝ LỚP ==========
function loadClasses() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data', 'classes.json'), 'utf8');
        classesData = JSON.parse(data);
    } catch (err) {
        classesData = {};
    }
}

function saveClasses() {
    const dir = path.join(__dirname, 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'classes.json'), JSON.stringify(classesData, null, 2), 'utf8');
}

function getClassList() {
    return Object.entries(classesData).map(([id, data]) => ({
        id,
        name: data.name,
        studentCount: data.studentCount || 0,
        studentFile: data.studentFile || null,
        createdAt: data.createdAt
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function createClass(name) {
    const id = 'class_' + Date.now();
    classesData[id] = {
        id,
        name,
        studentCount: 0,
        studentFile: null,
        createdAt: new Date().toISOString()
    };
    saveClasses();
    return classesData[id];
}

function deleteClass(classId) {
    if (classesData[classId]) {
        delete classesData[classId];
        saveClasses();
        return true;
    }
    return false;
}

// ========== QUẢN LÝ BÀI KIỂM TRA ==========
function getSavedExams() {
    const examsDir = path.join(__dirname, 'data', 'exams');
    if (!fs.existsSync(examsDir)) {
        fs.mkdirSync(examsDir, { recursive: true });
        return [];
    }
    
    const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(examsDir, f), 'utf8'));
            return {
                id: f.replace('.json', ''),
                name: data.name || f.replace('.json', ''),
                questionCount: data.questions ? data.questions.length : 0,
                createdAt: data.createdAt || null
            };
        } catch (e) {
            return null;
        }
    }).filter(e => e !== null);
}

function saveExam(examId, name) {
    const examsDir = path.join(__dirname, 'data', 'exams');
    if (!fs.existsSync(examsDir)) {
        fs.mkdirSync(examsDir, { recursive: true });
    }
    
    const examData = {
        name: name,
        questions: questions,
        settings: { ...examSettings, title: name },
        createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(path.join(examsDir, `${examId}.json`), JSON.stringify(examData, null, 2), 'utf8');
}

function loadExam(examId) {
    const examPath = path.join(__dirname, 'data', 'exams', `${examId}.json`);
    if (!fs.existsSync(examPath)) return null;
    
    try {
        return JSON.parse(fs.readFileSync(examPath, 'utf8'));
    } catch (e) {
        return null;
    }
}

function deleteExam(examId) {
    const examPath = path.join(__dirname, 'data', 'exams', `${examId}.json`);
    if (fs.existsSync(examPath)) {
        fs.unlinkSync(examPath);
        return true;
    }
    return false;
}

// ========== QUẢN LÝ KẾT QUẢ THEO LỚP + BÀI ==========
function getResultKey(classId, examId) {
    return `${classId}__${examId}`;
}

function loadResultsForSession(classId, examId) {
    const key = getResultKey(classId, examId);
    const filePath = path.join(__dirname, 'data', 'results', `${key}.json`);
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return [];
    }
}

function saveResultsForSession(classId, examId, resultsData) {
    const dir = path.join(__dirname, 'data', 'results');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const key = getResultKey(classId, examId);
    fs.writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(resultsData, null, 2), 'utf8');
}

function getAllResultsSummary() {
    const resultsDir = path.join(__dirname, 'data', 'results');
    if (!fs.existsSync(resultsDir)) return [];
    
    const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
        try {
            const [classId, examId] = f.replace('.json', '').split('__');
            const data = JSON.parse(fs.readFileSync(path.join(resultsDir, f), 'utf8'));
            const classData = classesData[classId];
            const className = (classData && classData.name) ? classData.name : classId;
            const exam = loadExam(examId);
            const examName = (exam && exam.name) ? exam.name : examId;
            
            return {
                classId,
                className,
                examId,
                examName,
                resultCount: data.length,
                avgScore: data.length > 0 ? (data.reduce((s, r) => s + r.score, 0) / data.length).toFixed(1) : 0
            };
        } catch (e) {
            return null;
        }
    }).filter(e => e !== null);
}

// Load/Save trạng thái phiên hiện tại
function loadCurrentSession() {
    try {
        var sessionPath = path.join(__dirname, 'data', 'current-session.json');
        if (!fs.existsSync(sessionPath)) {
            currentSession = { classId: null, className: null, examId: null, examName: null };
            return;
        }
        var data = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        if (data.currentSession) {
            currentSession.classId = data.currentSession.classId || null;
            currentSession.className = data.currentSession.className || null;
            currentSession.examId = data.currentSession.examId || null;
            currentSession.examName = data.currentSession.examName || null;
        }
        if (data.examSettings) {
            Object.keys(data.examSettings).forEach(function(key) {
                examSettings[key] = data.examSettings[key];
            });
        }
    } catch (e) {
        console.log('    Loi doc session:', e.message);
        currentSession = { classId: null, className: null, examId: null, examName: null };
    }
}

function saveCurrentSession() {
    const dir = path.join(__dirname, 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'current-session.json'), JSON.stringify({
        currentSession,
        examSettings
    }, null, 2), 'utf8');
}

// Lấy key để lưu kết quả theo lớp + bài
function getSessionResultKey() {
    if (!currentSession.classId || !currentSession.examId) return null;
    return `${currentSession.classId}__${currentSession.examId}`;
}

// Load kết quả theo lớp + bài hiện tại
function loadSessionResults() {
    const key = getSessionResultKey();
    if (!key) {
        results = [];
        return;
    }
    
    const filePath = path.join(__dirname, 'data', 'results', `${key}.json`);
    try {
        results = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        results = [];
    }
}

// Lưu kết quả theo lớp + bài hiện tại
function saveSessionResults() {
    const key = getSessionResultKey();
    if (!key) return;
    
    const dir = path.join(__dirname, 'data', 'results');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(results, null, 2), 'utf8');
}

// Load trạng thái học sinh theo lớp + bài hiện tại
function loadSessionStudentStatus() {
    const key = getSessionResultKey();
    if (!key) {
        studentStatus = {};
        return;
    }
    
    const filePath = path.join(__dirname, 'data', 'student-status', `${key}.json`);
    try {
        studentStatus = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        studentStatus = {};
        // Khởi tạo trạng thái cho học sinh từ danh sách
        students.forEach(s => {
            studentStatus[s.stt] = {
                selected: false,
                selectedBy: null,
                completed: false,
                canRetry: false
            };
        });
    }
}

// Lưu trạng thái học sinh theo lớp + bài hiện tại
function saveSessionStudentStatus() {
    const key = getSessionResultKey();
    if (!key) return;
    
    const dir = path.join(__dirname, 'data', 'student-status');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(studentStatus, null, 2), 'utf8');
}

// Load danh sách học sinh theo lớp hiện tại
function loadStudentsForClass() {
    if (!currentSession.classId) {
        // Nếu chưa chọn lớp, load file mặc định
        loadStudentsFromDefaultFile();
        return;
    }
    
    const classData = classesData[currentSession.classId];
    if (!classData || !classData.studentFile) {
        loadStudentsFromDefaultFile();
        return;
    }
    
    const filePath = path.join(__dirname, 'data', 'class-students', classData.studentFile);
    if (!fs.existsSync(filePath)) {
        loadStudentsFromDefaultFile();
        return;
    }
    
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        students = parseStudentData(data);
        console.log('[OK] Da tai ' + students.length + ' hoc sinh cho lop ' + currentSession.className);
    } catch (err) {
        console.error('Lỗi đọc file học sinh:', err);
        loadStudentsFromDefaultFile();
    }
}

function loadStudentsFromDefaultFile() {
    try {
        const excelPath = path.join(__dirname, 'danhsach', 'danhsach.xlsx');
        if (!fs.existsSync(excelPath)) {
            console.log('[!] Chua co file danhsach.xlsx trong thu muc danhsach/');
            students = [];
            return;
        }
        
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        students = parseStudentData(data);
        console.log('[OK] Da tai ' + students.length + ' hoc sinh tu file mac dinh');
    } catch (err) {
        console.error('Lỗi đọc file Excel:', err);
        students = [];
    }
}

function parseStudentData(data) {
    // Log để debug
    if (data.length > 0) {
        console.log('📋 Các cột trong file Excel:', Object.keys(data[0]));
    }
    
    let index = 0;
    return data.map(row => {
        index++;
        
        // Hỗ trợ nhiều tên cột STT khác nhau
        let stt = row['STT'] || row['stt'] || row['Stt'] || row['SỐ TT'] || row['Số TT'] || 
                  row['TT'] || row['tt'] || row['Số thứ tự'] || row['So thu tu'] || 
                  row['#'] || row['No'] || row['NO'] || row['no'] || '';
        
        // Hỗ trợ nhiều tên cột Họ
        let ho = row['Họ'] || row['Ho'] || row['ho'] || row['HO'] || row['HỌ'] ||
                 row['Họ và tên lót'] || row['Ho va ten lot'] || row['Họ tên lót'] || '';
        
        // Hỗ trợ nhiều tên cột Tên  
        let ten = row['Tên'] || row['Ten'] || row['ten'] || row['TEN'] || row['TÊN'] ||
                  row['Họ và tên'] || row['Ho va ten'] || row['Họ tên'] || row['Ho ten'] ||
                  row['HỌ VÀ TÊN'] || row['HO VA TEN'] || row['Hovaten'] || row['hovaten'] ||
                  row['FullName'] || row['fullname'] || row['FULLNAME'] || row['Name'] || row['name'] || '';
        
        // Nữ / Giới tính
        let nu = row['Nữ'] || row['Nu'] || row['nu'] || row['NU'] || row['NỮ'] ||
                 row['Giới tính'] || row['GioiTinh'] || row['GIOITINH'] || row['Gioi tinh'] || 
                 row['GT'] || row['gt'] || row['Gender'] || row['gender'] || '';
        
        // Nếu không có cột HO riêng, lấy tên đầy đủ từ cột TEN
        if (!ho && ten) {
            const parts = ten.trim().split(/\s+/);
            if (parts.length > 1) {
                ten = parts.pop();
                ho = parts.join(' ');
            }
        }
        
        // Xử lý giới tính
        if (typeof nu === 'string') {
            nu = ['x', 'nữ', 'nu', 'female', 'f', 'n'].includes(nu.toLowerCase()) ? 'X' : '';
        }
        
        // Nếu không có STT nhưng có tên, tự tạo STT
        if (!stt && (ho || ten)) {
            stt = index;
        }
        
        // Chuyển STT về string
        stt = String(stt).trim();
        
        return { stt, ho, ten, nu };
    }).filter(s => s.stt && (s.ho || s.ten)); // Cần có STT và ít nhất họ hoặc tên
}

// Load câu hỏi từ file hoặc từ bài kiểm tra hiện tại
function loadQuestions() {
    // Nếu đang có session với examId, load từ exam đã lưu
    if (currentSession.examId) {
        const exam = loadExam(currentSession.examId);
        if (exam) {
            questions = exam.questions || [];
            examSettings = { ...examSettings, ...exam.settings };
            console.log('[OK] Da tai ' + questions.length + ' cau hoi tu bai "' + currentSession.examName + '"');
            return;
        }
    }
    
    // Load từ file mặc định
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data', 'questions.json'), 'utf8');
        questions = JSON.parse(data);
        console.log('[OK] Da tai ' + questions.length + ' cau hoi');
    } catch (err) {
        questions = [];
        console.log('[!] Chua co file cau hoi, se tao moi khi them cau hoi');
    }
}

// Lưu câu hỏi vào file
function saveQuestions() {
    const dir = path.join(__dirname, 'data');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'questions.json'), JSON.stringify(questions, null, 2), 'utf8');
    
    // Nếu đang có exam, cập nhật exam đó
    if (currentSession.examId && currentSession.examName) {
        saveExam(currentSession.examId, currentSession.examName);
    }
}

// Lưu kết quả vào file - ƯU TIÊN lưu theo session
function saveResults() {
    const key = getSessionResultKey();
    if (key) {
        // Lưu theo session
        const dir = path.join(__dirname, 'data', 'results');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(results, null, 2), 'utf8');
    } else {
        // Lưu vào file chung
        const dir = path.join(__dirname, 'data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(results, null, 2), 'utf8');
    }
}

// Load kết quả
function loadResults() {
    const key = getSessionResultKey();
    if (key) {
        const filePath = path.join(__dirname, 'data', 'results', `${key}.json`);
        try {
            results = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (err) {
            results = [];
        }
    } else {
        try {
            const data = fs.readFileSync(path.join(__dirname, 'data', 'results.json'), 'utf8');
            results = JSON.parse(data);
        } catch (err) {
            results = [];
        }
    }
}

// Load danh sách học sinh từ lớp hiện tại hoặc file mặc định
function loadStudents() {
    loadStudentsForClass();
    
    // Khởi tạo trạng thái cho học sinh nếu chưa có
    students.forEach(s => {
        if (!studentStatus[s.stt]) {
            studentStatus[s.stt] = {
                selected: false,
                selectedBy: null,
                completed: false,
                canRetry: false
            };
        }
    });
}

// Lưu trạng thái học sinh - ƯU TIÊN lưu theo session
function saveStudentStatus() {
    const key = getSessionResultKey();
    if (key) {
        const dir = path.join(__dirname, 'data', 'student-status');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(studentStatus, null, 2), 'utf8');
    } else {
        const dir = path.join(__dirname, 'data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'student-status.json'), JSON.stringify(studentStatus, null, 2), 'utf8');
    }
}

// Load trạng thái học sinh
function loadStudentStatus() {
    const key = getSessionResultKey();
    if (key) {
        const filePath = path.join(__dirname, 'data', 'student-status', `${key}.json`);
        try {
            studentStatus = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (err) {
            studentStatus = {};
        }
    } else {
        try {
            const data = fs.readFileSync(path.join(__dirname, 'data', 'student-status.json'), 'utf8');
            studentStatus = JSON.parse(data);
        } catch (err) {
            studentStatus = {};
        }
    }
}

// Lưu báo cáo
function saveReports() {
    const dir = path.join(__dirname, 'data');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'reports.json'), JSON.stringify(reports, null, 2), 'utf8');
}

// Load báo cáo
function loadReports() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data', 'reports.json'), 'utf8');
        reports = JSON.parse(data);
    } catch (err) {
        reports = [];
    }
}

// API Routes

// Lấy danh sách học sinh với trạng thái
app.get('/api/students', (req, res) => {
    const studentsWithStatus = students.map(s => ({
        ...s,
        fullName: `${s.ho} ${s.ten}`,
        status: studentStatus[s.stt] || { selected: false, selectedBy: null, completed: false, canRetry: false }
    }));
    res.json(studentsWithStatus);
});

// Học sinh chọn tên
app.post('/api/select-student', (req, res) => {
    const { stt, socketId } = req.body;
    
    // Kiểm tra học sinh có trong danh sách không
    const student = students.find(s => s.stt == stt);
    if (!student) {
        return res.json({ success: false, error: 'Không tìm thấy học sinh' });
    }
    
    // Tạo status nếu chưa có
    if (!studentStatus[stt]) {
        studentStatus[stt] = { selected: false, selectedBy: null, completed: false, canRetry: false };
    }
    
    const status = studentStatus[stt];
    
    // Kiểm tra đã hoàn thành chưa
    if (status.completed && !status.canRetry) {
        return res.json({ success: false, error: 'Học sinh này đã hoàn thành bài thi' });
    }
    
    // Kiểm tra đã được chọn chưa
    if (status.selected && status.selectedBy !== socketId) {
        return res.json({ success: false, error: 'Tên này đã được chọn bởi người khác' });
    }
    
    // Đánh dấu đã chọn
    status.selected = true;
    status.selectedBy = socketId;
    if (status.canRetry) {
        status.canRetry = false; // Reset retry flag
    }
    saveStudentStatus();
    
    // Thông báo cho tất cả client
    io.emit('studentStatusUpdated', { stt, status: studentStatus[stt] });
    
    res.json({ success: true, student });
});

// Hủy chọn học sinh (khi đóng trang hoặc muốn đổi)
app.post('/api/deselect-student', (req, res) => {
    const { stt, socketId } = req.body;
    
    // Kiểm tra học sinh có trong danh sách không
    const student = students.find(s => s.stt == stt);
    if (!student) {
        return res.json({ success: false, error: 'Không tìm thấy học sinh' });
    }
    
    // Nếu chưa có status thì không cần làm gì
    if (!studentStatus[stt]) {
        return res.json({ success: true });
    }
    
    const status = studentStatus[stt];
    
    // Chỉ hủy nếu đúng người đã chọn và chưa hoàn thành
    if (status.selectedBy === socketId && !status.completed) {
        status.selected = false;
        status.selectedBy = null;
        saveStudentStatus();
        
        io.emit('studentStatusUpdated', { stt, status: studentStatus[stt] });
    }
    
    res.json({ success: true });
});

// Báo cáo chọn nhầm
app.post('/api/report-wrong-selection', (req, res) => {
    const { wrongSTT, correctSTT, reason, socketId } = req.body;
    
    const wrongStudent = students.find(s => s.stt == wrongSTT);
    const correctStudent = students.find(s => s.stt == correctSTT);
    
    if (!wrongStudent || !correctStudent) {
        return res.json({ success: false, error: 'Không tìm thấy thông tin học sinh' });
    }
    
    const report = {
        id: Date.now(),
        wrongSTT,
        wrongName: `${wrongStudent.ho} ${wrongStudent.ten}`,
        correctSTT,
        correctName: `${correctStudent.ho} ${correctStudent.ten}`,
        reason: reason || 'Chọn nhầm',
        socketId,
        status: 'pending', // pending, approved, rejected
        createdAt: new Date().toLocaleString('vi-VN')
    };
    
    reports.push(report);
    saveReports();
    
    // Thông báo cho giáo viên
    io.emit('newReport', report);
    
    res.json({ success: true, report });
});

// Lấy danh sách báo cáo
app.get('/api/reports', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }
    res.json(reports.filter(r => r.status === 'pending'));
});

// Duyệt báo cáo chọn nhầm
app.post('/api/approve-report', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện thao tác này' });
    }
    const { reportId } = req.body;
    
    const report = reports.find(r => r.id == reportId);
    if (!report) {
        return res.json({ success: false, error: 'Không tìm thấy báo cáo' });
    }
    
    // Reset học sinh đã chọn nhầm
    if (studentStatus[report.wrongSTT]) {
        studentStatus[report.wrongSTT].selected = false;
        studentStatus[report.wrongSTT].selectedBy = null;
        // Nếu đã hoàn thành, reset để có thể được chọn lại
        if (studentStatus[report.wrongSTT].completed) {
            studentStatus[report.wrongSTT].completed = false;
        }
    }
    
    // Đánh dấu học sinh đúng
    if (studentStatus[report.correctSTT]) {
        studentStatus[report.correctSTT].selected = true;
        studentStatus[report.correctSTT].selectedBy = report.socketId;
    }
    
    // Chuyển kết quả từ tên sai sang tên đúng (nếu đã nộp bài)
    const wrongStudent = students.find(s => s.stt == report.wrongSTT);
    const correctStudent = students.find(s => s.stt == report.correctSTT);
    
    results.forEach(r => {
        if (r.studentSTT == report.wrongSTT && wrongStudent && correctStudent) {
            r.studentSTT = report.correctSTT;
            r.studentName = `${correctStudent.ho} ${correctStudent.ten}`;
            r.note = `(Chuyển từ ${report.wrongName})`;
        }
    });
    
    // Cập nhật trạng thái completed cho tên đúng nếu đã có kết quả
    const hasResult = results.some(r => r.studentSTT == report.correctSTT);
    if (hasResult && studentStatus[report.correctSTT]) {
        studentStatus[report.correctSTT].completed = true;
        studentStatus[report.correctSTT].selected = false;
        studentStatus[report.correctSTT].selectedBy = null;
    }
    
    report.status = 'approved';
    saveStudentStatus();
    saveReports();
    saveResults();
    
    // Thông báo cập nhật
    io.emit('reportProcessed', { reportId, status: 'approved', correctSTT: report.correctSTT });
    io.emit('studentStatusUpdated', { stt: report.wrongSTT, status: studentStatus[report.wrongSTT] });
    io.emit('studentStatusUpdated', { stt: report.correctSTT, status: studentStatus[report.correctSTT] });
    
    res.json({ success: true });
});

// Từ chối báo cáo
app.post('/api/reject-report', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện thao tác này' });
    }
    const { reportId } = req.body;
    
    const report = reports.find(r => r.id == reportId);
    if (!report) {
        return res.json({ success: false, error: 'Không tìm thấy báo cáo' });
    }
    
    report.status = 'rejected';
    saveReports();
    
    io.emit('reportProcessed', { reportId, status: 'rejected' });
    
    res.json({ success: true });
});

// Cho phép học sinh làm lại
app.post('/api/allow-retry', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện thao tác này' });
    }
    const { stt } = req.body;
    
    if (!studentStatus[stt]) {
        return res.json({ success: false, error: 'Không tìm thấy học sinh' });
    }
    
    studentStatus[stt].completed = false;
    studentStatus[stt].selected = false;
    studentStatus[stt].selectedBy = null;
    studentStatus[stt].canRetry = true;
    saveStudentStatus();
    
    io.emit('studentStatusUpdated', { stt, status: studentStatus[stt] });
    io.emit('retryAllowed', { stt });
    
    res.json({ success: true });
});

// Reset tất cả trạng thái học sinh
app.post('/api/reset-all-students', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện thao tác này' });
    }
    students.forEach(s => {
        studentStatus[s.stt] = {
            selected: false,
            selectedBy: null,
            completed: false,
            canRetry: false
        };
    });
    saveStudentStatus();
    
    io.emit('allStudentsReset');
    
    res.json({ success: true });
});

// Lấy danh sách câu hỏi (chỉ cho giáo viên - localhost)
app.get('/api/questions', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }
    res.json(questions);
});

// Lấy câu hỏi cho học sinh (không có đáp án)
app.get('/api/exam', (req, res) => {
    if (!examSettings.isOpen) {
        return res.json({ error: 'Bài thi chưa được mở' });
    }
    const examQuestions = questions.map((q, index) => ({
        id: index,
        question: q.question,
        options: q.options,
        image: q.image || null
    }));
    res.json({
        title: examSettings.title,
        timeLimit: examSettings.timeLimit,
        questions: examQuestions,
        className: currentSession.className || 'Chưa chọn lớp',
        examId: currentSession.examId || 'default',
        examName: currentSession.examName || examSettings.title,
        practiceMode: examSettings.practiceMode || false
    });
});

// API kiểm tra đáp án cho chế độ ôn tập
app.post('/api/check-answer', (req, res) => {
    if (!examSettings.practiceMode) {
        return res.status(403).json({ error: 'Chế độ ôn tập chưa được bật' });
    }
    
    const { questionIndex, answer } = req.body;
    
    if (questionIndex < 0 || questionIndex >= questions.length) {
        return res.json({ error: 'Câu hỏi không hợp lệ' });
    }
    
    const correctAnswer = questions[questionIndex].correct;
    const isCorrect = answer === correctAnswer;
    
    res.json({
        isCorrect,
        correctAnswer,
        yourAnswer: answer
    });
});

// Kiểm tra học sinh đã nộp bài chưa (cho bài thi hiện tại)
app.get('/api/check-submitted/:stt', (req, res) => {
    const stt = req.params.stt;
    const examId = currentSession.examId || 'default';
    
    // Kiểm tra trong studentStatus
    const status = studentStatus[stt];
    const hasSubmitted = status && status.completed === true;
    
    res.json({
        submitted: hasSubmitted,
        examId: examId,
        canRetry: status ? status.canRetry : false
    });
});

// Thêm câu hỏi mới (chỉ localhost)
app.post('/api/questions', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }
    const { question, options, correct, image } = req.body;
    questions.push({ question, options, correct, image: image || null });
    saveQuestions();
    io.emit('questionsUpdated', questions.length);
    res.json({ success: true, total: questions.length });
});

// Sửa câu hỏi (chỉ localhost)
app.put('/api/questions/:id', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }
    const id = parseInt(req.params.id);
    if (id >= 0 && id < questions.length) {
        questions[id] = req.body;
        saveQuestions();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Không tìm thấy câu hỏi' });
    }
});

// Xóa câu hỏi (chỉ localhost)
app.delete('/api/questions/:id', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }
    const id = parseInt(req.params.id);
    if (id >= 0 && id < questions.length) {
        questions.splice(id, 1);
        saveQuestions();
        io.emit('questionsUpdated', questions.length);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Không tìm thấy câu hỏi' });
    }
});

// Cài đặt bài thi
app.get('/api/settings', (req, res) => {
    res.json({ 
        ...examSettings, 
        currentSession,
        currentExamId: currentSession.examId // backward compatible
    });
});

app.post('/api/settings', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện thao tác này' });
    }
    examSettings = { ...examSettings, ...req.body };
    saveCurrentSession();
    io.emit('examStatusChanged', examSettings.isOpen);
    res.json({ success: true });
});

// Mở bài thi
app.post('/api/exam/open', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    if (questions.length === 0) {
        return res.json({ success: false, error: 'Chưa có câu hỏi nào trong bài thi' });
    }
    
    examSettings.isOpen = true;
    saveCurrentSession();
    io.emit('examStatusChanged', true);
    io.emit('examOpened');
    res.json({ success: true, message: 'Bài thi đã mở' });
});

// Đóng bài thi
app.post('/api/exam/close', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    examSettings.isOpen = false;
    saveCurrentSession();
    io.emit('examStatusChanged', false);
    io.emit('examClosed');
    res.json({ success: true, message: 'Bài thi đã đóng' });
});

// Kiểm tra mật khẩu bắt đầu làm bài
app.post('/api/exam/verify-password', (req, res) => {
    const { password } = req.body;
    
    // Nếu không yêu cầu mật khẩu hoặc mật khẩu trống
    if (!examSettings.requirePassword || !examSettings.examPassword) {
        return res.json({ success: true, message: 'Không cần mật khẩu' });
    }
    
    // Kiểm tra mật khẩu
    if (password === examSettings.examPassword) {
        return res.json({ success: true, message: 'Mật khẩu chính xác' });
    } else {
        return res.json({ success: false, error: 'Mật khẩu không đúng!' });
    }
});

// Kiểm tra xem có yêu cầu mật khẩu không (cho client)
app.get('/api/exam/password-required', (req, res) => {
    res.json({
        required: examSettings.requirePassword && !!examSettings.examPassword
    });
});

// ========== QUẢN LÝ SESSION (LỚP + BÀI KIỂM TRA) ==========

// Lấy thông tin session hiện tại
app.get('/api/session', (req, res) => {
    res.json({
        currentSession,
        examSettings,
        studentCount: students.length,
        resultCount: results.length
    });
});

// Cập nhật session (chọn lớp + bài)
app.post('/api/session', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { classId, examId } = req.body;
    
    // Validate class nếu có
    if (classId) {
        const classData = classesData[classId];
        if (!classData) {
            return res.json({ success: false, error: 'Không tìm thấy lớp' });
        }
        currentSession.classId = classId;
        currentSession.className = classData.name;
    }
    
    // Validate exam nếu có
    if (examId) {
        const exam = loadExam(examId);
        if (!exam) {
            return res.json({ success: false, error: 'Không tìm thấy bài kiểm tra' });
        }
        currentSession.examId = examId;
        currentSession.examName = exam.name;
        
        // Load câu hỏi từ exam
        questions = exam.questions || [];
        examSettings = { ...examSettings, ...exam.settings, isOpen: false };
    }
    
    saveCurrentSession();
    
    // Reload students, results, status cho session mới
    loadStudents();
    loadStudentStatus();
    loadResults();
    
    // Khởi tạo trạng thái cho học sinh mới
    students.forEach(s => {
        if (!studentStatus[s.stt]) {
            studentStatus[s.stt] = {
                selected: false,
                selectedBy: null,
                completed: false,
                canRetry: false
            };
        }
    });
    
    io.emit('sessionChanged', currentSession);
    
    res.json({ 
        success: true, 
        currentSession,
        questionCount: questions.length,
        studentCount: students.length,
        resultCount: results.length
    });
});

// ========== QUẢN LÝ LỚP ==========

// Lấy danh sách lớp
app.get('/api/classes', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }
    res.json({
        classes: getClassList(),
        currentClassId: currentSession.classId
    });
});

// Tạo lớp mới
app.post('/api/classes', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.json({ success: false, error: 'Vui lòng nhập tên lớp' });
    }
    
    // Kiểm tra trùng tên lớp
    const trimmedName = name.trim().toLowerCase();
    const existingClass = Object.values(classesData).find(
        c => c.name.toLowerCase() === trimmedName
    );
    if (existingClass) {
        return res.json({ success: false, error: 'Tên lớp đã tồn tại' });
    }
    
    const newClass = createClass(name.trim());
    
    res.json({ 
        success: true, 
        class: newClass,
        message: `Đã tạo lớp "${name.trim()}"`
    });
});

// Xóa lớp
app.delete('/api/classes/:classId', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { classId } = req.params;
    
    if (classId === currentSession.classId) {
        return res.json({ success: false, error: 'Không thể xóa lớp đang sử dụng' });
    }
    
    if (deleteClass(classId)) {
        res.json({ success: true, message: 'Đã xóa lớp' });
    } else {
        res.json({ success: false, error: 'Không tìm thấy lớp' });
    }
});

// Upload danh sách học sinh cho lớp cụ thể
app.post('/api/classes/:classId/students', upload.single('file'), (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền upload danh sách' });
    }
    
    const { classId } = req.params;
    const classData = classesData[classId];
    
    console.log(`📤 Upload danh sách cho lớp: ${classId}`);
    console.log(`📦 File: ${req.file ? req.file.originalname : 'không có'}, Size: ${req.file ? req.file.size : 0} bytes`);
    
    if (!classData) {
        return res.json({ success: false, error: 'Không tìm thấy lớp' });
    }
    
    if (!req.file || req.file.size === 0) {
        return res.json({ success: false, error: 'File rỗng hoặc không nhận được dữ liệu' });
    }
    
    try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📋 Sheet: ${sheetName}, Số dòng: ${data.length}`);
        if (data.length > 0) {
            console.log(`📋 Các cột: ${Object.keys(data[0]).join(', ')}`);
        }
        
        const parsedStudents = parseStudentData(data);
        console.log(`✅ Parsed: ${parsedStudents.length} học sinh hợp lệ`);
        
        if (parsedStudents.length === 0) {
            return res.json({ success: false, error: 'Không có học sinh hợp lệ' });
        }
        
        // Lưu file vào thư mục class-students
        const dir = path.join(__dirname, 'data', 'class-students');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        const filename = `${classId}.xlsx`;
        fs.writeFileSync(path.join(dir, filename), req.file.buffer);
        
        // Cập nhật thông tin lớp
        classData.studentFile = filename;
        classData.studentCount = parsedStudents.length;
        saveClasses();
        
        // Nếu là lớp hiện tại, reload students
        if (classId === currentSession.classId) {
            loadStudents();
            io.emit('studentsUpdated');
        }
        
        res.json({
            success: true,
            count: parsedStudents.length,
            message: `Đã tải lên ${parsedStudents.length} học sinh cho lớp "${classData.name}"`
        });
        
    } catch (err) {
        console.error('Lỗi upload danh sách:', err);
        res.json({ success: false, error: 'Không thể đọc file Excel' });
    }
});

// ========== QUẢN LÝ BÀI KIỂM TRA ==========

// Lấy danh sách bài kiểm tra
app.get('/api/exams', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }
    res.json({
        currentExamId: currentSession.examId,
        exams: getSavedExams()
    });
});

// Tạo bài kiểm tra mới (API ngắn gọn)
app.post('/api/exams', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.json({ success: false, error: 'Vui lòng nhập tên bài kiểm tra' });
    }
    
    // Tạo ID unique
    const examId = 'exam_' + Date.now();
    
    // Lưu bài kiểm tra trống
    const examData = {
        name: name.trim(),
        questions: [],
        settings: {
            title: name.trim(),
            timeLimit: 30,
            isOpen: false,
            showScore: true
        },
        createdAt: new Date().toISOString()
    };
    
    const dir = path.join(__dirname, 'data', 'exams');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${examId}.json`), JSON.stringify(examData, null, 2), 'utf8');
    
    res.json({ 
        success: true, 
        examId,
        message: `Đã tạo bài kiểm tra "${name.trim()}"` 
    });
});

// Xóa bài kiểm tra
app.delete('/api/exams/:examId', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { examId } = req.params;
    
    // Không cho xóa bài đang dùng
    if (examId === currentSession.examId) {
        return res.json({ success: false, error: 'Không thể xóa bài đang sử dụng' });
    }
    
    const examPath = path.join(__dirname, 'data', 'exams', `${examId}.json`);
    if (fs.existsSync(examPath)) {
        fs.unlinkSync(examPath);
        res.json({ success: true, message: 'Đã xóa bài kiểm tra' });
    } else {
        res.json({ success: false, error: 'Không tìm thấy bài kiểm tra' });
    }
});

// Lưu bài kiểm tra hiện tại
app.post('/api/exams/save', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.json({ success: false, error: 'Vui lòng nhập tên bài kiểm tra' });
    }
    
    // Tạo ID từ tên (loại bỏ ký tự đặc biệt)
    const examId = name.trim()
        .toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'bai-kiem-tra';
    
    saveExam(examId, name.trim());
    
    // Cập nhật session
    currentSession.examId = examId;
    currentSession.examName = name.trim();
    saveCurrentSession();
    
    res.json({ 
        success: true, 
        examId,
        message: `Đã lưu bài kiểm tra "${name.trim()}"` 
    });
});

// Chuyển sang bài kiểm tra khác
app.post('/api/exams/switch', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { examId, resetStudents } = req.body;
    const exam = loadExam(examId);
    
    if (!exam) {
        return res.json({ success: false, error: 'Không tìm thấy bài kiểm tra' });
    }
    
    // Load câu hỏi và cài đặt từ bài kiểm tra
    questions = exam.questions || [];
    examSettings = { ...examSettings, ...exam.settings, isOpen: false };
    
    // Cập nhật session
    currentSession.examId = examId;
    currentSession.examName = exam.name;
    saveCurrentSession();
    
    // Reload results và student status cho session mới
    loadResults();
    loadStudentStatus();
    
    // Reset nếu được yêu cầu (khi là lớp mới hoặc muốn reset)
    if (resetStudents) {
        results = [];
        saveResults();
        
        // Reset trạng thái học sinh
        Object.keys(studentStatus).forEach(stt => {
            studentStatus[stt] = {
                selected: false,
                selectedBy: null,
                completed: false,
                canRetry: false
            };
        });
        saveStudentStatus();
    }
    
    // Lưu câu hỏi vào file chính
    saveQuestions();
    
    // Thông báo cho tất cả client
    io.emit('examSwitched', {
        examId,
        examName: exam.name,
        questionCount: questions.length
    });
    io.emit('sessionChanged', currentSession);
    
    res.json({ 
        success: true, 
        examName: exam.name,
        questionCount: questions.length,
        message: `Đã chuyển sang bài "${exam.name}" với ${questions.length} câu hỏi`
    });
});

// Tạo bài kiểm tra mới (KHÔNG chuyển sang dùng - chỉ lưu vào danh sách)
app.post('/api/exams/create', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.json({ success: false, error: 'Vui lòng nhập tên bài kiểm tra' });
    }
    
    // Tạo examId mới
    const newExamId = 'exam_' + Date.now();
    
    // Lưu bài kiểm tra mới vào file riêng (trống, chưa có câu hỏi)
    const examData = {
        id: newExamId,
        name: name.trim(),
        questions: [],
        createdAt: new Date().toISOString()
    };
    
    const examFilePath = path.join(__dirname, 'data', 'exams', `${newExamId}.json`);
    fs.writeFileSync(examFilePath, JSON.stringify(examData, null, 2));
    
    res.json({ 
        success: true, 
        examId: newExamId,
        message: `Đã tạo bài kiểm tra "${name.trim()}". Bài đang dùng không thay đổi.`
    });
});

// Import câu hỏi vào một bài kiểm tra cụ thể (không phải bài đang dùng)
app.post('/api/exams/:examId/import-json', upload.single('file'), (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { examId } = req.params;
    
    if (!req.file) {
        return res.json({ success: false, error: 'Không có file được upload' });
    }
    
    try {
        // Đọc nội dung file JSON
        const jsonContent = req.file.buffer.toString('utf8');
        const uploadedQuestions = JSON.parse(jsonContent);
        
        if (!Array.isArray(uploadedQuestions) || uploadedQuestions.length === 0) {
            return res.json({ success: false, error: 'File JSON không hợp lệ hoặc rỗng' });
        }
        
        // Validate câu hỏi
        const validQuestions = [];
        uploadedQuestions.forEach((q, index) => {
            if (q.question && q.options && Array.isArray(q.options) && q.options.length >= 2 &&
                typeof q.correct === 'number' && q.correct >= 0 && q.correct < q.options.length) {
                validQuestions.push({
                    question: q.question.trim(),
                    options: q.options.map(opt => String(opt).trim()),
                    correct: q.correct,
                    image: q.image || null
                });
            }
        });
        
        if (validQuestions.length === 0) {
            return res.json({ success: false, error: 'Không có câu hỏi hợp lệ trong file' });
        }
        
        // Đọc file bài kiểm tra
        const examFilePath = path.join(__dirname, 'data', 'exams', `${examId}.json`);
        if (!fs.existsSync(examFilePath)) {
            return res.json({ success: false, error: 'Không tìm thấy bài kiểm tra' });
        }
        
        const examData = JSON.parse(fs.readFileSync(examFilePath, 'utf8'));
        examData.questions = validQuestions;
        examData.updatedAt = new Date().toISOString();
        
        fs.writeFileSync(examFilePath, JSON.stringify(examData, null, 2));
        
        res.json({ 
            success: true, 
            count: validQuestions.length,
            message: `Đã import ${validQuestions.length} câu hỏi vào bài "${examData.name}"`
        });
        
    } catch (err) {
        console.error('Lỗi import:', err);
        res.json({ success: false, error: 'Lỗi: ' + err.message });
    }
});

// Import Word vào bài kiểm tra cụ thể
app.post('/api/exams/:examId/import-word', upload.single('file'), (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { examId } = req.params;
    
    if (!req.file) {
        return res.json({ success: false, error: 'Không có file được upload' });
    }
    
    try {
        const result = mammoth.extractRawText({ buffer: req.file.buffer });
        result.then(data => {
            const text = data.value;
            const parsedQuestions = parseQuestionsFromText(text);
            
            if (parsedQuestions.length === 0) {
                return res.json({ success: false, error: 'Không tìm thấy câu hỏi hợp lệ trong file' });
            }
            
            // Đọc và cập nhật bài kiểm tra
            const examFilePath = path.join(__dirname, 'data', 'exams', `${examId}.json`);
            if (!fs.existsSync(examFilePath)) {
                return res.json({ success: false, error: 'Không tìm thấy bài kiểm tra' });
            }
            
            const examData = JSON.parse(fs.readFileSync(examFilePath, 'utf8'));
            examData.questions = parsedQuestions;
            examData.updatedAt = new Date().toISOString();
            
            fs.writeFileSync(examFilePath, JSON.stringify(examData, null, 2));
            
            res.json({ 
                success: true, 
                count: parsedQuestions.length,
                message: `Đã import ${parsedQuestions.length} câu hỏi vào bài "${examData.name}"`
            });
        }).catch(err => {
            res.json({ success: false, error: 'Không thể đọc file Word: ' + err.message });
        });
        
    } catch (err) {
        console.error('Lỗi import Word:', err);
        res.json({ success: false, error: 'Lỗi: ' + err.message });
    }
});

// Tạo bài kiểm tra mới và CHUYỂN SANG DÙNG NGAY (cũ - giữ lại để tương thích)
app.post('/api/exams/new', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { name, resetStudents } = req.body;
    if (!name || name.trim() === '') {
        return res.json({ success: false, error: 'Vui lòng nhập tên bài kiểm tra' });
    }
    
    // Tạo examId mới
    const newExamId = 'exam_' + Date.now();
    
    // Reset câu hỏi
    questions = [];
    examSettings.title = name.trim();
    examSettings.isOpen = false;
    
    // Cập nhật session
    currentSession.examId = newExamId;
    currentSession.examName = name.trim();
    saveCurrentSession();
    
    // Reset kết quả nếu được yêu cầu
    if (resetStudents) {
        results = [];
        saveResults();
        
        Object.keys(studentStatus).forEach(stt => {
            studentStatus[stt] = {
                selected: false,
                selectedBy: null,
                completed: false,
                canRetry: false
            };
        });
        saveStudentStatus();
    }
    
    saveQuestions();
    
    io.emit('examSwitched', {
        examId: newExamId,
        examName: name.trim(),
        questionCount: 0
    });
    io.emit('sessionChanged', currentSession);
    
    res.json({ 
        success: true, 
        message: `Đã tạo bài kiểm tra mới "${name.trim()}". Hãy thêm câu hỏi!`
    });
});

// Xóa bài kiểm tra
app.delete('/api/exams/:examId', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    const { examId } = req.params;
    
    if (examId === currentSession.examId) {
        return res.json({ success: false, error: 'Không thể xóa bài kiểm tra đang sử dụng' });
    }
    
    if (deleteExam(examId)) {
        res.json({ success: true, message: 'Đã xóa bài kiểm tra' });
    } else {
        res.json({ success: false, error: 'Không tìm thấy bài kiểm tra' });
    }
});

// ========== END QUẢN LÝ BÀI KIỂM TRA ==========

// Nộp bài
app.post('/api/submit', (req, res) => {
    const { studentSTT, studentName, studentClass, answers, timeSpent } = req.body;
    
    // Kiểm tra học sinh đã nộp bài chưa (không cho nộp lại trừ khi được phép)
    if (studentSTT && studentStatus[studentSTT] && studentStatus[studentSTT].completed && !studentStatus[studentSTT].canRetry) {
        return res.json({ 
            success: false, 
            error: 'Bạn đã nộp bài rồi. Không thể nộp lại!' 
        });
    }
    
    // Chấm điểm
    let correctCount = 0;
    const details = questions.map((q, index) => {
        const isCorrect = answers[index] === q.correct;
        if (isCorrect) correctCount++;
        
        // Lấy nội dung text của đáp án để dễ kiểm tra (vì đề đã đảo thứ tự)
        const studentAnswerText = (answers[index] >= 0 && answers[index] < q.options.length) 
            ? q.options[answers[index]] 
            : null;
        const correctAnswerText = q.options[q.correct];
        
        return {
            question: q.question,
            studentAnswer: answers[index],
            studentAnswerText: studentAnswerText,  // Nội dung đáp án HS chọn
            correctAnswer: q.correct,
            correctAnswerText: correctAnswerText,  // Nội dung đáp án đúng
            isCorrect
        };
    });
    
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) / 10 : 0;
    
    const result = {
        studentSTT,
        studentName,
        studentClass,
        score,
        correctCount,
        totalQuestions: questions.length,
        timeSpent,
        submittedAt: new Date().toLocaleString('vi-VN'),
        details
    };
    
    // Tìm và cập nhật kết quả cũ nếu có, hoặc thêm mới
    const existingIndex = results.findIndex(r => r.studentSTT == studentSTT);
    if (existingIndex >= 0) {
        results[existingIndex] = result;
        io.emit('resultUpdated', result);
    } else {
        results.push(result);
        io.emit('newResult', result);
    }
    saveResults();
    
    // Đánh dấu học sinh đã hoàn thành
    if (studentSTT && studentStatus[studentSTT]) {
        studentStatus[studentSTT].completed = true;
        studentStatus[studentSTT].selected = false;
        studentStatus[studentSTT].selectedBy = null;
        studentStatus[studentSTT].canRetry = false; // Reset canRetry sau khi nộp
        saveStudentStatus();
        
        io.emit('studentStatusUpdated', { stt: studentSTT, status: studentStatus[studentSTT] });
    }
    
    res.json({ 
        success: true, 
        score, 
        correctCount, 
        totalQuestions: questions.length,
        showScore: examSettings.showScore
    });
});

// Lấy kết quả (cho giáo viên)
app.get('/api/results', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền truy cập kết quả' });
    }
    res.json(results);
});

// Xóa tất cả kết quả
app.delete('/api/results', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền xóa kết quả' });
    }
    results = [];
    saveResults();
    io.emit('resultsCleared');
    res.json({ success: true });
});

// Xuất kết quả ra Excel
app.get('/api/results/export', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền xuất kết quả' });
    }
    
    // Hàm bỏ dấu tiếng Việt
    function removeVietnameseTones(str) {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .replace(/[^a-zA-Z0-9]/g, '')
            .trim();
    }
    
    // Tạo tên file: TenLop_TenBai_NgayThang
    const className = currentSession.className || 'ChuaChonLop';
    const examName = currentSession.examName || 'ChuaChonBai';
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}`;
    
    const fileName = `${removeVietnameseTones(className)}_${removeVietnameseTones(examName)}_${dateStr}.xlsx`;
    
    // Tạo dữ liệu cho Excel theo danh sách đầy đủ học sinh trong lớp
    // Sắp xếp theo STT, học sinh chưa thi thì để trống điểm
    const excelData = [];
    
    // Lấy danh sách học sinh, sắp xếp theo STT
    const sortedStudents = [...students].sort((a, b) => a.stt - b.stt);
    
    for (const student of sortedStudents) {
        // Tìm kết quả của học sinh này (theo STT)
        const result = results.find(r => r.studentSTT === student.stt);
        
        // Ghép họ + tên thành họ tên đầy đủ
        const fullName = [student.ho, student.ten].filter(Boolean).join(' ').trim();
        
        if (result) {
            // Học sinh đã thi - có điểm
            excelData.push({
                'STT': student.stt,
                'Họ tên': fullName || result.studentName || '',
                'Điểm': result.score,
                'Số câu đúng': result.correctCount,
                'Tổng câu': result.totalQuestions,
                'Thời gian làm': result.timeSpent,
                'Thời gian nộp': result.submittedAt
            });
        } else {
            // Học sinh chưa thi - để trống điểm
            excelData.push({
                'STT': student.stt,
                'Họ tên': fullName,
                'Điểm': '',
                'Số câu đúng': '',
                'Tổng câu': '',
                'Thời gian làm': '',
                'Thời gian nộp': ''
            });
        }
    }
    
    // Tạo worksheet và workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
        { wch: 5 },   // STT
        { wch: 25 },  // Họ tên
        { wch: 8 },   // Điểm
        { wch: 12 },  // Số câu đúng
        { wch: 10 },  // Tổng câu
        { wch: 15 },  // Thời gian làm
        { wch: 20 }   // Thời gian nộp
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KetQua');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
});

// Download mẫu file Excel danh sách học sinh - Mẫu đầy đủ (STT, HO, TEN, NU)
app.get('/api/sample-excel', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền tải file mẫu' });
    }
    
    const sampleData = [
        { STT: 1, HO: 'Nguyễn Văn', TEN: 'An', NU: '' },
        { STT: 2, HO: 'Trần Thị', TEN: 'Bình', NU: 'X' },
        { STT: 3, HO: 'Lê Hoàng', TEN: 'Cường', NU: '' },
        { STT: 4, HO: 'Phạm Thị', TEN: 'Dung', NU: 'X' },
        { STT: 5, HO: 'Hoàng Văn', TEN: 'Em', NU: '' }
    ];
    
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 5 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSach');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=mau-daydu-stt-ho-ten-nu.xlsx');
    res.send(buffer);
});

// Download mẫu file Excel - Mẫu phổ biến (STT, TEN, NU)
app.get('/api/sample-excel-2', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền tải file mẫu' });
    }
    
    const sampleData = [
        { STT: 1, TEN: 'Nguyễn Văn An', NU: '' },
        { STT: 2, TEN: 'Trần Thị Bình', NU: 'X' },
        { STT: 3, TEN: 'Lê Hoàng Cường', NU: '' },
        { STT: 4, TEN: 'Phạm Thị Dung', NU: 'X' },
        { STT: 5, TEN: 'Hoàng Văn Em', NU: '' }
    ];
    
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 5 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSach');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=mau-phobien-stt-ten-nu.xlsx');
    res.send(buffer);
});

// Download mẫu file Excel - Mẫu đơn giản (STT, TEN)
app.get('/api/sample-excel-3', (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền tải file mẫu' });
    }
    
    const sampleData = [
        { STT: 1, TEN: 'Nguyễn Văn An' },
        { STT: 2, TEN: 'Trần Thị Bình' },
        { STT: 3, TEN: 'Lê Hoàng Cường' },
        { STT: 4, TEN: 'Phạm Thị Dung' },
        { STT: 5, TEN: 'Hoàng Văn Em' }
    ];
    
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSach');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=mau-dongian-stt-ten.xlsx');
    res.send(buffer);
});

// Upload danh sách học sinh từ Excel
app.post('/api/upload-students', express.raw({ type: '*/*', limit: '10mb' }), (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền upload danh sách' });
    }
    
    try {
        // Đọc file Excel từ buffer
        const workbook = XLSX.read(req.body, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        if (!data || data.length === 0) {
            return res.json({ 
                success: false, 
                error: 'File Excel trống hoặc không đọc được dữ liệu.' 
            });
        }
        
        // Kiểm tra cột bắt buộc
        const firstRow = data[0];
        const hasSTT = 'STT' in firstRow || 'stt' in firstRow || 'Stt' in firstRow;
        const hasTEN = 'TEN' in firstRow || 'Ten' in firstRow || 'ten' in firstRow || 
                       'Tên' in firstRow || 'TÊN' in firstRow;
        
        if (!hasSTT) {
            return res.json({ 
                success: false, 
                error: 'Thiếu cột STT. File phải có cột STT (số thứ tự).' 
            });
        }
        
        if (!hasTEN) {
            return res.json({ 
                success: false, 
                error: 'Thiếu cột TEN. File phải có cột TEN (tên học sinh).' 
            });
        }
        
        // Parse dữ liệu học sinh
        const parsedStudents = [];
        const errors = [];
        
        data.forEach((row, index) => {
            const rowNum = index + 2; // Dòng trong Excel (1-indexed + header)
            const stt = row['STT'] || row['stt'] || row['Stt'] || '';
            let ho = row['Họ'] || row['Ho'] || row['ho'] || row['HO'] || row['HỌ'] || '';
            let ten = row['Tên'] || row['Ten'] || row['ten'] || row['TEN'] || row['TÊN'] || '';
            let nu = row['Nữ'] || row['Nu'] || row['nu'] || row['NU'] || row['NỮ'] ||
                     row['Giới tính'] || row['GioiTinh'] || row['GIOITINH'] || row['Gioi tinh'] || '';
            
            // Kiểm tra lỗi từng dòng
            if (!stt) {
                errors.push(`Dòng ${rowNum}: Thiếu STT`);
                return;
            }
            
            if (!ten && !ho) {
                errors.push(`Dòng ${rowNum}: Thiếu tên học sinh`);
                return;
            }
            
            // Nếu không có cột HO riêng, tách họ tên từ cột TEN
            if (!ho && ten) {
                const parts = ten.trim().split(/\s+/);
                if (parts.length > 1) {
                    ten = parts.pop();
                    ho = parts.join(' ');
                }
            }
            
            // Xử lý giới tính
            if (typeof nu === 'string') {
                nu = ['x', 'nữ', 'nu', 'female', 'f'].includes(nu.toLowerCase()) ? 'X' : '';
            }
            
            parsedStudents.push({ stt, ho, ten, nu });
        });
        
        // Nếu có lỗi, trả về danh sách lỗi
        if (errors.length > 0 && parsedStudents.length === 0) {
            return res.json({
                success: false,
                error: 'Không có học sinh hợp lệ trong file.',
                details: errors
            });
        }
        
        // Lưu file vào thư mục danhsach
        const dir = path.join(__dirname, 'danhsach');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(dir, 'danhsach.xlsx'), req.body);
        
        // Reload danh sách học sinh
        loadStudents();
        
        // Phát sự kiện cập nhật
        io.emit('studentsUpdated');
        
        res.json({
            success: true,
            count: parsedStudents.length,
            warnings: errors.length > 0 ? errors : null,
            message: `Đã tải lên ${parsedStudents.length} học sinh thành công!`
        });
        
    } catch (err) {
        console.error('Lỗi upload danh sách học sinh:', err);
        res.json({
            success: false,
            error: 'Không thể đọc file. Đảm bảo file là định dạng Excel (.xlsx hoặc .xls).'
        });
    }
});

// Upload câu hỏi từ file JSON (qua FormData)
app.post('/api/import-json-file', upload.single('file'), (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền upload câu hỏi' });
    }
    
    if (!req.file) {
        return res.json({ success: false, error: 'Không có file được upload' });
    }
    
    try {
        // Đọc nội dung file JSON từ buffer
        const jsonContent = req.file.buffer.toString('utf8');
        const uploadedQuestions = JSON.parse(jsonContent);
        
        // Kiểm tra dữ liệu
        if (!Array.isArray(uploadedQuestions)) {
            return res.json({
                success: false,
                error: 'File JSON không hợp lệ. Phải là một mảng các câu hỏi.'
            });
        }
        
        if (uploadedQuestions.length === 0) {
            return res.json({
                success: false,
                error: 'File JSON không có câu hỏi nào.'
            });
        }
        
        // Validate và import câu hỏi
        const validQuestions = [];
        const errors = [];
        
        uploadedQuestions.forEach((q, index) => {
            const qNum = index + 1;
            
            if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') {
                errors.push(`Câu ${qNum}: Thiếu nội dung câu hỏi`);
                return;
            }
            
            if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                errors.push(`Câu ${qNum}: Thiếu hoặc không đủ đáp án`);
                return;
            }
            
            if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) {
                errors.push(`Câu ${qNum}: Đáp án đúng không hợp lệ`);
                return;
            }
            
            validQuestions.push({
                question: q.question.trim(),
                options: q.options.map(opt => String(opt).trim()),
                correct: q.correct,
                image: q.image || null
            });
        });
        
        if (validQuestions.length === 0) {
            return res.json({
                success: false,
                error: 'Không có câu hỏi hợp lệ. ' + errors.slice(0, 3).join('; ')
            });
        }
        
        // Thêm vào danh sách câu hỏi hiện tại
        questions = validQuestions;
        saveQuestions();
        
        io.emit('questionsUpdated', questions.length);
        
        res.json({
            success: true,
            count: validQuestions.length,
            errors: errors.length > 0 ? errors.slice(0, 5) : undefined
        });
        
    } catch (err) {
        console.error('Lỗi import JSON:', err);
        res.json({
            success: false,
            error: 'File JSON không hợp lệ: ' + err.message
        });
    }
});

// Upload câu hỏi từ file JSON (cũ - qua body)
app.post('/api/upload-questions-json', express.json({ limit: '10mb' }), (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền upload câu hỏi' });
    }
    
    try {
        const uploadedQuestions = req.body;
        
        // Kiểm tra dữ liệu
        if (!Array.isArray(uploadedQuestions)) {
            return res.json({
                success: false,
                error: 'File JSON không hợp lệ. Phải là một mảng các câu hỏi.'
            });
        }
        
        if (uploadedQuestions.length === 0) {
            return res.json({
                success: false,
                error: 'File JSON không có câu hỏi nào.'
            });
        }
        
        // Validate từng câu hỏi
        const validQuestions = [];
        const errors = [];
        
        uploadedQuestions.forEach((q, index) => {
            const qNum = index + 1;
            
            // Kiểm tra câu hỏi
            if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') {
                errors.push(`Câu ${qNum}: Thiếu nội dung câu hỏi (question)`);
                return;
            }
            
            // Kiểm tra options
            if (!q.options || !Array.isArray(q.options)) {
                errors.push(`Câu ${qNum}: Thiếu danh sách đáp án (options)`);
                return;
            }
            
            if (q.options.length < 2) {
                errors.push(`Câu ${qNum}: Phải có ít nhất 2 đáp án`);
                return;
            }
            
            // Kiểm tra đáp án đúng
            if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) {
                errors.push(`Câu ${qNum}: Đáp án đúng (correct) không hợp lệ`);
                return;
            }
            
            // Câu hỏi hợp lệ
            validQuestions.push({
                question: q.question.trim(),
                options: q.options.map(opt => String(opt).trim()),
                correct: q.correct,
                image: q.image || null
            });
        });
        
        if (validQuestions.length === 0) {
            return res.json({
                success: false,
                error: 'Không có câu hỏi hợp lệ trong file.',
                details: errors
            });
        }
        
        // Thêm vào danh sách câu hỏi
        questions = questions.concat(validQuestions);
        saveQuestions();
        
        io.emit('questionsUpdated', questions.length);
        
        res.json({
            success: true,
            imported: validQuestions.length,
            total: questions.length,
            warnings: errors.length > 0 ? errors : null,
            message: `Đã import ${validQuestions.length} câu hỏi thành công!`
        });
        
    } catch (err) {
        console.error('Lỗi upload câu hỏi JSON:', err);
        res.json({
            success: false,
            error: 'Không thể đọc file JSON. Kiểm tra định dạng file.'
        });
    }
});

// Import câu hỏi từ file Word
app.post('/api/import-word', upload.single('file'), async (req, res) => {
    if (!isLocalhost(req)) {
        return res.status(403).json({ error: 'Không có quyền import câu hỏi' });
    }
    
    console.log(`📤 Import Word: ${req.file ? req.file.originalname : 'không có file'}, Size: ${req.file ? req.file.size : 0} bytes`);
    
    if (!req.file || req.file.size === 0) {
        return res.json({ success: false, error: 'Không nhận được file' });
    }
    
    try {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        const text = result.value;
        
        console.log(`📝 Nội dung trích xuất: ${text.substring(0, 200)}...`);
        
        // Parse câu hỏi từ text
        const parsedQuestions = parseQuestionsFromText(text);
        
        if (parsedQuestions.length === 0) {
            return res.json({ success: false, error: 'Không tìm thấy câu hỏi nào. Kiểm tra lại định dạng file.' });
        }
        
        // Thêm vào danh sách câu hỏi
        questions = questions.concat(parsedQuestions);
        saveQuestions();
        
        io.emit('questionsUpdated', questions.length);
        
        res.json({ success: true, imported: parsedQuestions.length, total: questions.length });
    } catch (err) {
        console.error('Lỗi đọc file Word:', err);
        res.json({ success: false, error: 'Không thể đọc file Word' });
    }
});

// Hàm parse câu hỏi từ text
function parseQuestionsFromText(text) {
    const questions = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    let currentQuestion = null;
    let currentOptions = [];
    let correctAnswer = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Kiểm tra nếu là câu hỏi (bắt đầu bằng "Câu X:" hoặc "Câu X." hoặc số)
        const questionMatch = line.match(/^(Câu\s*\d+[\.:]\s*|^\d+[\.:]\s*)(.*)/i);
        
        if (questionMatch) {
            // Lưu câu hỏi trước đó
            if (currentQuestion && currentOptions.length >= 2) {
                questions.push({
                    question: currentQuestion,
                    options: currentOptions,
                    correct: correctAnswer >= 0 ? correctAnswer : 0,
                    image: null
                });
            }
            
            currentQuestion = questionMatch[2] || '';
            currentOptions = [];
            correctAnswer = -1;
            continue;
        }
        
        // Kiểm tra nếu là đáp án (A. B. C. D. hoặc A) B) C) D))
        const optionMatch = line.match(/^([A-Da-d])[\.\)]\s*(.*)/);
        
        if (optionMatch && currentQuestion) {
            let optionText = optionMatch[2];
            const optionIndex = optionMatch[1].toUpperCase().charCodeAt(0) - 65;
            
            // Kiểm tra đáp án đúng (có dấu * hoặc [x] hoặc (đúng))
            if (optionText.includes('*') || optionText.includes('[x]') || optionText.includes('[X]') || 
                optionText.toLowerCase().includes('(đúng)') || optionText.toLowerCase().includes('(dung)')) {
                correctAnswer = optionIndex;
                optionText = optionText.replace(/\*|\[x\]|\[X\]|\(đúng\)|\(dung\)/gi, '').trim();
            }
            
            // Đảm bảo đủ số option
            while (currentOptions.length < optionIndex) {
                currentOptions.push('');
            }
            currentOptions[optionIndex] = optionText;
        }
        // Nếu không match và đang có câu hỏi, có thể là phần tiếp của câu hỏi
        else if (currentQuestion && currentOptions.length === 0 && !line.match(/^[A-Da-d][\.\)]/)) {
            currentQuestion += ' ' + line;
        }
    }
    
    // Lưu câu hỏi cuối cùng
    if (currentQuestion && currentOptions.length >= 2) {
        questions.push({
            question: currentQuestion,
            options: currentOptions,
            correct: correctAnswer >= 0 ? correctAnswer : 0,
            image: null
        });
    }
    
    return questions;
}

// Socket.IO
io.on('connection', (socket) => {
    console.log('📱 Có người kết nối:', socket.id);
    
    // Gửi socket ID cho client
    socket.emit('connected', { socketId: socket.id });
    
    // Nhận thông báo khi học sinh rời tab
    socket.on('tabLeave', (data) => {
        console.log(`⚠️ Học sinh ${data.name} (STT ${data.stt}) rời khỏi trang lần ${data.count}`);
        
        // Lưu vào student status
        if (studentStatus[data.stt]) {
            studentStatus[data.stt].tabLeaveCount = data.count;
            studentStatus[data.stt].lastTabLeave = data.time;
            saveStudentStatus();
        }
        
        // Thông báo cho giáo viên (teacher dashboard)
        io.emit('studentTabLeave', {
            stt: data.stt,
            name: data.name,
            count: data.count,
            time: data.time
        });
    });
    
    // Khi ngắt kết nối, hủy chọn học sinh nếu chưa hoàn thành
    socket.on('disconnect', () => {
        console.log('📴 Ngắt kết nối:', socket.id);
        
        // Tìm và hủy chọn học sinh
        for (const stt in studentStatus) {
            const status = studentStatus[stt];
            if (status.selectedBy === socket.id && !status.completed) {
                status.selected = false;
                status.selectedBy = null;
                saveStudentStatus();
                io.emit('studentStatusUpdated', { stt, status: studentStatus[stt] });
            }
        }
    });
});

// Lấy địa chỉ IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Khởi động server
console.log('Dang tai du lieu...');
loadClasses();         // Load danh sách lớp
console.log('  - Da tai danh sach lop');
loadCurrentSession();  // Load session (lớp + bài đang dùng)
console.log('  - Da tai session');
loadQuestions();       // Load câu hỏi theo session
console.log('  - Da tai cau hoi');
loadStudents();        // Load học sinh theo lớp
console.log('  - Da tai hoc sinh');
loadStudentStatus();   // Load trạng thái theo session
console.log('  - Da tai trang thai');
loadResults();         // Load kết quả theo session  
console.log('  - Da tai ket qua');
loadReports();         // Load báo cáo
console.log('  - Da tai bao cao');
console.log('Hoan tat tai du lieu!');
console.log('');

server.listen(PORT, '0.0.0.0', function() {
    var ip = getLocalIP();
    var hostname = os.hostname().toLowerCase();
    
    // Kiểm tra license
    var licenseStatus = '';
    
    if (LICENSE_ENABLED && licenseManager && trialManager) {
        var licenseInfo = licenseManager.getLicenseInfo();
        var trialInfo = trialManager.getTrialInfo();
        
        if (licenseInfo.activated) {
            licenseStatus = 'License: ' + licenseInfo.type.toUpperCase() + ' - ' + licenseInfo.customerName;
        } else if (trialInfo.active) {
            licenseStatus = 'Dung thu: con ' + trialInfo.daysLeft + ' ngay (' + trialInfo.maxStudents + ' hoc sinh)';
        } else {
            licenseStatus = 'Het han dung thu - Vui long mua license';
        }
    } else {
        licenseStatus = 'Development Mode - No License Check';
    }
    
    console.log('');
    console.log('================================================================');
    console.log('');
    console.log('   TRAC NGHIEM LAN v' + APP_VERSION + ' - He thong thi trac nghiem');
    console.log('');
    console.log('----------------------------------------------------------------');
    console.log('   ' + licenseStatus);
    if (currentSession.className || currentSession.examName) {
        console.log('');
        console.log('   Lop: ' + (currentSession.className || 'Chua chon'));
        console.log('   Bai: ' + (currentSession.examName || 'Chua chon'));
    }
    console.log('');
    console.log('   Giao vien truy cap (chi tren may nay):');
    console.log('      http://localhost:' + PORT + '/teacher');
    console.log('');
    console.log('   Link gui hoc sinh:');
    console.log('      http://' + hostname + ':' + PORT);
    console.log('');
    console.log('   Link du phong:');
    console.log('      http://' + ip + ':' + PORT);
    console.log('');
    console.log('----------------------------------------------------------------');
    console.log('   Nhan Ctrl+C de tat server');
    console.log('================================================================');
    console.log('');
});
