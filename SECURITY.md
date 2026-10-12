# Simply University - Security Policy

At Simply University, security, data integrity, and privacy are foundational. This policy defines our commitment to handling vulnerability reports safely, responsibly, and transparently.

---

## 1. Supported Versions

Security updates and patches are actively maintained for the following versions:

| Version | Status | Security Support |
| :--- | :--- | :--- |
| `1.x.x` (Current Main) | Supported | :white_check_mark: Active Security Patches |
| `< 1.0.0` | Deprecated | :x: End of Life |

---

## 2. Reporting a Vulnerability

If you identify a security vulnerability in the Simply University platform:

> **DO NOT disclose the vulnerability publicly (e.g., via GitHub Issues, public pull requests, or social media).**

### How to Report Privately:
1. **GitHub Security Advisory (Recommended):** Submit a confidential report via the **Security** tab -> **Advisories** -> **Report a vulnerability** on our GitHub repository.
2. **Security Contact:** Email our security team directly at:
   - **Email:** `security@simplyuniversity.edu` or repository maintainer contact.
   - Include `[SECURITY REPORT]` in the subject line.

### Information to Include in Your Report:
To help us triage and resolve the issue quickly, please provide:
- A descriptive summary of the potential vulnerability.
- Step-by-step reproduction instructions or Proof of Concept (PoC).
- Affected endpoints, parameters, or components.
- An assessment of the potential impact (e.g., Privilege Escalation, IDOR, SQL Injection, Data Exposure).

---

## 3. Vulnerability Response Timeline

We adhere to a coordinated disclosure process:

1. **Initial Acknowledgment:** Within **48 hours** of receiving the report.
2. **Triage & Reproduction:** Within **3 business days**, validating severity according to CVSS.
3. **Patch Development:** Within **7 business days** for Critical/High severity issues.
4. **Coordinated Disclosure:** Once the fix is merged and deployed, coordinated publication of security advisories will proceed with attribution given to the reporter.

---

## 4. Scope and Exclusions

### In Scope:
- Authentication & Session Management (JWT, tokens, password hashing).
- Access Control & Authorization (RBAC, IDOR, cross-tenant isolation).
- Data Privacy & Student Dossier Isolation.
- Payment Validation & Idempotency.
- Server-side File Upload Handling & Validation.
- SQL Injection, Remote Code Execution (RCE), SSRF.

### Out of Scope:
- Social engineering, phishing, or denial-of-service (DDoS) attacks against testing infrastructure.
- Vulnerabilities requiring physical access to an end user's unlocked device.
- Outdated third-party browser plugins or client-side self-XSS.

---

## 5. Security Measures Implemented

Simply University includes built-in defense-in-depth protections:
- **CSPRNG Cryptography:** All tokens, OTP codes, and IDs utilize cryptographically secure random number generators.
- **Strict Parameterized Queries:** Protection against SQL injection across all MySQL database interactions.
- **Layered Authorization:** Server-side verification of cohort assignment, ownership, and role on every data mutation.
- **Storage Isolation:** Separation of public static assets from private academic documents and payment receipts.
- **Production Hardening:** Enforcement of strict environment variables, rate limiting, and defensive HTTP security headers.
