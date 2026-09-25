import { appwriteAccount, appwriteClient, ID, OAuthProvider } from './appwrite-init.js?v=264';

export const API_BASE = window.HELORA_API_BASE || (
    window.location.port === '5000' ? '' : 'http://127.0.0.1:5000'
);

export function apiUrl(path) {
    return `${API_BASE}${path}`;
}

export const ROLES = Object.freeze({
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    PATIENT: 'patient',
    EMPLOYEE: 'employee'
});

function clearAuthState() {
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_data');
}

const PATIENT_ENSURE_DEBUG_KEY = 'helora_patient_ensure_debug';

function setPatientEnsureDebug(debugState = {}) {
    try {
        const entry = { stage: 'unknown', status: 'unknown', role: 'missing', allowed: false, profilePresent: false, ...debugState };
        sessionStorage.setItem(PATIENT_ENSURE_DEBUG_KEY, JSON.stringify(entry));
    } catch (error) {
        console.debug('Patient ensure debug state unavailable:', error && error.message ? error.message : error);
    }
}

export function readableAppwriteError(error) {
    const rawMessage = error && (
        error.message ||
        error.error ||
        error.code ||
        error.type ||
        error.reason ||
        error.details ||
        JSON.stringify(error)
    );
    const message = typeof rawMessage === 'string' ? rawMessage : String(rawMessage || 'Appwrite service error');
    const normalized = message.toLowerCase();

    if (!message || message === '[object Object]') return 'Appwrite service error';
    if (normalized.includes('email already') || normalized.includes('already registered') || normalized.includes('already exists') || normalized.includes('duplicate')) return 'Email already registered';
    if (normalized.includes('invalid email') || normalized.includes('email is invalid') || normalized.includes('not a valid email')) return 'Invalid email';
    if (normalized.includes('password') && (normalized.includes('requirement') || normalized.includes('too short') || normalized.includes('weak') || normalized.includes('must be') || normalized.includes('length'))) return 'Password requirements not met';
    if (normalized.includes('network') || normalized.includes('failed to fetch') || normalized.includes('fetch failed') || normalized.includes('timeout')) return 'Network error';
    if (normalized.includes('forbidden') || normalized.includes('not allowed') || normalized.includes('role')) return 'This account is not allowed to access the patient portal.';
    if (normalized.includes('blocked') || normalized.includes('disabled')) return 'Appwrite service error';
    return 'Appwrite service error';
}

export function backendConnectivityMessage() {
    const location = API_BASE || (typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : 'the configured Helora backend');
    return `Unable to reach the Helora backend at ${location}. Please make sure the Flask API is running and then try again.`;
}

async function fetchWithAuthGuard(url, options = {}) {
    try {
        return await fetch(url, options);
    } catch (error) {
        const message = error && error.message ? error.message : 'Network request failed';
        if (message.includes('Failed to fetch') || message.includes('fetch') || message.includes('NetworkError')) {
            throw new Error(backendConnectivityMessage());
        }
        throw new Error(`Helora backend request failed: ${message}`);
    }
}

export async function getAuthToken() {
    const jwt = await appwriteAccount.createJWT();
    console.info('Appwrite createJWT succeeded: present=%s length=%s', Boolean(jwt.jwt), jwt.jwt.length);
    return jwt.jwt;
}

async function ensureUserSession(email, password) {
    const currentUser = await getCurrentUser();
    if (currentUser && String(currentUser.email || '').toLowerCase() === email.trim().toLowerCase()) {
        return currentUser;
    }

    await appwriteAccount.createEmailPasswordSession(email.trim().toLowerCase(), password);

    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Appwrite session could not be established.');
    }
    return user;
}

export async function getCurrentUser() {
    try {
        return await appwriteAccount.get();
    } catch (error) {
        return null;
    }
}

async function withTimeout(label, operation, timeoutMs = 15000) {
    let timerId;
    const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    });
    try {
        return await Promise.race([
            Promise.resolve().then(operation),
            timeoutPromise,
        ]);
    } finally {
        clearTimeout(timerId);
    }
}

export async function syncPatientProfile(payload = {}) {
    console.log('profile sync started');
    setPatientEnsureDebug({ stage: 'Patient session continuation started', status: 'pending', role: 'missing', allowed: false, profilePresent: false });
    try {
        const result = await withTimeout('profile sync', async () => {
            const user = await getCurrentUser();
            if (!user || !user.email) {
                throw new Error('Appwrite session is required to create the patient profile.');
            }

            const token = await getAuthToken();
            const body = {
                email: String(payload.email || user.email || '').trim().toLowerCase(),
                full_name: String(payload.full_name || user.name || user.email || '').trim(),
                age: payload.age ?? '',
                condition: payload.condition ?? '',
                role: 'patient',
                source: payload.source || 'email'
            };

            setPatientEnsureDebug({ stage: 'Backend ensure request started', status: 'pending', role: 'missing', allowed: false, profilePresent: false });
            const response = await fetchWithAuthGuard(apiUrl('/api/auth/patient/ensure'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const rawResponse = await response.clone().json().catch(() => ({}));
            const resolvedRole = (rawResponse && rawResponse.role) || (rawResponse && rawResponse.data && rawResponse.data.role) || 'missing';
            const allowed = resolvedRole === 'patient' || resolvedRole === 'super_admin';
            setPatientEnsureDebug({
                stage: response.ok ? 'Backend status received' : 'Backend ensure failed',
                status: String(response.status),
                role: resolvedRole,
                allowed: Boolean(response.ok && allowed),
                profilePresent: Boolean(rawResponse && (rawResponse.data || rawResponse.profile || rawResponse.user))
            });

            if (!response.ok) {
                let detail = 'Patient profile could not be created.';
                try {
                    const failure = await response.json();
                    detail = failure.error || failure.message || detail;
                    const failureRole = (failure && failure.role) || (failure && failure.data && failure.data.role) || 'missing';
                    setPatientEnsureDebug({
                        stage: 'Backend ensure failed',
                        status: String(response.status),
                        role: failureRole,
                        allowed: false,
                        profilePresent: Boolean(failure && (failure.data || failure.profile || failure.user)),
                        safeError: detail
                    });
                } catch (error) {
                    console.debug('Patient profile sync response was not JSON:', response.status);
                    setPatientEnsureDebug({
                        stage: 'Backend ensure failed',
                        status: String(response.status),
                        role: 'missing',
                        allowed: false,
                        profilePresent: false,
                        safeError: 'backend response not JSON'
                    });
                }
                throw new Error(readableAppwriteError({ message: detail }));
            }

            const data = await response.json();
            const result = data && data.data ? data.data : data;
            const finalRole = (result && (result.role || result.user_role)) || 'missing';
            setPatientEnsureDebug({
                stage: 'Backend response role resolved',
                status: String(response.status),
                role: finalRole,
                allowed: finalRole === 'patient' || finalRole === 'super_admin',
                profilePresent: Boolean(result)
            });
            return result;
        }, 15000);
        console.log('profile sync completed');
        return result;
    } catch (error) {
        console.log('profile sync error code:', error && error.code);
        console.log('profile sync error type:', error && error.type);
        console.log('profile sync error message:', error && error.message);
        setPatientEnsureDebug({
            stage: 'Backend ensure failed',
            status: 'error',
            role: 'missing',
            allowed: false,
            profilePresent: false,
            safeError: error && error.message ? error.message : 'Patient profile sync failed'
        });
        throw error;
    }
}

export async function registerPatientAccount({ full_name, email, password, age = '', condition = '' } = {}) {
    const name = String(full_name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const candidatePassword = String(password || '');
    if (!name || !normalizedEmail || !candidatePassword) {
        throw new Error('Full name, email, and password are required.');
    }
    if (!normalizedEmail.includes('@')) {
        throw new Error('Invalid email');
    }
    if (candidatePassword.length < 8) {
        throw new Error('Password requirements not met');
    }

    try {
        await appwriteAccount.create(ID.unique(), normalizedEmail, candidatePassword, name);
    } catch (error) {
        throw new Error(readableAppwriteError(error));
    }

    try {
        await appwriteAccount.createEmailPasswordSession(normalizedEmail, candidatePassword);
        await appwriteAccount.createVerification(`${window.location.origin}/pages/patient/login.html?verified=1`);
        const syncedProfile = await syncPatientProfile({ full_name: name, email: normalizedEmail, age, condition, source: 'email' });
        const user = await appwriteAccount.get();
        return { user, syncedProfile, verificationSent: true };
    } catch (error) {
        const message = readableAppwriteError(error);
        throw new Error(message);
    }
}

export function buildPatientGoogleOAuthUrls() {
    const base = `${window.location.origin}/pages/patient`;
    return {
        successUrl: `${base}/oauth-callback.html`,
        failureUrl: `${base}/login.html?oauth_error=1`
    };
}

export async function startPatientGoogleAuth() {
    const { successUrl, failureUrl } = buildPatientGoogleOAuthUrls();
    try {
        const redirectUrl = await appwriteAccount.createOAuth2Token({
            provider: OAuthProvider.Google,
            success: successUrl,
            failure: failureUrl
        });

        if (!redirectUrl) {
            throw new Error('Google OAuth redirect URL could not be generated.');
        }

        window.location.href = redirectUrl;
    } catch (error) {
        throw new Error(readableAppwriteError(error));
    }
}

export function resolvePatientPortalRole(profileResult, fallbackUser = null) {
    const rawRole = (profileResult && (profileResult.role || profileResult.user_role)) || (fallbackUser && fallbackUser.role) || null;
    const normalizedRole = rawRole === null || rawRole === undefined ? null : String(rawRole).trim().toLowerCase();
    const allowedPatientRoles = new Set(['patient', 'super_admin']);

    if (normalizedRole === null || !allowedPatientRoles.has(normalizedRole)) {
        throw new Error('This account is not allowed to access the patient portal.');
    }

    return normalizedRole;
}

export async function continuePatientGoogleSession(existingUser = null) {
    console.log('role resolution started');
    try {
        const currentUser = existingUser || await withTimeout('role resolution', async () => {
            const user = await getCurrentUser();
            if (!user) {
                throw new Error('Appwrite session could not be confirmed after Google sign-in.');
            }
            return user;
        }, 15000);

        const synced = await withTimeout('role resolution', async () => {
            const result = await syncPatientProfile({
                full_name: currentUser.name || currentUser.email,
                email: currentUser.email,
                source: 'google',
            });
            const resolvedRole = resolvePatientPortalRole(result, currentUser);
            localStorage.setItem('user_role', resolvedRole);
            localStorage.setItem('user_email', currentUser.email || '');
            localStorage.setItem('user_data', JSON.stringify({ ...currentUser, role: resolvedRole, profile: result }));
            return result;
        }, 15000);

        console.log('role resolution completed');
        window.location.href = '/pages/patient/dashboard.html';
        return synced;
    } catch (error) {
        console.log('role resolution error code:', error && error.code);
        console.log('role resolution error type:', error && error.type);
        console.log('role resolution error message:', error && error.message);
        const readable = readableAppwriteError(error);
        await logout(false);
        throw new Error(readable);
    }
}

let activeLogin = null;

function portalPath(role) {
    if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) return '/pages/admin/dashboard.html';
    if (role === ROLES.DOCTOR) return '/pages/doctor/dashboard.html';
    return '/pages/patient/dashboard.html';
}

function canAccessRole(userRole, requiredRoles) {
    if (!requiredRoles) return true;
    const allowed = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return userRole === ROLES.SUPER_ADMIN || allowed.includes(userRole);
}

async function loginInternal(email, password, expectedRole) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await getCurrentUser();
    if (existingUser && String(existingUser.email || '').toLowerCase() !== normalizedEmail) {
        await appwriteAccount.deleteSession('current');
    }
    const user = await ensureUserSession(normalizedEmail, password);
    if (!user) throw new Error('Appwrite session could not be established.');

    try {
        await syncPatientProfile({ full_name: user.name || user.email, email: normalizedEmail, source: 'email' });
    } catch (error) {
        const message = readableAppwriteError(error);
        throw new Error(message);
    }

    const token = await getAuthToken();
    const verificationUrl = apiUrl('/api/admin/auth/verify');
    console.info('Auth verification request: method=GET url=%s bearer_present=%s token_length=%s', verificationUrl, Boolean(token), token.length);
    const response = await fetchWithAuthGuard(verificationUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.info('Auth verification response: status=%s', response.status);

    if (!response.ok) {
        let detail = 'Your account is not authorized for Helora.';
        try {
            const failure = await response.json();
            detail = failure.error || detail;
        } catch (error) {
            console.debug('Authorization response was not JSON:', response.status);
        }
        await logout(false);
        throw new Error(readableAppwriteError({ message: detail }));
    }

    const data = await response.json();
    const role = data.user && data.user.role;
    const acceptedRoles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];
    if (expectedRole && !canAccessRole(role, acceptedRoles)) {
        await logout(false);
        throw new Error(`This account does not have the ${acceptedRoles.join(' or ')} role.`);
    }

    localStorage.setItem('user_role', role);
    localStorage.setItem('user_email', user.email || normalizedEmail);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    window.location.href = portalPath(role);
    return true;
}

export function login(email, password, expectedRole) {
    if (activeLogin) return activeLogin;
    activeLogin = loginInternal(email, password, expectedRole)
        .catch(error => {
            console.error('Appwrite login failed:', error);
            throw error;
        })
        .finally(() => { activeLogin = null; });
    return activeLogin;
}

export async function verifySession(expectedRoles = null) {
    const user = await getCurrentUser();
    if (!user) return null;
    const token = await getAuthToken();
    const response = await fetchWithAuthGuard(apiUrl('/api/admin/auth/verify'), {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const data = await response.json();
    const role = data.user && data.user.role;
    const roles = expectedRoles ? (Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles]) : null;
    if (roles && !canAccessRole(role, roles)) return null;
    return data.user;
}

export async function resetPassword(email, redirectPath = '/pages/patient/login.html') {
    if (!email) {
        alert('Please provide an email address to reset your password.');
        return;
    }
    try {
        await appwriteAccount.createRecovery(email, `${window.location.origin}${redirectPath}`);
    } catch (error) {
        console.error('Appwrite password reset failed:', error);
        throw new Error(readableAppwriteError(error));
    }
}

export async function logout(redirect = true) {
    try {
        await appwriteAccount.deleteSession('current');
    } catch (error) {
        console.debug('Appwrite session deletion:', error.message);
    } finally {
        clearAuthState();
        if (redirect) window.location.href = '/index.html';
    }
}

function redirectToPortalLogin() {
    const path = window.location.pathname;
    if (path.includes('/pages/doctor')) window.location.href = '/pages/doctor/login.html';
    else if (path.includes('/pages/patient')) window.location.href = '/pages/patient/login.html';
    else window.location.href = '/pages/admin/login.html';
}

export async function initAuthGuard(requiredRole) {
    const user = await getCurrentUser();
    if (!user) {
        clearAuthState();
        redirectToPortalLogin();
        return null;
    }

    try {
        const token = await getAuthToken();
        const response = await fetchWithAuthGuard(apiUrl('/api/admin/auth/verify'), {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Unauthorized');
        const data = await response.json();
        const role = data.user && data.user.role;
        const acceptedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const ownerOverride = data.user && data.user.is_owner === true && role === ROLES.SUPER_ADMIN;
        if (requiredRole && !canAccessRole(role, acceptedRoles) && !ownerOverride) {
            clearAuthState();
            alert('Unauthorized. Redirecting to login.');
            window.location.href = '/pages/admin/login.html';
            return null;
        }
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_email', data.user.email || user.email);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        return data.user;
    } catch (error) {
        console.error('Appwrite auth guard failed:', error);
        await logout(false);
        redirectToPortalLogin();
        return null;
    }
}

export async function checkAuth(role) {
    return initAuthGuard(role);
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.logo').forEach((element) => {
        element.style.cursor = 'pointer';
        element.addEventListener('click', () => { window.location.href = '/index.html'; });
    });
});