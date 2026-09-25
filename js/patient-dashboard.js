/* Patient Dashboard page script: counts + previews, all from one dataset. */
import { summarize } from './patient-portal-data.js';
import {
    appendField,
    bindLogout,
    formatDate,
    hideError,
    requirePatientDataset,
    showEmpty,
    showError,
    showLoading,
    withDemo,
} from './patient-portal.js';

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value == null || value === '' ? '-' : String(value);
}

function propagateDemo() {
    document.querySelectorAll('a[data-portal-link]').forEach((link) => {
        link.setAttribute('href', withDemo(link.getAttribute('href')));
    });
    const findDoctors = document.querySelector('a[data-find-doctors]');
    if (findDoctors) {
        const url = new URL(findDoctors.getAttribute('href'), window.location.href);
        url.searchParams.set('from', 'patient');
        findDoctors.setAttribute(
            'href',
            withDemo(`${url.pathname}${url.search}`),
        );
    }
}

function renderAppointmentPreview(rows) {
    const container = document.getElementById('appointments-list');
    container.replaceChildren();
    if (!rows.length) return showEmpty('appointments-list', 'No appointments yet.');
    rows.slice(0, 3).forEach((row) => {
        const item = document.createElement('article');
        item.className = 'record-item';
        appendField(item, 'Doctor', row.doctor_name || row.doctor_id || 'Doctor');
        appendField(item, 'Date', `${formatDate(row.appointment_date)}${row.appointment_time ? ` · ${row.appointment_time}` : ''}`);
        appendField(item, 'Status', String(row.status || 'pending').toUpperCase());
        const link = document.createElement('a');
        link.className = 'btn btn-outline';
        link.textContent = 'View details';
        link.setAttribute('href', withDemo(`appointment-details.html?id=${encodeURIComponent(row.$id)}`));
        item.appendChild(link);
        container.appendChild(item);
    });
}

function renderPrescriptionPreview(rows) {
    const container = document.getElementById('prescriptions-list');
    container.replaceChildren();
    if (!rows.length) return showEmpty('prescriptions-list', 'No prescriptions available yet.');
    rows.slice(0, 2).forEach((row) => {
        const item = document.createElement('article');
        item.className = 'record-item';
        appendField(item, 'Doctor', row.doctor_name || row.doctor_id || 'Doctor');
        appendField(item, 'Date', formatDate(row.created_at || row.prescribed_at));
        appendField(item, 'Diagnosis', row.diagnosis || row.instructions || 'Prescription issued');
        const link = document.createElement('a');
        link.className = 'btn btn-outline';
        link.textContent = 'View details';
        link.setAttribute('href', withDemo(`prescription-details.html?id=${encodeURIComponent(row.$id)}`));
        item.appendChild(link);
        container.appendChild(item);
    });
}

function renderRecentRecords(rows) {
    const container = document.getElementById('records-mini-list');
    container.replaceChildren();
    const records = (rows || []).slice(0, 3);
    if (!records.length) return showEmpty('records-mini-list', 'No lab or medical reports available yet.');
    records.forEach((row) => {
        const item = document.createElement('article');
        item.className = 'record-item';
        appendField(item, 'Report', row.file_name || row.report_type || 'Medical record');
        appendField(item, 'Type', row.report_type || 'report');
        appendField(item, 'Date', formatDate(row.report_date || row.created_at));
        container.appendChild(item);
    });
}

function renderNotificationsPreview(rows) {
    const container = document.getElementById('notifications-mini-list');
    container.replaceChildren();
    const items = (rows || []).slice(0, 3);
    if (!items.length) return showEmpty('notifications-mini-list', 'No notifications yet.');
    items.forEach((row) => {
        const item = document.createElement('article');
        item.className = 'record-item';
        appendField(item, 'Title', row.title || 'Notification');
        appendField(item, 'Message', row.message || 'No details available.');
        appendField(item, 'Date', formatDate(row.created_at));
        if (!row.is_read) {
            const badge = document.createElement('span');
            badge.className = 'unread-dot';
            badge.textContent = 'NEW';
            item.appendChild(badge);
        }
        container.appendChild(item);
    });
}

async function loadDashboard() {
    showLoading('appointments-list');
    showLoading('prescriptions-list');
    showLoading('records-mini-list');
    showLoading('notifications-mini-list');
    hideError('dashboard-error');
    propagateDemo();
    const loaded = await requirePatientDataset();
    if (!loaded) return;
    const { user, dataset } = loaded;
    propagateDemo();

    const profile = dataset.profile || {};
    setText('user-name', profile.full_name || user.email || 'Patient');
    setText('profile-summary', `${profile.full_name || user.email || 'Patient'} · ${profile.status || 'Active'}`);

    const counts = summarize(dataset);
    setText('appt-count', counts.appointments);
    setText('pres-count', counts.prescriptions);
    setText('report-count', counts.reports);
    setText('insurance-count', counts.insurance);
    setText('notification-count', counts.notifications);
    setText('pharmacy-count', counts.pharmacy);

    renderAppointmentPreview(dataset.appointments || []);
    renderPrescriptionPreview(dataset.prescriptions || []);
    renderRecentRecords(dataset.reports || []);
    renderNotificationsPreview(dataset.notifications || []);
}

bindLogout();
loadDashboard().catch((error) => {
    console.error('Patient dashboard load failed:', error);
    showError('dashboard-error', error.message || 'Unable to load your dashboard.');
    showEmpty('appointments-list', 'Could not load appointments.');
    showEmpty('prescriptions-list', 'Could not load prescriptions.');
    ['appt-count', 'pres-count', 'report-count', 'insurance-count', 'notification-count', 'pharmacy-count'].forEach((id) => setText(id, '–'));
});
