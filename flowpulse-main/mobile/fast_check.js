const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'step_log.txt');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line, 'utf8');
}

fs.writeFileSync(logFile, '=== FAST STEP CHECK STARTED ===\n');

// 1. Local TypeScript compiler check via local node_modules
log('Checking local TypeScript...');
try {
  const tscPath = path.join(__dirname, 'node_modules', 'typescript', 'bin', 'tsc');
  if (fs.existsSync(tscPath)) {
    log(`Found tsc at ${tscPath}`);
    const out = execSync(`node "${tscPath}" --noEmit`, { cwd: __dirname, encoding: 'utf8', timeout: 15000 });
    log(`TypeScript Output: SUCCESS (0 errors)\n${out}`);
  } else {
    log('tsc not found in mobile/node_modules/typescript/bin/tsc');
  }
} catch (e) {
  log(`TypeScript ERROR: ${e.message}\nSTDOUT: ${e.stdout || ''}\nSTDERR: ${e.stderr || ''}`);
}

// 2. Check ADB
log('Checking ADB Devices...');
try {
  const adbOut = execSync('adb devices -l', { encoding: 'utf8', timeout: 4000 });
  log(`ADB devices:\n${adbOut}`);
} catch (e) {
  log(`ADB ERROR: ${e.message}`);
}

// 3. Check environment path for Android SDK / Expo
log('Checking EXPO & ADB Paths...');
try {
  const adbWhere = execSync('where adb', { encoding: 'utf8', timeout: 4000 });
  log(`where adb:\n${adbWhere}`);
} catch (e) {
  log(`where adb error: ${e.message}`);
}

try {
  const expoWhere = execSync('where npx', { encoding: 'utf8', timeout: 4000 });
  log(`where npx:\n${expoWhere}`);
} catch (e) {
  log(`where npx error: ${e.message}`);
}

log('=== FAST STEP CHECK COMPLETE ===');
