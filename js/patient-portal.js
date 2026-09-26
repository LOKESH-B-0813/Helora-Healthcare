/* Helora Patient Portal - shared browser helpers (DOM + network).
 *
 * Every patient inner page uses this module so that loading, empty, and error
 * states behave identically and dashboard counts always come from the same
 * dataset the lists render.
 */
import { apiUrl, getAuthToken, initAuthGuard, logout } from './auth.js';
import { buildDemoDataset, normalizeLiveDataset } from './patient-portal-data.js';

export function isDemoMode() {
    try {
        return new URLSearchParams(window.location.search).get('demo') === '1';
    } catch (error) {
        return false;
    }
}

/* Append ?demo=1 to an internal link when demo mode is active so the user
 * stays inside the same dataset while navigating (never browser history). */
export function withDemo(href) {
    if (!isDemoMode()) return href;
    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}demo=1`;
}

/* Rewrite every explicit back button ([data-back-link]) so the demo flag
 * survives navigation. */
export function wireBackLinks() {
    if (!isDemoMode()) return;
    document.querySelectorAll('a[data-back-link]').forEach((link) => {
        const target = link.getAttribute('href');
        if (target) link.setAttribute('href', withDemo(target));
    });
}

export function showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.replaceChildren();
    const item = document.createElement('p');
    item.className = 'record-muted';
    item.textContent = message;
    container.appendChild(item);
}

export function showEmpty(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.replaceChildren();
    const item = document.createElement('p');
    item.className = 'record-muted';
    item.textContent = message;
    container.appendChild(item);
}

export function showError(boxId, message) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.hidden = false;
    box.textContent = message;
}

export function hideError(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.hidden = true;
    box.textContent = '';
}

export function renderDemoBanner() {
    if (!isDemoMode()) return;
    const banner = document.getElementById('demo-banner');
    if (banner) banner.hidden = false;
}

export function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

export function appendField(container, label, value) {
    if (value == null || value === '') return;
    const line = document.createElement('p');
    if (label) {
        const strong = document.createElement('strong');
        strong.textContent = `${label}: `;
        line.append(strong, String(value));
    } else {
        line.textContent = String(value);
    }
    container.appendChild(line);
}

/* Guard the page (patient or super_admin owner override) and load one
 * dataset for the whole page. In demo mode no network is used. */
export async function requirePatientDataset() {
    renderDemoBanner();
    wireBackLinks();
    const user = await initAuthGuard(['patient', 'super_admin']);
    if (!user) return null;

    if (isDemoMode()) {
        return { user, dataset: buildDemoDataset() };
    }

    const token = await getAuthToken();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);
    const request = async (path) => {
        try {
            const response = await fetch(apiUrl(path), {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal,
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.success === false) {
                throw new Error((data.error && (data.error.message || data.error)) || `Request failed: ${path}`);
            }
            return data;
        } catch (error) {
            if (error.name === 'AbortError') throw new Error('Patient records request timed out. Please retry.');
            throw error;
        }
    };
    try {
        let profile = null;
        try {
            profile = await request('/api/health-record/profile');
        } catch (error) {
            console.warn('Patient profile request failed, falling back to records payload:', error);
        }

        const records = await request('/api/health-record/records');
        const dataset = normalizeLiveDataset(profile, records);
        const role = String(user.role || '').trim().toLowerCase();
        if (!role || !['patient', 'super_admin'].includes(role)) {
            throw new Error('Patient access required.');
        }
        return { user, dataset };
    } finally {
        window.clearTimeout(timeoutId);
    }
}

export function bindLogout(buttonId = 'logout-btn') {
    const button = document.getElementById(buttonId);
    if (button) button.addEventListener('click', () => logout());
    // Legacy inline onclick="logout()" fallback for older markup.
    window.logout = logout;
}
