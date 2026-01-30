#!/bin/bash

# VoxType Deployment Script
# Creates a production-ready ZIP package for Chrome Web Store

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 VoxType Deployment Packager${NC}"
echo "================================"
echo ""

# Get version from manifest.json
VERSION=$(grep -o '"version": "[^"]*' manifest.json | cut -d'"' -f4)
PACKAGE_NAME="voxtype-v${VERSION}"

echo -e "${YELLOW}📦 Version: ${VERSION}${NC}"
echo ""

# Create temporary directory for clean build
TEMP_DIR="build_temp"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo -e "${BLUE}📋 Copying files...${NC}"

# Copy only necessary files
cp manifest.json "$TEMP_DIR/"
cp background.js "$TEMP_DIR/"
cp index.html "$TEMP_DIR/"
cp index.js "$TEMP_DIR/"
cp setup.html "$TEMP_DIR/"
cp setup.js "$TEMP_DIR/"
cp vox16.png "$TEMP_DIR/"
cp vox48.png "$TEMP_DIR/"
cp vox128.png "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"
cp LICENSE "$TEMP_DIR/"
cp PRIVACY.md "$TEMP_DIR/"

echo -e "${GREEN}✅ Files copied${NC}"
echo ""

# Create ZIP package
echo -e "${BLUE}🗜️  Creating ZIP package...${NC}"
cd "$TEMP_DIR"
zip -r "../${PACKAGE_NAME}.zip" . -q
cd ..

# Cleanup
rm -rf "$TEMP_DIR"

# Get file size
SIZE=$(du -h "${PACKAGE_NAME}.zip" | cut -f1)

echo -e "${GREEN}✅ Package created successfully!${NC}"
echo ""
echo "================================"
echo -e "📦 Package: ${GREEN}${PACKAGE_NAME}.zip${NC}"
echo -e "📊 Size: ${GREEN}${SIZE}${NC}"
echo -e "🎯 Version: ${GREEN}${VERSION}${NC}"
echo "================================"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the package by loading it as an unpacked extension"
echo "2. Upload to Chrome Web Store Developer Dashboard"
echo "3. Fill in store listing details"
echo "4. Submit for review"
echo ""
echo -e "${GREEN}🎉 Ready for deployment!${NC}"
