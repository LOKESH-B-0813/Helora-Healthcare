import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    DEMO_DOCTOR_ID,
    DEMO_PATIENT_ID,
    buildDemoDataset,
    buildVisitTracker,
    checkDemoConnectivity,
    findAppointment,
    findPrescription,
    isDemoRecord,
    itemsForPrescription,
    normalizeLiveDataset,
    summarize,
} from '../../js/patient-portal-data.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readPage = (relativePath) => readFileSync(join(repoRoot, relativePath), 'utf8');

test('demo dataset is fully connected: patient -> appointments -> doctor -> prescriptions', () => {
    const dataset = buildDemoDataset();
    assert.equal(checkDemoConnectivity(dataset).length, 0);

    const counts = summarize(dataset);
    assert.equal(counts.appointments, 3);
    assert.equal(counts.prescriptions, 2);
    assert.equal(counts.reports, 2);
    assert.equal(counts.insurance, 1);
    assert.equal(counts.notifications, 3);
    assert.equal(counts.unreadNotifications, 2);
    assert.equal(counts.pharmacy, 2);
});

test('demo prescriptions link to demo appointments and their items', () => {
    const dataset = buildDemoDataset();
    const found = findPrescription(dataset, 'rx-demo-001');
    assert.ok(found);
    assert.equal(found.prescription.appointment_id, 'appt-demo-001');
    assert.equal(itemsForPrescription(dataset, 'rx-demo-001').length, 2);
    assert.equal(itemsForPrescription(dataset, 'rx-demo-002').length, 1);

    const appt = findAppointment(dataset, 'appt-demo-001');
    assert.ok(appt);
    assert.equal(appt.patient_id, DEMO_PATIENT_ID);
    assert.equal(appt.doctor_id, DEMO_DOCTOR_ID);
    assert.equal(findAppointment(dataset, 'nope'), null);
    assert.equal(findPrescription(dataset, 'nope'), null);
});

test('demo records are internally flagged as test data, live records are not', () => {
    const dataset = buildDemoDataset();
    assert.equal(isDemoRecord(dataset.profile), true);
    assert.equal(isDemoRecord(dataset.appointments[0]), true);
    assert.equal(isDemoRecord({ full_name: 'Real Patient' }), false);
    assert.equal(isDemoRecord(null), false);
});

test('live payload normalization keeps the dashboard/page shape', () => {
    const dataset = normalizeLiveDataset(
        { success: true, data: { full_name: 'Jane', status: 'Active' } },
        {
            success: true,
            data: {
                appointments: { data: [{ $id: 'a1' }], total: 1 },
                prescriptions: { data: [], total: 0 },
                prescription_items: { data: [], total: 0 },
                medical_reports: { data: [{ $id: 'r1' }], total: 1 },
                insurance_records: { data: [], total: 0 },
                notifications: { data: [], total: 0 },
                pharmacy_records: { data: [], total: 0 },
            },
        },
    );
    assert.equal(dataset.source, 'live');
    const counts = summarize(dataset);
    assert.equal(counts.appointments, 1);
    assert.equal(counts.prescriptions, 0);
    assert.equal(counts.reports, 1);
});

test('live payload normalization accepts direct Appwrite-like payload objects', () => {
    const dataset = normalizeLiveDataset(
        { success: true, data: { full_name: 'Jane', status: 'Active', role: 'patient' } },
        {
            profile: { full_name: 'Jane', status: 'Active', role: 'patient' },
            appointments: [{ $id: 'a1' }],
            prescriptions: [],
            prescription_items: [],
            medical_reports: [{ $id: 'r1' }],
            insurance_records: [],
            notifications: [],
            pharmacy_records: [],
        },
    );

    assert.equal(dataset.source, 'live');
    assert.equal(dataset.profile.full_name, 'Jane');
    assert.equal(dataset.appointments.length, 1);
    assert.equal(dataset.reports.length, 1);
});

test('live patient records retain consultation and doctor-advice datasets', () => {
    const dataset = normalizeLiveDataset(
        { success: true, data: { full_name: 'Jane', role: 'patient' } },
        { data: {
            consultation_records: [{ $id: 'consult-1', patient_id: 'patient-1' }],
            doctor_advice: [{ $id: 'advice-1', patient_id: 'patient-1' }],
        } },
    );
    assert.equal(dataset.consultations.length, 1);
    assert.equal(dataset.doctorAdvice.length, 1);
    assert.match(readPage('pages/patient/records.html'), /consultation-list/);
    assert.match(readPage('pages/patient/records.html'), /advice-list/);
});

test('visit tracker uses appointment status and never invents live queue data', () => {
    const pending = buildVisitTracker({ status: 'pending', appointment_time: '10:30 AM' });
    assert.equal(pending.suggestedArrival, '10:20 AM');
    assert.equal(pending.steps[1].state, 'current');
    assert.equal(pending.hasLiveQueueData, false);
    assert.equal(pending.queuePosition, null);

    const completed = buildVisitTracker({
        status: 'completed', appointment_time: '10:30 AM', queue_position: 2,
        estimated_wait_minutes: 8, estimated_completion_time: '11:48 AM',
    });
    assert.equal(completed.steps[2].state, 'complete');
    assert.equal(completed.queuePosition, 2);
    assert.equal(completed.waitMinutes, 8);
    assert.equal(completed.hasLiveQueueData, true);

    const details = readPage('pages/patient/appointment-details.html');
    assert.match(details, /Track My Visit/);
    assert.match(details, /not a live delay prediction/);
    assert.match(details, /Live queue position and wait estimate have not been posted/);
});

test('legacy health-records page stays session-scoped and has recoverable states', () => {
    const page = readPage('pages/services/view-reports.html');
    const script = readPage('js/health-records.js');
    assert.match(page, /health-error/);
    assert.match(page, /Loading\.\.\./);
    assert.match(page, /consultation-count/);
    assert.match(page, /advice-count/);
    assert.match(script, /verifySession\(\['patient', 'super_admin'\]\)/);
    assert.doesNotMatch(script, /localStorage|patient_id|innerHTML/);
    assert.match(script, /showError\(error\.message\)/);
});

test('live patient dataset requires the Appwrite role guard before creating a JWT', () => {
    const portal = readPage('js/patient-portal.js');
    const start = portal.indexOf('export async function requirePatientDataset()');
    const end = portal.indexOf('\nexport function bindLogout', start);
    const loader = portal.slice(start, end);
    assert.match(loader, /initAuthGuard\(\['patient', 'super_admin'\]\)/);
    assert.ok(loader.indexOf('initAuthGuard(') < loader.indexOf('getAuthToken()'));
    assert.match(loader, /if \(!user\) return null/);
});

test('homepage service links use authenticated live insurance and pharmacy views', () => {
    const insurance = readPage('pages/services/insurance.html');
    const pharmacy = readPage('pages/services/pharmacy.html');
    assert.match(insurance, /requirePatientDataset/);
    assert.match(insurance, /No insurance records are available/);
    assert.doesNotMatch(insurance, /Check Eligibility|Star Health|HDFC Ergo|ICICI Lombard/);
    assert.match(pharmacy, /requirePatientDataset/);
    assert.match(pharmacy, /No pharmacy records are available/);
    assert.doesNotMatch(pharmacy, /Paracetamol 650mg|Vitamin C Serum|First Aid Kit|Add/);
});

test('consultation meetings use authenticated backend routes', () => {
    const page = readPage('pages/services/consultation.html');
    assert.match(page, /initAuthGuard/);
    assert.match(page, /\/api\/meetings/);
    assert.doesNotMatch(page, /\/api\/create-meeting|\/api\/join-meeting/);
    assert.doesNotMatch(page, /hostName|userName/);
    assert.equal((page.match(/id="btn-mic"/g) || []).length, 1);
    assert.equal((page.match(/id="btn-cam"/g) || []).length, 1);
    assert.match(page, /camera-status/);
});

test('homepage controls are keyboard-accessible and avoid deleted scripts and fake claims', () => {
    const homepage = readPage('index.html');
    const enhancements = readPage('js/ui-enhancements.js');
    const styles = readPage('css/style.css');
    assert.doesNotMatch(homepage, /admin-service\.js|AdminService|Secure OTP Access|Live Focus/);
    assert.equal((homepage.match(/class="portal-box" href=/g) || []).length, 5);
    assert.match(homepage, /id="contact-status"/);
    assert.match(homepage, /mailto:helorahealthcare@gmail\.com/);
    assert.match(homepage, /label for="contact-email"/);
    assert.doesNotMatch(homepage, /Trusted by Leading Healthcare Providers|HIPAA compliance|MedCore|HealthPlus|CareLink|GlobalMed/);
    assert.doesNotMatch(enhancements, /FDA approved|Breakthrough in targeted cancer therapy|Live Focus/);
    assert.match(styles, /@media \(max-width: 768px\)[\s\S]*?\.nav-links \{\s*display: flex/);
    assert.equal((homepage.match(/class="portal-box" href=/g) || []).length, 5);
    assert.doesNotMatch(homepage, /<a href="pages\/patient\/login\.html">\s*<\/a>/);
});

test('Medi-AI widget controls have keyboard semantics and accessible names', () => {
    const chatbot = readPage('js/chatbot.js');
    assert.match(chatbot, /<button id="medi-chat-toggle"[^>]*aria-label="Open Medi Assistant"/);
    assert.match(chatbot, /id="medi-send-btn" type="button" aria-label="Send message"/);
    assert.match(chatbot, /id="medi-chat-close" type="button" aria-label="Close Medi Assistant"/);
    assert.match(chatbot, /id="medi-chat-reset" type="button" aria-label="Reset chat"/);
});

test('patient dashboard exposes one wired logout action', () => {
    const dashboard = readPage('pages/patient/dashboard.html');
    assert.equal((dashboard.match(/id="logout-btn"/g) || []).length, 1);
});

test('doctor appointments navigation targets the doctor schedule', () => {
    const dashboard = readPage('pages/doctor/dashboard.html');
    assert.match(dashboard, /href="#doctor-schedule"/);
    assert.match(dashboard, /id="doctor-schedule"/);
    assert.doesNotMatch(dashboard, /href="\.\.\/services\/appointments\.html"/);
});

test('admin account actions have visible labels and report failed requests', () => {
    const dashboard = readPage('js/admin-dashboard.js');
    assert.match(dashboard, /permissionsButton\.textContent = 'Permissions'/);
    assert.match(dashboard, /terminateButton\.textContent = 'Terminate'/);
    assert.match(dashboard, /Unable to update account status/);
    assert.match(dashboard, /Unable to terminate this account/);
});

const PATIENT_PAGES = [
    'pages/patient/dashboard.html',
    'pages/patient/appointments.html',
    'pages/patient/appointment-details.html',
    'pages/patient/prescriptions.html',
    'pages/patient/prescription-details.html',
    'pages/patient/records.html',
    'pages/patient/insurance.html',
    'pages/patient/notifications.html',
    'pages/patient/profile.html',
];

// The dashboard is the navigation hub (the target of every back button), so
// only the inner pages require an explicit back button.
const INNER_PAGES = PATIENT_PAGES.filter((page) => page !== 'pages/patient/dashboard.html');

for (const page of INNER_PAGES) {
    test(`${page} has an explicit back button with a real target`, () => {
        const html = readPage(page);
        assert.match(html, /← Back/, `${page} must show a visible back button`);
        assert.match(html, /data-back-link/, `${page} back button must carry a data-back-link hook`);
        assert.doesNotMatch(html, /history\.back/, `${page} must not rely on browser history`);
    });
}

for (const page of PATIENT_PAGES) {
    test(`${page} has loading, empty/error states and shared styles`, () => {
        const html = readPage(page);
        assert.match(html, /Loading/, `${page} must show a loading state`);
        assert.match(html, /page-error|dashboard-error/, `${page} must have an error box`);
        assert.match(html, /patient-portal\.css/, `${page} must load shared portal styles`);
    });
}

test('detail pages resolve records from the ?id= query parameter', () => {
    for (const page of ['pages/patient/appointment-details.html', 'pages/patient/prescription-details.html']) {
        const html = readPage(page);
        assert.match(html, /get\('id'\)/, `${page} must read the record id from the URL`);
        assert.match(html, /not found/i, `${page} must handle unknown ids`);
    }
});

test('dashboard counts and lists come from the same dataset module', () => {
    const html = readPage('pages/patient/dashboard.html');
    assert.match(html, /patient-dashboard\.js/, 'dashboard must use the portal page script');
    assert.match(html, /demo=1/, 'dashboard must offer clearly-labelled demo mode');
});

test('find-doctors supports back navigation to the patient dashboard', () => {
    const html = readPage('pages/services/find-doctors.html');
    assert.match(html, /patient-back/, 'find-doctors must include a patient back block');
    assert.match(html, /from.*patient/, 'find-doctors must handle ?from=patient');
});

test('appointment booking uses authenticated Appwrite data instead of legacy browser storage', () => {
    const page = readPage('pages/services/appointments.html');
    assert.doesNotMatch(page, /admin-service\.js|localStorage\.getItem\(['"]user_data/i);
    assert.match(page, /initAuthGuard\(\['patient', 'super_admin'\]\)/i);
    assert.match(page, /\/api\/doctors/);
    assert.match(page, /\/api\/appointments/);
    assert.match(page, /patient_id: currentUser\.uid/);
    assert.match(page, /doctor_id: doctor\.doctor_id/);
});

test('active pages do not load the retired credential-bearing admin service', () => {
    const appointments = readPage('pages/services/appointments.html');
    const doctorDashboard = readPage('pages/doctor/dashboard.html');
    assert.doesNotMatch(appointments, /admin-service\.js|AdminService/);
    assert.doesNotMatch(doctorDashboard, /admin-service\.js|AdminService/);
});

test('failed doctor lookup does not invent healthcare providers', () => {
    const chatbot = readPage('js/chatbot.js');
    assert.doesNotMatch(chatbot, /Fallback hardcoded|Dr\. Sarah Wilson|Dr\. John Smith/);
    assert.match(chatbot, /this\.doctors = \[\]/);
});

test('doctor dashboard has no hardcoded identity or statistics', () => {
    const page = readPage('pages/doctor/dashboard.html');
    assert.doesNotMatch(page, /Dr\. Sarah Wilson|DOC-8821|Patients Today[\s\S]{0,120}>12<|>4<|>8</i);
    assert.match(page, /\/api\/doctor\/dashboard/);
    assert.match(page, /initAuthGuard\(\['doctor', 'super_admin'\]\)/i);
    assert.match(page, /empty-state/);
});

test('legacy checkAuth delegates to the Appwrite-backed guard', () => {
    const authModule = readPage('js/auth.js');
    assert.match(authModule, /export async function checkAuth\(role\)/);
    assert.match(authModule, /return initAuthGuard\(role\)/);
    assert.doesNotMatch(authModule, /const currentRole = localStorage\.getItem\(['"]user_role['"]\)/);
});

test('admin dashboard displays the server-verified role', () => {
    const dashboard = readPage('js/admin-dashboard.js');
    assert.match(dashboard, /identity-role', String\(user\.role/);
    assert.doesNotMatch(dashboard, /setText\('identity-role', 'Super Admin'\)/);
});

test('patient auth pages include Google sign-in and other portals do not', () => {
    const patientLogin = readPage('pages/patient/login.html');
    const patientRegister = readPage('pages/patient/register.html');
    const doctorLogin = readPage('pages/doctor/login.html');
    const doctorRegister = readPage('pages/doctor/register.html');
    const adminLogin = readPage('pages/admin/login.html');
    const superAdminLogin = readPage('pages/admin/login.html');
    const authModule = readPage('js/auth.js');

    assert.match(patientLogin, /Continue with Google/i, 'patient login must expose Appwrite Google sign-in');
    assert.match(patientRegister, /Continue with Google/i, 'patient register must expose Appwrite Google sign-in');
    assert.match(authModule, /oauth-callback\.html/i, 'patient Google OAuth must redirect to a dedicated callback page');
    assert.doesNotMatch(doctorLogin, /Continue with Google/i, 'doctor login must not show patient Google sign-in');
    assert.doesNotMatch(doctorRegister, /Continue with Google/i, 'doctor register must not show patient Google sign-in');
    assert.doesNotMatch(adminLogin, /Continue with Google/i, 'admin login must not show patient Google sign-in');
    assert.doesNotMatch(superAdminLogin, /Continue with Google/i, 'super admin login must not show patient Google sign-in');
});

test('patient login binds submit before awaiting Appwrite session checks', () => {
    const loginPage = readPage('pages/patient/login.html');
    const handlerIndex = loginPage.indexOf("getElementById('patient-login-form').addEventListener('submit'");
    const sessionCheckIndex = loginPage.indexOf('await getCurrentUser()');
    assert.ok(handlerIndex >= 0);
    assert.ok(sessionCheckIndex > handlerIndex);
    assert.match(loginPage.slice(handlerIndex, sessionCheckIndex), /e\.preventDefault\(\)/);
    assert.match(readPage('js/auth.js'), /invalid credentials[\s\S]*Email or password is incorrect/);
});

test('browser auth does not restore Appwrite sessions via localStorage or Client.setSession()', () => {
    const appwriteInit = readPage('js/appwrite-init.js');
    const authModule = readPage('js/auth.js');

    assert.doesNotMatch(appwriteInit, /helora_appwrite_session|localStorage\.getItem\(|localStorage\.setItem\(|appwriteClient\.setSession\s*\(/i, 'browser setup must not restore Appwrite sessions from localStorage');
    assert.doesNotMatch(appwriteInit, /persistAppwriteSession|clearAppwriteSession/i, 'browser setup must not define custom session persistence helpers');
    assert.doesNotMatch(authModule, /persistAppwriteSession|clearAppwriteSession|helora_appwrite_session/i, 'auth flow must not call or depend on custom localStorage session storage');
    assert.doesNotMatch(authModule, /session\.id|session\.\$id|session\.secret|session\.session/i, 'auth flow must not use session-object fallbacks for browser authentication state');
});

test('patient OAuth callback handles existing Appwrite sessions before createSession()', () => {
    const callback = readPage('pages/patient/oauth-callback.html');
    const authModule = readPage('js/auth.js');

    assert.match(callback, /currentStage = 'checking existing Appwrite session'/i, 'callback must check whether an Appwrite session already exists');
    assert.match(callback, /using existing OAuth session/i, 'callback must reuse the already-authenticated user session when it matches the OAuth user');
    assert.match(callback, /deleting conflicting Appwrite session/i, 'callback must delete a conflicting active session before creating the OAuth session');
    assert.match(callback, /creating Appwrite OAuth session/i, 'callback must create the OAuth session only after the active-session check');
    assert.match(callback, /getting authenticated Appwrite account/i, 'callback must fetch the authenticated account after the session is established');
    assert.match(callback, /continuing patient Google session/i, 'callback must continue the Helora patient Google flow once the Appwrite session is valid');
    assert.match(callback, /error\?\.code \?\? 'unknown'/i, 'callback must preserve raw Appwrite error fields instead of replacing them');
    assert.match(callback, /Error code: /i, 'callback must display safe error code details');
    assert.doesNotMatch(callback, /redirectToLogin|window\.location\.href = 'login\.html\?oauth_error=1'/i, 'callback must not auto-redirect on OAuth callback failures during diagnostics');
    assert.match(authModule, /continuePatientGoogleSession\(existingUser = null\)/i, 'Helora patient flow must accept a pre-authenticated Appwrite user when continuing Google auth');
});

test('chatbot and OAuth callback render untrusted text without HTML injection', () => {
    const chatbot = readPage('js/chatbot.js');
    const callback = readPage('pages/patient/oauth-callback.html');

    assert.match(chatbot, /paragraph\.textContent = String\(text\)/i, 'chatbot must render message text as textContent instead of HTML');
    assert.match(chatbot, /span\.textContent = String\(text\)/i, 'chatbot action cards must render labels as textContent instead of HTML');
    assert.match(callback, /errorEl\.textContent = `Error code:/i, 'OAuth callback must render errors as text instead of innerHTML');
    assert.doesNotMatch(callback, /innerHTML\s*=\s*`Error code:/i, 'OAuth callback must not inject raw Appwrite error markup');
});

test('Helora patient role resolution preserves the intended role model for Google accounts', () => {
    const authModule = readPage('js/auth.js');
    const userTableRoute = readPage('backend/app/registration_routes.py');

    assert.match(authModule, /resolvePatientPortalRole/i, 'Google patient flow must resolve the final role from the Helora user record instead of hard-coding patient');
    assert.match(authModule, /allowedPatientRoles|new Set\(\['patient', 'super_admin'\]\)/i, 'Patient Portal access must allow patient and super_admin only');
    assert.match(authModule, /localStorage\.setItem\('user_role', resolvedRole\)/i, 'Google patient flow must store the resolved Helora role, not force patient');
    assert.match(userTableRoute, /if role in \{'admin', 'doctor'\}/i, 'doctor/admin rows must remain protected from patient conversion');
    assert.match(userTableRoute, /if role == 'super_admin'/i, 'super_admin rows must be preserved and allowed');
    assert.match(userTableRoute, /role': 'super_admin'/i, 'super_admin identity must remain intact in the Helora record');
    assert.match(userTableRoute, /role': 'patient'/i, 'new Google patient accounts must be created with patient role');
});
