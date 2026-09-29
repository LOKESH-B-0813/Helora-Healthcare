const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'adb_devices_result.json');

try {
  const adbOut = execSync('adb devices -l', { encoding: 'utf8' });
  fs.writeFileSync(logFile, JSON.stringify({ success: true, adbOut }, null, 2), 'utf8');
} catch (err) {
  fs.writeFileSync(logFile, JSON.stringify({ success: false, error: err.message, stderr: err.stderr?.toString() }, null, 2), 'utf8');
}
console.log('ADB check written.');
