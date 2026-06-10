#!/usr/bin/env bash
# Deploy the secondary search orchestrator worker from the repo root.
set -euo pipefail

cd backend/search-worker
npx wrangler deploy
