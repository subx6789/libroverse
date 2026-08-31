# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions of LibroVerse:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

We take the security of **LibroVerse** and our user data seriously. If you discover a security vulnerability, please follow the guidelines below:

### 1. How to Report
- **Do not report security vulnerabilities through public GitHub issues.**
- Please privately disclose security issues by creating a **GitHub Security Advisory** on this repository, or by contacting the project maintainer directly via email: `subhajits956@gmail.com`.

### 2. What to Include in Your Report
To help us triage and resolve the issue quickly, please provide:
- A clear description of the vulnerability.
- Step-by-step instructions or proof-of-concept (PoC) code to reproduce the issue.
- Potential impact of the vulnerability.
- Any suggested fixes or remediations, if available.

### 3. Response & Resolution Timeline
- **Initial Response:** Within 48 hours of report receipt.
- **Triage & Assessment:** Within 5 business days.
- **Remediation & Patch:** Security patches will be prioritized and deployed promptly.
- **Disclosure:** We follow coordinated disclosure principles, allowing time for patches to be applied before public disclosure.

---

## Security Practices
- 100% of incoming payloads are validated through strict Zod schemas.
- File uploads are validated via binary magic-byte inspection and streamed into memory with zero disk persistence.
- Multi-tier rate limiting protects authentication, public endpoints, and user actions.
