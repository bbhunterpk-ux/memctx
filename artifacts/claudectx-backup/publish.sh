#!/bin/bash

# ClaudeContext - Complete Publishing Workflow
# This script guides you through the entire publishing process

set -e

echo "🚀 ClaudeContext NPM Publishing Workflow"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Verify we're in the right place
echo -e "${BLUE}Step 1: Verifying location...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this from: artifacts/claudectx-backup/"
    exit 1
fi
echo -e "${GREEN}✅ Correct directory${NC}"
echo ""

# Step 2: Check package.json has been updated
echo -e "${BLUE}Step 2: Checking package.json...${NC}"
AUTHOR=$(node -p "require('./package.json').author")
REPO=$(node -p "require('./package.json').repository.url")

if [[ "$AUTHOR" == *"Your Name"* ]] || [[ "$AUTHOR" == *"ClaudeContext Contributors"* ]]; then
    echo -e "${YELLOW}⚠️  Warning: Author field needs updating${NC}"
    echo "Current: $AUTHOR"
    echo "Please update 'author' in package.json"
    echo ""
    read -p "Press Enter after updating, or Ctrl+C to exit..."
fi

if [[ "$REPO" == *"yourusername"* ]]; then
    echo -e "${YELLOW}⚠️  Warning: Repository URL needs updating${NC}"
    echo "Current: $REPO"
    echo "Please update 'repository.url' in package.json"
    echo ""
    read -p "Press Enter after updating, or Ctrl+C to exit..."
fi

echo -e "${GREEN}✅ Package metadata looks good${NC}"
echo ""

# Step 3: Clean and rebuild
echo -e "${BLUE}Step 3: Building package...${NC}"
read -p "Clean and rebuild? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleaning old builds..."
    rm -rf dist/ dashboard/dist/

    echo "Installing dependencies..."
    pnpm install

    echo "Building worker and dashboard..."
    pnpm run build

    echo -e "${GREEN}✅ Build complete${NC}"
else
    echo "Skipping build..."
fi
echo ""

# Step 4: Verify build output
echo -e "${BLUE}Step 4: Verifying build output...${NC}"
REQUIRED_FILES=(
    "dist/bin/claudectx.js"
    "dist/src/index.js"
    "dashboard/dist/index.html"
    "README.md"
    "LICENSE"
    ".npmignore"
)

ALL_GOOD=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file (missing)"
        ALL_GOOD=false
    fi
done

if [ "$ALL_GOOD" = false ]; then
    echo -e "${RED}❌ Some required files are missing${NC}"
    exit 1
fi
echo ""

# Step 5: Check NPM login
echo -e "${BLUE}Step 5: Checking NPM authentication...${NC}"
if npm whoami &> /dev/null; then
    NPM_USER=$(npm whoami)
    echo -e "${GREEN}✅ Logged in as: $NPM_USER${NC}"
else
    echo -e "${YELLOW}⚠️  Not logged in to NPM${NC}"
    echo "Please login now..."
    npm login
    NPM_USER=$(npm whoami)
    echo -e "${GREEN}✅ Logged in as: $NPM_USER${NC}"
fi
echo ""

# Step 6: Check package name availability
echo -e "${BLUE}Step 6: Checking package name...${NC}"
PKG_NAME=$(node -p "require('./package.json').name")
echo "Package name: $PKG_NAME"

if npm view "$PKG_NAME" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Package '$PKG_NAME' already exists on NPM${NC}"
    echo ""
    echo "Options:"
    echo "1. Use scoped package: @$NPM_USER/claudectx"
    echo "2. Choose different name (e.g., claudectx-memory)"
    echo "3. If you own it, proceed with version update"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting. Please update package name in package.json"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Package name is available${NC}"
fi
echo ""

# Step 7: Dry run
echo -e "${BLUE}Step 7: Running dry-run publish...${NC}"
echo "This shows what will be published (no actual upload)"
echo ""
npm publish --dry-run
echo ""

# Step 8: Final confirmation
echo -e "${BLUE}Step 8: Ready to publish!${NC}"
echo ""
echo "Package: $PKG_NAME"
echo "Version: $(node -p "require('./package.json').version")"
echo "Author: $AUTHOR"
echo ""
echo -e "${YELLOW}This will publish to NPM registry!${NC}"
read -p "Proceed with publish? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled. No changes made."
    exit 0
fi

# Step 9: Publish!
echo -e "${BLUE}Step 9: Publishing to NPM...${NC}"
if [[ "$PKG_NAME" == @* ]]; then
    # Scoped package
    npm publish --access public
else
    # Unscoped package
    npm publish
fi

echo ""
echo -e "${GREEN}🎉 Successfully published to NPM!${NC}"
echo ""
echo "Next steps:"
echo "1. Create git tag: git tag v$(node -p "require('./package.json').version")"
echo "2. Push tag: git push origin --tags"
echo "3. Create GitHub release"
echo "4. Test installation: npm install -g $PKG_NAME"
echo ""
echo "View on NPM: https://www.npmjs.com/package/$PKG_NAME"
echo ""
