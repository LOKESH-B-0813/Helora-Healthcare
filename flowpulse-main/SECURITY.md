# Security Policy

## 🔒 Healthcare Data & Privacy Notice

> [!IMPORTANT]
> **Synthetic Data & Non-PHI Compliance**:
> FlowPulse AI is designed exclusively for operational research, prototype modeling, and process optimization.
> - **Zero Protected Health Information (PHI)**: All patient records, physician names, identification tokens, and timestamps within this repository are 100% synthetic demonstration data.
> - **No Real Clinical Data**: Never commit real patient data, medical records, or identifiable health information to this repository.

---

## 🔑 Credential & Secret Protection

- **Public Client Keys Only**: Only public anonymous keys (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) subject to Row-Level Security (RLS) should be referenced in client environments.
- **Never Commit Service Role Keys**: Never commit `SUPABASE_SERVICE_ROLE_KEY`, database administrator passwords, private encryption certificates, or secret API credentials.
- Use `.env.example` templates for documenting required configuration variables.

---

## 🛡️ Reporting a Vulnerability

If you discover a potential security vulnerability within FlowPulse AI, please report it responsibly:

1. **Do not create public GitHub issues** for suspected security vulnerabilities or credential disclosures.
2. Report the vulnerability privately via **GitHub Security Advisories** on the repository:
   - Navigate to the repository's **Security** tab.
   - Click **Report a vulnerability** to submit a private advisory.
3. Provide detailed steps to reproduce the issue, along with any relevant proof-of-concept logs.
4. Maintainers will review the submission, investigate the issue, and release a fix in a timely manner.
