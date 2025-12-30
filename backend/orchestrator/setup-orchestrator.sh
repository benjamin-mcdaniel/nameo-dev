#!/usr/bin/env bash
set -euo pipefail

# Simple setup script to run on a fresh Ubuntu VM (e.g. DigitalOcean)
# to install the nameo orchestrator service.
#
# Usage (on the VM):
#   curl -O https://raw.githubusercontent.com/<your-user>/<your-repo>/backend/orchestrator/setup-orchestrator.sh
#   chmod +x setup-orchestrator.sh
#   ./setup-orchestrator.sh
#
# This assumes:
# - You have SSH access and git access to the repo.
# - You will later point a DNS name (e.g. orchestrator.nameo.dev) at this VM.

REPO_URL="https://github.com/benjamin-mcdaniel/nameo-dev.git"
APP_DIR="/opt/nameo-orchestrator"
SERVICE_NAME="nameo-orchestrator"
PYTHON_BIN="python3"

if ! command -v $PYTHON_BIN >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y python3 python3-venv python3-pip git
else
  sudo apt-get update
  sudo apt-get install -y python3-venv python3-pip git
fi

sudo mkdir -p "$APP_DIR"
sudo chown "$(whoami)" "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  git pull --ff-only
fi

cd "$APP_DIR/backend/orchestrator"

$PYTHON_BIN -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
# Minimal dependencies for a FastAPI/uvicorn-style orchestrator stub;
# you can extend this later as the orchestrator grows.
pip install fastapi uvicorn

deactivate

# Create a simple systemd service so the orchestrator stays running.
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

sudo bash -c "cat > $SERVICE_FILE" <<EOF
[Unit]
Description=nameo orchestrator service
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR/backend/orchestrator
ExecStart=$APP_DIR/backend/orchestrator/.venv/bin/uvicorn orchestrator_app:app --host 0.0.0.0 --port 8081
Restart=always
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

echo "Orchestrator service installed. It should now be listening on port 8081."
echo "Next steps:"
echo " - Point a DNS record (e.g. orchestrator.nameo.dev) at this VM's IP."
echo " - Later, configure the Cloudflare Worker to call this host for complex searches."
