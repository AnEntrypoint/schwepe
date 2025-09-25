#!/usr/bin/env node

/**
 * Schwepe Description Manager
 *
 * This script:
 * 1. Scans the schwepe/ folder for image files
 * 2. Compares against schwepe-descriptions.json
 * 3. Identifies missing descriptions
 * 4. Can integrate with Claude CLI to auto-describe missing images
 * 5. Updates the gallery files with new descriptions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { execFileSync } = require('child_process');
const https = require('https');
const http = require('http');

const SCHWEPE_FOLDER = path.join(__dirname, '..', 'schwepe');
const CORNERMEN_FOLDER = path.join(__dirname, '..', 'cornermen');
const DESCRIPTIONS_FILE = path.join(__dirname, '..', 'schwepe-descriptions.json');
const CORNERMEN_CONFIG_FILE = path.join(__dirname, '..', 'cornermen-config.json');
const GALLERY_FILE = path.join(__dirname, '..', 'gallery.html');
const INDEX_FILE = path.join(__dirname, '..', 'index.html');

// Supported image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];

function scanSchwepeFolder() {
    if (!fs.existsSync(SCHWEPE_FOLDER)) {
        console.error('❌ Schwepe folder not found:', SCHWEPE_FOLDER);
        process.exit(1);
    }

    const files = fs.readdirSync(SCHWEPE_FOLDER);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
    });

    console.log(`📁 Found ${imageFiles.length} images in schwepe folder`);
    return imageFiles;
}

function loadDescriptions() {
    if (!fs.existsSync(DESCRIPTIONS_FILE)) {
        console.log('📄 Creating new descriptions file...');
        return {};
    }

    try {
        const content = fs.readFileSync(DESCRIPTIONS_FILE, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('❌ Error reading descriptions file:', error.message);
        return {};
    }
}

function saveDescriptions(descriptions) {
    try {
        const content = JSON.stringify(descriptions, null, 2);
        fs.writeFileSync(DESCRIPTIONS_FILE, content, 'utf8');
        console.log('✅ Descriptions file updated');
    } catch (error) {
        console.error('❌ Error saving descriptions file:', error.message);
    }
}

function findMissingDescriptions(imageFiles, descriptions) {
    const missing = imageFiles.filter(file => !descriptions[file]);
    return missing;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function describeImageWithClaude(imagePath, retryCount = 0) {
    console.log(`🤖 Describing ${path.basename(imagePath)} with Gemini vision...`);

    const prompt = `Look at this Schwepe (pink frog) image and create a title and description in the style of a crypto/trading meme.

The title should be a creative name that either:
1. Starts with "sch" (like Schmoon, Schdiamond, Schvibes, Schcharts, Schdegen)
2. Rhymes with "Schwepe" (like Schepey, Schweepy, Schmeep, Schleepy, Scheep)

The description should be 1-2 sentences relating the frog's expression/appearance to crypto trading emotions, market conditions, or degen culture. Use phrases like "when you", "ready to", "diamond hands", "hodl", "pump", "dip", "moon", "charts", "trading", "vibes", etc.

Examples:
- "Late night chart watching with comfort drinks and hopium"
- "When your portfolio finally turns golden and you're feeling majestic"
- "Ready to defend the community against rugs and paper hands"

Respond in this exact JSON format:
{
  "title": "[Creative Sch-name or rhyme]",
  "description": "Your trading-themed description here"
}`;

    return new Promise((resolve) => {
        const attemptRequest = () => {
            try {
                // Get API key from environment
                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) {
                    throw new Error('GEMINI_API_KEY environment variable not set');
                }

                // Read image file and convert to base64
                const imageData = fs.readFileSync(imagePath);
                const imageBase64 = imageData.toString('base64');

                // Determine MIME type
                const mime = require('mime-types');
                const mimeType = mime.lookup(imagePath) || 'image/jpeg';

                // Prepare API request
                const requestData = {
                    contents: [{
                        parts: [
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageBase64
                                }
                            },
                            {
                                text: prompt
                            }
                        ]
                    }]
                };

                // Make API request using https
                const postData = JSON.stringify(requestData);
                const options = {
                    hostname: 'generativelanguage.googleapis.com',
                    port: 443,
                    path: '/v1beta/models/gemini-2.0-flash:generateContent',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-goog-api-key': apiKey,
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            if (res.statusCode === 200) {
                                const response = JSON.parse(data);
                                const text = response.candidates[0].content.parts[0].text;

                                // Extract JSON from response
                                const jsonMatch = text.match(/\{[\s\S]*\}/);
                                if (jsonMatch) {
                                    resolve(JSON.parse(jsonMatch[0]));
                                } else {
                                    console.log('🔄 Gemini response:', text);
                                    // Fallback: manual parsing if JSON isn't perfectly formatted
                                    const titleMatch = text.match(/title['":\s]*([^'"]+)/i);
                                    const descMatch = text.match(/description['":\s]*([^'"]+)/i);

                                    if (titleMatch && descMatch) {
                                        resolve({
                                            title: titleMatch[1].trim(),
                                            description: descMatch[1].trim()
                                        });
                                    } else {
                                        throw new Error('Could not parse Gemini response');
                                    }
                                }
                            } else if (res.statusCode === 429) {
                                // Rate limit hit - implement exponential backoff
                                const errorData = JSON.parse(data);
                                const retryDelay = errorData.error?.details?.[0]?.retryDelay;

                                let delayMs = 60000; // Default 1 minute
                                if (retryDelay) {
                                    // Parse retry delay (e.g., "7.312821429s" -> 7312ms)
                                    const delaySeconds = parseFloat(retryDelay.replace('s', ''));
                                    delayMs = Math.max(delaySeconds * 1000, 1000);
                                } else {
                                    // Exponential backoff: 2^retryCount * 60 seconds, max 5 minutes
                                    delayMs = Math.min(Math.pow(2, retryCount) * 60000, 300000);
                                }

                                console.log(`⏰ Rate limit hit, retrying in ${Math.round(delayMs / 1000)}s (attempt ${retryCount + 1})`);

                                sleep(delayMs).then(() => {
                                    describeImageWithClaude(imagePath, retryCount + 1).then(resolve);
                                });
                            } else {
                                throw new Error(`HTTP ${res.statusCode}: ${data}`);
                            }
                        } catch (error) {
                            console.error('❌ Error processing Gemini response:', error.message);
                            console.log('📝 Please describe this image manually');

                            // Return a placeholder that needs manual editing
                            const baseName = path.basename(imagePath, path.extname(imagePath));
                            resolve({
                                title: `${baseName} Schwepe`,
                                description: "MANUAL_DESCRIPTION_NEEDED - Please update this description",
                                needsManualEdit: true
                            });
                        }
                    });
                });

                req.on('error', (error) => {
                    console.error('❌ Error calling Gemini API:', error.message);
                    console.log('📝 Please describe this image manually');

                    // Return a placeholder that needs manual editing
                    const baseName = path.basename(imagePath, path.extname(imagePath));
                    resolve({
                        title: `${baseName} Schwepe`,
                        description: "MANUAL_DESCRIPTION_NEEDED - Please update this description",
                        needsManualEdit: true
                    });
                });

                req.write(postData);
                req.end();

            } catch (error) {
                console.error('❌ Error preparing image for Gemini:', error.message);
                console.log('📝 Please describe this image manually');

                // Return a placeholder that needs manual editing
                const baseName = path.basename(imagePath, path.extname(imagePath));
                resolve({
                    title: `${baseName} Schwepe`,
                    description: "MANUAL_DESCRIPTION_NEEDED - Please update this description",
                    needsManualEdit: true
                });
            }
        };

        attemptRequest();
    });
}

function updateGalleryFiles(descriptions) {
    console.log('🔄 Updating gallery files...');

    // Update count in index.html
    const totalCount = Object.keys(descriptions).length;
    try {
        let indexContent = fs.readFileSync(INDEX_FILE, 'utf8');
        indexContent = indexContent.replace(
            /<div class="stat-number">\d+<\/div>\s*<div class="stat-label">Unique Schwepes<\/div>/,
            `<div class="stat-number">${totalCount}</div>\n                <div class="stat-label">Unique Schwepes</div>`
        );
        fs.writeFileSync(INDEX_FILE, indexContent, 'utf8');
        console.log(`✅ Index.html updated with count: ${totalCount}`);
    } catch (error) {
        console.error('❌ Error updating index.html:', error.message);
    }

    // Note: Gallery.html now loads dynamically from JSON, so no need to update the HTML content
    console.log('✅ Gallery will load dynamically from schwepe-descriptions.json');
}

function main() {
    console.log('🚀 Schwepe Description Manager');
    console.log('================================');

    const imageFiles = scanSchwepeFolder();
    const descriptions = loadDescriptions();
    const missing = findMissingDescriptions(imageFiles, descriptions);

    console.log(`📊 Current descriptions: ${Object.keys(descriptions).length}`);
    console.log(`🔍 Missing descriptions: ${missing.length}`);

    if (missing.length === 0) {
        console.log('✅ All images have descriptions!');
        updateGalleryFiles(descriptions);
        return;
    }

    console.log('\n📝 Missing descriptions for:');
    missing.forEach(file => console.log(`   - ${file}`));

    // Check if Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
        console.log('\n🤖 Gemini API key detected, auto-describing images...');

        let hasChanges = true;

        // Process images sequentially with rate limiting
        (async function processImages() {
            const RATE_LIMIT_PER_MINUTE = 10; // Gemini 2.5 Flash free tier limit
            const PROCESSING_INTERVAL_MS = 60000 / RATE_LIMIT_PER_MINUTE; // 6 seconds between requests

            console.log(`📊 Processing ${missing.length} images at ${RATE_LIMIT_PER_MINUTE} requests/minute`);
            console.log(`⏱️  Expected completion time: ${Math.ceil(missing.length / RATE_LIMIT_PER_MINUTE)} minutes`);

            for (let i = 0; i < missing.length; i++) {
                const filename = missing[i];
                const imagePath = path.join(SCHWEPE_FOLDER, filename);

                // Add delay between requests to stay under rate limit (except for first request)
                if (i > 0) {
                    console.log(`⏳ Waiting ${PROCESSING_INTERVAL_MS/1000}s to respect rate limits...`);
                    await sleep(PROCESSING_INTERVAL_MS);
                }

                console.log(`📝 Processing image ${i + 1}/${missing.length}: ${filename}`);

                try {
                    const result = await describeImageWithClaude(imagePath);

                    descriptions[filename] = {
                        title: result.title,
                        description: result.description,
                        special: true // Mark new images as special
                    };

                    if (result.needsManualEdit) {
                        console.log(`⚠️  ${filename} needs manual editing`);
                    } else {
                        console.log(`✅ Successfully processed ${filename}`);
                    }
                } catch (error) {
                    console.error(`❌ Error processing ${filename}:`, error.message);
                    const baseName = path.basename(imagePath, path.extname(imagePath));
                    descriptions[filename] = {
                        title: `${baseName} Schwepe`,
                        description: "MANUAL_DESCRIPTION_NEEDED - Please update this description",
                        needsManualEdit: true
                    };
                }
            }

            // Save after all images are processed
            saveDescriptions(descriptions);
            updateGalleryFiles(descriptions);
            console.log('\n🎉 Auto-description complete!');
        })();

        // Processing is handled asynchronously above

    } else {
        console.log('\n❌ Gemini API key not available');
        console.log('💡 Set GEMINI_API_KEY environment variable');
        console.log('💡 Or manually add descriptions to schwepe-descriptions.json');
    }
}

// Corner Men Management Functions
function scanCornerRadiusFolder() {
    if (!fs.existsSync(CORNERMEN_FOLDER)) {
        console.log('📁 Cornermen folder not found');
        return [];
    }

    const files = fs.readdirSync(CORNERMEN_FOLDER);
    const cornerMenFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.png', '.jpg', '.jpeg'].includes(ext) && file.startsWith('schwepe-corner-');
    });

    console.log(`📁 Found ${cornerMenFiles.length} corner men images`);
    return cornerMenFiles;
}

function loadCornerRadiusConfig() {
    if (!fs.existsSync(CORNERMEN_CONFIG_FILE)) {
        console.log('📄 Creating new cornermen config file...');
        return createDefaultCornerRadiusConfig();
    }

    try {
        const content = fs.readFileSync(CORNERMEN_CONFIG_FILE, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('❌ Error reading cornermen config:', error.message);
        return createDefaultCornerRadiusConfig();
    }
}

function createDefaultCornerRadiusConfig() {
    const defaultConfig = {
        cornermen: {
            version: "1.0",
            created: new Date().toISOString().split('T')[0],
            description: "Schwepe corner men with transparent backgrounds",
            images: []
        },
        display: {
            position: "bottom-left",
            size: "120x120px",
            rotation_interval: 30000,
            animation: "smooth-scale",
            z_index: 1000
        },
        processing: {
            tool: "ImageMagick",
            background_removal: "transparent",
            resizing: "120x120px centered",
            format: "PNG"
        }
    };

    saveCornerRadiusConfig(defaultConfig);
    return defaultConfig;
}

function saveCornerRadiusConfig(config) {
    try {
        fs.writeFileSync(CORNERMEN_CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log('💾 Cornermen config saved');
    } catch (error) {
        console.error('❌ Error saving cornermen config:', error.message);
    }
}

function updateCornerRadiusImages() {
    console.log('🔄 Updating corner men images...');

    const cornerMenFiles = scanCornerRadiusFolder();
    const config = loadCornerRadiusConfig();

    // Update config with current images
    config.cornermen.images = cornerMenFiles.map(filename => ({
        filename: filename,
        title: filename.replace('schwepe-corner-', '').replace('.png', '').replace('.jpg', '').replace('.jpeg', ''),
        size: "120x120px",
        last_updated: new Date().toISOString().split('T')[0]
    }));

    config.cornermen.total_images = cornerMenFiles.length;
    config.cornermen.last_updated = new Date().toISOString().split('T')[0];

    saveCornerRadiusConfig(config);
    console.log(`✅ Updated ${cornerMenFiles.length} corner men in config`);
}

function validateCornerRadiusAssets() {
    console.log('🔍 Validating corner men assets...');

    const cornerMenFiles = scanCornerRadiusFolder();
    const config = loadCornerRadiusConfig();

    const configImages = config.cornermen.images.map(img => img.filename);
    const missingInConfig = cornerMenFiles.filter(file => !configImages.includes(file));
    const missingInFolder = configImages.filter(file => !cornerMenFiles.includes(file));

    if (missingInConfig.length > 0) {
        console.log(`⚠️  ${missingInConfig.length} images missing from config`);
        updateCornerRadiusImages();
    }

    if (missingInFolder.length > 0) {
        console.log(`⚠️  ${missingInFolder.length} config images missing from folder`);
    }

    console.log(`✅ Corner men validation complete: ${cornerMenFiles.length} assets found`);
    return { cornerMenFiles, config, missingInConfig, missingInFolder };
}

if (require.main === module) {
    main();
}

module.exports = {
    scanSchwepeFolder,
    loadDescriptions,
    findMissingDescriptions,
    updateGalleryFiles,
    scanCornerRadiusFolder,
    loadCornerRadiusConfig,
    updateCornerRadiusImages,
    validateCornerRadiusAssets
};