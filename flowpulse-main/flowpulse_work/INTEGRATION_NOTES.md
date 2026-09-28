# FlowPulse + patient-facing hospital template integration

This integration keeps the existing FlowPulse operations dashboard and adds a separate patient-facing hospital experience inspired by the visual principles of the supplied MediCore Framer reference.

## Route architecture

### Patient/public experience
- `/` — landing page
- `/about` — product/hospital explanation
- `/departments` — patient department directory with live wait estimates
- `/doctors` — doctor directory
- `/book-appointment` — interactive smart appointment flow
- `/track-visit` — patient journey tracker

### Staff operations experience
- `/staff` — FlowPulse Command Center
- `/staff/patient-flow`
- `/staff/departments`
- `/staff/beds-capacity`
- `/staff/staff-operations`
- `/staff/ripple-analysis`
- `/staff/scenario-simulator`
- `/staff/analytics`
- `/staff/integrations`
- `/staff/settings`

## Key integration decisions

1. Existing staff UI is preserved instead of forcing the patient-facing visual style onto operations screens.
2. Public pages reuse existing FlowPulse hospital, department and staff data.
3. Public pages use an original green/editorial healthcare design inspired by the reference, without copying its proprietary code, text or assets.
4. The public header includes `Staff portal` linking directly to `/staff`.
5. Smart appointment and patient-journey views are included as the bridge between the public website and FlowPulse's operational intelligence concept.

## Recommended next steps in v0

1. Import/open this project.
2. Refine the public landing page with your preferred healthcare photography.
3. Build the real `/staff` Command Center on top of the existing placeholder using the centralized data.
4. Build Ripple Analysis and Scenario Simulator next.
5. Add a shared scenario store so staff-side simulated disruptions update patient-facing wait and journey estimates.
6. Final QA all public ↔ staff navigation.

## Validation note

The route/file structure and imports were reviewed after integration. A full dependency install/build could not be run in this sandbox because external package registry access was unavailable. Run `pnpm install && pnpm build` in v0/Vercel or your local environment after importing.
