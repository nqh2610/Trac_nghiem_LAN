/**
 * ADMIN TOOL - Tạo và quản lý License Key
 * Chỉ dành cho người phát triển/admin
 * 
 * Cách sử dụng:
 * node admin-tool.js generate --name "Tên KH" --email "email@example.com" --type school
 * node admin-tool.js list
 * node admin-tool.js verify <license-key>
 */

const fs = require('fs');
const path = require('path');
const { LicenseManager } = require('./license-manager');
const readline = require('readline');

const licenseManager = new LicenseManager();
const licensesDbFile = path.join(__dirname, 'licenses-db.json');

// Load database licenses đã tạo
function loadLicensesDb() {
    try {
        if (fs.existsSync(licensesDbFile)) {
            return JSON.parse(fs.readFileSync(licensesDbFile, 'utf8'));
        }
    } catch (e) {}
    return { licenses: [] };
}

// Save database
function saveLicensesDb(db) {
    fs.writeFileSync(licensesDbFile, JSON.stringify(db, null, 2), 'utf8');
}

// Tạo license mới
function generateLicense(options) {
    const result = licenseManager.generateLicenseKey(options);
    
    // Lưu vào database
    const db = loadLicensesDb();
    db.licenses.push({
        ...result.rawData,
        licenseKey: result.licenseKey,
        licenseData: result.licenseData,
        status: 'active',
        activations: []
    });
    saveLicensesDb(db);

    console.log('\n========================================');
    console.log('      LICENSE KEY ĐÃ TẠO THÀNH CÔNG');
    console.log('========================================\n');
    console.log('📋 Thông tin khách hàng:');
    console.log(`   Tên: ${options.customerName}`);
    console.log(`   Email: ${options.email}`);
    console.log(`   Loại: ${options.type}`);
    console.log(`   Số học sinh tối đa: ${options.maxStudents}`);
    console.log(`   Số máy tối đa: ${options.maxDevices}`);
    console.log(`   Hết hạn: ${options.expiryDate ? options.expiryDate.toLocaleDateString('vi-VN') : 'Vĩnh viễn'}`);
    console.log('\n🔑 LICENSE KEY:');
    console.log(`   ${result.licenseKey}`);
    console.log('\n📦 LICENSE DATA (gửi kèm cho khách hàng):');
    console.log(`   ${result.licenseData}`);
    console.log('\n========================================\n');

    return result;
}

// Liệt kê tất cả licenses
function listLicenses() {
    const db = loadLicensesDb();
    
    console.log('\n========================================');
    console.log('      DANH SÁCH LICENSE ĐÃ TẠO');
    console.log('========================================\n');

    if (db.licenses.length === 0) {
        console.log('Chưa có license nào được tạo.\n');
        return;
    }

    db.licenses.forEach((lic, index) => {
        console.log(`${index + 1}. ${lic.customerName} (${lic.email})`);
        console.log(`   Key: ${lic.licenseKey}`);
        console.log(`   Loại: ${lic.type} | Học sinh: ${lic.maxStudents} | Máy: ${lic.maxDevices}`);
        console.log(`   Trạng thái: ${lic.status}`);
        console.log(`   Tạo lúc: ${new Date(lic.createdAt).toLocaleString('vi-VN')}`);
        console.log('');
    });
}

// Vô hiệu hóa license
function revokeLicense(licenseId) {
    const db = loadLicensesDb();
    const lic = db.licenses.find(l => l.id === licenseId || l.licenseKey === licenseId);
    
    if (lic) {
        lic.status = 'revoked';
        lic.revokedAt = new Date().toISOString();
        saveLicensesDb(db);
        console.log(`\n✅ Đã vô hiệu hóa license của: ${lic.customerName}\n`);
    } else {
        console.log('\n❌ Không tìm thấy license\n');
    }
}

// Interactive mode
async function interactiveMode() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    console.log('\n========================================');
    console.log('   TRẮC NGHIỆM LAN - ADMIN TOOL');
    console.log('========================================\n');

    while (true) {
        console.log('Chọn chức năng:');
        console.log('1. Tạo license mới');
        console.log('2. Xem danh sách license');
        console.log('3. Vô hiệu hóa license');
        console.log('4. Thoát');
        
        const choice = await question('\nNhập lựa chọn (1-4): ');

        switch (choice.trim()) {
            case '1':
                console.log('\n--- TẠO LICENSE MỚI ---\n');
                
                const name = await question('Tên khách hàng: ');
                const email = await question('Email: ');
                
                console.log('\nLoại license:');
                console.log('1. Personal (30 HS, 1 máy)');
                console.log('2. School (200 HS, 3 máy)');
                console.log('3. Enterprise (Unlimited)');
                const typeChoice = await question('Chọn loại (1-3): ');
                
                let type, maxStudents, maxDevices;
                switch (typeChoice.trim()) {
                    case '2':
                        type = 'school';
                        maxStudents = 200;
                        maxDevices = 3;
                        break;
                    case '3':
                        type = 'enterprise';
                        maxStudents = 9999;
                        maxDevices = 999;
                        break;
                    default:
                        type = 'personal';
                        maxStudents = 30;
                        maxDevices = 1;
                }

                const expiry = await question('Số ngày sử dụng (0 = vĩnh viễn): ');
                let expiryDate = null;
                if (expiry && parseInt(expiry) > 0) {
                    expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + parseInt(expiry));
                }

                generateLicense({
                    customerName: name,
                    email: email,
                    type: type,
                    maxStudents: maxStudents,
                    maxDevices: maxDevices,
                    expiryDate: expiryDate,
                    features: ['basic', 'export', 'import']
                });
                break;

            case '2':
                listLicenses();
                break;

            case '3':
                const licId = await question('Nhập License Key hoặc ID để vô hiệu hóa: ');
                revokeLicense(licId.trim());
                break;

            case '4':
                console.log('\nTạm biệt!\n');
                rl.close();
                process.exit(0);

            default:
                console.log('\n❌ Lựa chọn không hợp lệ\n');
        }
    }
}

// Command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    // Interactive mode
    interactiveMode();
} else {
    const command = args[0];
    
    switch (command) {
        case 'generate':
            // Parse arguments
            const options = {
                customerName: 'Unknown',
                email: '',
                type: 'personal',
                maxStudents: 30,
                maxDevices: 1,
                expiryDate: null,
                features: ['basic']
            };

            for (let i = 1; i < args.length; i += 2) {
                const key = args[i].replace('--', '');
                const value = args[i + 1];
                
                switch (key) {
                    case 'name': options.customerName = value; break;
                    case 'email': options.email = value; break;
                    case 'type': 
                        options.type = value;
                        if (value === 'school') {
                            options.maxStudents = 200;
                            options.maxDevices = 3;
                        } else if (value === 'enterprise') {
                            options.maxStudents = 9999;
                            options.maxDevices = 999;
                        }
                        break;
                    case 'students': options.maxStudents = parseInt(value); break;
                    case 'devices': options.maxDevices = parseInt(value); break;
                    case 'days':
                        if (parseInt(value) > 0) {
                            options.expiryDate = new Date();
                            options.expiryDate.setDate(options.expiryDate.getDate() + parseInt(value));
                        }
                        break;
                }
            }

            generateLicense(options);
            break;

        case 'list':
            listLicenses();
            break;

        case 'revoke':
            if (args[1]) {
                revokeLicense(args[1]);
            } else {
                console.log('Thiếu License ID');
            }
            break;

        default:
            console.log(`
Cách sử dụng:
  node admin-tool.js                    - Chế độ tương tác
  node admin-tool.js generate [options] - Tạo license mới
  node admin-tool.js list               - Xem danh sách
  node admin-tool.js revoke <id>        - Vô hiệu hóa

Options cho generate:
  --name "Tên khách hàng"
  --email "email@example.com"
  --type personal|school|enterprise
  --students 30
  --devices 1
  --days 365 (0 = vĩnh viễn)
`);
    }
}
