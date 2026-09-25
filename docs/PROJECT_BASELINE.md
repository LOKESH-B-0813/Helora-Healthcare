# PROJECT BASELINE - Helora

Date: 2026-08-13

This file documents the current repository baseline before further Phase 1 frontend stabilization work.

## Frontend structure
- Root: `index.html`
- Assets: `assets/`, `css/style.css`, `js/` files
- Pages: `pages/` - contains `admin/`, `patient/`, `doctor/`, `services/` folders with HTML pages.
- Key JS files:
  - `js/firebase-init.js` - client Firebase config
  - `js/auth.js` - auth helper (client)
  - `js/script.js` - global scripts
  - `js/chatbot.js` - frontend chatbot UI handlers
  - `js/admin-service.js`, `js/icons.js`, `js/ui-enhancements.js`

## Backend structure
- `backend/` contains a Flask app skeleton:
  - `backend/app/__init__.py` - app factory
  - `backend/app/config.py` - config loader
  - `backend/app/extensions.py` - extensions (CORS)
  - `backend/app/firebase_admin_init.py` - firebase admin initializer
  - `backend/app/reports.py` - reports blueprint (recently added)
  - `backend/run.py` - simple runner
  - `backend/requirements.txt` - backend dependencies

## Existing server files
- `app.py` and `server.js` exist at project root and implement legacy/demo flows (in-memory OTP and `uploads/` storage).
- `backend/` Flask files are new and not yet fully integrated with the rest of the project.

## Firebase configuration
- Client config in `js/firebase-init.js` (used by frontend Firestore interactions).
- Server Firebase admin initialization in `backend/app/firebase_admin_init.py` expects env vars (SERVICE_ACCOUNT JSON pieces).

## Dependencies
- `package.json` and `package-lock.json` for frontend tooling.
- `requirements.txt` at repo root and `backend/requirements.txt` for backend Python dependencies.

## Existing functionality
- Frontend drives static pages and writes/reads Firestore directly via client SDK in many places (not secure for production but part of baseline).
- Legacy demo endpoints `POST /api/send-otp`, `POST /api/verify-otp`, `POST /api/upload-file` in `server.js`/`app.py` support demo OTP and uploads.

## Known broken functionality (observed)
- Recent backend additions modified `pages/services/view-reports.html` to call new backend endpoints; these changes may break the approved frontend when backend isn't running.
- Some new backend code may require env vars and Firebase admin credentials which are not present in baseline.

## Recent unintended modifications
- `pages/services/view-reports.html` — JS replaced to call `/api/reports/*` endpoints and to store token in window. This file has been restored to original demo behavior in this baseline.
- `backend/app/reports.py` — introduced server-side OTP/report endpoints. Keep but do not enable until Phase 2.

## Files that must remain unchanged (unless fixing an explicit frontend-only bug)
- All CSS files in `css/`
- All HTML in `pages/` unless a JavaScript bug requires a minimal fix that preserves UI
- `index.html`
- `js/` files that control UI appearance (changes allowed only for event wiring)

## Files that can be modified
- `backend/` files for stabilization (syntax fixes only)
- `docs/` additions
- small JS fixes limited to wiring event handlers or correcting paths; must preserve visual appearance

## Next steps (Phase 0 tasks)
1. Run `git status`/`git diff --stat` to identify modified files.
2. Revert accidental frontend changes (already partially done).
3. Run the frontend locally and open browser console to find JS errors.
4. Run `python -m py_compile` on backend modules to find syntax/import errors and fix only obvious syntax issues.
5. Document all frontend-only fixes in `docs/PHASE_1_FRONTEND_FIXES.md`.

