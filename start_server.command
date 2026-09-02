#!/bin/bash
cd "$(dirname "$0")"

# Stop old server on port 5173 if running
OLD_PID=$(lsof -ti :5173)
if [ -n "$OLD_PID" ]; then
    kill -9 $OLD_PID 2>/dev/null
    sleep 1
fi

echo "========================================="
echo "  MVP DESIGN Dev Server starting"
echo "========================================="
echo ""
echo "URL: http://localhost:5173"
echo ""
echo "Stop: Ctrl + C in this window"
echo ""

open "http://localhost:5173"

npm run dev

if [ $? -ne 0 ]; then
    echo ""
    echo "Error starting server. Press any key..."
    read -n 1
fi