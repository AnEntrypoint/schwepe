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

function describeImageWithClaude(imagePath) {
    console.log(`🤖 Describing ${path.basename(imagePath)} with Z.AI vision...`);

    const prompt = `Look at this Schwepe (pink frog) image and create a title and description in the style of a crypto/trading meme.

The title should be "[Emotion/Style] Schwepe" (e.g., "Cozy Schwepe", "Golden Schwepe").

The description should be 1-2 sentences relating the frog's expression/appearance to crypto trading emotions, market conditions, or degen culture. Use phrases like "when you", "ready to", "diamond hands", "hodl", "pump", "dip", "moon", "charts", "trading", "vibes", etc.

Examples:
- "Late night chart watching with comfort drinks and hopium"
- "When your portfolio finally turns golden and you're feeling majestic"
- "Ready to defend the community against rugs and paper hands"

Respond in this exact JSON format:
{
  "title": "[Emotion] Schwepe",
  "description": "Your trading-themed description here"
}`;

    try {
        // Convert image to base64 for Z.AI API
        const imageBase64 = fs.readFileSync(imagePath, 'base64');
        const imageExt = path.extname(imagePath).toLowerCase().substring(1);
        const imageDataUrl = `data:image/${imageExt};base64,${imageBase64}`;

        // Get API key from environment
        const apiKey = process.env.ZAI_API_KEY;
        if (!apiKey) {
            throw new Error('ZAI_API_KEY environment variable not set');
        }

        // Prepare API request
        const requestData = {
            model: "glm-4.5v",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: {
                                url: imageDataUrl
                            }
                        },
                        {
                            type: "text",
                            text: prompt
                        }
                    ]
                }
            ],
            thinking: {
                type: "enabled"
            }
        };

        // Make API request
        const response = await new Promise((resolve, reject) => {
            const postData = JSON.stringify(requestData);
            const options = {
                hostname: 'api.z.ai',
                port: 443,
                path: '/api/paas/v4/chat/completions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept-Language': 'en-US,en',
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        // Extract content from response
        const result = response.choices[0].message.content;

        // Extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            console.log('🔄 Z.AI response:', result);
            // Fallback: manual parsing if JSON isn't perfectly formatted
            const titleMatch = result.match(/title['":\s]*([^'"]+)/i);
            const descMatch = result.match(/description['":\s]*([^'"]+)/i);

            if (titleMatch && descMatch) {
                return {
                    title: titleMatch[1].trim(),
                    description: descMatch[1].trim()
                };
            }
        }

        throw new Error('Could not parse Z.AI response');
    } catch (error) {
        console.error('❌ Error describing image with Z.AI:', error.message);
        console.log('📝 Please describe this image manually');

        // Return a placeholder that needs manual editing
        const baseName = path.basename(imagePath, path.extname(imagePath));
        return {
            title: `${baseName} Schwepe`,
            description: "MANUAL_DESCRIPTION_NEEDED - Please update this description",
            needsManualEdit: true
        };
    }
}

function updateGalleryFiles(descriptions) {
    console.log('🔄 Updating gallery files...');

    // Generate gallery HTML from descriptions
    const schwepeCards = Object.entries(descriptions)
        .filter(([filename, data]) => !data.featured) // Skip featured image
        .map(([filename, data]) => {
            const specialClass = data.special ? ' special-card' : '';
            return `            <div class="schwepe-card${specialClass}">
                <img src="schwepe/${filename}" alt="${data.title}" class="schwepe-image">
                <h3 class="schwepe-title">${data.title}</h3>
                <p class="schwepe-description">${data.description}</p>
            </div>`;
        }).join('\n\n');

    // Update gallery.html
    try {
        let galleryContent = fs.readFileSync(GALLERY_FILE, 'utf8');

        // Replace the gallery section
        const galleryStart = galleryContent.indexOf('<!-- Featured Official Schwepe -->');
        const galleryEnd = galleryContent.indexOf('        </div>\n    </div>\n\n    <script>');

        if (galleryStart !== -1 && galleryEnd !== -1) {
            const beforeGallery = galleryContent.substring(0, galleryStart);
            const afterGallery = galleryContent.substring(galleryEnd);

            const newGalleryContent = `<!-- Generated from schwepe-descriptions.json -->
            <!-- Featured Official Schwepe -->
            <div class="schwepe-card special-card">
                <img src="schwepe/schwepe.gif" alt="Official Schwepe Logo" class="schwepe-image">
                <h3 class="schwepe-title">Official $SCHWEPE</h3>
                <p class="schwepe-description">The official branding and identity of our beloved token</p>
            </div>

${schwepeCards}`;

            const newFileContent = beforeGallery + newGalleryContent + '\n' + afterGallery;
            fs.writeFileSync(GALLERY_FILE, newFileContent, 'utf8');
            console.log('✅ Gallery.html updated');
        }
    } catch (error) {
        console.error('❌ Error updating gallery.html:', error.message);
    }

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

    // Check if Z.AI API key is available
    const apiKey = process.env.ZAI_API_KEY;
    if (apiKey) {
        console.log('\n🤖 Z.AI API key detected, auto-describing images...');

        let hasChanges = false;
        for (const filename of missing) {
            const imagePath = path.join(SCHWEPE_FOLDER, filename);
            const result = describeImageWithClaude(imagePath);

            descriptions[filename] = {
                title: result.title,
                description: result.description,
                special: true // Mark new images as special
            };

            if (result.needsManualEdit) {
                console.log(`⚠️  ${filename} needs manual editing`);
            }

            hasChanges = true;
        }

        if (hasChanges) {
            saveDescriptions(descriptions);
            updateGalleryFiles(descriptions);
            console.log('\n🎉 Auto-description complete!');
        }

    } else {
        console.log('\n❌ Z.AI API key not available');
        console.log('💡 Set ZAI_API_KEY environment variable');
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