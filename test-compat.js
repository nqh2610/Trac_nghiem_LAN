/**
 * Script kiểm tra tương thích Node.js
 * Chạy: node test-compat.js
 */

console.log('=== KIEM TRA TUONG THICH NODE.JS ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('');

var errors = [];

// Test 1: Kiểm tra require cơ bản
console.log('1. Kiem tra require co ban...');
try {
    var fs = require('fs');
    var path = require('path');
    var http = require('http');
    var os = require('os');
    var crypto = require('crypto');
    console.log('   OK - Cac module co ban hoat dong');
} catch (e) {
    errors.push('Module co ban: ' + e.message);
    console.log('   LOI:', e.message);
}

// Test 2: Kiểm tra các module npm
console.log('2. Kiem tra module npm...');
var modules = ['express', 'socket.io', 'mammoth', 'xlsx', 'multer'];
for (var i = 0; i < modules.length; i++) {
    try {
        require(modules[i]);
        console.log('   OK -', modules[i]);
    } catch (e) {
        errors.push(modules[i] + ': ' + e.message);
        console.log('   LOI -', modules[i] + ':', e.message);
    }
}

// Test 3: Kiểm tra license module
console.log('3. Kiem tra license module...');
try {
    var licenseModule = require('./license/license-manager');
    console.log('   OK - license-manager');
} catch (e) {
    errors.push('license-manager: ' + e.message);
    console.log('   LOI - license-manager:', e.message);
}

try {
    var updateModule = require('./license/update-manager');
    console.log('   OK - update-manager');
} catch (e) {
    errors.push('update-manager: ' + e.message);
    console.log('   LOI - update-manager:', e.message);
}

// Test 4: Kiểm tra crypto functions
console.log('4. Kiem tra crypto...');
try {
    var crypto = require('crypto');
    var hash = crypto.createHash('sha256').update('test').digest('hex');
    console.log('   OK - createHash');
    
    // Test scryptSync hoặc pbkdf2Sync
    if (crypto.scryptSync) {
        var key = crypto.scryptSync('password', 'salt', 32);
        console.log('   OK - scryptSync');
    } else if (crypto.pbkdf2Sync) {
        var key = crypto.pbkdf2Sync('password', 'salt', 10000, 32, 'sha256');
        console.log('   OK - pbkdf2Sync (fallback)');
    }
    
    // Test cipher
    var iv = crypto.randomBytes(16);
    var cipher = crypto.createCipheriv('aes-256-cbc', crypto.randomBytes(32), iv);
    console.log('   OK - createCipheriv');
} catch (e) {
    errors.push('crypto: ' + e.message);
    console.log('   LOI - crypto:', e.message);
}

// Test 5: Kiểm tra file system
console.log('5. Kiem tra file system...');
try {
    var dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    console.log('   OK - Thu muc data ton tai');
    
    // Kiểm tra quyền ghi
    var testFile = path.join(dataDir, 'test-write.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('   OK - Quyen ghi file');
} catch (e) {
    errors.push('file system: ' + e.message);
    console.log('   LOI - file system:', e.message);
}

// Test 6: Thử khởi tạo Express
console.log('6. Kiem tra Express...');
try {
    var express = require('express');
    var app = express();
    console.log('   OK - Express khoi tao thanh cong');
} catch (e) {
    errors.push('Express: ' + e.message);
    console.log('   LOI - Express:', e.message);
}

// Kết quả
console.log('');
console.log('=== KET QUA ===');
if (errors.length === 0) {
    console.log('Tat ca kiem tra OK! Ung dung san sang chay.');
    console.log('');
    console.log('Neu van gap loi, hay chay:');
    console.log('  node server.js');
    console.log('de xem thong bao loi chi tiet.');
} else {
    console.log('Co', errors.length, 'loi:');
    for (var i = 0; i < errors.length; i++) {
        console.log('  -', errors[i]);
    }
    console.log('');
    console.log('Giai phap:');
    console.log('  1. Xoa thu muc node_modules');
    console.log('  2. Chay: npm install');
    console.log('  3. Thu lai: node test-compat.js');
}

process.exit(errors.length > 0 ? 1 : 0);
