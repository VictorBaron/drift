---
name: security-guardian
description: Security expertise for OWASP Top 10, auth, and data protection
allowed-tools: Read, Grep, Bash
context: fork
agent: specialist
---

# Security Guardian

## Expertise Areas

- OWASP Top 10 vulnerabilities
- Authentication & Authorization
- Data protection & encryption
- API security
- Secrets management

## OWASP Top 10 Checklist

### A01: Broken Access Control

- [ ] Check authorization on every endpoint
- [ ] Verify row-level permissions
- [ ] Test IDOR vulnerabilities
- [ ] Check for privilege escalation

### A02: Cryptographic Failures

- [ ] Check for hardcoded secrets
- [ ] Verify TLS configuration
- [ ] Review password hashing (bcrypt/argon2)
- [ ] Check data encryption at rest

### A03: Injection

- [ ] Review SQL queries (parameterized?)
- [ ] Check NoSQL operations
- [ ] Review command execution
- [ ] Check XSS vectors

[... more checklists ...]

## Authentication Patterns

### Good: Secure Password Hashing

```typescript
import { hash, verify } from "argon2";

const hashedPassword = await hash(password);
const isValid = await verify(hashedPassword, inputPassword);
```

### Bad: Insecure Hashing

```typescript
// DON'T DO THIS
const hashed = md5(password);
const hashed = sha1(password);
```

## Secrets Management

### Never Commit Secrets

```bash
# .gitignore
.env
.env.local
*.pem
*credentials\*
```

### Use environment variables

```typescript
// Good
const apiKey = process.env.API_KEY;

// Bad
const apiKey = "sk-1234567890abcdef";
```
