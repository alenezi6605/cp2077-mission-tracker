#!/bin/sh
# CP2077 Mission Tracker — production start script
# Runs the app directly on Node.js (Docker bridge networking unavailable in this environment)

export PORT=3000
export NODE_ENV=production

cd "$(dirname "$0")"

echo "Starting CP2077 Mission Tracker on port $PORT..."
node src/server.js
