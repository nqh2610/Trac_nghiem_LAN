// Test script để phát hiện syntax không tương thích Node 13
// Node 13 KHÔNG hỗ trợ:
// - Optional chaining (?.)
// - Nullish coalescing (??)
// - Logical assignment (||=, &&=, ??=)

var fs = require('fs');
var path = require('path');

console.log('=== KIEM TRA TUONG THICH NODE 13 ===\n');

var serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

var errors = [];

// Kiểm tra Optional Chaining (?.)
var optionalChaining = serverCode.match(/\?\./g);
if (optionalChaining) {
    errors.push('  - Optional chaining (?.) - ' + optionalChaining.length + ' cho');
}

// Kiểm tra Nullish Coalescing (??)
var nullishCoalescing = serverCode.match(/\?\?/g);
if (nullishCoalescing) {
    errors.push('  - Nullish coalescing (??) - ' + nullishCoalescing.length + ' cho');
}

// Kiểm tra Logical Assignment
var logicalAssignment = serverCode.match(/(\|\|=|&&=|\?\?=)/g);
if (logicalAssignment) {
    errors.push('  - Logical assignment - ' + logicalAssignment.length + ' cho');
}

// Kiểm tra class private fields (#)
var privateFields = serverCode.match(/#\w+/g);
if (privateFields) {
    errors.push('  - Private fields (#) - ' + privateFields.length + ' cho');
}

// Kiểm tra top-level await
var topLevelAwait = serverCode.match(/^await\s/gm);
if (topLevelAwait) {
    errors.push('  - Top-level await - ' + topLevelAwait.length + ' cho');
}

// Kiểm tra import/export ES modules
var esModules = serverCode.match(/^(import|export)\s/gm);
if (esModules) {
    errors.push('  - ES Modules (import/export) - ' + esModules.length + ' cho');
}

if (errors.length > 0) {
    console.log('LOI: Tim thay syntax KHONG tuong thich Node 13:\n');
    errors.forEach(function(e) { console.log(e); });
    console.log('\n');
} else {
    console.log('OK: Khong tim thay syntax ES2020+ khong tuong thich.\n');
}

// Kiểm tra các packages
console.log('=== KIEM TRA PACKAGES ===\n');

try {
    var pkg = require('./package.json');
    var deps = pkg.dependencies || {};
    
    var incompatible = {
        'socket.io': { minNode: 14, compatible: '2.5.0' },
        'multer': { minNode: 14, compatible: '1.4.4' }
    };
    
    Object.keys(deps).forEach(function(name) {
        var version = deps[name];
        if (incompatible[name]) {
            var majorVersion = parseInt(version.replace(/[^0-9]/g, '').substring(0, 1));
            console.log('  ' + name + ': ' + version);
            if (name === 'socket.io' && majorVersion >= 4) {
                console.log('    ^ CANH BAO: socket.io 4.x can Node 14+');
                console.log('    ^ Dung phien ban: ' + incompatible[name].compatible);
            }
            if (name === 'multer' && majorVersion >= 2) {
                console.log('    ^ CANH BAO: multer 2.x co the khong tuong thich Node 13');
                console.log('    ^ Dung phien ban: ' + incompatible[name].compatible);
            }
        }
    });
} catch(e) {
    console.log('Khong doc duoc package.json');
}

console.log('\n=== THU PARSE SERVER.JS ===\n');

try {
    // Thử parse syntax
    new Function(serverCode);
    console.log('OK: Syntax server.js hop le!\n');
} catch(e) {
    console.log('LOI SYNTAX:');
    console.log('  ' + e.message);
    
    // Tìm dòng lỗi
    var match = e.message.match(/position (\d+)/);
    if (match) {
        var pos = parseInt(match[1]);
        var lines = serverCode.substring(0, pos).split('\n');
        console.log('  Dong: ' + lines.length);
        console.log('  Noi dung: ' + lines[lines.length - 1].trim());
    }
    console.log('\n');
}

// Thử require các module
console.log('=== THU LOAD MODULES ===\n');

var modules = ['express', 'socket.io', 'mammoth', 'xlsx', 'multer'];
modules.forEach(function(mod) {
    try {
        require(mod);
        console.log('  OK: ' + mod);
    } catch(e) {
        console.log('  LOI: ' + mod + ' - ' + e.message);
    }
});

console.log('\n=== THU KHOI TAO SERVER ===\n');

try {
    var express = require('express');
    var http = require('http');
    var socketIO = require('socket.io');
    
    var app = express();
    var server = http.createServer(app);
    var io = socketIO(server);
    
    console.log('OK: Khoi tao server thanh cong!');
    console.log('');
    console.log('Server co the chay tren Node 13.');
    
    // Cleanup
    server.close();
} catch(e) {
    console.log('LOI: ' + e.message);
    if (e.stack) {
        console.log('\nStack trace:');
        console.log(e.stack.split('\n').slice(0, 5).join('\n'));
    }
}

console.log('\n=== HOAN TAT ===\n');
