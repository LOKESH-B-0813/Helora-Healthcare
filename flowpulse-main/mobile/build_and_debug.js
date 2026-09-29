const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'debug_results.json');
const results = {
  timestamp: new Date().toISOString(),
  checks: {}
};

function runStep(name, cmd, options = {}) {
  try {
    const out = execSync(cmd, {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 30000,
      ...options
    });
    results.checks[name] = { success: true, output: out.trim() };
  } catch (err) {
    results.checks[name] = {
      success: false,
      error: err.message,
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : ''
    };
  }
}

// 1. Check Node & NPM versions
runStep('node_version', 'node -v');
runStep('npm_version', 'npm -v');

// 2. Check TypeScript build / Typecheck
runStep('typescript_typecheck', 'npx tsc --noEmit');

// 3. Check ADB device
runStep('adb_devices', 'adb devices -l');

// 4. If ADB device found, get details
try {
  const adbOut = execSync('adb devices', { encoding: 'utf8', timeout: 5000 });
  const lines = adbOut.trim().split('\n').slice(1).filter(l => l.trim().length > 0);
  results.connectedDevices = lines;
  
  if (lines.length > 0 && !lines[0].includes('unauthorized') && !lines[0].includes('offline')) {
    const deviceId = lines[0].split(/\s+/)[0];
    results.primaryDeviceId = deviceId;
    
    runStep('adb_model', `adb -s ${deviceId} shell getprop ro.product.model`);
    runStep('adb_manufacturer', `adb -s ${deviceId} shell getprop ro.product.manufacturer`);
    runStep('adb_android_version', `adb -s ${deviceId} shell getprop ro.build.version.release`);
    runStep('adb_sdk_version', `adb -s ${deviceId} shell getprop ro.build.version.sdk`);
    runStep('adb_reverse_port', `adb -s ${deviceId} reverse tcp:8081 tcp:8081`);
    runStep('adb_check_expo', `adb -s ${deviceId} shell pm list packages host.exp.exponent`);
  }
} catch (e) {
  results.adbCheckError = e.message;
}

fs.writeFileSync(logFile, JSON.stringify(results, null, 2), 'utf8');
console.log('Results written to', logFile);
