---
name: test-security
description: "Security test workflow — checks existing security test structure, creates if missing, augments if exists. Covers OWASP Top 10, dependency vulnerabilities, secrets scanning, and auth testing."
---

# Helix — Security Test

ตรวจช่องโหว่ความปลอดภัยครอบคลุม OWASP Top 10 และ dependency risks

## Step 1: Repo Structure Check

```bash
# หา security test folder
find . -type d \( -name "security" -o -name "sec" -o -name "pentest" \) \
  | grep -v node_modules | grep -v .git

# ตรวจ security tools ที่มีอยู่
cat package.json 2>/dev/null | grep -E "snyk|audit|semgrep|trivy|bandit|brakeman"
which semgrep bandit trivy snyk 2>/dev/null

# ตรวจ .gitignore ไม่ให้ security reports หลุด
cat .gitignore 2>/dev/null | grep -i "security\|report\|scan"
```

### กรณี A: ยังไม่มี security test

**Free tools แนะนำ:**

| Tool | ตรวจอะไร | ติดตั้ง | Cost |
|------|---------|--------|------|
| `npm audit` / `pip audit` | dependency CVEs | built-in | Free |
| `semgrep` | SAST — code vulnerabilities | `brew install semgrep` | Free |
| `bandit` | Python security issues | `pip install bandit` | Free |
| `trivy` | container + dependency scan | `brew install trivy` | Free |
| `truffleHog` | secrets in git history | `brew install trufflehog` | Free |
| `brakeman` | Rails security | `gem install brakeman` | Free |

สร้าง structure:
```
tests/security/
├── scans/           ← output จาก tools (.gitignored)
├── manual/          ← manual test cases + results
└── SECURITY_SCAN.md ← สรุปผล scan (commit ได้)
```

เพิ่ม `.gitignore` entries:
```
tests/security/scans/
*.sarif
security-report*.json
```

### กรณี B: มี security test แล้ว

- อ่าน SECURITY_SCAN.md หรือ scan results ที่มีอยู่
- ตรวจว่า features ใหม่มี attack surface ที่ยังไม่ได้ cover
- เพิ่ม test cases + re-run scans

### External Skill Check

- `security-guidance @ claude-plugins-official` ⭐⭐⭐ — general security guidance
- `agentic-actions-auditor @ trailofbits` ⭐⭐ — deep security audit
- `insecure-defaults @ trailofbits` ⭐⭐ — ตรวจ insecure defaults
- `entry-point-analyzer @ trailofbits` ⭐⭐ — วิเคราะห์ attack surface

ถ้ายังไม่ได้ติดตั้ง → แนะนำ + ถาม user ก่อนเสมอ

## Step 2: Test Case Planning

ครอบคลุม OWASP Top 10 ที่เกี่ยวข้อง:

| # | Category | ตรวจอะไรสำหรับ feature นี้ |
|---|----------|------------------------|
| A01 | Broken Access Control | unauthorized access paths |
| A02 | Cryptographic Failures | sensitive data exposure |
| A03 | Injection | SQL, command, LDAP injection |
| A04 | Insecure Design | missing threat modeling |
| A05 | Security Misconfiguration | default creds, open ports |
| A06 | Vulnerable Components | outdated dependencies |
| A07 | Auth Failures | brute force, session issues |
| A08 | Integrity Failures | unsigned updates, deserialization |
| A09 | Logging Failures | missing audit logs |
| A10 | SSRF | unvalidated redirects/fetches |

```
| ID | OWASP | Test Case | Method | Expected | Severity |
|----|-------|-----------|--------|----------|---------|
```

## Step 3: Run Scans

```bash
# Dependency vulnerabilities
npm audit --audit-level=moderate
pip audit

# SAST (static analysis)
semgrep --config=auto src/

# Secrets scan
trufflehog git file://. --only-verified

# Container (ถ้ามี Docker)
trivy image <image-name>

# Python
bandit -r src/ -ll
```

รายงานทุก 10 นาที — แยก severity: Critical, High, Medium, Low

## Step 4: Fix Protocol

| Severity | Action |
|----------|--------|
| Critical | แก้ทันที ห้าม merge จนกว่าจะแก้ |
| High | แก้ใน PR นี้ แจ้ง user ก่อน |
| Medium | แจ้ง user — แก้เลยหรือเปิด issue? |
| Low | เปิด issue ไว้ทีหลัง |

## Done

สร้าง `tests/security/SECURITY_SCAN.md` สรุปผล scan ทั้งหมด + issues ที่แก้แล้ว  
แจ้ง user และถามว่าต้องการต่อ `/helix:deploy` ไหม
