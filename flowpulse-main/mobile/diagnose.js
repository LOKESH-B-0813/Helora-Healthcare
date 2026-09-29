const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'diagnose_output.txt');
let log = '';

function appendLog(str) {
  log += str + '\n';
  fs.writeFileSync(logPath, log);
}

appendLog('=== Starting Android / Mobile Diagnosis ===');

// Check where adb is
try {
  const whereAdb = execSync('where adb', { encoding: 'utf8', timeout: 4000 });
  appendLog(`[where adb]:\n${whereAdb}`);
} catch (e) {
  appendLog(`[where adb ERROR]: ${e.message}\n${e.stdout || ''}\n${e.stderr || ''}`);
}

// Check adb devices
try {
  const adbDevices = execSync('adb devices -l', { encoding: 'utf8', timeout: 5000 });
  appendLog(`[adb devices]:\n${adbDevices}`);
} catch (e) {
  appendLog(`[adb devices ERROR]: ${e.message}\n${e.stdout || ''}\n${e.stderr || ''}`);
}

// Check android command
try {
  const androidInfo = execSync('android info', { encoding: 'utf8', timeout: 4000 });
  appendLog(`[android info]:\n${androidInfo}`);
} catch (e) {
  appendLog(`[android info ERROR]: ${e.message}\n${e.stdout || ''}\n${e.stderr || ''}`);
}

// Check package.json & expo in mobile
try {
  const tscCheck = execSync('npx tsc --noEmit', { cwd: __dirname, encoding: 'utf8', timeout: 20000 });
  appendLog(`[tsc check]: Passed with no errors! \n${tscCheck}`);
} catch (e) {
  appendLog(`[tsc check ERROR]: ${e.message}\n${e.stdout || ''}\n${e.stderr || ''}`);
}

appendLog('=== Diagnosis Finished ===');
console.log('Diagnosis completed.');
