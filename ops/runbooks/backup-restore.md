# Backup and Restore Runbook (SQLite on Docker volume)

## Why this exists
- Production uses `DATABASE_URL=file:/var/lib/apom-db/production.db` mounted from the `db-data` Docker volume.
- This runbook ensures consistent backups and fast restore without ad-hoc container edits.

## Backup
1. Confirm services are healthy:
   ```bash
   docker compose ps
   ```
2. Create timestamped backup directory:
   ```bash
   mkdir -p backups
   ts="$(date +%Y%m%d-%H%M%S)"
   ```
3. Copy and compress database file from the shared volume:
   ```bash
   docker compose exec -T db sh -c "cat /var/lib/apom-db/production.db" > "backups/apom-${ts}.db"
   gzip "backups/apom-${ts}.db"
   ```
4. Verify checksum for integrity tracking:
   ```bash
   shasum -a 256 "backups/apom-${ts}.db.gz"
   ```

## Restore
1. Stop write traffic to avoid partial state during restore:
   ```bash
   docker compose stop backend
   ```
2. Restore selected backup:
   ```bash
   gunzip -c backups/apom-YYYYMMDD-HHMMSS.db.gz | docker compose exec -T db sh -c "cat > /var/lib/apom-db/production.db"
   ```
3. Run migrations to align schema:
   ```bash
   docker compose --profile deploy run --rm backend-migrate
   ```
4. Start services and validate health/routes:
   ```bash
   docker compose up -d backend frontend reverse-proxy
   ./ops/smoke-check.sh http://localhost
   ```

## Failure handling
- If restore or migration fails, keep `reverse-proxy` and `frontend` running with prior backend instance and retry from the previous backup artifact.
