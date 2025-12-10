// Test chi tiet de tim loi runtime tren Node 13
var fs = require('fs');
var path = require('path');

console.log('');
console.log('===========================================');
console.log('   TEST RUNTIME CHO NODE 13');
console.log('===========================================');
console.log('');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('');

// Bat tat ca loi
process.on('uncaughtException', function(err) {
    console.log('');
    console.log('!!! LOI KHONG XU LY DUOC !!!');
    console.log('Message:', err.message);
    console.log('');
    if (err.stack) {
        console.log('Stack trace:');
        var lines = err.stack.split('\n');
        for (var i = 0; i < Math.min(lines.length, 10); i++) {
            console.log('  ', lines[i]);
        }
    }
    console.log('');
    process.exit(1);
});

process.on('unhandledRejection', function(reason, promise) {
    console.log('');
    console.log('!!! PROMISE REJECTION !!!');
    console.log('Reason:', reason);
    console.log('');
    process.exit(1);
});

// Test tung buoc
function testStep(name, fn) {
    try {
        console.log('Testing:', name, '...');
        fn();
        console.log('  -> OK');
        return true;
    } catch(e) {
        console.log('  -> LOI:', e.message);
        if (e.stack) {
            var lines = e.stack.split('\n').slice(1, 4);
            for (var i = 0; i < lines.length; i++) {
                console.log('     ', lines[i].trim());
            }
        }
        return false;
    }
}

console.log('--- KIEM TRA MODULES ---');
console.log('');

var express, http, socketIO, mammoth, XLSX, multer;

if (!testStep('require express', function() { express = require('express'); })) process.exit(1);
if (!testStep('require http', function() { http = require('http'); })) process.exit(1);
if (!testStep('require socket.io', function() { socketIO = require('socket.io'); })) process.exit(1);
if (!testStep('require mammoth', function() { mammoth = require('mammoth'); })) process.exit(1);
if (!testStep('require xlsx', function() { XLSX = require('xlsx'); })) process.exit(1);
if (!testStep('require multer', function() { multer = require('multer'); })) process.exit(1);

console.log('');
console.log('--- KIEM TRA KHOI TAO ---');
console.log('');

var app, server, io;

if (!testStep('express()', function() { app = express(); })) process.exit(1);
if (!testStep('http.createServer', function() { server = http.createServer(app); })) process.exit(1);
if (!testStep('socketIO(server)', function() { io = socketIO(server); })) process.exit(1);
if (!testStep('multer memory storage', function() { multer({ storage: multer.memoryStorage() }); })) process.exit(1);

console.log('');
console.log('--- KIEM TRA LICENSE MODULES ---');
console.log('');

testStep('license-manager', function() { require('./license/license-manager'); });
testStep('update-manager', function() { require('./license/update-manager'); });

console.log('');
console.log('--- THU CHAY SERVER THUC ---');
console.log('');

console.log('Dang khoi dong server tren port 3457...');

server.on('error', function(err) {
    console.log('LOI SERVER:', err.message);
    process.exit(1);
});

server.listen(3457, '0.0.0.0', function() {
    console.log('');
    console.log('===========================================');
    console.log('   SERVER CHAY THANH CONG!');
    console.log('===========================================');
    console.log('');
    console.log('Neu ban thay dong nay, nghia la server');
    console.log('co the chay duoc tren Node 13.');
    console.log('');
    console.log('Van de co the nam o:');
    console.log('  1. File server.js co loi o phan sau');
    console.log('  2. Loi khi doc/ghi file data');
    console.log('  3. Loi o mot API route cu the');
    console.log('');
    console.log('Dang tat server test...');
    server.close();
    
    // Thu load server.js thuc
    console.log('');
    console.log('--- THU LOAD SERVER.JS ---');
    console.log('');
    
    try {
        console.log('Dang load server.js...');
        require('./server.js');
    } catch(e) {
        console.log('');
        console.log('!!! LOI KHI LOAD SERVER.JS !!!');
        console.log('Message:', e.message);
        if (e.stack) {
            console.log('');
            console.log('Stack:');
            var lines = e.stack.split('\n');
            for (var i = 0; i < Math.min(lines.length, 15); i++) {
                console.log('  ', lines[i]);
            }
        }
    }
});
