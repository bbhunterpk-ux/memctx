#!/bin/bash
# ClaudeContext Kill Script
# This script stops all ClaudeContext worker processes

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║              🛑 ClaudeContext - Stopping Service 🛑              ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

PID_FILE="/tmp/claudectx.pid"

# Find all ClaudeContext processes
echo -e "${BLUE}🔍 Searching for ClaudeContext processes...${NC}"
EXISTING_PIDS=$(ps aux | grep "node dist/src/index.js" | grep -v grep | awk '{print $2}')

if [ -z "$EXISTING_PIDS" ]; then
    echo -e "${YELLOW}⚠️  No ClaudeContext processes found${NC}"
    rm -f "$PID_FILE"
    exit 0
fi

# Display found processes
echo -e "${YELLOW}Found processes:${NC}"
echo "$EXISTING_PIDS" | while read pid; do
    echo -e "   PID: ${RED}$pid${NC}"
done
echo ""

# Kill all processes
echo -e "${BLUE}🛑 Stopping all ClaudeContext processes...${NC}"
echo "$EXISTING_PIDS" | xargs kill 2>/dev/null || true
sleep 1

# Force kill if still running
REMAINING=$(ps aux | grep "node dist/src/index.js" | grep -v grep | awk '{print $2}')
if [ -n "$REMAINING" ]; then
    echo -e "${YELLOW}⚠️  Some processes still running, force killing...${NC}"
    echo "$REMAINING" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Clean up PID file
rm -f "$PID_FILE"

# Verify all stopped
STILL_RUNNING=$(ps aux | grep "node dist/src/index.js" | grep -v grep | awk '{print $2}')
if [ -z "$STILL_RUNNING" ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                  ║${NC}"
    echo -e "${GREEN}║              ✅ ClaudeContext Stopped Successfully ✅              ║${NC}"
    echo -e "${GREEN}║                                                                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
else
    echo -e "${RED}❌ Failed to stop some processes:${NC}"
    echo "$STILL_RUNNING"
    exit 1
fi
