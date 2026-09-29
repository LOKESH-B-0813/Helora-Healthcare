const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'build_output.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logPath, line, 'utf8');
  console.log(msg);
}

fs.writeFileSync(logPath, '=== Starting Native Android APK Build ===\n', 'utf8');

const env = {
  ...process.env,
  CI: '1',
  EXPO_NO_TELEMETRY: '1',
  FORCE_COLOR: '0',
};

// Step 1: Prebuild Android project
log('Step 1: Running expo prebuild for Android...');
try {
  const prebuildOut = execSync('npx expo prebuild --platform android --no-install', {
    cwd: __dirname,
    env,
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 120000,
  });
  log(`Prebuild succeeded:\n${prebuildOut}`);
} catch (err) {
  log(`Prebuild note/error: ${err.message}\nSTDOUT: ${err.stdout || ''}\nSTDERR: ${err.stderr || ''}`);
}

// Step 2: Build with Gradle
const androidDir = path.join(__dirname, 'android');
if (fs.existsSync(androidDir)) {
  log('Step 2: Building Android debug APK via Gradle...');
  const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  try {
    const gradleOut = execSync(`${gradlewCmd} assembleDebug`, {
      cwd: androidDir,
      env,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 300000,
    });
    log(`Gradle build succeeded:\n${gradleOut}`);
  } catch (err) {
    log(`Gradle build note/error: ${err.message}\nSTDOUT: ${err.stdout || ''}\nSTDERR: ${err.stderr || ''}`);
  }
} else {
  log('Step 2: android/ directory was not generated.');
}

// Step 3: Install on connected ADB mobile device
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (fs.existsSync(apkPath)) {
  log(`Step 3: Found APK at ${apkPath}. Installing to connected device...`);
  try {
    const installOut = execSync(`adb install -r "${apkPath}"`, {
      env,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000,
    });
    log(`ADB install succeeded:\n${installOut}`);
  } catch (err) {
    log(`ADB install note/error: ${err.message}\nSTDOUT: ${err.stdout || ''}\nSTDERR: ${err.stderr || ''}`);
  }
} else {
  log('Step 3: app-debug.apk not yet found at expected path.');
}

log('=== Build process completed ===');
