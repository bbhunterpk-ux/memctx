#!/bin/bash

# ClaudeContext - Quick Publishing Checklist

echo "📦 ClaudeContext NPM Package Publishing Checklist"
echo "=================================================="
echo ""

# 1. Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this from artifacts/claudectx-backup/"
    exit 1
fi

echo "✅ Found package.json"

# 2. Check required files
REQUIRED_FILES=("README.md" "LICENSE" ".npmignore" "dist/bin/claudectx.js" "dist/src/index.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found $file"
    else
        echo "❌ Missing $file"
        exit 1
    fi
done

# 3. Check package.json fields
echo ""
echo "📋 Package Information:"
echo "----------------------"
NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")
DESCRIPTION=$(node -p "require('./package.json').description")
echo "Name: $NAME"
echo "Version: $VERSION"
echo "Description: $DESCRIPTION"

# 4. Check if logged in to npm
echo ""
echo "🔐 NPM Authentication:"
if npm whoami &> /dev/null; then
    NPM_USER=$(npm whoami)
    echo "✅ Logged in as: $NPM_USER"
else
    echo "❌ Not logged in to NPM"
    echo "   Run: npm login"
    exit 1
fi

# 5. Check if package name is available
echo ""
echo "🔍 Checking package name availability..."
if npm view "$NAME" &> /dev/null; then
    echo "⚠️  Package '$NAME' already exists on NPM"
    echo "   You can:"
    echo "   1. Use a scoped package: @$NPM_USER/$NAME"
    echo "   2. Choose a different name"
    echo "   3. If you own it, proceed with version update"
else
    echo "✅ Package name '$NAME' is available"
fi

# 6. Dry run
echo ""
echo "🧪 Running dry-run publish..."
npm publish --dry-run

echo ""
echo "=================================================="
echo "📦 Pre-publish Checklist Complete!"
echo ""
echo "Next steps:"
echo "1. Review the dry-run output above"
echo "2. Update version if needed: npm version patch|minor|major"
echo "3. Publish: npm publish"
echo "4. For scoped package: npm publish --access public"
echo ""
