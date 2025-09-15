# Schwepe Automation Scripts

## Overview

This directory contains automation scripts for managing the Schwepe image collection and descriptions.

## Files

- `update-schwepe-descriptions.js` - Main automation script
- `README.md` - This documentation

## How It Works

### 1. Data-Driven Approach

All Schwepe images and their descriptions are stored in `schwepe-descriptions.json`:

```json
{
  "image-filename.jpg": {
    "title": "Emotion Schwepe",
    "description": "Trading-themed description with degen energy",
    "special": true,
    "featured": false
  }
}
```

### 2. Automation Script

The script (`update-schwepe-descriptions.js`) does the following:

1. **Scans** the `schwepe/` folder for all image files
2. **Compares** against existing descriptions in `schwepe-descriptions.json`
3. **Identifies** missing descriptions
4. **Auto-describes** new images using Claude CLI (if available)
5. **Updates** gallery.html and index.html with new content
6. **Saves** updated descriptions back to JSON file

## Usage

### Quick Commands

```bash
# Scan for new images and auto-describe them
npm run update-schwepes

# Just scan and report (no changes)
npm run scan-schwepes
```

### Manual Usage

```bash
# Run the script directly
node scripts/update-schwepe-descriptions.js

# Check what images are missing descriptions
node scripts/update-schwepe-descriptions.js --scan-only
```

## Requirements

### For Auto-Description

Install Claude CLI:
```bash
npm install -g @anthropics/claude-cli
```

Configure with your API key:
```bash
claude auth login
```

### Manual Mode

If Claude CLI is not available, the script will:
- Show you which images need descriptions
- Create placeholder entries that you can manually edit
- Still update the gallery files from existing descriptions

## Workflow

### When New Images Are Added

1. Copy new images to `schwepe/` folder
2. Run: `npm run update-schwepes`
3. Review the auto-generated descriptions
4. Edit `schwepe-descriptions.json` if needed
5. Run: `npm run build`
6. Commit and push changes

### Manual Description Editing

Edit `schwepe-descriptions.json` directly:

```json
{
  "new-image.jpg": {
    "title": "Epic Schwepe",
    "description": "When your diamond hands finally pay off and you're ready for Valhalla",
    "special": true
  }
}
```

Then run:
```bash
npm run update-schwepes  # Updates gallery files
npm run build           # Builds the site
```

## File Generation

The script automatically updates:

### gallery.html
- Generates all schwepe-card divs from JSON data
- Applies special-card class for new images
- Maintains proper HTML structure

### index.html
- Updates the stat counter with total count
- Keeps the featured image separate

## Description Style Guide

### Titles
Format: `"[Emotion/State] Schwepe"`

Examples:
- Cozy Schwepe
- Golden Schwepe
- Battle Schwepe
- Psychedelic Schwepe

### Descriptions
- 1-2 sentences max
- Relate to crypto/trading emotions
- Use degen terminology
- Include words like: hodl, diamond hands, pump, moon, charts, vibes, etc.

Examples:
- "Late night chart watching with comfort drinks and hopium"
- "Ready to defend the community against rugs and paper hands"
- "When you've stared at the charts too long and reality starts glitching"

## Benefits

✅ **Scalable**: Easy to add hundreds of new images
✅ **Consistent**: All descriptions follow the same format
✅ **Automated**: Claude CLI integration for auto-descriptions
✅ **Data-driven**: Single source of truth in JSON file
✅ **Fast**: No need to manually update HTML files
✅ **Version controlled**: JSON file tracks all changes

## Future Enhancements

- Add rarity/tier system
- Generate dynamic statistics
- Create themed collections
- Add search/filter functionality
- Batch processing for large uploads