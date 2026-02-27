#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost}"

check() {
  local path="$1"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}${path}")"
  if [[ "$code" -ge 400 ]]; then
    echo "FAIL ${path} -> ${code}"
    exit 1
  fi
  echo "PASS ${path} -> ${code}"
}

check /health/live
check /health/ready
check /
check /gaming
check /defi
check /nft-marketplace
check /launchpad
check /governance

echo "Smoke checks passed for six routes + API health endpoints"
