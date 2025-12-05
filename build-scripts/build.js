/**
 * SCRIPT ĐÓNG GÓI ỨNG DỤNG - TRẮC NGHIỆM LAN
 * Tạo file installer cho Windows
 * 
 * Yêu cầu:
 * 1. npm install -g pkg
 * 2. Cài Inno Setup: https://jrsoftware.org/isinfo.php
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APP_NAME = 'TracNghiemLAN';
const APP_VERSION = require('../package.json').version || '1.0.0';
const BUILD_DIR = path.join(__dirname, '..', 'build');
const DIST_DIR = path.join(__dirname, '..', 'dist');

console.log(`
╔════════════════════════════════════════════════╗
║     ĐÓNG GÓI TRẮC NGHIỆM LAN v${APP_VERSION}          ║
╚════════════════════════════════════════════════╝
`);

// Tạo thư mục build
function setupDirectories() {
    console.log('📁 Tạo thư mục build...');
    
    if (!fs.existsSync(BUILD_DIR)) {
        fs.mkdirSync(BUILD_DIR, { recursive: true });
    }
    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }
}

// Copy các file cần thiết
function copyFiles() {
    console.log('📋 Copy files...');
    
    const filesToCopy = [
        'server.js',
        'package.json',
        'start.bat'
    ];
    
    const dirsToCopy = [
        'public',
        'license',
        'data',
        'Noidung'
    ];

    // Copy files
    filesToCopy.forEach(file => {
        const src = path.join(__dirname, '..', file);
        const dest = path.join(BUILD_DIR, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`   ✓ ${file}`);
        }
    });

    // Copy directories
    dirsToCopy.forEach(dir => {
        const src = path.join(__dirname, '..', dir);
        const dest = path.join(BUILD_DIR, dir);
        if (fs.existsSync(src)) {
            copyDirSync(src, dest);
            console.log(`   ✓ ${dir}/`);
        }
    });
}

// Helper: Copy thư mục recursive
function copyDirSync(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Đóng gói bằng pkg
function packageWithPkg() {
    console.log('\n📦 Đóng gói với pkg...');
    
    try {
        // Tạo pkg config
        const pkgConfig = {
            "name": APP_NAME,
            "version": APP_VERSION,
            "bin": "server.js",
            "pkg": {
                "scripts": ["license/**/*.js"],
                "assets": [
                    "public/**/*",
                    "data/**/*",
                    "Noidung/**/*"
                ],
                "targets": ["node18-win-x64"],
                "outputPath": DIST_DIR
            }
        };

        const pkgConfigPath = path.join(BUILD_DIR, 'package.json');
        const originalPkg = JSON.parse(fs.readFileSync(pkgConfigPath, 'utf8'));
        Object.assign(originalPkg, pkgConfig);
        fs.writeFileSync(pkgConfigPath, JSON.stringify(originalPkg, null, 2));

        // Chạy pkg
        process.chdir(BUILD_DIR);
        execSync(`npx pkg . --output "${path.join(DIST_DIR, APP_NAME + '.exe')}"`, {
            stdio: 'inherit'
        });

        console.log('   ✓ Đã tạo file .exe');
        return true;
    } catch (e) {
        console.error('   ❌ Lỗi pkg:', e.message);
        return false;
    }
}

// Tạo Inno Setup script
function createInnoSetupScript() {
    console.log('\n📝 Tạo Inno Setup script...');
    
    const issContent = `; Inno Setup Script for ${APP_NAME}
; Generated automatically

#define MyAppName "${APP_NAME}"
#define MyAppVersion "${APP_VERSION}"
#define MyAppPublisher "Your Company"
#define MyAppURL "https://yourwebsite.com"
#define MyAppExeName "${APP_NAME}.exe"

[Setup]
AppId={{GUID-UNIQUE-ID-HERE}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=
OutputDir=${DIST_DIR}
OutputBaseFilename=${APP_NAME}_Setup_v${APP_VERSION}
SetupIconFile=
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "vietnamese"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "${DIST_DIR}\\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "${BUILD_DIR}\\public\\*"; DestDir: "{app}\\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "${BUILD_DIR}\\data\\*"; DestDir: "{app}\\data"; Flags: ignoreversion recursesubdirs createallsubdirs; Permissions: users-modify

[Icons]
Name: "{group}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"
Name: "{group}\\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
// Mở port firewall tự động
procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    Exec('netsh', 'advfirewall firewall add rule name="${APP_NAME}" dir=in action=allow protocol=TCP localport=3456', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
`;

    const issPath = path.join(BUILD_DIR, 'setup.iss');
    fs.writeFileSync(issPath, issContent, 'utf8');
    console.log(`   ✓ Đã tạo: ${issPath}`);
    
    return issPath;
}

// Build với Inno Setup
function buildInstaller(issPath) {
    console.log('\n🔨 Tạo installer với Inno Setup...');
    
    const innoPath = 'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe';
    
    if (!fs.existsSync(innoPath)) {
        console.log('   ⚠️ Chưa cài Inno Setup. Tải tại: https://jrsoftware.org/isinfo.php');
        console.log('   ⚠️ File .iss đã được tạo, bạn có thể compile thủ công.');
        return false;
    }

    try {
        execSync(`"${innoPath}" "${issPath}"`, { stdio: 'inherit' });
        console.log('   ✓ Đã tạo installer thành công!');
        return true;
    } catch (e) {
        console.error('   ❌ Lỗi Inno Setup:', e.message);
        return false;
    }
}

// Main
async function main() {
    try {
        setupDirectories();
        copyFiles();
        
        const pkgSuccess = packageWithPkg();
        const issPath = createInnoSetupScript();
        
        if (pkgSuccess) {
            buildInstaller(issPath);
        }

        console.log(`
╔════════════════════════════════════════════════╗
║              HOÀN THÀNH!                       ║
╠════════════════════════════════════════════════╣
║  📁 Build folder: ${BUILD_DIR}
║  📁 Dist folder:  ${DIST_DIR}
║  📄 Installer:    ${APP_NAME}_Setup_v${APP_VERSION}.exe
╚════════════════════════════════════════════════╝
`);

    } catch (e) {
        console.error('❌ Lỗi:', e.message);
        process.exit(1);
    }
}

// Export hoặc chạy trực tiếp
if (require.main === module) {
    main();
}

module.exports = { setupDirectories, copyFiles, packageWithPkg, createInnoSetupScript };
