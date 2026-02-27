# Security Playbook

This project enforces runtime hardening and repeatable dependency checks for
production readiness.

## Runtime policies

- `helmet` is enabled globally for secure HTTP headers.
- API traffic is protected with `express-rate-limit` (defaults:
  `100 requests / 15 minutes / IP`).
- CORS uses an explicit allowlist from `CORS_ORIGINS` (comma-separated).
- Request body size is limited by `REQUEST_BODY_LIMIT` (default `100kb`).
- Contact submission logs redact sensitive fields (`password`, `token`,
  `secret`, `authorization`, `cookie`).

## Environment variables

- `CORS_ORIGINS`: Allowed origins, comma-separated.
  - Example: `https://app.apom.io,https://admin.apom.io`
- `RATE_LIMIT_WINDOW_MS`: Rate-limit window in milliseconds.
- `RATE_LIMIT_MAX`: Maximum requests per IP in each window.
- `REQUEST_BODY_LIMIT`: Express payload limit for `json` and `urlencoded`.

## Dependency audit process

Run dependency auditing before release and in regular maintenance:

```bash
npm run security:audit
```

Severity threshold is `high` and above. If findings appear:

1. Run `npm audit` for full advisory detail.
2. Apply safe updates (`npm audit fix`) and retest with quality gates.
3. If a fix is unavailable, document mitigation and compensating controls
   in release notes before deployment approval.
