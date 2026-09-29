const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'device_check_output.json');

function run(cmd, cwd = __dirname) {
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { cmd, success: true, output: out.trim() };
  } catch (err) {
    return {
      cmd,
      success: false,
      error: err.message,
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : ''
    };
  }
}

const results = [];

// 1. Check ADB devices
results.push(run('adb devices'));

// 2. Check Android CLI info if available
results.push(run('android info'));

// 3. Run TypeScript check in mobile/
results.push(run('npx tsc --noEmit'));

fs.writeFileSync(logFile, JSON.stringify(results, null, 2), 'utf8');
console.log('Done checking device and mobile build.');
