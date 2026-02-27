# VPS Deployment Runbook

## Prerequisites
- Docker Engine with Compose v2
- DNS pointing your domain to the VPS
- Firewall allowing inbound TCP 80/443 as needed

## First-time setup
1. Clone repository and install env file:
   ```bash
   cp .env.compose.example .env.compose
   ```
2. Set production secrets and origins in `.env.compose`.
3. Build and deploy:
   ```bash
   ./ops/deploy.sh
   ```
4. Validate routes and health:
   ```bash
   ./ops/smoke-check.sh http://localhost
   ```

## Ongoing deployment
- Run `./ops/deploy.sh` for every release.
- The script runs `backend-migrate` before replacing app containers.
- If migration fails, deployment exits and currently serving containers continue running.

## Observability and uptime checks
- API health endpoints:
  - `GET /health/live`
  - `GET /health/ready`
- Request logs are emitted in structured JSON (`event=http_request`).
- Optional uptime ping webhook is controlled by `UPTIME_PING_URL` and `UPTIME_PING_INTERVAL_MS`.

## Rollback guidance
1. Keep current stack serving while diagnosing migration failure.
2. Revert to a known-good image tag (if using a registry) or previous git revision.
3. Re-run `./ops/deploy.sh` once migration gate passes.
