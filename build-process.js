// Build Process for Phrase Replacement
// This script runs during build to select phrases and generate static HTML

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BuildTimePhraseSystem } from './static/build-time-phrases.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PhraseBuildProcess {
    constructor() {
        this.phraseSystem = new BuildTimePhraseSystem();
        this.buildSelections = this.phraseSystem.getBuildSelections();
        this.contentDir = path.join(__dirname, 'content');
        this.staticDir = path.join(__dirname, 'static');
    }

    // Load phrases from decap CMS content
    loadPhrasesFromCMS() {
        const phraseData = {};
        const phrasesDir = path.join(this.contentDir, 'phrases');

        if (fs.existsSync(phrasesDir)) {
            const files = fs.readdirSync(phrasesDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const filePath = path.join(phrasesDir, file);
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    Object.assign(phraseData, content);
                }
            });
        }

        return phraseData;
    }

    // Update phrase system with CMS data
    updatePhrasesFromCMS(cmsData) {
        Object.keys(cmsData).forEach(group => {
            if (Array.isArray(cmsData[group])) {
                // The CMS data has arrays like ["phrase1", "phrase2", "phrase3"]
                // The phrase system expects arrays directly
                this.phraseSystem.phraseGroups[group] = cmsData[group];
            }
        });
    }

    // Replace phrases in HTML content
    replacePhrasesInHTML(htmlContent) {
        let processedHTML = htmlContent;

        // Replace data-phrase attributes with selected phrases
        // This pattern matches elements with data-phrase attributes and captures their content
        processedHTML = processedHTML.replace(
            /<([a-zA-Z0-9]+)([^>]*data-phrase-group="([^"]+)"[^>]*data-phrase-key="([^"]+)"[^>]*)>([^<]*)<\/\1>/g,
            (match, tag, attributes, group, key, content) => {
                const phrase = this.phraseSystem.getPhrase(group, key, this.buildSelections);
                return `<${tag}${attributes} data-phrase-selected="${phrase}">${phrase}</${tag}>`;
            }
        );

        // Replace self-closing and void elements with data-phrase attributes
        processedHTML = processedHTML.replace(
            /<([a-zA-Z0-9]+)([^>]*data-phrase-group="([^"]+)"[^>]*data-phrase-key="([^"]+)"[^>]*?)\/>/g,
            (match, tag, attributes, group, key) => {
                const phrase = this.phraseSystem.getPhrase(group, key, this.buildSelections);
                return `<${tag}${attributes} data-phrase-selected="${phrase}">${phrase}</${tag}>`;
            }
        );

        // Replace title tags with page titles
        processedHTML = processedHTML.replace(
            /<title>[^<]*<\/title>/,
            `<title>${this.phraseSystem.getPhrase('pageTitle', 'main', this.buildSelections)}</title>`
        );

        return processedHTML;
    }

    // Process a single HTML file
    processHTMLFile(inputPath, outputPath) {
        const htmlContent = fs.readFileSync(inputPath, 'utf8');
        const processedHTML = this.replacePhrasesInHTML(htmlContent);

        fs.writeFileSync(outputPath, processedHTML);
        console.log(`✅ Processed: ${inputPath} -> ${outputPath}`);
    }

    // Process all HTML files in a directory
    processHTMLDirectory(inputDir, outputDir) {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const files = fs.readdirSync(inputDir);
        files.forEach(file => {
            if (file.endsWith('.html')) {
                const inputPath = path.join(inputDir, file);
                const outputPath = path.join(outputDir, file);
                this.processHTMLFile(inputPath, outputPath);
            }
        });
    }

    // Generate phrase selection data for client-side use
    generatePhraseData() {
        const phraseData = {
            selections: this.buildSelections,
            generatedAt: new Date().toISOString(),
            stats: this.phraseSystem.getStats()
        };

        const outputPath = path.join(this.staticDir, 'phrase-data.json');
        fs.writeFileSync(outputPath, JSON.stringify(phraseData, null, 2));
        console.log(`✅ Generated phrase data: ${outputPath}`);

        return phraseData;
    }

    // Generate build manifest
    generateBuildManifest() {
        const manifest = {
            buildTime: new Date().toISOString(),
            phraseStats: this.phraseSystem.getStats(),
            selections: {},
            files: []
        };

        // Add selection summary
        Object.keys(this.buildSelections).forEach(group => {
            manifest.selections[group] = {};
            Object.keys(this.buildSelections[group]).forEach(key => {
                const selection = this.buildSelections[group][key];
                manifest.selections[group][key] = {
                    selectedIndex: selection.selectedIndex,
                    selectedPhrase: selection.selectedPhrase,
                    totalPhrases: selection.totalPhrases
                };
            });
        });

        const outputPath = path.join(this.staticDir, 'build-manifest.json');
        fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
        console.log(`✅ Generated build manifest: ${outputPath}`);

        return manifest;
    }

    // Validate all phrases meet minimum requirements
    validatePhrases() {
        const validation = this.phraseSystem.validatePhraseGroups();

        if (!validation.isValid) {
            console.error('❌ Phrase validation errors:');
            validation.errors.forEach(error => console.error(`  - ${error}`));
            throw new Error('Phrase validation failed');
        } else {
            console.log('✅ All phrases validated successfully');
        }

        return validation;
    }

    // Main build process
    async build(options = {}) {
        console.log('🚀 Starting phrase build process...');

        const {
            inputDir = path.join(__dirname),
            outputDir = path.join(__dirname, 'dist'),
            loadFromCMS = true
        } = options;

        try {
            // Load phrases from CMS if enabled
            if (loadFromCMS) {
                const cmsData = this.loadPhrasesFromCMS();
                if (Object.keys(cmsData).length > 0) {
                    this.updatePhrasesFromCMS(cmsData);
                    console.log('✅ Loaded phrases from CMS');
                }
            }

            // Validate phrases
            this.validatePhrases();

            // Process HTML files
            this.processHTMLDirectory(inputDir, outputDir);

            // Generate phrase data
            this.generatePhraseData();

            // Generate build manifest
            this.generateBuildManifest();

            console.log('🎉 Phrase build process completed successfully!');
            console.log(`📊 Processed ${this.phraseSystem.getStats().totalPhrases} phrases across ${this.phraseSystem.getStats().totalGroups} groups`);

        } catch (error) {
            console.error('❌ Build process failed:', error);
            throw error;
        }
    }

    // Development mode - watch for phrase changes
    async watchMode(inputDir, outputDir) {
        console.log('👀 Starting watch mode...');

        const chokidar = require('chokidar');
        const watcher = chokidar.watch([
            path.join(this.contentDir, 'phrases', '*.json'),
            path.join(inputDir, '*.html')
        ]);

        watcher.on('change', async (filePath) => {
            console.log(`📝 File changed: ${filePath}`);
            await this.build({ inputDir, outputDir, loadFromCMS: true });
        });
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const command = args[0];

    const buildProcess = new PhraseBuildProcess();

    switch (command) {
        case 'build':
            buildProcess.build();
            break;
        case 'watch':
            const inputDir = args[1] || path.join(__dirname);
            const outputDir = args[2] || path.join(__dirname, 'dist');
            buildProcess.watchMode(inputDir, outputDir);
            break;
        case 'validate':
            buildProcess.validatePhrases();
            break;
        case 'stats':
            const stats = buildProcess.phraseSystem.getStats();
            console.log('📊 Phrase Statistics:');
            console.log(`  Total Phrases: ${stats.totalPhrases}`);
            console.log(`  Total Groups: ${stats.totalGroups}`);
            console.log(`  Total Keys: ${stats.totalKeys}`);
            console.log(`  Average Phrases per Key: ${stats.averagePhrasesPerKey.toFixed(2)}`);
            break;
        default:
            console.log('Usage:');
            console.log('  node build-process.js build');
            console.log('  node build-process.js watch [inputDir] [outputDir]');
            console.log('  node build-process.js validate');
            console.log('  node build-process.js stats');
    }
}

export default PhraseBuildProcess;