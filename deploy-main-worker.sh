#!/usr/bin/env bash
# Deploy the primary nameo-worker from the repo root.
set -euo pipefail

npx wrangler deploy
