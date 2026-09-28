# Contributing to FlowPulse AI

Thank you for your interest in contributing to FlowPulse AI! We welcome contributions from developers, researchers, and healthcare technology enthusiasts.

---

## 🛠 Development Setup

### 1. Prerequisites
- **Node.js**: v18+ or v20+ LTS
- **npm** / **pnpm** / **yarn**
- **Git**
- *(Optional for Mobile)*: Expo Go app or Android Studio / SDK for native builds

### 2. Clone & Install
```bash
# Clone the repository
git clone https://github.com/Muthudeenathayalan/flowpulse.git
cd flowpulse

# Web Application Setup
cd flowpulse_work
npm install
npm run dev

# Mobile Application Setup (in a separate terminal)
cd ../mobile
npm install
npx expo start
```

---

## 🌿 Branch Naming Conventions

Create feature branches using descriptive prefixes:
- `feature/<feature-name>` (e.g. `feature/bed-turnover-timer`)
- `fix/<bug-description>` (e.g. `fix/queue-wait-rounding`)
- `docs/<doc-update>` (e.g. `docs/architecture-mermaid-update`)
- `refactor/<module-name>` (e.g. `refactor/journey-engine`)

---

## 📝 Commit Message Guidelines (Conventional Commits)

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Prefix | Scope / Purpose | Example |
| :--- | :--- | :--- |
| `feat:` | A new user-facing feature | `feat(simulator): add specimen courier diversion option` |
| `fix:` | A bug fix | `fix(queue): correct arrival window rounding boundary` |
| `docs:` | Documentation changes only | `docs(readme): add system architecture diagram` |
| `refactor:` | Code restructuring without feature/bug change | `refactor(state): extract scenario selector pure functions` |
| `test:` | Adding or modifying tests | `test(engine): add unit tests for journey calculation` |
| `chore:` | Build scripts, dependencies, or repo maintenance | `chore(ci): add GitHub Actions workflow` |

---

## 🧪 Testing & Verification

Before submitting a Pull Request, verify that all typechecks and builds pass:

```bash
# 1. Typecheck & Build Web Application
cd flowpulse_work
npm run typecheck
npm run build

# 2. Typecheck Mobile Application
cd ../mobile
npm run typecheck
```

---

## 🚀 Pull Request Process

1. Fork the repository and create your branch from `main`.
2. Ensure your code passes all typechecks and builds with zero errors.
3. Write clean, readable code with descriptive comments where appropriate.
4. Open a Pull Request with a clear summary of changes, motivation, and verification steps.
5. Code reviews will be conducted by maintainers before merging into `main`.
