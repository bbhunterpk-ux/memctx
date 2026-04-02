#!/bin/bash
# ClaudeContext Startup Script
# This script starts the ClaudeContext worker service

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║              🧠 ClaudeContext - Starting Service 🧠              ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
WORKER_DIR="/home/max/All_Projects_Files/April 2026 Projects/Claude-Context/artifacts/claudectx-backup"
PORT="${CLAUDECTX_PORT:-8000}"
LOG_FILE="/tmp/claudectx.log"
PID_FILE="/tmp/claudectx.pid"

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  ClaudeContext is already running (PID: $OLD_PID)${NC}"
        echo -e "${BLUE}   Dashboard: http://localhost:$PORT${NC}"
        echo ""
        read -p "Do you want to restart it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Stopping existing process...${NC}"
            kill "$OLD_PID" 2>/dev/null || true
            sleep 2
        else
            echo -e "${GREEN}✅ Service already running${NC}"
            exit 0
        fi
    fi
fi

# Check if worker is built
if [ ! -f "$WORKER_DIR/dist/src/index.js" ]; then
    echo -e "${RED}❌ Worker not built. Building now...${NC}"
    cd "$WORKER_DIR"
    pnpm run build:worker
    echo -e "${GREEN}✅ Worker built successfully${NC}"
fi

# Check if dashboard is built
if [ ! -d "$WORKER_DIR/dashboard/dist" ]; then
    echo -e "${YELLOW}⚠️  Dashboard not built. Building now...${NC}"
    cd "$WORKER_DIR/dashboard"
    pnpm run build
    echo -e "${GREEN}✅ Dashboard built successfully${NC}"
fi

# Check environment
echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "   Port: ${GREEN}$PORT${NC}"
echo -e "   Database: ${GREEN}~/.claudectx/db.sqlite${NC}"
echo -e "   Hooks: ${GREEN}~/.claudectx/hooks/${NC}"

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo -e "   API Key: ${GREEN}✓ Set${NC}"
else
    echo -e "   API Key: ${YELLOW}⚠️  Not set (AI summaries disabled)${NC}"
    echo -e "   ${YELLOW}Set with: export ANTHROPIC_API_KEY=\"sk-ant-...\"${NC}"
fi
echo ""

# Start the worker
echo -e "${BLUE}🚀 Starting ClaudeContext worker...${NC}"
cd "$WORKER_DIR"

# Export 9router environment variables
export ANTHROPIC_BASE_URL="http://localhost:20128/v1"
export ANTHROPIC_AUTH_TOKEN="sk_9router"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="AWS"

# Start in background and save PID
PORT=$PORT node dist/src/index.js > "$LOG_FILE" 2>&1 &
WORKER_PID=$!
echo $WORKER_PID > "$PID_FILE"

# Wait for startup
echo -e "${BLUE}⏳ Waiting for service to start...${NC}"
sleep 3

# Check if it's running
if ps -p "$WORKER_PID" > /dev/null 2>&1; then
    # Test health endpoint
    if curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                                                                  ║${NC}"
        echo -e "${GREEN}║              ✅ ClaudeContext Started Successfully ✅              ║${NC}"
        echo -e "${GREEN}║                                                                  ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${BLUE}📊 Service Information:${NC}"
        echo -e "   PID: ${GREEN}$WORKER_PID${NC}"
        echo -e "   Port: ${GREEN}$PORT${NC}"
        echo -e "   Dashboard: ${GREEN}http://localhost:$PORT${NC}"
        echo -e "   API Health: ${GREEN}http://localhost:$PORT/api/health${NC}"
        echo -e "   Logs: ${GREEN}$LOG_FILE${NC}"
        echo ""
        echo -e "${BLUE}🎯 Next Steps:${NC}"
        echo -e "   1. Open dashboard: ${GREEN}http://localhost:$PORT${NC}"
        echo -e "   2. Start a new Claude Code session"
        echo -e "   3. Hooks will automatically capture your session"
        echo ""
        echo -e "${BLUE}📝 Useful Commands:${NC}"
        echo -e "   View logs: ${GREEN}tail -f $LOG_FILE${NC}"
        echo -e "   Stop service: ${GREEN}kill $WORKER_PID${NC}"
        echo -e "   Check status: ${GREEN}curl http://localhost:$PORT/api/health | jq${NC}"
        echo ""
    else
        echo -e "${RED}❌ Service started but not responding${NC}"
        echo -e "   Check logs: tail -f $LOG_FILE"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to start service${NC}"
    echo -e "   Check logs: tail -f $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
