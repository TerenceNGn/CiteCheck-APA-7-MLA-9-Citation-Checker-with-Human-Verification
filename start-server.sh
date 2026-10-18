#!/usr/bin/env sh
# CiteCheck local server. Run ./start-server.sh then open http://localhost:8000
cd "$(dirname "$0")"
echo "Starting CiteCheck at http://localhost:8000 (press Ctrl+C to stop)"
python3 -m http.server 8000
