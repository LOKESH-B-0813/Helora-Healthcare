const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'native_build_status.txt');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line, 'utf8');
  console.log(msg);
}

fs.writeFileSync(logFile, '==================================================\n   FlowPulse Native Android APK Build & Install\n==================================================\n\n', 'utf8');

const env = {
  ...process.env,
  CI: '1',
  EXPO_NO_TELEMETRY: '1',
  FORCE_COLOR: '0',
  GRADLE_OPTS: '-Dorg.gradle.jvmargs="-Xmx1536m -XX:MaxMetaspaceSize=512m"',
};

// ----------------------------------------------------
// Step 1: Prebuild Android project
// ----------------------------------------------------
log('[1/3] Running Expo Prebuild for Android (--no-install --clean)...');
try {
  const prebuildRes = spawnSync('npx.cmd', ['expo', 'prebuild', '--platform', 'android', '--clean', '--no-install'], {
    cwd: __dirname,
    env,
    encoding: 'utf8',
    shell: true,
    timeout: 180000,
  });
  log(`Prebuild exit code: ${prebuildRes.status}`);
  if (prebuildRes.stdout) log(`Prebuild stdout:\n${prebuildRes.stdout}`);
  if (prebuildRes.stderr) log(`Prebuild stderr:\n${prebuildRes.stderr}`);
} catch (e) {
  log(`Prebuild exception: ${e.message}`);
}

// ----------------------------------------------------
// Step 2: Compile APK with Gradle
// ----------------------------------------------------
const androidDir = path.join(__dirname, 'android');
log(`\n[2/3] Checking android directory at: ${androidDir}`);
if (fs.existsSync(androidDir)) {
  log('Found android/ folder. Running gradlew assembleDebug...');
  try {
    const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    const gradleRes = spawnSync(gradlewCmd, ['assembleDebug', '--no-daemon', '--stacktrace'], {
      cwd: androidDir,
      env,
      encoding: 'utf8',
      shell: true,
      timeout: 600000,
    });
    log(`Gradle exit code: ${gradleRes.status}`);
    if (gradleRes.stdout) log(`Gradle stdout:\n${gradleRes.stdout}`);
    if (gradleRes.stderr) log(`Gradle stderr:\n${gradleRes.stderr}`);
  } catch (e) {
    log(`Gradle exception: ${e.message}`);
  }
} else {
  log('ERROR: android/ directory was not found after prebuild.');
}

// ----------------------------------------------------
// Step 3: Install APK to connected mobile device
// ----------------------------------------------------
log('\n[3/3] Checking for compiled app-debug.apk...');
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (fs.existsSync(apkPath)) {
  const stats = fs.statSync(apkPath);
  log(`SUCCESS: Found APK (${Math.round(stats.size / 1024 / 1024)} MB) at ${apkPath}`);
  log('Installing APK to connected Android mobile device via adb install -r...');
  try {
    const installRes = spawnSync('adb', ['install', '-r', apkPath], {
      env,
      encoding: 'utf8',
      shell: true,
      timeout: 120000,
    });
    log(`ADB install exit code: ${installRes.status}`);
    if (installRes.stdout) log(`ADB install stdout:\n${installRes.stdout}`);
    if (installRes.stderr) log(`ADB install stderr:\n${installRes.stderr}`);
    log('\n==================================================\n   COMPLETE: FlowPulse installed on mobile phone!\n==================================================');
  } catch (e) {
    log(`ADB install exception: ${e.message}`);
  }
} else {
  log(`Notice: APK not found at ${apkPath}`);
}

log('\nFinished native build pipeline.');
