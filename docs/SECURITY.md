# 🔒 Security & Privacy Whitepaper

**Classification:** Public Security Document  
**Version:** 1.0.0  

---

## 1. Security Principles

LibroVerse follows an **Assumed-Breach, Zero-Trust, Defense-in-Depth** security philosophy:

```mermaid
graph TD
    subgraph Layer1 ["1. Gateway & Perimeter"]
        IPRate["Configurable Multi-Tier Rate Limiting"]
        CORSOrigin["Strict CORS Whitelisting"]
    end

    subgraph Layer2 ["2. Input & Validation"]
        ZodSchema["Strict Zod Schema Gates"]
        MagicBytes["Binary Magic-Byte Inspection"]
    end

    subgraph Layer3 ["3. Authentication & Access"]
        JWTAuth["Signed JWT Verification"]
        RBACGate["Role-Based Access Control (Admin vs User)"]
        BanEnforce["Active Account Suspension Enforcement"]
    end

    subgraph Layer4 ["4. Execution & Storage"]
        NoDisk["Zero-Disk In-Memory Buffer Piping"]
        SafeErrors["Stack Trace Shielding & Sanitized Responses"]
    end

    Layer1 --> Layer2
    Layer2 --> Layer3
    Layer3 --> Layer4
```

---

## 2. Authentication & Credential Security

- **Password Storage:** Encrypted using industry-standard `bcrypt` hashing with salt rounds. Raw plaintext passwords are never logged, cached, or transmitted in responses.
- **Session Tokens:** Stateless, cryptographic `JSON Web Tokens (JWT)` signed with secret keys stored exclusively in server environment variables.
- **Account Suspension Enforcement:** The authentication gateway checks `isBanned` state before token issuance and upon active protected endpoint access.

---

## 3. Upload & File Execution Defense

```mermaid
flowchart TD
    UploadReq["Incoming File Upload"] --> MimeCheck["MIME-Type Whitelist Check"]
    MimeCheck -->|Invalid| RejectMime["Reject 400 (Invalid Mime)"]
    MimeCheck -->|Valid| MagicCheck["Binary Magic-Byte Inspection"]
    MagicCheck -->|Header Mismatch| RejectMagic["Reject 400 (Corrupted/Fake File)"]
    MagicCheck -->|Verified| SizeCheck["Size Threshold Gate (3MB Image, 10MB PDF)"]
    SizeCheck -->|Oversized| RejectSize["Reject 400 (File Exceeds Quota)"]
    SizeCheck -->|Compliant| MemPipe["Pipe Buffer to Isolated Cloud Storage"]
    MemPipe --> Result["Return Cloud Asset URL"]
```

- **Isolated Storage:** Files are streamed directly to isolated CDN storage. No files are stored inside the web application root or server operating system, preventing Remote Code Execution (RCE) attacks.
- **True Content Verification:** Verifies file signatures:
  - **JPEG:** `0xFF 0xD8 0xFF`
  - **PNG:** `0x89 0x50 0x4E 0x47`
  - **WEBP:** `RIFF...WEBP`
  - **PDF:** `%PDF` (`0x25 0x50 0x44 0x46`)

---

## 4. Error Sanitization & Data Protection

- **Production Error Masking:** Uncaught server errors (`500`) are mapped to clean, sanitized messages without exposing database names, collection schemas, or operating system file paths.
- **Zero Hardcoded Secrets:** All credentials, tokens, and database URIs are loaded strictly via `process.env`.
