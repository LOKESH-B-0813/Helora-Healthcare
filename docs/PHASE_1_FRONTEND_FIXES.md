# Phase 1 — Frontend Fixes

Date: 2026-08-13

Purpose: Record the minimal frontend-only repairs performed during Phase 0 stabilization and provide verification steps. No UI redesign or new backend features were added.

## Files changed (frontend-only)
- pages/services/view-reports.html — reverted JavaScript to original demo endpoints (`/api/send-otp`, `/api/verify-otp`, `/api/upload-file`).

## Files added (documentation)
- docs/PROJECT_BASELINE.md — repository baseline snapshot.
- docs/PHASE_1_FRONTEND_FIXES.md — this file.

## Errors found
- Recent edits replaced `pages/services/view-reports.html` to call new backend endpoints (`/api/reports/*`) which break the approved frontend when the new backend is not running. This is an unintended functional change to UI wiring.
- Unable to execute `git` and `python -m py_compile` inside the automation sandbox due to environment restrictions; therefore an authoritative `git status`/`git diff` and runtime syntax checks were not executed here.

## Fixes applied
- Restored `pages/services/view-reports.html` to use the original demo endpoints that the frontend expects by default.
- Added `docs/PROJECT_BASELINE.md` documenting the current baseline and listing files that must not be changed (UI/CSS/HTML).

## Tests performed (local static checks)
- Verified `view-reports.html` now contains the original fetch calls to `/api/send-otp`, `/api/verify-otp`, and `/api/upload-file`.
- Scanned `js/` for references to the modified endpoints to ensure no other pages were forcibly changed: `grep` located demo endpoints in `app.py`, `server.js`, `docs/` and `view-reports.html`.
- Read backend Flask files (`backend/app/*.py`) for obvious syntax or structural issues (no syntax errors visible from static inspection). Full `py_compile` not run due to sandbox limits.

## Remaining checks (manual / local)
These must be run locally (commands below):

1. Run git status and diff to confirm all recent changes and to produce a clean commit plan:

```bash
git status --porcelain --untracked-files=all
git --no-pager diff --name-only
git --no-pager diff --stat
```

2. Run Python syntax checks on backend modules (in the activated virtualenv):

```bash
python -m py_compile backend/app/__init__.py backend/app/config.py backend/app/firebase_admin_init.py backend/app/reports.py backend/app/extensions.py
```

3. Start the demo Node/Flask servers and browse the frontend to verify no console errors:

- To run the demo Node server (if used):

```bash
node server.js
# or
python app.py
```

- Open `index.html` in browser (or `http://localhost:3000` if running `app.py`) and verify:
  - No console JavaScript errors
  - OTP flow on `pages/services/view-reports.html` uses demo endpoints and behaves as before
  - File upload uses `/api/upload-file` and stores files in `uploads/`

4. If you plan to enable the new `backend/` Flask app, set env vars and run the Flask app via `backend/run.py` after verifying `backend/requirements.txt` is installed in the venv.

## Next steps (manual, do not proceed automatically)
- Run the checks listed above locally and report results here.
- If `git status` shows unintended files changed, revert or adjust only the files that modified approved frontend UI.

---

I will stop here and wait for your instruction to proceed to the next step. Do you want me to run the git and py_compile checks now, or should I provide exact commands and expected outputs for you to run locally?