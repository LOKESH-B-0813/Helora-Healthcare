/* Helora Patient Portal - shared data layer (pure, no DOM access).
 *
 * This module is intentionally free of browser globals at import time so it
 * can be unit-tested with plain Node.js.
 *
 * Data sources:
 *   - "live": the application's real data layer
 *     (GET /api/health-record/profile + GET /api/health-record/records).
 *   - "demo": development-only connected TEST records used to demonstrate the
 *     complete portal when the live account has no records yet. Every demo
 *     record carries the DEMO_TAG prefix / demo:true flag and must never be
 *     presented as a real person, doctor, or policy.
 *
 * Connected demo graph:
 *   TEST PATIENT (demo-patient-001)
 *     -> 3 TEST APPOINTMENTS (appt-demo-001..003, all with demo-doctor-001)
 *     -> 2 TEST PRESCRIPTIONS (rx-demo-001 linked to appt-demo-001,
 *        rx-demo-002 linked to appt-demo-002) + linked prescription items
 *     -> 2 TEST LAB/MEDICAL REPORTS, 1 TEST INSURANCE POLICY,
 *        3 TEST NOTIFICATIONS, 2 TEST PHARMACY RECORDS
 */

export const DEMO_TAG = '[TEST-DATA]';

export const DEMO_PATIENT_ID = 'demo-patient-001';
export const DEMO_DOCTOR_ID = 'demo-doctor-001';

export function isDemoRecord(row) {
    if (!row || typeof row !== 'object') return false;
    if (row.demo === true) return true;
    return Object.values(row).some(
        (value) => typeof value === 'string' && value.includes(DEMO_TAG),
    );
}

function demoDoctorName() {
    return `${DEMO_TAG} Demo Doctor (General Medicine)`;
}

export function buildDemoDataset() {
    const profile = {
        user_id: DEMO_PATIENT_ID,
        full_name: `${DEMO_TAG} Demo Patient`,
        email: 'demo.patient@example.invalid',
        phone: '+91-90000-00001',
        status: 'Active',
        demo: true,
    };

    const appointments = [
        {
            $id: 'appt-demo-001',
            patient_id: DEMO_PATIENT_ID,
            doctor_id: DEMO_DOCTOR_ID,
            patient_name: profile.full_name,
            doctor_name: demoDoctorName(),
            appointment_date: '2026-09-10T10:00:00Z',
            appointment_time: '10:00 AM - 10:30 AM',
            appointment_type: 'in-person',
            reason: 'Demo follow-up for seasonal fever',
            status: 'completed',
            doctor_notes: 'Demo note: rest and fluids; review if fever persists.',
            created_at: '2026-09-01T09:00:00Z',
            demo: true,
        },
        {
            $id: 'appt-demo-002',
            patient_id: DEMO_PATIENT_ID,
            doctor_id: DEMO_DOCTOR_ID,
            patient_name: profile.full_name,
            doctor_name: demoDoctorName(),
            appointment_date: '2026-09-28T15:00:00Z',
            appointment_time: '03:00 PM - 03:30 PM',
            appointment_type: 'video',
            reason: 'Demo review of lab report LIPID-2026-09',
            status: 'accepted',
            doctor_notes: '',
            created_at: '2026-09-12T09:00:00Z',
            demo: true,
        },
        {
            $id: 'appt-demo-003',
            patient_id: DEMO_PATIENT_ID,
            doctor_id: DEMO_DOCTOR_ID,
            patient_name: profile.full_name,
            doctor_name: demoDoctorName(),
            appointment_date: '2026-10-05T11:00:00Z',
            appointment_time: '11:00 AM - 11:30 AM',
            appointment_type: 'in-person',
            reason: 'Demo general health check',
            status: 'pending',
            doctor_notes: '',
            created_at: '2026-09-15T09:00:00Z',
            demo: true,
        },
    ];

    const prescriptions = [
        {
            $id: 'rx-demo-001',
            patient_id: DEMO_PATIENT_ID,
            doctor_id: DEMO_DOCTOR_ID,
            doctor_name: demoDoctorName(),
            appointment_id: 'appt-demo-001',
            diagnosis: 'Demo diagnosis: viral fever',
            instructions: 'Demo instructions: complete the full course.',
            status: 'active',
            created_at: '2026-09-10T11:00:00Z',
            demo: true,
        },
        {
            $id: 'rx-demo-002',
            patient_id: DEMO_PATIENT_ID,
            doctor_id: DEMO_DOCTOR_ID,
            doctor_name: demoDoctorName(),
            appointment_id: 'appt-demo-002',
            diagnosis: 'Demo diagnosis: elevated lipids (lab review)',
            instructions: 'Demo instructions: diet review at next visit.',
            status: 'active',
            created_at: '2026-09-12T10:00:00Z',
            demo: true,
        },
    ];

    const prescriptionItems = [
        {
            $id: 'rxitem-demo-001a',
            prescription_id: 'rx-demo-001',
            medicine_name: 'Demo Paracetamol 650mg (TEST ITEM)',
            dosage: '650mg', frequency: 'Twice daily', duration: '3 days',
            demo: true,
        },
        {
            $id: 'rxitem-demo-001b',
            prescription_id: 'rx-demo-001',
            medicine_name: 'Demo ORS Powder (TEST ITEM)',
            dosage: '1 sachet', frequency: 'As needed', duration: '3 days',
            demo: true,
        },
        {
            $id: 'rxitem-demo-002a',
            prescription_id: 'rx-demo-002',
            medicine_name: 'Demo Atorvastatin 10mg (TEST ITEM)',
            dosage: '10mg', frequency: 'Once daily at night', duration: '30 days',
            demo: true,
        },
    ];

    const reports = [
        {
            $id: 'lab-demo-001',
            patient_id: DEMO_PATIENT_ID,
            file_name: `${DEMO_TAG} lipid-profile-sep-2026.pdf`,
            file_type: 'application/pdf',
            report_type: 'lab',
            description: 'Demo lipid profile ordered after appt-demo-001.',
            report_date: '2026-09-11T00:00:00Z',
            created_at: '2026-09-11T08:00:00Z',
            demo: true,
        },
        {
            $id: 'lab-demo-002',
            patient_id: DEMO_PATIENT_ID,
            file_name: `${DEMO_TAG} cbc-sep-2026.pdf`,
            file_type: 'application/pdf',
            report_type: 'lab',
            description: 'Demo CBC panel for fever workup.',
            report_date: '2026-09-10T00:00:00Z',
            created_at: '2026-09-10T12:00:00Z',
            demo: true,
        },
    ];

    const insurance = [
        {
            $id: 'ins-demo-001',
            patient_id: DEMO_PATIENT_ID,
            provider: `${DEMO_TAG} Demo Health Cover Co.`,
            policy_number: 'DEMO-POL-000001',
            plan_name: 'Demo Family Floater (Test Policy)',
            status: 'active',
            coverage_details: 'Demo coverage summary for portal demonstration only.',
            valid_from: '2026-01-01T00:00:00Z',
            valid_until: '2026-12-31T00:00:00Z',
            demo: true,
        },
    ];

    const notifications = [
        {
            $id: 'notif-demo-001',
            user_id: DEMO_PATIENT_ID,
            title: `${DEMO_TAG} Appointment confirmed`,
            message: 'Your demo appointment appt-demo-002 was accepted.',
            type: 'appointment',
            is_read: false,
            related_id: 'appt-demo-002',
            created_at: '2026-09-12T09:05:00Z',
            demo: true,
        },
        {
            $id: 'notif-demo-002',
            user_id: DEMO_PATIENT_ID,
            title: `${DEMO_TAG} Lab report ready`,
            message: 'Your demo lipid profile report is available.',
            type: 'report',
            is_read: false,
            related_id: 'lab-demo-001',
            created_at: '2026-09-11T08:05:00Z',
            demo: true,
        },
        {
            $id: 'notif-demo-003',
            user_id: DEMO_PATIENT_ID,
            title: `${DEMO_TAG} Prescription issued`,
            message: 'Demo prescription rx-demo-001 was issued.',
            type: 'prescription',
            is_read: true,
            related_id: 'rx-demo-001',
            created_at: '2026-09-10T11:05:00Z',
            demo: true,
        },
    ];

    const pharmacy = [
        {
            $id: 'pharm-demo-001',
            patient_id: DEMO_PATIENT_ID,
            prescription_id: 'rx-demo-001',
            medicine_name: 'Demo Paracetamol 650mg (TEST ITEM)',
            quantity: 10,
            status: 'dispensed',
            prescribed_by: demoDoctorName(),
            created_at: '2026-09-10T12:00:00Z',
            demo: true,
        },
        {
            $id: 'pharm-demo-002',
            patient_id: DEMO_PATIENT_ID,
            prescription_id: 'rx-demo-002',
            medicine_name: 'Demo Atorvastatin 10mg (TEST ITEM)',
            quantity: 30,
            status: 'pending',
            prescribed_by: demoDoctorName(),
            created_at: '2026-09-12T11:00:00Z',
            demo: true,
        },
    ];

    return {
        source: 'demo',
        profile,
        appointments,
        prescriptions,
        prescriptionItems,
        reports,
        insurance,
        notifications,
        pharmacy,
    };
}

/* Normalize the live /api/health-record/records payload into the same shape
 * used by the demo dataset so every page renders from one structure. */
export function normalizeLiveDataset(profilePayload, recordsPayload) {
    const directPayload = recordsPayload && !recordsPayload.data && typeof recordsPayload === 'object' ? recordsPayload : (recordsPayload && recordsPayload.data) || {};
    const data = directPayload && typeof directPayload === 'object' ? directPayload : {};
    const pick = (name) => {
        const candidate = data[name] ?? (recordsPayload && recordsPayload[name]) ?? [];
        if (Array.isArray(candidate)) return candidate;
        if (candidate && typeof candidate === 'object' && Array.isArray(candidate.data)) return candidate.data;
        if (candidate && typeof candidate === 'object' && candidate.rows && Array.isArray(candidate.rows)) return candidate.rows;
        return [];
    };
    const profile =
        ((profilePayload && profilePayload.data) || (profilePayload && profilePayload.profile)) ||
        (recordsPayload && recordsPayload.data && recordsPayload.data.profile) ||
        (recordsPayload && recordsPayload.profile) ||
        (data.profile || {});

    return {
        source: 'live',
        profile: profile || {},
        appointments: pick('appointments'),
        prescriptions: pick('prescriptions'),
        prescriptionItems: pick('prescription_items'),
        reports: pick('medical_reports'),
        insurance: pick('insurance_records'),
        notifications: pick('notifications'),
        pharmacy: pick('pharmacy_records'),
        consultations: pick('consultation_records'),
        doctorAdvice: pick('doctor_advice'),
        medicalRecords: pick('medical_records'),
        labReports: pick('lab_reports'),
    };
}

/* Dashboard counts are always derived from the same arrays the pages render,
 * so "appointments = 3" means the history page really contains those 3. */
export function summarize(dataset) {
    const ds = dataset || {};
    return {
        appointments: (ds.appointments || []).length,
        prescriptions: (ds.prescriptions || []).length,
        reports: (ds.reports || []).length,
        insurance: (ds.insurance || []).length,
        notifications: (ds.notifications || []).length,
        unreadNotifications: (ds.notifications || []).filter((n) => !n.is_read).length,
        pharmacy: (ds.pharmacy || []).length,
    };
}

export function itemsForPrescription(dataset, prescriptionId) {
    return ((dataset && dataset.prescriptionItems) || []).filter(
        (item) => item.prescription_id === prescriptionId,
    );
}

export function findAppointment(dataset, appointmentId) {
    return ((dataset && dataset.appointments) || []).find((row) => row.$id === appointmentId) || null;
}

export function findPrescription(dataset, prescriptionId) {
    const rx = ((dataset && dataset.prescriptions) || []).find((row) => row.$id === prescriptionId) || null;
    if (!rx) return null;
    return { prescription: rx, items: itemsForPrescription(dataset, prescriptionId) };
}

/* Verify the demo graph is fully connected (used by tests and the demo
 * banner self-check). Returns an array of human-readable problems. */
export function checkDemoConnectivity(dataset) {
    const problems = [];
    const ds = dataset || {};
    const appointmentIds = new Set((ds.appointments || []).map((a) => a.$id));
    const prescriptionIds = new Set((ds.prescriptions || []).map((p) => p.$id));

    (ds.appointments || []).forEach((appt) => {
        if (appt.patient_id !== DEMO_PATIENT_ID) problems.push(`appointment ${appt.$id} not linked to demo patient`);
        if (appt.doctor_id !== DEMO_DOCTOR_ID) problems.push(`appointment ${appt.$id} not linked to demo doctor`);
    });
    (ds.prescriptions || []).forEach((rx) => {
        if (rx.patient_id !== DEMO_PATIENT_ID) problems.push(`prescription ${rx.$id} not linked to demo patient`);
        if (rx.appointment_id && !appointmentIds.has(rx.appointment_id)) {
            problems.push(`prescription ${rx.$id} links to unknown appointment ${rx.appointment_id}`);
        }
    });
    (ds.prescriptionItems || []).forEach((item) => {
        if (!prescriptionIds.has(item.prescription_id)) {
            problems.push(`prescription item ${item.$id} links to unknown prescription ${item.prescription_id}`);
        }
    });
    ['reports', 'insurance', 'pharmacy'].forEach((key) => {
        (ds[key] || []).forEach((row) => {
            if (row.patient_id !== DEMO_PATIENT_ID) problems.push(`${key} record ${row.$id} not linked to demo patient`);
        });
    });
    (ds.notifications || []).forEach((row) => {
        if (row.user_id !== DEMO_PATIENT_ID) problems.push(`notification ${row.$id} not linked to demo patient`);
    });
    return problems;
}
