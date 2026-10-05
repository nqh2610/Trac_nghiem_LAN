/**
 * HỆ THỐNG CẬP NHẬT TỰ ĐỘNG - TRẮC NGHIỆM LAN
 * Phiên bản tương thích Node.js 10+
 */

var https = require('https');
var http = require('http');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

function UpdateManager(options) {
    options = options || {};
    this.updateServerUrl = options.updateServerUrl || 'https://your-update-server.com/api';
    this.currentVersion = options.currentVersion || '1.0.0';
    this.appName = options.appName || 'TracNghiemLAN';
    this.dataDir = options.dataDir || path.join(__dirname, '..', 'data');
    this.updateDir = path.join(this.dataDir, 'updates');
    this.updateInfoFile = path.join(this.dataDir, '.update-info');
    
    // Đảm bảo thư mục tồn tại
    this.ensureDir(this.updateDir);
}

/**
 * Tạo thư mục (tương thích Node cũ)
 */
UpdateManager.prototype.ensureDir = function(dirPath) {
    if (fs.existsSync(dirPath)) return;
    
    try {
        fs.mkdirSync(dirPath, { recursive: true });
    } catch (e) {
        var parts = dirPath.split(path.sep);
        var current = '';
        for (var i = 0; i < parts.length; i++) {
            current = current ? path.join(current, parts[i]) : parts[i];
            if (current && !fs.existsSync(current)) {
                try { fs.mkdirSync(current); } catch (err) {}
            }
        }
    }
};

/**
 * So sánh version
 */
UpdateManager.prototype.compareVersions = function(v1, v2) {
    var parts1 = v1.split('.').map(Number);
    var parts2 = v2.split('.').map(Number);
    
    var maxLen = Math.max(parts1.length, parts2.length);
    for (var i = 0; i < maxLen; i++) {
        var p1 = parts1[i] || 0;
        var p2 = parts2[i] || 0;
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
    }
    return 0;
};

/**
 * Kiểm tra có bản cập nhật mới không
 */
UpdateManager.prototype.checkForUpdates = function() {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var url = self.updateServerUrl + '/check-update?app=' + self.appName + '&version=' + self.currentVersion;
        
        var protocol = url.indexOf('https') === 0 ? https : http;
        
        var req = protocol.get(url, { timeout: 10000 }, function(res) {
            var data = '';
            
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() {
                try {
                    var updateInfo = JSON.parse(data);
                    
                    if (updateInfo.latestVersion && 
                        self.compareVersions(self.currentVersion, updateInfo.latestVersion) < 0) {
                        resolve({
                            updateAvailable: true,
                            currentVersion: self.currentVersion,
                            latestVersion: updateInfo.latestVersion,
                            releaseDate: updateInfo.releaseDate,
                            changelog: updateInfo.changelog || [],
                            downloadUrl: updateInfo.downloadUrl,
                            fileSize: updateInfo.fileSize,
                            checksum: updateInfo.checksum,
                            mandatory: updateInfo.mandatory || false
                        });
                    } else {
                        resolve({
                            updateAvailable: false,
                            currentVersion: self.currentVersion,
                            latestVersion: updateInfo.latestVersion || self.currentVersion
                        });
                    }
                } catch (e) {
                    reject(new Error('Loi phan tich du lieu cap nhat: ' + e.message));
                }
            });
        });

        req.on('error', function(e) {
            reject(new Error('Khong the ket noi server cap nhat: ' + e.message));
        });

        req.on('timeout', function() {
            req.destroy();
            reject(new Error('Het thoi gian cho ket noi'));
        });
    });
};

/**
 * Tải file cập nhật
 */
UpdateManager.prototype.downloadUpdate = function(downloadUrl, expectedChecksum, onProgress) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        var fileName = 'update_' + Date.now() + '.exe';
        var filePath = path.join(self.updateDir, fileName);
        var file = fs.createWriteStream(filePath);
        
        var protocol = downloadUrl.indexOf('https') === 0 ? https : http;
        
        var req = protocol.get(downloadUrl, function(res) {
            if (res.statusCode === 302 || res.statusCode === 301) {
                file.close();
                fs.unlinkSync(filePath);
                return self.downloadUpdate(res.headers.location, expectedChecksum, onProgress)
                    .then(resolve)
                    .catch(reject);
            }

            var totalSize = parseInt(res.headers['content-length'], 10);
            var downloadedSize = 0;
            var hash = crypto.createHash('sha256');

            res.on('data', function(chunk) {
                downloadedSize += chunk.length;
                hash.update(chunk);
                
                if (onProgress && totalSize) {
                    onProgress({
                        downloaded: downloadedSize,
                        total: totalSize,
                        percent: Math.round((downloadedSize / totalSize) * 100)
                    });
                }
            });

            res.pipe(file);

            file.on('finish', function() {
                file.close();
                
                var fileChecksum = hash.digest('hex');
                if (expectedChecksum && fileChecksum !== expectedChecksum) {
                    fs.unlinkSync(filePath);
                    reject(new Error('File tai ve bi hong (checksum khong khop)'));
                    return;
                }

                resolve({
                    success: true,
                    filePath: filePath,
                    checksum: fileChecksum
                });
            });
        });

        req.on('error', function(e) {
            file.close();
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            reject(new Error('Loi tai file: ' + e.message));
        });
    });
};

/**
 * Dọn dẹp file cập nhật cũ
 */
UpdateManager.prototype.cleanupOldUpdates = function() {
    try {
        var files = fs.readdirSync(this.updateDir);
        for (var i = 0; i < files.length; i++) {
            var filePath = path.join(this.updateDir, files[i]);
            var stat = fs.statSync(filePath);
            
            var ageInDays = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);
            if (ageInDays > 7) {
                fs.unlinkSync(filePath);
            }
        }
    } catch (e) {
        console.error('Loi don dep update:', e.message);
    }
};

/**
 * Mock Update Server - Dùng để test local
 */
function MockUpdateServer(app, currentVersion) {
    this.currentVersion = currentVersion;
    this.setupRoutes(app);
}

MockUpdateServer.prototype.setupRoutes = function(app) {
    var self = this;
    
    // API kiểm tra cập nhật
    app.get('/api/check-update', function(req, res) {
        var clientVersion = req.query.version || '1.0.0';
        var latestVersion = '1.1.0';
        
        res.json({
            latestVersion: latestVersion,
            releaseDate: '2024-12-15',
            changelog: [
                'Them tinh nang xuat bao cao PDF',
                'Sua loi hien thi diem',
                'Cai thien hieu suat'
            ],
            downloadUrl: '/api/download-update',
            fileSize: 52428800,
            checksum: 'abc123...',
            mandatory: false
        });
    });

    // API tải update
    app.get('/api/download-update', function(req, res) {
        res.status(200).json({
            message: 'Mock download - Trong production se tra ve file installer'
        });
    });

    // API changelog
    app.get('/api/changelog', function(req, res) {
        res.json({
            versions: [
                {
                    version: '1.1.0',
                    date: '2024-12-15',
                    changes: ['Them tinh nang xuat bao cao PDF', 'Sua loi hien thi diem']
                },
                {
                    version: '1.0.1',
                    date: '2024-12-10',
                    changes: ['Sua loi nho', 'Cai thien UI']
                }
            ]
        });
    });
};

module.exports = {
    UpdateManager: UpdateManager,
    MockUpdateServer: MockUpdateServer
};
