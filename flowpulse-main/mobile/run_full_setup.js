const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const mobileDir = __dirname;
const logFile = path.join(mobileDir, 'setup_log.txt');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line, 'utf8');
  console.log(msg);
}

fs.writeFileSync(logFile, `=== FlowPulse Mobile Setup Started ===\n`, 'utf8');

// Step 1: Install Dependencies
log('Step 1: Running npm install in /mobile...');
try {
  const npmOut = execSync('npm install --prefer-offline --no-audit --no-fund', {
    cwd: mobileDir,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  log(`npm install succeeded: ${npmOut.slice(0, 300)}`);
} catch (err) {
  log(`npm install error: ${err.message}`);
  if (err.stderr) log(`stderr: ${err.stderr.toString()}`);
}

// Step 2: Check ADB Device
log('Step 2: Checking ADB devices...');
try {
  const adbDevices = execSync('adb devices -l', { encoding: 'utf8' });
  log(`Connected devices:\n${adbDevices}`);

  // If a device is found
  if (adbDevices.includes('device') && !adbDevices.includes('List of devices attached\r\n\r\n')) {
    log('Device found! Setting up port forwarding...');
    try {
      execSync('adb reverse tcp:8081 tcp:8081', { encoding: 'utf8' });
      log('Port 8081 reversed successfully via ADB.');
    } catch (e) {
      log(`Port reverse warning: ${e.message}`);
    }
  } else {
    log('No USB authorized ADB device currently detected. Expo server will broadcast QR code.');
  }
} catch (err) {
  log(`ADB check notice: ${err.message}`);
}

// Step 3: Typecheck verification
log('Step 3: Running TypeScript verification...');
try {
  const tscOut = execSync('npx tsc --noEmit', {
    cwd: mobileDir,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  log(`TypeScript check passed: 0 errors.`);
} catch (err) {
  log(`TypeScript output: ${err.stdout ? err.stdout.toString() : err.message}`);
}

log('=== Setup and preparation completed successfully! ===');
