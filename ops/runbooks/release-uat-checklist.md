# Production UAT and Release Checklist (US-020)

## Purpose
- Provide a deterministic pre-launch checklist for APOM production releases.
- Prevent go-live when UAT blockers or release readiness gaps exist.

## Scope
- Routes: `/`, `/gaming`, `/defi`, `/nft-marketplace`, `/launchpad`, `/governance`
- Auth modes: guest, email/password session, wallet-linked session (connected linked wallet)
- Critical mutations:
  - `POST /api/gaming/games/:slug/play`
  - `POST /api/defi/pools/:poolId/liquidity`
  - `POST /api/nft-marketplace/assets/:assetId/buy`
  - `POST /api/nft-marketplace/assets/:assetId/list`
  - `POST /api/launchpad/projects/:projectId/contribute`
  - `POST /api/governance/proposals/:proposalId/vote`
  - `POST /api/governance/proposals/:proposalId/discuss`

## Go/No-Go Rule
- Go only when all required UAT rows and quality gates pass and release notes are approved.
- Any blocker (`Severity=Blocker`) immediately sets release state to `NO-GO` and triggers rollback readiness path.

## UAT Matrix
Use `PASS`, `FAIL`, `BLOCKED`, or `N/A` per row.

| ID | Route | Guest route load | Email session | Linked wallet connected | Critical mutation | Negative case guard | Status | Evidence |
|---|---|---|---|---|---|---|---|---|
| UAT-001 | `/` Home | Header/nav/footer render | Sign in succeeds | Wallet link/connect status visible | N/A | Invalid credentials rejected with safe error | PASS | `npm run test:e2e` (home login flow) |
| UAT-002 | `/gaming` | Route loads with login prompt for protected action | Session can access page data | Wallet required for play | Play action succeeds on live game | Upcoming game returns blocked state (`GAME_NOT_PLAYABLE`) | PASS | `tests/gaming-routes.test.js`, `npm run test:e2e` |
| UAT-003 | `/defi` | Route loads with gated CTAs | Session can access page data | Wallet required for intents | Add liquidity succeeds with valid amount | Unauth -> `401`, invalid amount -> `400`, paused pool -> `409` | PASS | `tests/defi-routes.test.js`, `npm run test:e2e` |
| UAT-004 | `/nft-marketplace` | Route loads and listed/sold states visible | Session can access page data | Wallet required to buy/list | Buy and list mutations succeed | Sold asset buy blocked (`ASSET_UNAVAILABLE`) | PASS | `tests/nft-marketplace-routes.test.js`, `npm run test:e2e` |
| UAT-005 | `/launchpad` | Route loads with project cards | Session can access details | Wallet required for contribution | Live project contribution succeeds | Upcoming/completed project contribution blocked (`PROJECT_CONTRIBUTION_BLOCKED`) | PASS | `tests/launchpad-routes.test.js`, `npm run test:e2e` |
| UAT-006 | `/governance` | Route loads, unauth vote prompt appears | Session can view active proposals | Wallet required for vote/discuss | Vote/discuss succeed on active proposal | Unauth vote/discuss -> `401`; ended proposal vote -> `409` | PASS | `tests/governance-routes.test.js`, `npm run test:e2e` |

## Release Checklist
Mark each line before go-live.

### Pre-Launch Readiness
- [ ] UAT matrix complete with no `FAIL`/`BLOCKED` rows.
- [ ] Global quality gates pass: `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`.
- [ ] Smoke UAT flow pass: `npm run test:e2e`.
- [ ] Release artifact report captured (command outputs + timestamps).
- [ ] Release notes reviewed and approved by release owner.

### Rollback Readiness (must be prepared before launch)
- [ ] Last known good git commit/tag recorded.
- [ ] Last known good image references recorded (if registry tags are used).
- [ ] Most recent backup artifact checksum recorded.
- [ ] Rollback operator and communication channel identified.

## Rollback Procedure
1. Set release state to `NO-GO` or `ROLLBACK` in incident/release channel.
2. Stop backend write traffic (`docker compose stop backend`).
3. Restore previous known-good state:
   - Re-deploy known-good revision via `./ops/deploy.sh` from prior commit/tag.
   - If DB state regression is required, restore backup per `ops/runbooks/backup-restore.md`.
4. Validate service recovery:
   - `GET /health/live` returns `200`.
   - `GET /health/ready` returns `200`.
   - `./ops/smoke-check.sh http://localhost` passes.
5. Confirm rollback completion and keep release as `NO-GO` until blocker is resolved.

## Post-Launch Monitoring Checkpoints
- T+5m: Health endpoints green (`/health/live`, `/health/ready`) and no startup errors.
- T+15m: Error rate and structured request logs stable (no repeated 5xx spikes).
- T+30m: Core route overview APIs return successful responses across six routes.
- T+60m: Verify at least one successful authenticated mutation in logs for each critical domain touched by release.
- T+24h: Review uptime monitor signal and incident-free window; close release.

## Signoff
- Release owner: ____________________
- Date/time (UTC): ____________________
- Decision: `GO` / `NO-GO`
- Approved release notes reference: ____________________
- If `NO-GO`, blocker ID(s) and rollback path executed: ____________________
