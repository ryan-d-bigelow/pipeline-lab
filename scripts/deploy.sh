#!/bin/bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="$HOME/.nvm/versions/node/v24.14.0/bin"

echo "Building frontend..."
cd "$REPO_DIR/frontend"
PATH="$NODE_BIN:$PATH" npm install
PATH="$NODE_BIN:$PATH" npm run build

echo "Installing launchd services..."
cp "$REPO_DIR/launchd/ai.navi.pipeline-lab-backend.plist" ~/Library/LaunchAgents/
cp "$REPO_DIR/launchd/ai.navi.pipeline-lab-frontend.plist" ~/Library/LaunchAgents/

# Update OPENAI_API_KEY from environment if set
if [ -n "${OPENAI_API_KEY:-}" ]; then
  python3 -c "
import plistlib, os
p = os.path.expanduser('~/Library/LaunchAgents/ai.navi.pipeline-lab-backend.plist')
with open(p, 'rb') as f:
  d = plistlib.load(f)
d['EnvironmentVariables']['OPENAI_API_KEY'] = os.environ['OPENAI_API_KEY']
with open(p, 'wb') as f:
  plistlib.dump(d, f)
print('Updated OPENAI_API_KEY in plist')
"
fi

launchctl unload ~/Library/LaunchAgents/ai.navi.pipeline-lab-backend.plist 2>/dev/null || true
launchctl unload ~/Library/LaunchAgents/ai.navi.pipeline-lab-frontend.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/ai.navi.pipeline-lab-backend.plist
launchctl load ~/Library/LaunchAgents/ai.navi.pipeline-lab-frontend.plist

echo "Done. Backend: http://localhost:8001, Frontend: http://localhost:3001"
