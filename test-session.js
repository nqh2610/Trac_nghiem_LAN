/**
 * TEST SESSION - Chay file nay de kiem tra loi
 * node test-session.js
 */

console.log('=== TEST SESSION ===');
console.log('');

var fs = require('fs');
var path = require('path');

console.log('1. Thu require fs va path...');
console.log('   OK');

var sessionPath = path.join(__dirname, 'data', 'current-session.json');
console.log('2. Duong dan session:', sessionPath);

console.log('3. Kiem tra file ton tai...');
var exists = fs.existsSync(sessionPath);
console.log('   File ton tai:', exists);

if (!exists) {
    console.log('   => Khong co file, ket thuc test');
    process.exit(0);
}

console.log('4. Doc file...');
var content;
try {
    content = fs.readFileSync(sessionPath, 'utf8');
    console.log('   OK - Doc duoc', content.length, 'ky tu');
} catch (e) {
    console.log('   LOI:', e.message);
    process.exit(1);
}

console.log('5. Parse JSON...');
var data;
try {
    data = JSON.parse(content);
    console.log('   OK - Parse thanh cong');
} catch (e) {
    console.log('   LOI:', e.message);
    process.exit(1);
}

console.log('6. Kiem tra cau truc data...');
console.log('   currentSession:', data.currentSession ? 'CO' : 'KHONG');
console.log('   examSettings:', data.examSettings ? 'CO' : 'KHONG');

console.log('7. Gan gia tri...');
var currentSession = { classId: null, className: null, examId: null, examName: null };

if (data && data.currentSession) {
    currentSession.classId = data.currentSession.classId || null;
    currentSession.className = data.currentSession.className || null;
    currentSession.examId = data.currentSession.examId || null;
    currentSession.examName = data.currentSession.examName || null;
}
console.log('   OK');
console.log('   currentSession:', JSON.stringify(currentSession));

console.log('');
console.log('=== TEST HOAN TAT - KHONG CO LOI ===');
console.log('');
console.log('Neu server van bi treo, van de khong phai o loadCurrentSession');
