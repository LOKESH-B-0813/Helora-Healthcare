# FlowPulse AI — Patient Mobile Application

The **FlowPulse AI Patient Mobile Application** is a standalone mobile app built with **Expo**, **React Native**, and **TypeScript**. It provides outpatient and inpatient visitors with real-time queue visibility, door-to-door visit duration forecasts, adaptive check-in arrival windows, and proactive disruption notifications.

---

## Architecture Overview

```
                         FLOWPULSE AI

                              │
                        SUPABASE
                    PostgreSQL + Realtime
                              │
                 ┌────────────┴─────────────┐
                 │                          │
          HOSPITAL WEBSITE              MOBILE APP
           (flowpulse_work)              (/mobile)
             Next.js 16               Expo / React Native
                 │                          │
         Hospital Staff                  Patients
         Command Center                  Booking Wizard
         Live Queues                     Live Queue
         Ripple Analysis                 My Visit Care Pathway
         Simulator Lab                   Notifications
         Beds & Staff                    Profile & Scenarios
```

---

## Key Features for Patients

1. **Next Appointment & Smart Arrival Windows**:
   - Computes adaptive arrival windows (e.g. `10:40–10:45 AM`) based on current clinic throughput instead of generic scheduled times.
2. **Live Queue Tracker**:
   - High-contrast position display (e.g. `Position #3`, `2 Ahead`, `14 min Wait`, `Expected: 10:52 AM`).
   - Visual token progression stream (`C-021` → `C-022` → `C-023`).
   - Single-tap queue advancement simulation for live demonstration.
3. **My Visit — Vertical Care Pathway Timeline**:
   - Multi-stage milestone tracking: Registration → Cardiology Consultation → Diagnostic Laboratory → Doctor Review → Pharmacy Dispensing → Complete.
   - Dynamic delay propagation (e.g. `+16m delay` on laboratory incident) and recovery verification (`9m recovered`).
4. **5-Step Booking Wizard**:
   - Department selection with real-time wait telemetry.
   - Specialist profiles with experience, ratings, languages, and portrait assets.
   - FlowPulse AI pre-confirmation breakdown.
5. **Interactive Hackathon Scenario Controller**:
   - Switch between **Normal Baseline**, **Lab Analyzer Failure (LAB-AN-02)**, and **Staff Recovery (Option C)** directly from the Profile screen for instant cross-platform judging demonstrations.

---

## Technology Stack

- **Framework**: [Expo](https://expo.dev) (~52.0.38) & [React Native](https://reactnative.dev) (0.76.7)
- **Router**: [Expo Router v4](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Language**: TypeScript 5.3+ (Strict typing)
- **Backend / Realtime**: `@supabase/supabase-js` (PostgreSQL + Realtime WebSocket)
- **Persistence**: `@react-native-async-storage/async-storage`
- **Design Tokens**: FlowPulse Clinical System (`#2563EB` Royal Blue, `#0F172A` Navy, `#F8FAFC` Slate, `#10B981` Healthy, `#7C3AED` AI)

---

## Setup & Running the Mobile App

### Prerequisites
- Node.js 18+ or 20+
- npm, yarn, or pnpm
- Expo Go on iOS/Android or web browser

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Environment Variables (Optional)
Copy the example environment file:
```bash
cp .env.example .env
```
Fill in your Supabase project keys if connecting to a live database:
```ini
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
> **Note**: If Supabase credentials are not provided, the mobile app automatically and seamlessly falls back to the high-fidelity **Demo Mode**, ensuring 100% functionality offline.

### 3. Start the Development Server & Run on Connected Mobile

#### Option A: Run on Connected Android Mobile (Fast Live-Reload via Expo Go)
1. Ensure **USB Debugging** is turned ON in your phone's Developer Options and connected via USB cable.
2. Run the quick launch script or command:
```bash
# Easy 1-click batch launcher
.\mobile\start_mobile.bat

# Or manually:
adb reverse tcp:8081 tcp:8081
cd mobile
npx expo start --android
```
3. Press **`a`** in the terminal to automatically open the app on your connected phone, or scan the QR code with **Expo Go**.

#### Option B: Build & Install Standalone Native Android APK
To compile a native `.apk` and install directly to the connected phone:
```bash
# Easy 1-click build & install script
.\mobile\build_apk.bat

# Or manually:
cd mobile
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

#### Option C: Web Browser Preview
```bash
cd mobile
npx expo start --web
```

---

## Demo Patient Credentials

- **Name**: Arjun Kumar
- **Patient ID**: `FP-P10023`
- **Active Appointment ID**: `FP-2026-10482`
- **Clinic Token**: `C-023`
- **Department**: Cardiology Clinic (Suite 204)
- **Specialist**: Dr. Ananya Rao (MD, DM Cardiology)

---

## Multi-Platform Judge Demonstration Workflow

This app is designed to demonstrate seamless cross-platform operational synchronicity:

1. **Step 1 — Baseline**:
   - Open Mobile App: Arjun Kumar sees Cardiology appointment at `10:30 AM`, Queue Position `3`, estimated wait `14 min`, expected completion `12:00 PM` / `12:05 PM`.
2. **Step 2 — Trigger Lab Analyzer Failure**:
   - On the Staff Website or Mobile Profile Demo Switcher, trigger `LAB-AN-02 Offline`.
   - Mobile updates instantly: Laboratory wait increases `14m` → `34m`, Expected completion shifts `12:00 PM` → `12:16 PM`, and an alert notification is delivered.
3. **Step 3 — Staff Intervention & Recovery**:
   - Staff approves **Option C (Activate Backup Analyzer)**.
   - Mobile updates in real time: Laboratory wait drops `34m` → `20m`, Expected completion improves to `12:07 PM` (9 minutes recovered).

---

## Independent Verification

The mobile application is completely decoupled from the Next.js hospital website:
- Website path: `flowpulse_work/` (100% untouched)
- Mobile path: `mobile/` (Standalone Expo package)

Both applications run independently without mutual build dependencies.
