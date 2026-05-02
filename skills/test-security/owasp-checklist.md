# OWASP Top 10 Security Checklist

## Quick Reference — All 10 Categories

### A01: Broken Access Control
```
[ ] Every route/endpoint checks authentication
[ ] Every route checks authorization (role/ownership)
[ ] No IDOR — user can't access other users' data by changing IDs
[ ] Admin-only endpoints not reachable by regular users
[ ] CORS policy is restrictive (not *)
[ ] No path traversal (../../etc/passwd)
[ ] Directory listing disabled
```

### A02: Cryptographic Failures
```
[ ] Passwords hashed with bcrypt/argon2 (never MD5/SHA1/plain)
[ ] TLS enforced everywhere (no HTTP fallback)
[ ] Sensitive data not stored in localStorage / URL params / logs
[ ] No hardcoded secrets in code (grep: password=, secret=, apikey=)
[ ] Encryption keys managed via env vars / secrets manager
[ ] JWT uses RS256 or HS256 with strong secret (not "secret")
```

### A03: Injection
```
[ ] All DB queries parameterized (no string concatenation)
[ ] ORM used with safe query methods
[ ] Shell commands never include user input
[ ] LDAP/XML/NoSQL queries sanitized
[ ] Input validated before processing
```

**Code patterns to grep for:**
```bash
# SQL injection risks
grep -rn "query.*\${" --include="*.ts" --include="*.js"
grep -rn "execute.*\`" --include="*.ts" --include="*.js"

# Command injection risks  
grep -rn "exec\|spawn\|shell" --include="*.ts" --include="*.js"
```

### A04: Insecure Design
```
[ ] Business logic limits enforced server-side (not just UI)
[ ] Rate limiting on auth endpoints
[ ] Account lockout after N failed attempts
[ ] Password reset tokens expire (< 1 hour)
[ ] Sensitive operations require re-authentication
```

### A05: Security Misconfiguration
```
[ ] Debug mode disabled in production
[ ] Default credentials changed
[ ] Error messages don't leak stack traces to users
[ ] Security headers set (CSP, HSTS, X-Frame-Options)
[ ] Unnecessary features/routes disabled
[ ] Dependency versions up-to-date (no known CVEs)
```

**Security headers to verify:**
```
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

### A06: Vulnerable and Outdated Components
```
[ ] npm audit / pip-audit / cargo audit run (0 high/critical)
[ ] Dependencies pinned (not just ^version)
[ ] No packages with known CVEs in use
[ ] Docker base image scanned (trivy)
```

**Free scanning commands:**
```bash
npm audit --audit-level=high
pip-audit
trivy fs .
```

### A07: Identification and Authentication Failures
```
[ ] Session tokens are random and long (≥ 128 bits)
[ ] Sessions invalidated on logout
[ ] Old sessions invalidated on password change
[ ] MFA available for sensitive operations
[ ] Brute force protection on login
[ ] Credential stuffing protection (IP rate limit)
```

### A08: Software and Data Integrity Failures
```
[ ] Dependencies verified (lockfile committed)
[ ] CI/CD pipeline has integrity checks
[ ] Auto-update mechanisms verify signatures
[ ] Deserialization of user input avoided
[ ] Subresource Integrity (SRI) on CDN assets
```

### A09: Security Logging and Monitoring Failures
```
[ ] Auth events logged (success + failure)
[ ] Admin actions logged with user context
[ ] Failed access attempts logged
[ ] Logs stored securely (tamper-evident)
[ ] Alerts exist for unusual patterns
[ ] Sensitive data NOT in logs (passwords, tokens, PII)
```

### A10: Server-Side Request Forgery (SSRF)
```
[ ] URLs from user input not fetched directly
[ ] If fetch needed: allowlist of domains
[ ] Internal metadata endpoints blocked (169.254.169.254)
[ ] DNS rebinding protection
[ ] Response not returned verbatim to user
```

---

## Free Static Analysis Tools

| Tool | Language | Install | Command | What it catches |
|------|----------|---------|---------|-----------------|
| semgrep | Any | `brew install semgrep` | `semgrep --config=auto .` | Injection, insecure patterns |
| bandit | Python | `pip install bandit` | `bandit -r .` | Python security issues |
| eslint-plugin-security | JS/TS | `npm i -D eslint-plugin-security` | `npx eslint .` | JS security antipatterns |
| trivy | Containers | `brew install trivy` | `trivy fs .` | CVEs, misconfigs |
| trufflehog | Any | `brew install trufflehog` | `trufflehog filesystem .` | Leaked secrets |
| gitleaks | Any | `brew install gitleaks` | `gitleaks detect` | Git history secrets |

## Secrets Grep Patterns

```bash
# Patterns that indicate hardcoded secrets
grep -rn "password\s*=\s*['\"][^'\"]" --include="*.ts" --include="*.js" --include="*.py"
grep -rn "secret\s*=\s*['\"]" --include="*.ts" --include="*.js"  
grep -rn "api_key\s*=\s*['\"]" --include="*.py"
grep -rn "BEGIN.*PRIVATE KEY" -r .
grep -rn "AKIA[0-9A-Z]{16}" -r .  # AWS keys
```

## Severity Classification

| Severity | Definition | Action |
|----------|-----------|--------|
| Critical | Direct exploit, data breach possible | Block PR, fix immediately |
| High | Likely exploit with low complexity | Fix before merge |
| Medium | Exploit possible with conditions | Fix in current sprint |
| Low | Defense in depth issue | Schedule fix |
| Info | Best practice deviation | Document decision |

## Output: SECURITY_SCAN.md Template

```markdown
# Security Scan Results — [date]

## Summary
- Critical: X | High: X | Medium: X | Low: X

## Findings

### [SEVERITY] [Category] — [Title]
- **File**: path/to/file.ts:42
- **Description**: What the issue is
- **Impact**: What an attacker could do
- **Fix**: Specific remediation steps
- **Status**: Open / Fixed / Accepted risk

## Tools Run
- [ ] semgrep auto
- [ ] trufflehog filesystem
- [ ] npm audit
- [ ] trivy fs

## Sign-off
Reviewed by: [name] on [date]
```
