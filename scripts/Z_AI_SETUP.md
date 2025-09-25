# Schwepe Description Manager with Z.AI Vision

This script has been updated to use Z.AI's vision API instead of Claude CLI for image description generation.

## Setup

1. **Get your Z.AI API key** from your Z.AI account dashboard

2. **Set your API key** as an environment variable:
   ```bash
   export ZAI_API_KEY=your_api_key_here
   ```

## Usage

### Using environment variable (recommended):
```bash
export ZAI_API_KEY=your_api_key_here
npm run update-schwepes
```

### Using the npm script (replace `your_api_key_here`):
```bash
npm run update-schwepes-zai
```

### Or directly:
```bash
ZAI_API_KEY=your_api_key_here node scripts/update-schwepe-descriptions.cjs
```

## Features

- ✅ Same original prompts and functionality
- ✅ Uses Z.AI GLM-4.5v model for vision
- ✅ Supports all image formats (JPG, PNG, GIF)
- ✅ Maintains all existing features (gallery updates, corner men management)
- ✅ Fallback to manual description if API fails

## API Details

- **Model**: GLM-4.5v
- **Endpoint**: https://api.z.ai/api/paas/v4/chat/completions
- **Features**: Vision capabilities with thinking mode enabled

## Original Functionality Preserved

All original features remain the same:
- Scans schwepe/ folder for images
- Updates schwepe-descriptions.json
- Generates gallery.html with new descriptions
- Updates index.html with total count
- Corner men management
- Manual fallback support