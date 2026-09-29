const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'mobile_install_status.json');

function runSync(cmd, options = {}) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', ...options });
    return { cmd, success: true, stdout: out.trim() };
  } catch (err) {
    return { cmd, success: false, error: err.message, stderr: err.stderr?.toString() };
  }
}

const report = {};

// 1. Check ADB
report.adbDevices = runSync('adb devices -l');

// 2. Check if phone is authorized and get model
if (report.adbDevices.success) {
  report.adbModel = runSync('adb shell getprop ro.product.model');
  report.adbAndroidVersion = runSync('adb shell getprop ro.build.version.release');
  
  // Reverse Metro port so USB connection works seamlessly
  report.reversePort = runSync('adb reverse tcp:8081 tcp:8081');
  
  // Check if Expo Go is installed on device
  report.expoPackage = runSync('adb shell pm list packages host.exp.exponent');
}

fs.writeFileSync(logFile, JSON.stringify(report, null, 2), 'utf8');
console.log('Mobile device inspection completed.');
