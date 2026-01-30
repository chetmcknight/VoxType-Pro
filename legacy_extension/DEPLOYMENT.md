# VoxType Deployment Guide

This guide covers all deployment options for the VoxType Chrome extension.

---

## 📦 Pre-Deployment Checklist

Before deploying, ensure you have:

- ✅ All icon files (icon16.png, icon48.png, icon128.png)
- ✅ Updated manifest.json with correct version number
- ✅ Tested the extension locally
- ✅ Verified all permissions work correctly
- ✅ Checked for console errors
- ✅ Privacy policy and license files included

---

## 🚀 Deployment Options

### Option 1: Chrome Web Store (Recommended for Public Release)

#### Requirements

1. **Google Developer Account**
   - Cost: $5 one-time registration fee
   - Register at: https://chrome.google.com/webstore/devconsole

2. **Required Assets**
   - Extension icons (✅ Already included)
   - Screenshots (1280x800 or 640x400)
   - Promotional images (optional but recommended)
   - Privacy policy (✅ PRIVACY.md included)

#### Step-by-Step Process

1. **Create a ZIP Package**
   ```bash
   # From the VTT-chet directory
   zip -r voxtype-v1.0.0.zip . -x "*.git*" -x "node_modules/*" -x "*.DS_Store" -x "package.json" -x "gemini.md"
   ```

2. **Prepare Store Listing**
   - **Name**: VoxType - Global Voice to Text
   - **Summary**: Premium voice-to-text transcription with global keyboard shortcuts
   - **Description**: (Use the README.md content, formatted for the store)
   - **Category**: Productivity
   - **Language**: English

3. **Upload to Chrome Web Store**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Click "New Item"
   - Upload your ZIP file
   - Fill in the store listing details
   - Upload screenshots and promotional images
   - Set pricing (Free recommended)
   - Submit for review

4. **Review Process**
   - Typically takes 1-3 business days
   - You'll receive an email when approved or if changes are needed

#### Store Listing Tips

- **Screenshots**: Capture the extension in action
  - Main UI with microphone button
  - Recording in progress
  - Transcribed text example
  - Setup page

- **Promotional Text**: Highlight key features
  - Global keyboard shortcuts
  - Auto-copy to clipboard
  - Privacy-first (no data collection)
  - Beautiful UI

---

### Option 2: GitHub Release (For Open Source Distribution)

1. **Initialize Git Repository**
   ```bash
   cd /Users/chetmcknight/Documents/Apps/Google/AntiGravity/VTT-chet
   git init
   git add .
   git commit -m "Initial release v1.0.0"
   ```

2. **Create GitHub Repository**
   - Go to https://github.com/new
   - Name: `voxtype-extension`
   - Description: "Premium voice-to-text Chrome extension with global shortcuts"
   - Public or Private (your choice)

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/voxtype-extension.git
   git branch -M main
   git push -u origin main
   ```

4. **Create a Release**
   - Go to your repository → Releases → "Create a new release"
   - Tag: `v1.0.0`
   - Title: `VoxType v1.0.0 - Initial Release`
   - Description: Copy from README.md changelog
   - Attach the ZIP file created earlier
   - Publish release

---

### Option 3: Direct Distribution (Enterprise/Private)

For internal use or private distribution:

1. **Create Distribution Package**
   ```bash
   # Create a clean ZIP without development files
   zip -r voxtype-v1.0.0.zip \
     manifest.json \
     background.js \
     index.html \
     setup.html \
     icon16.png \
     icon48.png \
     icon128.png \
     README.md \
     LICENSE \
     PRIVACY.md
   ```

2. **Distribution Methods**
   - Email the ZIP file to users
   - Host on internal server
   - Share via cloud storage (Google Drive, Dropbox, etc.)

3. **Installation Instructions for Users**
   - Download and extract the ZIP file
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extracted folder

---

## 🔄 Updating the Extension

### For Chrome Web Store

1. **Update Version Number**
   - Edit `manifest.json`: Change `"version": "1.0.0"` to `"1.0.1"` (or appropriate version)

2. **Create New ZIP**
   ```bash
   zip -r voxtype-v1.0.1.zip . -x "*.git*" -x "node_modules/*" -x "*.DS_Store"
   ```

3. **Upload Update**
   - Go to Chrome Web Store Developer Dashboard
   - Select your extension
   - Click "Upload Updated Package"
   - Upload new ZIP
   - Update changelog
   - Submit for review

### For GitHub

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "Update to v1.0.1: [describe changes]"
   git push
   ```

2. **Create New Release**
   - Tag: `v1.0.1`
   - Include changelog
   - Attach new ZIP file

---

## 📸 Creating Screenshots for Store Listing

Use the browser's screenshot tool or these commands:

```bash
# Open the extension in Chrome
# Press Cmd+Shift+5 (Mac) or use Chrome DevTools

# Recommended screenshots:
# 1. Main interface (idle state)
# 2. Recording in progress (red pulsing button)
# 3. Transcribed text example
# 4. Setup page
```

**Screenshot Specifications:**
- Size: 1280x800 or 640x400
- Format: PNG or JPEG
- Maximum 5 screenshots
- Show actual functionality

---

## 🧪 Testing Before Deployment

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Icon appears in toolbar
- [ ] Side panel opens correctly
- [ ] Microphone permission prompt works
- [ ] Voice transcription functions properly
- [ ] Auto-copy to clipboard works
- [ ] Keyboard shortcut triggers recording
- [ ] Global shortcut works outside Chrome
- [ ] Setup page functions correctly
- [ ] No console errors
- [ ] Works on fresh Chrome profile

### Browser Compatibility

- ✅ Chrome (v114+)
- ✅ Edge (Chromium-based)
- ❌ Firefox (uses different extension API)
- ❌ Safari (uses different extension API)

---

## 📊 Post-Deployment Monitoring

### Chrome Web Store Dashboard

Monitor these metrics:
- Weekly users
- Install/uninstall rate
- User reviews and ratings
- Crash reports

### User Feedback

- Respond to reviews promptly
- Address bug reports
- Consider feature requests
- Update documentation based on common questions

---

## 🐛 Common Deployment Issues

### Issue: "Manifest file is invalid"
**Solution**: Validate JSON syntax at https://jsonlint.com

### Issue: "Icons not displaying"
**Solution**: Ensure icon files are in root directory and paths in manifest.json are correct

### Issue: "Permission warnings during install"
**Solution**: Review permissions in manifest.json - only request what's necessary

### Issue: "Extension rejected by Chrome Web Store"
**Solution**: Review rejection reason, common issues:
- Privacy policy missing or inadequate
- Permissions not justified
- Misleading description
- Icon quality issues

---

## 📝 Version Numbering

Follow Semantic Versioning (SemVer):

- **Major (1.x.x)**: Breaking changes
- **Minor (x.1.x)**: New features, backwards compatible
- **Patch (x.x.1)**: Bug fixes, backwards compatible

Examples:
- `1.0.0` → Initial release
- `1.0.1` → Bug fix
- `1.1.0` → New feature (e.g., language support)
- `2.0.0` → Major redesign or breaking change

---

## 🎯 Quick Deploy Command

For quick packaging (excludes unnecessary files):

```bash
#!/bin/bash
# Save as deploy.sh and run: chmod +x deploy.sh && ./deploy.sh

VERSION="1.0.0"
NAME="voxtype-v${VERSION}"

# Create clean build
zip -r "${NAME}.zip" \
  manifest.json \
  background.js \
  index.html \
  setup.html \
  icon*.png \
  README.md \
  LICENSE \
  PRIVACY.md

echo "✅ Package created: ${NAME}.zip"
echo "📦 Ready for deployment!"
```

---

## 🎉 Deployment Complete!

After successful deployment:

1. ✅ Test the live version
2. ✅ Share with users
3. ✅ Monitor feedback
4. ✅ Plan next version

---

**Need Help?** Check the [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
