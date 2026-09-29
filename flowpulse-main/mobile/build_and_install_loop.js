const { spawn, spawnSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ADB_PATH = fs.existsSync('C:\\Users\\Disa V\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe')
  ? 'C:\\Users\\Disa V\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe'
  : 'adb';

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Ensure virtual drive X: to eliminate space in path for CMake / Ninja
try {
  if (!fs.existsSync('X:\\mobile')) {
    execSync(`subst X: "${PROJECT_ROOT}"`, { stdio: 'ignore' });
  }
} catch (e) {
  // ignore
}

const USE_DRIVE_X = fs.existsSync('X:\\mobile\\android');
const MOBILE_DIR = USE_DRIVE_X ? 'X:\\mobile' : __dirname;
const ANDROID_DIR = path.join(MOBILE_DIR, 'android');
const APK_PATH = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

console.log('======================================================================');
console.log('       FLOWPULSE AI - MOBILE CONNECT & BUILD PIPELINE');
console.log('======================================================================\n');

function runSync(cmd, args, options = {}) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  return spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: true,
    ...options
  });
}

function getConnectedDevice() {
  try {
    const res = spawnSync(`"${ADB_PATH}"`, ['devices'], { encoding: 'utf8', shell: true });
    if (res.status !== 0) return null;
    const lines = res.stdout.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.startsWith('List of')) continue;
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        return { serial: parts[0], status: parts[1] };
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

// ---------------------------------------------------------
// STEP 1: Loop polling function for connected mobile
// ---------------------------------------------------------
async function waitForAuthorizedDevice(timeoutMs = 120000) {
  console.log('[Step 1/5] Monitoring connected mobile device via ADB...');
  const startTime = Date.now();
  let lastStatus = null;

  while (Date.now() - startTime < timeoutMs) {
    const dev = getConnectedDevice();
    if (dev) {
      if (dev.status === 'device') {
        console.log(`\n[READY] Connected mobile phone detected: ${dev.serial} (Status: AUTHORIZED)`);
        try {
          const model = execSync(`"${ADB_PATH}" -s ${dev.serial} shell getprop ro.product.model`, { encoding: 'utf8' }).trim();
          const manufacturer = execSync(`"${ADB_PATH}" -s ${dev.serial} shell getprop ro.product.manufacturer`, { encoding: 'utf8' }).trim();
          const androidVer = execSync(`"${ADB_PATH}" -s ${dev.serial} shell getprop ro.build.version.release`, { encoding: 'utf8' }).trim();
          console.log(`[DEVICE INFO] ${manufacturer} ${model} | Android ${androidVer}\n`);
        } catch (e) {
          // ignore
        }
        return dev.serial;
      } else if (dev.status !== lastStatus) {
        lastStatus = dev.status;
        console.log(`[WAITING] Device ${dev.serial} is in state: '${dev.status}'. If prompted on phone screen, tap 'Allow USB Debugging'.`);
      }
    } else if (lastStatus !== 'none') {
      lastStatus = 'none';
      console.log('[WAITING] Waiting for phone to be plugged in with USB debugging enabled...');
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  throw new Error('Timed out waiting for an authorized device.');
}

// ---------------------------------------------------------
// STEP 2: Generate verified assets & local.properties
// ---------------------------------------------------------
function prepareAssetsAndConfig() {
  console.log('[Step 2/5] Preparing app icons, Android SDK configuration and offline JS bundle...');
  runSync('node', ['make_assets.js'], { cwd: MOBILE_DIR });

  if (fs.existsSync(ANDROID_DIR)) {
    const localProp = path.join(ANDROID_DIR, 'local.properties');
    fs.writeFileSync(localProp, 'sdk.dir=C\\:\\\\Users\\\\Disa V\\\\AppData\\\\Local\\\\Android\\\\Sdk\n', 'utf8');
    console.log('[CONFIG] local.properties updated with Android SDK path.');
    
    // Ensure offline bundle is compiled into the APK
    const assetsDir = path.join(ANDROID_DIR, 'app', 'src', 'main', 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
    const bundleOutput = path.join(assetsDir, 'index.android.bundle');
    const resDest = path.join(ANDROID_DIR, 'app', 'src', 'main', 'res');

    console.log('[BUNDLE] Compiling offline React Native JavaScript bundle...');
    runSync('npx.cmd', [
      'expo', 'export:embed',
      '--platform', 'android',
      '--dev', 'false',
      '--entry-file', 'node_modules/expo-router/entry.js',
      '--bundle-output', bundleOutput,
      '--assets-dest', resDest
    ], { cwd: MOBILE_DIR });
  }
}

// ---------------------------------------------------------
// STEP 3: Prebuild if needed
// ---------------------------------------------------------
function ensurePrebuild() {
  if (!fs.existsSync(ANDROID_DIR)) {
    console.log('\n[Step 3/5] Generating native Android project via Expo prebuild...');
    runSync('npx.cmd', ['expo', 'prebuild', '--platform', 'android', '--no-install'], { cwd: MOBILE_DIR });
  } else {
    console.log('\n[Step 3/5] Android native project already present. Proceeding to Gradle build.');
  }
}

// ---------------------------------------------------------
// STEP 4: Compile APK via Gradle
// ---------------------------------------------------------
function buildApk() {
  console.log('\n[Step 4/5] Compiling APK with Gradle...');
  const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  
  const res = runSync(gradlewCmd, ['assembleDebug', '--no-daemon'], {
    cwd: ANDROID_DIR,
    env: process.env
  });

  if (res.status !== 0) {
    throw new Error(`Gradle compilation failed with code ${res.status}`);
  }

  if (!fs.existsSync(APK_PATH)) {
    throw new Error(`APK not found at ${APK_PATH}`);
  }

  console.log(`\n[SUCCESS] APK built successfully!`);
  console.log(`APK Location: ${APK_PATH}`);
}

// ---------------------------------------------------------
// STEP 5: Install and Launch on Phone
// ---------------------------------------------------------
function installAndLaunch(serial) {
  console.log(`\n[Step 5/5] Installing APK to phone (${serial})...`);
  const installRes = runSync(`"${ADB_PATH}"`, ['-s', serial, 'install', '-r', `"${APK_PATH}"`]);

  if (installRes.status === 0) {
    console.log('\n======================================================================');
    console.log('   INSTALLATION SUCCESSFUL!');
    console.log('   FlowPulse Patient app is now installed on your phone!');
    console.log('======================================================================');
    console.log('\nLaunching FlowPulse Patient app on device...');
    runSync(`"${ADB_PATH}"`, ['-s', serial, 'shell', 'monkey', '-p', 'com.flowpulse.patient', '-c', 'android.intent.category.LAUNCHER', '1']);
  } else {
    console.log('\n[WARNING] ADB install encountered an error. Opening APK location in Explorer...');
    runSync('explorer.exe', [`/select,"${APK_PATH}"`]);
  }
}

// ---------------------------------------------------------
// MAIN EXECUTION
// ---------------------------------------------------------
async function main() {
  try {
    const serial = await waitForAuthorizedDevice();
    prepareAssetsAndConfig();
    ensurePrebuild();
    buildApk();
    installAndLaunch(serial);
  } catch (err) {
    console.error(`\n[ERROR] ${err.message}`);
    process.exit(1);
  }
}

main();
