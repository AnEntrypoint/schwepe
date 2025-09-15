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

const SCHWEPE_FOLDER = path.join(__dirname, '..', 'schwepe');
const DESCRIPTIONS_FILE = path.join(__dirname, '..', 'schwepe-descriptions.json');
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
    console.log(`🤖 Describing ${path.basename(imagePath)} with Claude...`);

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
        // Use Claude CLI to describe the image
        const command = `claude -p "${prompt}" "${imagePath}"`;
        const result = execSync(command, { encoding: 'utf8' });

        // Extract JSON from Claude's response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            console.log('🔄 Claude response:', result);
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

        throw new Error('Could not parse Claude response');
    } catch (error) {
        console.error('❌ Error describing image with Claude:', error.message);
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

    // Check if Claude CLI is available
    try {
        execSync('claude --version', { stdio: 'ignore' });
        console.log('\n🤖 Claude CLI detected, auto-describing images...');

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

    } catch (error) {
        console.log('\n❌ Claude CLI not available');
        console.log('💡 Install with: npm install -g @anthropics/claude-cli');
        console.log('💡 Or manually add descriptions to schwepe-descriptions.json');
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    scanSchwepeFolder,
    loadDescriptions,
    findMissingDescriptions,
    updateGalleryFiles
};