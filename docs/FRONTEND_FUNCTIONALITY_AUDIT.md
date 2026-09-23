# Helora Frontend Functionality Audit

Purpose: complete, page-by-page inventory of interactive elements, current vs expected behavior, fixes required, security notes and testing status. This is a static (code-level) audit; runtime verification will follow.

SUMMARY
- The frontend is visually complete and relies on client Firebase SDK for auth and Firestore queries. However many interactive flows point to a demo Node/Flask server that uses in-memory stores for OTPs, meetings, and local file uploads. These demo flows must be replaced by a single Python/Flask backend integrating Firebase Admin, Firestore and Firebase Storage.
- Client-side role checks (in `js/auth.js`) currently gate portal access using `localStorage` and Firestore reads. Server-side session exchange and RBAC are missing.

AUDIT (page / element -> details)

1) index.html
- Element: Portal tiles (Patient / Doctor / Admin / Reports)
  - Current: Inline `onclick` redirects to local pages. Navigation-only; works.
  - Expected: Navigation to login pages. No backend required for link itself.
  - Broken: No
  - Fix: None
  - Security: Public page; no sensitive data.
  - Test: Navigation verified by code inspection.

2) pages/services/view-reports.html (HIGH PRIORITY)
- Element: Mobile input / Send OTP
  - Current: `mobile-form` submits to `/api/send-otp` (demo) — demo server generates OTP, stores in-memory, sometimes returns OTP in response for simulation.
  - Expected: Backend validates mobile (normalizes to E.164), verifies patient registration in `patients` collection, triggers provider-managed OTP (Firebase Phone Auth or Twilio Verify). Do NOT reveal OTP to frontend.
  - Broken: Yes — insecure demo OTP, no patient check before OTP.
  - Required backend/API: `POST /api/reports/request-otp` (normalize phone, check patient, call provider), `POST /api/reports/verify-otp` (verify provider response or validate hashed code stored server-side), issue short-lived signed report session token (JWT) on success.
  - Frontend fix: Update fetch endpoints to new API; after verify use the returned token to call `/api/reports` and `/api/reports/{id}/download` with Authorization header or cookie.
  - Security: Rate-limit, attempt counters, expiration, do not store OTP plaintext, audit log every attempt, IP/device heuristics.
  - Test: Needs runtime tests (unknown at static audit).

- Element: OTP input / Verify
  - Current: Calls `/api/verify-otp` (demo) — checks in-memory store.
  - Expected: Backend-only verification; on success return short-lived token scoped to patient id.
  - Broken: Yes.
  - Fix: See above.

- Element: Upload / File listing / View / Download
  - Current: Upload posts to `/api/upload-file` (demo) saving files to local `uploads/`. File open uses stored path `/uploads/...` served by demo server.
  - Expected: Upload validated server-side and stored in Firebase Storage under `medical-records/{patientId}/reports/{reportId}/`. Firestore stores metadata in `reports` collection referencing storage path. Downloads delivered via signed URLs or proxied endpoints after session/token validation.
  - Broken: Yes — local storage, public paths, no signed URLs.
  - Fix: Implement secure upload pipeline and signed download endpoints.

3) pages/services/appointments.html
- Element: Appointment booking form
  - Current: `appointment-form` has client-side handler; appears to be placeholder and not persisted to Firestore.
  - Expected: `POST /api/appointments` with validation: patient authenticated, doctor exists, slot available (server-side slot lock), create appointment document and notify participants.
  - Broken: Yes.
  - Fix: Implement availability APIs and transactional appointment creation.
  - Security: Prevent double-booking and IDOR (patient must be authenticated to create appointment on their behalf).

4) pages/services/find-doctors.html
- Element: Doctor cards, Book buttons
  - Current: Static cards link to `appointments.html` for booking.
  - Expected: `GET /api/doctors?specialization=...` search with pagination and server-side filters.
  - Broken: Data static.
  - Fix: Implement `/api/doctors` and connect UI filters to API.

5) pages/services/consultation.html
- Element: Create / Join meeting, mic/cam toggles, leave
  - Current: Calls demo endpoints `/api/create-meeting` and `/api/join-meeting` which hold meetings in-memory. Media toggles are UI-only.
  - Expected: Appointment-based consultation with authorized rooms. For real video, integrate WebRTC/SFU or third-party provider (Jitsi/Agora/Twilio). Backend should issue room tokens and record consultation metadata to Firestore.
  - Broken: Demo meeting state and no real video.
  - Fix: Implement consultation endpoints and provider integration or explicitly mark video as unavailable if not integrated.
  - Security: Authorize by appointment, room token expiry, logging.

6) pages/doctor/* (login.html, dashboard.html, register.html)
- Elements: Login, register, dashboard actions, join consultation
  - Current: `doctor-login-form` uses `js/auth.js` Firebase sign-in; register form likely posts to client logic; dashboard has links to consultation page and placeholder data.
  - Expected: Registration should POST to `/api/doctors/register` storing documents in Storage and creating pending doctor record; login should exchange ID token for server session and ensure role is DOCTOR; dashboard endpoints fetch doctor-specific data from server.
  - Broken: Server-side doctor approval and RBAC missing.
  - Fix: Implement registration workflow and admin approval APIs, server session exchange and RBAC checks.

7) pages/patient/* (login.html, register.html, dashboard.html)
- Elements: Login, register, uploads, dashboard tabs
  - Current: Firebase client-side auth used; uploads call demo `/api/upload-file`; dashboard uses static UI.
  - Expected: Use Firebase Auth + server session; uploads should POST to secure backend which validates user and stores to Firebase Storage; dashboard fetches patient-scoped data from server.
  - Broken: Uploads and patient data not securely persisted.
  - Fix: Implement upload API and patient endpoints; replace demo upload.

8) pages/admin/* (login.html, dashboard.html)
- Elements: Sidebar controls, approve/reject actions, inbox, backup
  - Current: UI contains many `onclick` handlers (approveDoc, rejectDoc, removePat, removeDoc) that expect an `AdminService` event; actual data retrieval seems to rely on `js/admin-service.js` which currently uses demo patterns.
  - Expected: Admin APIs: `/api/admin/dashboard`, `/api/admin/doctors`, `/api/admin/doctors/{id}/approve`, `/api/contact/messages` etc. All admin endpoints must verify server-side role.
  - Broken: Client-side actions may call functions that assume local demo state; no server RBAC.
  - Fix: Implement admin APIs and ensure clicks perform fetch calls to backend. Protect endpoints server-side.

9) js/auth.js and js/firebase-init.js
- `js/firebase-init.js` initializes Firebase client with a hard-coded web config; acceptable for frontend.
- `js/auth.js` uses Firebase client signInWithEmailAndPassword and then queries Firestore client-side to verify role and sets `localStorage.user_role` and `user_email`.
  - Issue: Relying on client-side Firestore role check and `localStorage` is insecure. Backend must verify ID token and issue server session with role and claims.
  - Fix: Add endpoint `POST /api/auth/session` to accept Firebase ID token and return server session cookie (HttpOnly) with server-managed RBAC.

10) js/chatbot.js
- Elements: toggle, send, quick-actions
  - Current: Uses `/db.json` local fallback and client-side logic; sends messages client-side and supports quick actions that navigate to pages.
  - Expected: Backend `POST /api/ai/chat` with explicit consent when optional patient context is used. Rate-limit and redact PHI.
  - Fix: Implement backend AI API and update frontend to call it; ensure patient actions require auth.

11) Demo backend files (`app.py`, `server.js`)
- Current: Provide overlapping demo endpoints that use in-memory stores (`otp_store`, `meetings_store`, `user_data_store`) and save uploads to local `uploads/`.
- Risk: Demo responses may include OTP values and allow fake access. Must be removed/replaced.
- Fix: Replace with single secure Flask backend integrated with Firebase Admin SDK and Firestore. Remove in-memory OTP and local uploads. Implement provider-based OTP, hashed OTP storage if locally managed, and strict rate limiting.

REQUIRED NEXT STEPS (Phase 2 -> 5 immediate)
1. Implement secure View Reports flow (server endpoints, provider-based OTP, short-lived scoped token, Firestore-backed reports listing and download). Priority: HIGH.
2. Implement `POST /api/auth/session` to exchange Firebase ID token for server session and enforce RBAC.
3. Replace `/api/upload-file` demo with `POST /api/reports/upload` that stores files to Firebase Storage and metadata to Firestore.
4. Implement admin APIs and protect with server-side RBAC.
5. Replace consultation demo endpoints or integrate a real video provider.

DOCUMENTATION
- Create `docs/DATABASE_ARCHITECTURE.md` for Firestore collections.
- Create `docs/API_DOCUMENTATION.md` listing new endpoints, request/response formats, and auth requirements.

This static audit is complete. Next I will implement the secure View Reports backend endpoints and wire the `pages/services/view-reports.html` frontend to use them (Phase 5). After that I will proceed page-by-page to fix and test remaining interactions.
