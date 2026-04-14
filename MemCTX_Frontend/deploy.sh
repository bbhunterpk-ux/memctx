#!/bin/bash
set -e

echo "Building MemCTX Frontend..."
cd "$(dirname "$0")"
pnpm build

echo "Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name=memctx

echo "✅ Deployment complete!"
