/**
 * HỆ THỐNG QUẢN LÝ LICENSE - TRẮC NGHIỆM LAN
 * Phiên bản tương thích Node.js 10+
 */

var crypto = require('crypto');
var os = require('os');
var fs = require('fs');
var path = require('path');

// Secret key để mã hóa
var SECRET_KEY = 'TracNghiemLAN_2024_SecretKey_!@#$%';

// Tạo encryption key tương thích với Node cũ
function getEncryptionKey() {
    try {
        // Node 10.5+ có scryptSync
        if (crypto.scryptSync) {
            return crypto.scryptSync(SECRET_KEY, 'salt', 32);
        }
    } catch (e) {}
    
    // Fallback cho Node cũ hơn - dùng pbkdf2Sync
    try {
        return crypto.pbkdf2Sync(SECRET_KEY, 'salt', 10000, 32, 'sha256');
    } catch (e) {}
    
    // Fallback cuối - dùng hash đơn giản
    return crypto.createHash('sha256').update(SECRET_KEY).digest();
}

var ENCRYPTION_KEY = getEncryptionKey();
var IV_LENGTH = 16;

function LicenseManager(dataDir) {
    this.dataDir = dataDir || path.join(__dirname, '..', 'data');
    this.licenseFile = path.join(this.dataDir, '.license');
    this.activationFile = path.join(this.dataDir, '.activation');
}

/**
 * Lấy Hardware ID của máy tính
 */
LicenseManager.prototype.getHardwareId = function() {
    try {
        var cpus = os.cpus();
        var networkInterfaces = os.networkInterfaces();
        
        // Lấy thông tin CPU
        var cpuInfo = cpus.length > 0 ? cpus[0].model : 'unknown';
        
        // Lấy MAC address đầu tiên không phải internal
        var macAddress = 'unknown';
        var ifaceNames = Object.keys(networkInterfaces);
        
        for (var i = 0; i < ifaceNames.length; i++) {
            var interfaces = networkInterfaces[ifaceNames[i]];
            for (var j = 0; j < interfaces.length; j++) {
                var iface = interfaces[j];
                if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                    macAddress = iface.mac;
                    break;
                }
            }
            if (macAddress !== 'unknown') break;
        }
        
        // Kết hợp thông tin
        var rawId = cpuInfo + '-' + macAddress + '-' + os.hostname();
        
        // Hash để tạo Hardware ID ngắn gọn
        return crypto.createHash('sha256')
            .update(rawId)
            .digest('hex')
            .substring(0, 16)
            .toUpperCase();
    } catch (e) {
        return 'UNKNOWN-HW-ID';
    }
};

/**
 * Mã hóa dữ liệu
 */
LicenseManager.prototype.encrypt = function(text) {
    try {
        var iv = crypto.randomBytes(IV_LENGTH);
        var cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        var encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (e) {
        return null;
    }
};

/**
 * Giải mã dữ liệu
 */
LicenseManager.prototype.decrypt = function(text) {
    try {
        var parts = text.split(':');
        var iv = Buffer.from(parts[0], 'hex');
        var encryptedText = parts[1];
        var decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        var decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return null;
    }
};

/**
 * Tạo License Key mới (Dành cho ADMIN)
 */
LicenseManager.prototype.generateLicenseKey = function(options) {
    var licenseData = {
        id: crypto.randomBytes(8).toString('hex').toUpperCase(),
        customerName: options.customerName || 'Unknown',
        email: options.email || '',
        type: options.type || 'personal',
        maxStudents: options.maxStudents || 30,
        maxDevices: options.maxDevices || 1,
        expiryDate: options.expiryDate ? options.expiryDate.toISOString() : null,
        createdAt: new Date().toISOString(),
        features: options.features || ['basic']
    };

    // Tạo signature
    var signature = crypto.createHmac('sha256', SECRET_KEY)
        .update(JSON.stringify(licenseData))
        .digest('hex')
        .substring(0, 8)
        .toUpperCase();

    licenseData.signature = signature;

    // Mã hóa và format thành key
    var encoded = Buffer.from(JSON.stringify(licenseData)).toString('base64');
    
    // Format: TNLN-XXXX-XXXX-XXXX-XXXX
    var keyParts = ['TNLN'];
    
    for (var i = 0; i < 4; i++) {
        var partLength = Math.ceil(encoded.length / 4);
        var part = encoded.substring(i * partLength, (i + 1) * partLength);
        keyParts.push(crypto.createHash('md5').update(part + signature).digest('hex').substring(0, 4).toUpperCase());
    }

    return {
        licenseKey: keyParts.join('-'),
        licenseData: encoded,
        rawData: licenseData
    };
};

/**
 * Kích hoạt license trên máy này
 */
LicenseManager.prototype.activate = function(licenseKey, licenseData) {
    try {
        var decoded = JSON.parse(Buffer.from(licenseData, 'base64').toString('utf8'));
        
        // Kiểm tra hết hạn
        if (decoded.expiryDate && new Date(decoded.expiryDate) < new Date()) {
            return { success: false, error: 'License da het han' };
        }

        // Tạo activation data
        var hardwareId = this.getHardwareId();
        var activationData = {
            licenseId: decoded.id,
            licenseKey: licenseKey,
            hardwareId: hardwareId,
            activatedAt: new Date().toISOString(),
            customerName: decoded.customerName,
            type: decoded.type,
            maxStudents: decoded.maxStudents,
            expiryDate: decoded.expiryDate,
            features: decoded.features
        };

        // Tạo activation signature
        activationData.activationSignature = crypto.createHmac('sha256', SECRET_KEY)
            .update(JSON.stringify(activationData))
            .digest('hex');

        // Lưu activation file (encrypted)
        var encryptedActivation = this.encrypt(JSON.stringify(activationData));
        
        this.ensureDir(this.dataDir);
        
        fs.writeFileSync(this.activationFile, encryptedActivation, 'utf8');
        fs.writeFileSync(this.licenseFile, licenseData, 'utf8');

        return { 
            success: true, 
            message: 'Kich hoat thanh cong!',
            data: activationData
        };

    } catch (e) {
        return { success: false, error: 'Loi kich hoat: ' + e.message };
    }
};

/**
 * Tạo thư mục (tương thích Node cũ)
 */
LicenseManager.prototype.ensureDir = function(dirPath) {
    if (fs.existsSync(dirPath)) return;
    
    try {
        fs.mkdirSync(dirPath, { recursive: true });
    } catch (e) {
        // Fallback cho Node cũ không hỗ trợ recursive
        var parts = dirPath.split(path.sep);
        var current = '';
        for (var i = 0; i < parts.length; i++) {
            current = current ? path.join(current, parts[i]) : parts[i];
            if (current && !fs.existsSync(current)) {
                fs.mkdirSync(current);
            }
        }
    }
};

/**
 * Kiểm tra license hiện tại
 */
LicenseManager.prototype.verify = function() {
    try {
        if (!fs.existsSync(this.activationFile)) {
            return { 
                valid: false, 
                error: 'NOT_ACTIVATED',
                message: 'Phan mem chua duoc kich hoat'
            };
        }

        var encryptedData = fs.readFileSync(this.activationFile, 'utf8');
        var decrypted = this.decrypt(encryptedData);
        
        if (!decrypted) {
            return { 
                valid: false, 
                error: 'CORRUPTED',
                message: 'File kich hoat bi hong'
            };
        }

        var activationData = JSON.parse(decrypted);

        // Kiểm tra Hardware ID
        var currentHardwareId = this.getHardwareId();
        if (activationData.hardwareId !== currentHardwareId) {
            return { 
                valid: false, 
                error: 'HARDWARE_MISMATCH',
                message: 'License khong hop le tren may nay'
            };
        }

        // Kiểm tra hết hạn
        if (activationData.expiryDate && new Date(activationData.expiryDate) < new Date()) {
            return { 
                valid: false, 
                error: 'EXPIRED',
                message: 'License da het han',
                expiredAt: activationData.expiryDate
            };
        }

        return {
            valid: true,
            data: {
                customerName: activationData.customerName,
                type: activationData.type,
                maxStudents: activationData.maxStudents,
                expiryDate: activationData.expiryDate,
                features: activationData.features,
                activatedAt: activationData.activatedAt
            }
        };

    } catch (e) {
        return { 
            valid: false, 
            error: 'VERIFY_ERROR',
            message: 'Loi kiem tra license: ' + e.message
        };
    }
};

/**
 * Lấy thông tin license
 */
LicenseManager.prototype.getLicenseInfo = function() {
    var verification = this.verify();
    if (verification.valid) {
        return {
            activated: true,
            customerName: verification.data.customerName,
            type: verification.data.type,
            maxStudents: verification.data.maxStudents,
            expiryDate: verification.data.expiryDate,
            features: verification.data.features,
            activatedAt: verification.data.activatedAt
        };
    }
    return {
        activated: false,
        error: verification.error,
        message: verification.message
    };
};

/**
 * Xóa license (deactivate)
 */
LicenseManager.prototype.deactivate = function() {
    try {
        if (fs.existsSync(this.activationFile)) {
            fs.unlinkSync(this.activationFile);
        }
        if (fs.existsSync(this.licenseFile)) {
            fs.unlinkSync(this.licenseFile);
        }
        return { success: true, message: 'Da huy kich hoat' };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

// ========== TRIAL MANAGER ==========
function TrialManager(dataDir) {
    this.dataDir = dataDir || path.join(__dirname, '..', 'data');
    this.trialFile = path.join(this.dataDir, '.trial');
    this.TRIAL_DAYS = 7;
    this.TRIAL_MAX_STUDENTS = 5;
}

/**
 * Tạo thư mục (tương thích Node cũ)
 */
TrialManager.prototype.ensureDir = function(dirPath) {
    if (fs.existsSync(dirPath)) return;
    
    try {
        fs.mkdirSync(dirPath, { recursive: true });
    } catch (e) {
        var parts = dirPath.split(path.sep);
        var current = '';
        for (var i = 0; i < parts.length; i++) {
            current = current ? path.join(current, parts[i]) : parts[i];
            if (current && !fs.existsSync(current)) {
                fs.mkdirSync(current);
            }
        }
    }
};

/**
 * Lấy thông tin trial
 */
TrialManager.prototype.getTrialInfo = function() {
    try {
        if (fs.existsSync(this.trialFile)) {
            var data = JSON.parse(fs.readFileSync(this.trialFile, 'utf8'));
            var startDate = new Date(data.startDate);
            var endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + this.TRIAL_DAYS);
            
            var now = new Date();
            var daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

            return {
                active: daysLeft > 0,
                startDate: data.startDate,
                endDate: endDate.toISOString(),
                daysLeft: Math.max(0, daysLeft),
                maxStudents: this.TRIAL_MAX_STUDENTS
            };
        } else {
            // Tạo trial mới
            var trialData = {
                startDate: new Date().toISOString(),
                hardwareId: new LicenseManager(this.dataDir).getHardwareId()
            };
            
            this.ensureDir(this.dataDir);
            fs.writeFileSync(this.trialFile, JSON.stringify(trialData), 'utf8');
            
            return {
                active: true,
                startDate: trialData.startDate,
                daysLeft: this.TRIAL_DAYS,
                maxStudents: this.TRIAL_MAX_STUDENTS
            };
        }
    } catch (e) {
        // Nếu có lỗi, trả về trial mặc định
        return { 
            active: true, 
            daysLeft: this.TRIAL_DAYS,
            maxStudents: this.TRIAL_MAX_STUDENTS,
            error: e.message 
        };
    }
};

module.exports = {
    LicenseManager: LicenseManager,
    TrialManager: TrialManager
};
