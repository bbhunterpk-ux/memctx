#!/bin/bash
# ClaudeContext Stop Script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PID_FILE="/tmp/claudectx.pid"

if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}⚠️  No PID file found. Service may not be running.${NC}"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${YELLOW}Stopping ClaudeContext (PID: $PID)...${NC}"
    kill "$PID"
    sleep 2

    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${RED}Process still running, forcing...${NC}"
        kill -9 "$PID"
    fi

    rm -f "$PID_FILE"
    echo -e "${GREEN}✅ ClaudeContext stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Process not running (PID: $PID)${NC}"
    rm -f "$PID_FILE"
fi
