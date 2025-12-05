/**
 * HỆ THỐNG CẬP NHẬT TỰ ĐỘNG - TRẮC NGHIỆM LAN
 * Kiểm tra và tải bản cập nhật mới
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');

class UpdateManager {
    constructor(options = {}) {
        // URL server cập nhật của bạn
        this.updateServerUrl = options.updateServerUrl || 'https://your-update-server.com/api';
        this.currentVersion = options.currentVersion || '1.0.0';
        this.appName = options.appName || 'TracNghiemLAN';
        this.dataDir = options.dataDir || path.join(__dirname, '..', 'data');
        this.updateDir = path.join(this.dataDir, 'updates');
        this.updateInfoFile = path.join(this.dataDir, '.update-info');
        
        // Đảm bảo thư mục tồn tại
        if (!fs.existsSync(this.updateDir)) {
            fs.mkdirSync(this.updateDir, { recursive: true });
        }
    }

    /**
     * So sánh version
     * @returns -1 nếu v1 < v2, 0 nếu bằng, 1 nếu v1 > v2
     */
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 < p2) return -1;
            if (p1 > p2) return 1;
        }
        return 0;
    }

    /**
     * Kiểm tra có bản cập nhật mới không
     */
    async checkForUpdates() {
        return new Promise((resolve, reject) => {
            const url = `${this.updateServerUrl}/check-update?app=${this.appName}&version=${this.currentVersion}`;
            
            const protocol = url.startsWith('https') ? https : http;
            
            const req = protocol.get(url, { timeout: 10000 }, (res) => {
                let data = '';
                
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const updateInfo = JSON.parse(data);
                        
                        if (updateInfo.latestVersion && 
                            this.compareVersions(this.currentVersion, updateInfo.latestVersion) < 0) {
                            resolve({
                                updateAvailable: true,
                                currentVersion: this.currentVersion,
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
                                currentVersion: this.currentVersion,
                                latestVersion: updateInfo.latestVersion || this.currentVersion
                            });
                        }
                    } catch (e) {
                        reject(new Error('Lỗi phân tích dữ liệu cập nhật: ' + e.message));
                    }
                });
            });

            req.on('error', (e) => {
                reject(new Error('Không thể kết nối server cập nhật: ' + e.message));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Hết thời gian chờ kết nối'));
            });
        });
    }

    /**
     * Tải file cập nhật
     */
    async downloadUpdate(downloadUrl, expectedChecksum, onProgress) {
        return new Promise((resolve, reject) => {
            const fileName = `update_${Date.now()}.exe`;
            const filePath = path.join(this.updateDir, fileName);
            const file = fs.createWriteStream(filePath);
            
            const protocol = downloadUrl.startsWith('https') ? https : http;
            
            const req = protocol.get(downloadUrl, (res) => {
                if (res.statusCode === 302 || res.statusCode === 301) {
                    // Follow redirect
                    file.close();
                    fs.unlinkSync(filePath);
                    return this.downloadUpdate(res.headers.location, expectedChecksum, onProgress)
                        .then(resolve)
                        .catch(reject);
                }

                const totalSize = parseInt(res.headers['content-length'], 10);
                let downloadedSize = 0;
                const hash = crypto.createHash('sha256');

                res.on('data', (chunk) => {
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

                file.on('finish', () => {
                    file.close();
                    
                    // Verify checksum
                    const fileChecksum = hash.digest('hex');
                    if (expectedChecksum && fileChecksum !== expectedChecksum) {
                        fs.unlinkSync(filePath);
                        reject(new Error('File tải về bị hỏng (checksum không khớp)'));
                        return;
                    }

                    resolve({
                        success: true,
                        filePath: filePath,
                        checksum: fileChecksum
                    });
                });
            });

            req.on('error', (e) => {
                file.close();
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                reject(new Error('Lỗi tải file: ' + e.message));
            });
        });
    }

    /**
     * Cài đặt bản cập nhật
     */
    async installUpdate(updateFilePath, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                // Kiểm tra file tồn tại
                if (!fs.existsSync(updateFilePath)) {
                    return reject(new Error('File cập nhật không tồn tại'));
                }

                // Lưu thông tin để app biết đang cập nhật
                const updateInfo = {
                    status: 'installing',
                    file: updateFilePath,
                    timestamp: new Date().toISOString()
                };
                fs.writeFileSync(this.updateInfoFile, JSON.stringify(updateInfo), 'utf8');

                if (options.silent) {
                    // Chạy installer ở chế độ silent
                    const installer = spawn(updateFilePath, ['/SILENT', '/CLOSEAPPLICATIONS'], {
                        detached: true,
                        stdio: 'ignore'
                    });
                    installer.unref();
                } else {
                    // Chạy installer bình thường
                    const installer = spawn(updateFilePath, [], {
                        detached: true,
                        stdio: 'ignore'
                    });
                    installer.unref();
                }

                resolve({
                    success: true,
                    message: 'Đang cài đặt cập nhật. Ứng dụng sẽ khởi động lại...'
                });

            } catch (e) {
                reject(new Error('Lỗi cài đặt: ' + e.message));
            }
        });
    }

    /**
     * Lấy changelog giữa 2 version
     */
    async getChangelog(fromVersion, toVersion) {
        return new Promise((resolve, reject) => {
            const url = `${this.updateServerUrl}/changelog?app=${this.appName}&from=${fromVersion}&to=${toVersion}`;
            
            const protocol = url.startsWith('https') ? https : http;
            
            const req = protocol.get(url, { timeout: 10000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Lỗi đọc changelog'));
                    }
                });
            });

            req.on('error', reject);
        });
    }

    /**
     * Dọn dẹp file cập nhật cũ
     */
    cleanupOldUpdates() {
        try {
            const files = fs.readdirSync(this.updateDir);
            for (const file of files) {
                const filePath = path.join(this.updateDir, file);
                const stat = fs.statSync(filePath);
                
                // Xóa file cũ hơn 7 ngày
                const ageInDays = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);
                if (ageInDays > 7) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (e) {
            console.error('Lỗi dọn dẹp update:', e.message);
        }
    }

    /**
     * Lưu thông tin cập nhật đã bỏ qua
     */
    skipVersion(version) {
        try {
            const skipFile = path.join(this.dataDir, '.skip-update');
            fs.writeFileSync(skipFile, JSON.stringify({ 
                version, 
                skippedAt: new Date().toISOString() 
            }), 'utf8');
        } catch (e) {
            console.error('Lỗi lưu skip version:', e.message);
        }
    }

    /**
     * Kiểm tra version đã bị skip chưa
     */
    isVersionSkipped(version) {
        try {
            const skipFile = path.join(this.dataDir, '.skip-update');
            if (fs.existsSync(skipFile)) {
                const data = JSON.parse(fs.readFileSync(skipFile, 'utf8'));
                return data.version === version;
            }
        } catch (e) {}
        return false;
    }
}

/**
 * Mock Update Server - Dùng để test local
 * Trong production, bạn cần deploy một server thật
 */
class MockUpdateServer {
    constructor(app, currentVersion) {
        this.currentVersion = currentVersion;
        this.setupRoutes(app);
    }

    setupRoutes(app) {
        // API kiểm tra cập nhật
        app.get('/api/check-update', (req, res) => {
            const clientVersion = req.query.version || '1.0.0';
            
            // Giả lập: version mới nhất là 1.1.0
            const latestVersion = '1.1.0';
            
            res.json({
                latestVersion: latestVersion,
                releaseDate: '2024-12-15',
                changelog: [
                    'Thêm tính năng xuất báo cáo PDF',
                    'Sửa lỗi hiển thị điểm',
                    'Cải thiện hiệu suất'
                ],
                downloadUrl: '/api/download-update',
                fileSize: 52428800, // 50MB
                checksum: 'abc123...',
                mandatory: false
            });
        });

        // API tải update
        app.get('/api/download-update', (req, res) => {
            res.status(200).json({
                message: 'Mock download - Trong production sẽ trả về file installer'
            });
        });

        // API changelog
        app.get('/api/changelog', (req, res) => {
            res.json({
                versions: [
                    {
                        version: '1.1.0',
                        date: '2024-12-15',
                        changes: [
                            'Thêm tính năng xuất báo cáo PDF',
                            'Sửa lỗi hiển thị điểm'
                        ]
                    },
                    {
                        version: '1.0.1',
                        date: '2024-12-10',
                        changes: [
                            'Sửa lỗi nhỏ',
                            'Cải thiện UI'
                        ]
                    }
                ]
            });
        });
    }
}

module.exports = { UpdateManager, MockUpdateServer };
