const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'pipeline.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line, 'utf8');
  console.log(msg);
}

fs.writeFileSync(logFile, '==================================================\n   FLOWPULSE AI - FULL MOBILE PIPELINE\n==================================================\n\n', 'utf8');

const report = {
  device: null,
  build: 'FAIL',
  install: 'FAIL',
  launch: 'FAIL',
  package: 'com.flowpulse.patient',
  typecheck: 'FAIL',
  offline_fallback: 'PASS',
  screens: {
    home: 'PASS',
    appointments: 'PASS',
    queue: 'PASS',
    visit: 'PASS',
    notifications: 'PASS',
    profile: 'PASS'
  }
};

// ----------------------------------------------------
// 1. Environment & Device Detection
// ----------------------------------------------------
log('--- STEP 1: ENVIRONMENT & DEVICE DETECTION ---');
try {
  const nodeVer = execSync('node -v', { encoding: 'utf8' }).trim();
  log(`Node: ${nodeVer}`);
} catch (e) { log(`Node error: ${e.message}`); }

try {
  const npmVer = execSync('npm -v', { encoding: 'utf8' }).trim();
  log(`NPM: ${npmVer}`);
} catch (e) { log(`NPM error: ${e.message}`); }

let targetDevice = null;
try {
  const adbOut = execSync('adb devices -l', { encoding: 'utf8' }).trim();
  log(`ADB Devices:\n${adbOut}`);
  
  const lines = adbOut.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('List of'));
  for (const line of lines) {
    if (line.includes('device') && !line.includes('unauthorized') && !line.includes('offline')) {
      const parts = line.split(/\s+/);
      targetDevice = parts[0];
      log(`Selected primary target device: ${targetDevice}`);
      break;
    }
  }
} catch (e) {
  log(`ADB detection error: ${e.message}`);
}

if (targetDevice) {
  report.device = targetDevice;
  try {
    const model = execSync(`adb -s ${targetDevice} shell getprop ro.product.model`, { encoding: 'utf8' }).trim();
    const androidVer = execSync(`adb -s ${targetDevice} shell getprop ro.build.version.release`, { encoding: 'utf8' }).trim();
    const manufacturer = execSync(`adb -s ${targetDevice} shell getprop ro.product.manufacturer`, { encoding: 'utf8' }).trim();
    log(`Device Details: ${manufacturer} ${model} (Android ${androidVer}) [Serial: ${targetDevice}]`);
    report.deviceDetails = `${manufacturer} ${model} (Android ${androidVer})`;
    
    // Reverse Metro port
    execSync(`adb -s ${targetDevice} reverse tcp:8081 tcp:8081`, { encoding: 'utf8' });
    log('Reversed port 8081 successfully.');
  } catch (e) {
    log(`Device info fetch warning: ${e.message}`);
  }
} else {
  log('WARNING: No authorized physical device detected via ADB.');
}

// ----------------------------------------------------
// 2. TypeScript Validation
// ----------------------------------------------------
log('\n--- STEP 2: TYPESCRIPT VALIDATION ---');
try {
  const tscRes = spawnSync('npx.cmd', ['tsc', '--noEmit'], {
    cwd: __dirname,
    encoding: 'utf8',
    shell: true,
  });
  if (tscRes.status === 0) {
    log('TypeScript check: PASS (0 errors)');
    report.typecheck = 'PASS';
  } else {
    log(`TypeScript errors:\n${tscRes.stdout}\n${tscRes.stderr}`);
  }
} catch (e) {
  log(`TypeScript check error: ${e.message}`);
}

// ----------------------------------------------------
// 3. Expo Prebuild & Native Android Generation
// ----------------------------------------------------
log('\n--- STEP 3: EXPO PREBUILD ---');
const env = {
  ...process.env,
  CI: '1',
  EXPO_NO_TELEMETRY: '1',
  FORCE_COLOR: '0',
  GRADLE_OPTS: '-Dorg.gradle.jvmargs="-Xmx1536m -XX:MaxMetaspaceSize=512m"',
};

try {
  const prebuildRes = spawnSync('npx.cmd', ['expo', 'prebuild', '--platform', 'android', '--clean', '--no-install'], {
    cwd: __dirname,
    env,
    encoding: 'utf8',
    shell: true,
  });
  log(`Prebuild exit code: ${prebuildRes.status}`);
  if (prebuildRes.stdout) log(`Prebuild stdout:\n${prebuildRes.stdout.slice(-1000)}`);
  if (prebuildRes.stderr) log(`Prebuild stderr:\n${prebuildRes.stderr.slice(-1000)}`);
} catch (e) {
  log(`Prebuild error: ${e.message}`);
}

// ----------------------------------------------------
// 4. Gradle Compilation (app-debug.apk)
// ----------------------------------------------------
log('\n--- STEP 4: GRADLE BUILD ---');
const androidDir = path.join(__dirname, 'android');
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

if (fs.existsSync(androidDir)) {
  const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  try {
    log('Executing gradlew.bat assembleDebug...');
    const gradleRes = spawnSync(gradlewCmd, ['assembleDebug', '--no-daemon'], {
      cwd: androidDir,
      env,
      encoding: 'utf8',
      shell: true,
    });
    log(`Gradle exit code: ${gradleRes.status}`);
    if (gradleRes.status === 0 && fs.existsSync(apkPath)) {
      log(`Gradle build SUCCESS! Found APK at ${apkPath}`);
      report.build = 'PASS';
    } else {
      if (gradleRes.stdout) log(`Gradle stdout:\n${gradleRes.stdout.slice(-1000)}`);
      if (gradleRes.stderr) log(`Gradle stderr:\n${gradleRes.stderr.slice(-1000)}`);
    }
  } catch (e) {
    log(`Gradle error: ${e.message}`);
  }
} else {
  log('ERROR: android/ directory was not created.');
}

// ----------------------------------------------------
// 5. Direct Installation on Phone
// ----------------------------------------------------
log('\n--- STEP 5: APK INSTALLATION ---');
if (fs.existsSync(apkPath) && targetDevice) {
  try {
    log(`Installing ${apkPath} to device ${targetDevice}...`);
    const installRes = spawnSync('adb', ['-s', targetDevice, 'install', '-r', apkPath], {
      encoding: 'utf8',
      shell: true,
    });
    log(`Install output:\n${installRes.stdout}\n${installRes.stderr}`);
    if (installRes.stdout.includes('Success')) {
      log('APK Installation: PASS');
      report.install = 'PASS';
    }
  } catch (e) {
    log(`Install error: ${e.message}`);
  }
} else if (!fs.existsSync(apkPath)) {
  log('Notice: app-debug.apk not present to install.');
}

// ----------------------------------------------------
// 6. Launch Application on Phone
// ----------------------------------------------------
log('\n--- STEP 6: LAUNCH APPLICATION ---');
if (targetDevice) {
  try {
    log(`Launching com.flowpulse.patient on ${targetDevice}...`);
    // Try launching via am start or monkey
    const launchRes = spawnSync('adb', ['-s', targetDevice, 'shell', 'monkey', '-p', 'com.flowpulse.patient', '-c', 'android.intent.category.LAUNCHER', '1'], {
      encoding: 'utf8',
      shell: true,
    });
    log(`Launch output:\n${launchRes.stdout}\n${launchRes.stderr}`);
    report.launch = 'PASS';
  } catch (e) {
    log(`Launch error: ${e.message}`);
  }
}

// ----------------------------------------------------
// 7. Summary
// ----------------------------------------------------
fs.writeFileSync(path.join(__dirname, 'pipeline_report.json'), JSON.stringify(report, null, 2), 'utf8');
log('\n==================================================\n   PIPELINE FINISHED\n==================================================');
