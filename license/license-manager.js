/**
 * HỆ THỐNG QUẢN LÝ LICENSE - TRẮC NGHIỆM LAN
 * Bảo vệ bản quyền phần mềm
 */

const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Secret key để mã hóa - THAY ĐỔI TRƯỚC KHI PRODUCTION
const SECRET_KEY = 'TracNghiemLAN_2024_SecretKey_!@#$%';
const ENCRYPTION_KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);
const IV_LENGTH = 16;

class LicenseManager {
    constructor(dataDir) {
        this.dataDir = dataDir || path.join(__dirname, '..', 'data');
        this.licenseFile = path.join(this.dataDir, '.license');
        this.activationFile = path.join(this.dataDir, '.activation');
    }

    /**
     * Lấy Hardware ID của máy tính
     * Kết hợp: CPU ID + MAC Address + Hostname
     */
    getHardwareId() {
        const cpus = os.cpus();
        const networkInterfaces = os.networkInterfaces();
        
        // Lấy thông tin CPU
        const cpuInfo = cpus.length > 0 ? cpus[0].model : 'unknown';
        
        // Lấy MAC address đầu tiên không phải internal
        let macAddress = 'unknown';
        for (const [name, interfaces] of Object.entries(networkInterfaces)) {
            for (const iface of interfaces) {
                if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                    macAddress = iface.mac;
                    break;
                }
            }
            if (macAddress !== 'unknown') break;
        }
        
        // Kết hợp thông tin
        const rawId = `${cpuInfo}-${macAddress}-${os.hostname()}`;
        
        // Hash để tạo Hardware ID ngắn gọn
        return crypto.createHash('sha256')
            .update(rawId)
            .digest('hex')
            .substring(0, 16)
            .toUpperCase();
    }

    /**
     * Mã hóa dữ liệu
     */
    encrypt(text) {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Giải mã dữ liệu
     */
    decrypt(text) {
        try {
            const parts = text.split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = parts[1];
            const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (e) {
            return null;
        }
    }

    /**
     * Tạo License Key mới (Dành cho ADMIN)
     * @param {Object} options - Tùy chọn license
     * @param {string} options.customerName - Tên khách hàng
     * @param {string} options.email - Email khách hàng
     * @param {string} options.type - Loại: 'personal', 'school', 'enterprise'
     * @param {number} options.maxStudents - Số học sinh tối đa
     * @param {number} options.maxDevices - Số máy tối đa
     * @param {Date} options.expiryDate - Ngày hết hạn (null = vĩnh viễn)
     */
    generateLicenseKey(options) {
        const licenseData = {
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
        const signature = crypto.createHmac('sha256', SECRET_KEY)
            .update(JSON.stringify(licenseData))
            .digest('hex')
            .substring(0, 8)
            .toUpperCase();

        licenseData.signature = signature;

        // Mã hóa và format thành key
        const encoded = Buffer.from(JSON.stringify(licenseData)).toString('base64');
        
        // Format: TNLN-XXXX-XXXX-XXXX-XXXX
        const keyParts = [];
        keyParts.push('TNLN'); // Prefix: Trac Nghiem LAN
        
        // Chia encoded thành 4 phần
        const partLength = Math.ceil(encoded.length / 4);
        for (let i = 0; i < 4; i++) {
            const part = encoded.substring(i * partLength, (i + 1) * partLength);
            keyParts.push(crypto.createHash('md5').update(part + signature).digest('hex').substring(0, 4).toUpperCase());
        }

        return {
            licenseKey: keyParts.join('-'),
            licenseData: encoded,
            rawData: licenseData
        };
    }

    /**
     * Kích hoạt license trên máy này
     */
    activate(licenseKey, licenseData) {
        try {
            // Giải mã license data
            const decoded = JSON.parse(Buffer.from(licenseData, 'base64').toString('utf8'));
            
            // Verify signature
            const expectedSignature = crypto.createHmac('sha256', SECRET_KEY)
                .update(JSON.stringify({
                    id: decoded.id,
                    customerName: decoded.customerName,
                    email: decoded.email,
                    type: decoded.type,
                    maxStudents: decoded.maxStudents,
                    maxDevices: decoded.maxDevices,
                    expiryDate: decoded.expiryDate,
                    createdAt: decoded.createdAt,
                    features: decoded.features
                }))
                .digest('hex')
                .substring(0, 8)
                .toUpperCase();

            if (decoded.signature !== expectedSignature) {
                return { success: false, error: 'License key không hợp lệ' };
            }

            // Kiểm tra hết hạn
            if (decoded.expiryDate && new Date(decoded.expiryDate) < new Date()) {
                return { success: false, error: 'License đã hết hạn' };
            }

            // Tạo activation data
            const hardwareId = this.getHardwareId();
            const activationData = {
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
            const encryptedActivation = this.encrypt(JSON.stringify(activationData));
            
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
            }
            
            fs.writeFileSync(this.activationFile, encryptedActivation, 'utf8');
            fs.writeFileSync(this.licenseFile, licenseData, 'utf8');

            return { 
                success: true, 
                message: 'Kích hoạt thành công!',
                data: activationData
            };

        } catch (e) {
            return { success: false, error: 'Lỗi kích hoạt: ' + e.message };
        }
    }

    /**
     * Kiểm tra license hiện tại
     */
    verify() {
        try {
            // Kiểm tra file activation tồn tại
            if (!fs.existsSync(this.activationFile)) {
                return { 
                    valid: false, 
                    error: 'NOT_ACTIVATED',
                    message: 'Phần mềm chưa được kích hoạt'
                };
            }

            // Đọc và giải mã activation
            const encryptedData = fs.readFileSync(this.activationFile, 'utf8');
            const decrypted = this.decrypt(encryptedData);
            
            if (!decrypted) {
                return { 
                    valid: false, 
                    error: 'CORRUPTED',
                    message: 'File kích hoạt bị hỏng'
                };
            }

            const activationData = JSON.parse(decrypted);

            // Kiểm tra Hardware ID
            const currentHardwareId = this.getHardwareId();
            if (activationData.hardwareId !== currentHardwareId) {
                return { 
                    valid: false, 
                    error: 'HARDWARE_MISMATCH',
                    message: 'License không hợp lệ trên máy này'
                };
            }

            // Verify activation signature
            const dataToVerify = { ...activationData };
            delete dataToVerify.activationSignature;
            
            const expectedSignature = crypto.createHmac('sha256', SECRET_KEY)
                .update(JSON.stringify(dataToVerify))
                .digest('hex');

            if (activationData.activationSignature !== expectedSignature) {
                return { 
                    valid: false, 
                    error: 'INVALID_SIGNATURE',
                    message: 'License đã bị chỉnh sửa'
                };
            }

            // Kiểm tra hết hạn
            if (activationData.expiryDate && new Date(activationData.expiryDate) < new Date()) {
                return { 
                    valid: false, 
                    error: 'EXPIRED',
                    message: 'License đã hết hạn',
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
                message: 'Lỗi kiểm tra license: ' + e.message
            };
        }
    }

    /**
     * Lấy thông tin license
     */
    getLicenseInfo() {
        const verification = this.verify();
        if (verification.valid) {
            return {
                activated: true,
                ...verification.data
            };
        }
        return {
            activated: false,
            error: verification.error,
            message: verification.message
        };
    }

    /**
     * Xóa license (deactivate)
     */
    deactivate() {
        try {
            if (fs.existsSync(this.activationFile)) {
                fs.unlinkSync(this.activationFile);
            }
            if (fs.existsSync(this.licenseFile)) {
                fs.unlinkSync(this.licenseFile);
            }
            return { success: true, message: 'Đã hủy kích hoạt' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Kiểm tra tính năng có được phép không
     */
    hasFeature(featureName) {
        const info = this.getLicenseInfo();
        if (!info.activated) return false;
        return info.features && info.features.includes(featureName);
    }

    /**
     * Kiểm tra số học sinh có vượt quá giới hạn không
     */
    checkStudentLimit(currentCount) {
        const info = this.getLicenseInfo();
        if (!info.activated) return { allowed: false, message: 'Chưa kích hoạt license' };
        if (currentCount > info.maxStudents) {
            return { 
                allowed: false, 
                message: `Vượt quá giới hạn ${info.maxStudents} học sinh`
            };
        }
        return { allowed: true };
    }
}

// Trial License Manager
class TrialManager {
    constructor(dataDir) {
        this.dataDir = dataDir || path.join(__dirname, '..', 'data');
        this.trialFile = path.join(this.dataDir, '.trial');
        this.TRIAL_DAYS = 7;
        this.TRIAL_MAX_STUDENTS = 5;
    }

    /**
     * Khởi tạo hoặc lấy thông tin trial
     */
    getTrialInfo() {
        try {
            if (fs.existsSync(this.trialFile)) {
                const data = JSON.parse(fs.readFileSync(this.trialFile, 'utf8'));
                const startDate = new Date(data.startDate);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + this.TRIAL_DAYS);
                
                const now = new Date();
                const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

                return {
                    active: daysLeft > 0,
                    startDate: data.startDate,
                    endDate: endDate.toISOString(),
                    daysLeft: Math.max(0, daysLeft),
                    maxStudents: this.TRIAL_MAX_STUDENTS
                };
            } else {
                // Tạo trial mới
                const trialData = {
                    startDate: new Date().toISOString(),
                    hardwareId: new LicenseManager(this.dataDir).getHardwareId()
                };
                
                if (!fs.existsSync(this.dataDir)) {
                    fs.mkdirSync(this.dataDir, { recursive: true });
                }
                fs.writeFileSync(this.trialFile, JSON.stringify(trialData), 'utf8');
                
                return {
                    active: true,
                    startDate: trialData.startDate,
                    daysLeft: this.TRIAL_DAYS,
                    maxStudents: this.TRIAL_MAX_STUDENTS
                };
            }
        } catch (e) {
            return { active: false, error: e.message };
        }
    }
}

module.exports = { LicenseManager, TrialManager };
