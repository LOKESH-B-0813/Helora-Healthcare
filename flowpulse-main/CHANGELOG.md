# Changelog

All notable changes to the **FlowPulse AI** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-08-29

### 🚀 Initial Public Release

FlowPulse AI is an enterprise predictive hospital flow intelligence and counterfactual operations platform designed to model and prevent downstream queue propagation across healthcare facilities.

### ✨ Key Features

#### 🏥 Staff Operations Web Portal (`flowpulse_work/`)
- **Executive Command Center**: Real-time hospital status overview with an interactive 10-department React Flow care-pathway dependency graph.
- **Live Smart Queue Intelligence**: Live department queue monitoring, token sequencing, and multi-factor root-cause attribution.
- **Live Patient Flow Timeline**: Chronological daily schedule with Scheduled vs Predicted service times, dynamic NOW operational clock marker, and delay risk categorization (`ON_TIME`, `MODERATE_DELAY`, `HIGH_DELAY`, `CRITICAL_DELAY`).
- **Ripple Cascade Analysis**: Directional cascade graph projecting how upstream laboratory disruptions propagate to Doctor Review, Inpatient Bed turnover, and Emergency Department boarding.
- **Counterfactual Scenario Simulator**: Multi-option operational simulation sandbox allowing hospital managers to model interventions (staff reassignment, backup analyzer activation, satellite diversion) and authorize recovery with human-in-the-loop governance.
- **Beds Capacity Matrix**: 120-bed interactive ward visualizer tracking occupancy, cleaning cycles, and discharge holds.
- **Staff Operations & Analytics**: Workforce directory, technician reassignment models, and Recharts performance dashboards.

#### 📱 Patient Mobile Application (`mobile/`)
- **Adaptive Arrival Windows**: Dynamic calculation of recommended check-in arrival targets based on current clinic queue load to prevent waiting room congestion.
- **Live Queue Position Tracker**: Real-time position tracking (`#3`), patients ahead (`2`), estimated wait (`14m`), and estimated consultation time.
- **Door-to-Door Journey Pathway**: 6-stage care milestone tracker (Registration → Consultation → Diagnostics → Review → Pharmacy → Complete) with dynamic delay and recovery synchronization.
- **Proactive Disruption Notifications**: Timely push-style notifications when hospital delays occur or interventions recover time.
- **Offline Hackathon Demo Switcher**: Instant scenario toggling between Baseline, Disruption, and Staff Recovery directly from the Profile screen.

#### 📐 Core Mathematical Engines
- Pure TypeScript calculation engines for queue wait-time estimation with active resource scaling and non-linear congestion multipliers.
- Adaptive arrival window targeting and multi-stage transit estimation.
- 4-horizon predictive forecasting (`NOW`, `+30m`, `+60m`, `+120m`).
