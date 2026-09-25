import { apiUrl, getAuthToken, initAuthGuard, logout } from './auth.js';

const userViews = new Set(['patients', 'doctors', 'administrators', 'employees']);
const recordViews = new Set(['appointments', 'reports', 'pharmacy', 'insurance', 'notifications', 'audit']);

const statLabels = {
    total_patients: 'total-patients',
    total_doctors: 'total-doctors',
    total_admins: 'total-admins',
    total_employees: 'total-employees',
    total_appointments: 'total-appointments',
    active_users: 'active-users',
    total_medical_reports: 'total-medical-reports',
    total_pharmacy_records: 'total-pharmacy-records',
    total_insurance_records: 'total-insurance-records',
    total_notifications: 'total-notifications'
};

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function statusLabel(status) {
    if (status && status.ok) return 'Connected';
    return status && status.error ? 'Error' : 'Unavailable';
}

function renderStatus(id, status) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = statusLabel(status);
    element.dataset.state = status && status.ok ? 'ok' : 'error';
}

function renderRoleDistribution(distribution) {
    const list = document.getElementById('role-distribution');
    if (!list) return;
    list.replaceChildren();
    const entries = Object.entries(distribution || {});
    if (!entries.length || entries.every(([, count]) => !count)) {
        const empty = document.createElement('li');
        empty.className = 'empty-state';
        empty.textContent = 'No user profiles available.';
        list.appendChild(empty);
        return;
    }
    entries.forEach(([role, count]) => {
        const item = document.createElement('li');
        const label = document.createElement('span');
        label.textContent = role.replace('_', ' ');
        const total = document.createElement('strong');
        total.textContent = String(count);
        item.append(label, total);
        list.appendChild(item);
    });
}

function renderActivity(activity) {
    const list = document.getElementById('recent-activity');
    if (!list) return;
    list.replaceChildren();
    if (!activity || !activity.length) {
        const empty = document.createElement('li');
        empty.className = 'empty-state';
        empty.textContent = 'No recent activity.';
        list.appendChild(empty);
        return;
    }
    activity.forEach((entry) => {
        const item = document.createElement('li');
        const title = document.createElement('strong');
        title.textContent = entry.email || 'User profile';
        const detail = document.createElement('span');
        detail.textContent = `${entry.role || 'unknown role'}${entry.created_at ? ` · ${new Date(entry.created_at).toLocaleString()}` : ''}`;
        item.append(title, detail);
        list.appendChild(item);
    });
}

function showError(message) {
    const panel = document.getElementById('dashboard-error');
    if (panel) {
        panel.hidden = false;
        panel.textContent = message;
    }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {...options, signal: controller.signal});
    } finally {
        clearTimeout(timeout);
    }
}

function setDashboardUnavailable() {
    Object.values(statLabels).forEach(id => setText(id, 'Unavailable'));
    ['status-backend', 'status-appwrite', 'status-database', 'status-storage'].forEach(id => renderStatus(id, {error: true}));
    setText('appointment-note', 'Dashboard data is unavailable');
}

function syncActiveNavigation() {
    const view = new URLSearchParams(window.location.search).get('view') || 'dashboard';
    document.querySelectorAll('.admin-nav a').forEach(link => {
        const linkView = new URL(link.href, window.location.href).searchParams.get('view') || 'dashboard';
        link.classList.toggle('active', linkView === view);
    });
}

async function loadUserView(view, token) {
    const panel = document.getElementById('management-view');
    const title = document.getElementById('management-title');
    const count = document.getElementById('management-count');
    const state = document.getElementById('management-state');
    const table = document.getElementById('management-table');
    const body = table.querySelector('tbody');
    panel.hidden = false;
    table.hidden = true;
    state.textContent = 'Loading records...';
    title.textContent = `${view[0].toUpperCase()}${view.slice(1)} management`;
    document.getElementById('create-user-button').hidden = false;
    document.getElementById('create-user-form').hidden = false;
    const response = await fetchWithTimeout(apiUrl('/api/admin/users'), { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'Unable to load user records.');
    const role = view === 'administrators' ? ['admin', 'super_admin'] : [view.slice(0, -1)];
    const users = payload.users.filter(user => role.includes(String(user.role || '').toLowerCase()));
    count.textContent = `${users.length} record${users.length === 1 ? '' : 's'}`;
    if (!users.length) {
        state.textContent = `No ${view} registered yet.`;
        return;
    }
    state.textContent = '';
    body.replaceChildren(...users.map(user => {
        const row = document.createElement('tr');
        [user.full_name || '-', user.email || '-', user.role || '-', user.phone || '-', user.status || '-'].forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        if (view !== 'patients' && view !== 'doctors' && view !== 'administrators' && view !== 'employees') return row;
        const action = document.createElement('td');
        const button = document.createElement('button');
        button.className = 'btn btn-outline';
        button.textContent = String(user.status || '').toLowerCase() === 'active' ? 'Deactivate' : 'Activate';
        button.addEventListener('click', async () => {
            button.disabled = true;
            const token = await getAuthToken();
            const nextStatus = button.textContent === 'Deactivate' ? 'inactive' : 'active';
            const result = await fetch(apiUrl(`/api/admin/users/${encodeURIComponent(user.user_id)}/status`), { method: 'PATCH', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`}, body: JSON.stringify({status: nextStatus}) });
            if (result.ok) window.location.reload();
            else button.disabled = false;
        });
        row.appendChild(action);
        const permissionsAction = document.createElement('td');
        const permissionsButton = document.createElement('button');
        permissionsButton.className = 'btn btn-outline';
        permissionsButton.textContent = 'Permissions';
        permissionsButton.addEventListener('click', async () => {
            const value = window.prompt('Permissions (comma-separated)', user.permissions || '');
            if (value === null) return;
            const token = await getAuthToken();
            const response = await fetch(apiUrl(`/api/admin/users/${encodeURIComponent(user.user_id)}/permissions`), {
                method: 'PATCH', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
                body: JSON.stringify({permissions: value.split(',').map(item => item.trim()).filter(Boolean)})
            });
            if (response.ok) window.location.reload();
        });
        permissionsAction.appendChild(permissionsButton);
        row.appendChild(permissionsAction);
        if (view === 'employees' || view === 'doctors') {
            const terminateAction = document.createElement('td');
            const terminateButton = document.createElement('button');
            terminateButton.className = 'btn btn-outline';
            terminateButton.textContent = 'Terminate';
            terminateButton.addEventListener('click', async () => {
                if (!window.confirm('Terminate this account and preserve its history?')) return;
                const reason = window.prompt('Termination reason', '');
                if (reason === null) return;
                const token = await getAuthToken();
                const response = await fetch(apiUrl(`/api/admin/users/${encodeURIComponent(user.user_id)}/terminate`), {
                    method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
                    body: JSON.stringify({reason})
                });
                if (response.ok) window.location.reload();
            });
            terminateAction.appendChild(terminateButton);
            row.appendChild(terminateAction);
        }
        return row;
    }));
    table.hidden = false;
}

async function createAdminUser(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const status = document.getElementById('create-user-status');
    status.textContent = 'Creating...';
    try {
        const token = await getAuthToken();
        const response = await fetch(apiUrl('/api/admin/users'), { method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`}, body: JSON.stringify(data) });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || payload.error || 'Account creation failed');
        status.textContent = 'Account created.';
        form.reset();
        setTimeout(() => window.location.reload(), 500);
    } catch (error) {
        status.textContent = error.message;
    }
}

async function loadRecordView(view, token) {
    const panel = document.getElementById('management-view');
    const title = document.getElementById('management-title');
    const count = document.getElementById('management-count');
    const state = document.getElementById('management-state');
    const table = document.getElementById('management-table');
    const body = table.querySelector('tbody');
    panel.hidden = false;
    table.hidden = true;
    state.textContent = 'Loading records...';
    title.textContent = `${view[0].toUpperCase()}${view.slice(1)} management`;
    const response = await fetchWithTimeout(apiUrl(`/api/admin/records/${view}`), { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Unable to load records.');
    const rows = payload.data || [];
    count.textContent = `${rows.length} record${rows.length === 1 ? '' : 's'}`;
    if (!rows.length) {
        state.textContent = `No ${view} records yet.`;
        return;
    }
    const keys = Object.keys(rows[0]).filter(key => !key.startsWith('$') && key !== 'data').slice(0, 8);
    const headerRow = document.createElement('tr');
    keys.forEach((key) => {
        const header = document.createElement('th');
        header.textContent = key.replaceAll('_', ' ');
        headerRow.appendChild(header);
    });
    table.querySelector('thead').replaceChildren(headerRow);
    body.replaceChildren(...rows.map(row => {
        const tr = document.createElement('tr');
        keys.forEach(key => { const td = document.createElement('td'); td.textContent = row[key] ?? '-'; tr.appendChild(td); });
        if (view === 'appointments') {
            const td = document.createElement('td');
            const select = document.createElement('select');
            ['pending', 'accepted', 'rejected', 'reschedule_requested', 'completed', 'cancelled'].forEach(status => {
                const option = new Option(status, status, false, row.status === status);
                select.add(option);
            });
            select.addEventListener('change', async () => {
                const token = await getAuthToken();
                const result = await fetch(apiUrl(`/api/appointments/${encodeURIComponent(row.$id)}/status`), { method: 'PATCH', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`}, body: JSON.stringify({status: select.value}) });
                if (!result.ok) select.value = row.status;
            });
            td.appendChild(select); tr.appendChild(td);
        }
        return tr;
    }));
    state.textContent = '';
    table.hidden = false;
}

async function loadDashboard(token) {
    const response = await fetchWithTimeout(apiUrl('/api/admin/dashboard'), {
        headers: { Authorization: `Bearer ${token}` }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Unable to load dashboard data.');
    }

    Object.entries(statLabels).forEach(([key, id]) => {
        const value = payload.stats[key];
        setText(id, value === null || value === undefined ? 'Not configured' : value);
    });
    setText('appointment-note', payload.appointments.available ? 'Existing appointment records' : 'Appointments table is not configured yet');
    renderRoleDistribution(payload.role_distribution);
    renderActivity(payload.recent_activity);
    renderStatus('status-backend', payload.system_status.backend);
    renderStatus('status-appwrite', payload.system_status.appwrite);
    renderStatus('status-database', payload.system_status.database);
    renderStatus('status-storage', payload.system_status.storage);
    document.getElementById('dashboard-loading')?.remove();
}

document.addEventListener('DOMContentLoaded', async () => {
    syncActiveNavigation();
    document.getElementById('logout-button')?.addEventListener('click', () => logout());
    document.getElementById('create-user-form')?.addEventListener('submit', createAdminUser);
    try {
        const user = await initAuthGuard(['admin', 'super_admin']);
        if (!user) return;
        setText('identity-name', user.full_name || user.email || 'Administrator');
        setText('identity-role', String(user.role || 'admin').replaceAll('_', ' '));
        const view = new URLSearchParams(window.location.search).get('view');
        const token = await getAuthToken();
        const dashboardRequest = loadDashboard(token);
        const viewRequest = userViews.has(view)
            ? loadUserView(view, token)
            : recordViews.has(view) ? loadRecordView(view, token) : Promise.resolve();
        const [dashboardResult, viewResult] = await Promise.allSettled([dashboardRequest, viewRequest]);
        if (dashboardResult.status === 'rejected') {
            setDashboardUnavailable();
            showError(dashboardResult.reason?.name === 'AbortError'
                ? 'Dashboard data timed out. Individual sections may still be available.'
                : dashboardResult.reason?.message || 'Dashboard data is unavailable.');
            document.getElementById('dashboard-loading')?.remove();
        }
        if (viewResult.status === 'rejected') {
            throw viewResult.reason;
        }
        if (view === 'settings') {
            const panel = document.getElementById('management-view');
            panel.hidden = false;
            document.getElementById('management-title').textContent = 'System settings';
            document.getElementById('management-count').textContent = 'Read-only system information';
            document.getElementById('management-state').textContent = 'Use the live system status panel on Dashboard for backend, Appwrite, database, and storage state.';
        }
    } catch (error) {
        console.error('Dashboard load failed:', error);
        document.getElementById('dashboard-loading')?.remove();
        document.getElementById('management-view')?.removeAttribute('hidden');
        showError(error.message || 'Dashboard data is unavailable.');
    }
});