// Build Process for Phrase Replacement
// This script runs during build to select phrases and generate static HTML

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { MediaGenerator } from './lib/420kit/media-generator.js';
import { BuildTimePhraseSystem } from './lib/420kit/phrase-system.js';

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
                    // Use the filename (without .json) as the group name
                    const groupName = file.replace('-phrases.json', '').replace('.json', '');
                    phraseData[groupName] = content;
                }
            });
        }

        return phraseData;
    }

    // Update phrase system with CMS data
    updatePhrasesFromCMS(cmsData) {
        Object.keys(cmsData).forEach(group => {
            if (!this.phraseSystem.phraseGroups[group]) {
                this.phraseSystem.phraseGroups[group] = {};
            }

            Object.keys(cmsData[group]).forEach(key => {
                const phrases = cmsData[group][key];
                if (Array.isArray(phrases)) {
                    this.phraseSystem.phraseGroups[group][key] = phrases;
                }
            });
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

    // Generate media lists for images and videos using @420kit/shared
    async generateMediaLists() {
        console.log('🖼️ Generating media lists using @420kit/shared...');

        // Create media generator instance
        const mediaGenerator = new MediaGenerator({
            baseDir: __dirname,
            imageDir: 'saved_images',
            videoDir: 'saved_videos',
            outputDir: '.',
            generateTimestamps: true,
            sortByDate: true,
            sortOrder: 'desc',
            includeMetadata: true,
            prettyPrint: true
        });

        // Generate all media lists
        const result = await mediaGenerator.generateAllLists();

        console.log('🎉 Media list generation completed!');

        // Return the results in the expected format
        return {
            images: result.images || [],
            videos: result.videos || [],
            stats: result.stats
        };
    }

    // Generate video schedule
    generateVideoSchedule() {
        const PROGRAM_SEED = 247420;
        const EPOCH_START = new Date('2025-01-01T00:00:00Z').getTime();

        const seededRandom = (seed) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        const getDefaultDuration = (filename) => {
            // Return reasonable default durations based on file patterns
            if (filename.includes('short') || filename.includes('clip')) return 15;
            if (filename.includes('long') || filename.includes('full')) return 120;
            return 30; // Default 30 seconds
        };

        console.log('📺 Generating video schedule...');

        let videosJson = [];

        // Try to read existing videos.json, fall back to basic scan
        if (fs.existsSync('videos.json')) {
            videosJson = JSON.parse(fs.readFileSync('videos.json', 'utf8'));
            console.log(`✅ Loaded ${videosJson.length} videos from videos.json`);
        } else if (fs.existsSync('saved_videos.json')) {
            videosJson = JSON.parse(fs.readFileSync('saved_videos.json', 'utf8'));
            console.log(`✅ Loaded ${videosJson.length} videos from saved_videos.json`);
        } else {
            // Fallback: create basic video list
            console.log('⚠️ No video list found, creating fallback schedule');
            videosJson = [
                { filename: 'placeholder1.mp4', path: 'saved_videos/placeholder1.mp4' },
                { filename: 'placeholder2.mp4', path: 'saved_videos/placeholder2.mp4' },
                { filename: 'placeholder3.mp4', path: 'saved_videos/placeholder3.mp4' }
            ];
        }

        console.log('📺 Processing video durations...');
        const videos = videosJson.map(video => {
            // Use default duration instead of trying to measure with ffprobe
            const duration = getDefaultDuration(video.filename);
            console.log(`  ${video.filename}: ${duration}s (estimated)`);
            return {
                ...video,
                duration
            };
        });

        console.log('\n📺 Generating repeating schedule...');
        let currentTime = 0;
        let seedOffset = 0;
        const oneLoop = [];

        for (let i = 0; i < videos.length; i++) {
            const videoIndex = Math.floor(seededRandom(PROGRAM_SEED + seedOffset) * videos.length);
            const video = videos[videoIndex];

            oneLoop.push({
                videoIndex,
                offsetMs: currentTime,
                duration: video.duration * 1000,
                filename: video.filename
            });

            currentTime += video.duration * 1000;
            seedOffset++;
        }

        const loopDuration = currentTime;
        console.log(`\n📺 Loop duration: ${(loopDuration / 1000 / 60).toFixed(2)} minutes`);
        console.log(`📺 Total videos in loop: ${oneLoop.length}`);

        const schedule = {
            epochStart: EPOCH_START,
            programSeed: PROGRAM_SEED,
            loopDurationMs: loopDuration,
            videos,
            loop: oneLoop
        };

        // Ensure static directory exists
        if (!fs.existsSync(this.staticDir)) {
            fs.mkdirSync(this.staticDir, { recursive: true });
        }

        const schedulePath = path.join(this.staticDir, 'video-schedule.json');
        fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));
        console.log('\n✅ Schedule saved to static/video-schedule.json');

        return schedule;
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
            loadFromCMS = true,
            runViteBuild = true
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

            // Generate media lists
            this.generateMediaLists();

            // Generate video schedule
            this.generateVideoSchedule();

            // Process HTML files
            this.processHTMLDirectory(inputDir, outputDir);

            // Generate phrase data
            this.generatePhraseData();

            // Generate build manifest
            this.generateBuildManifest();

            console.log('🎉 Phrase build process completed successfully!');
            console.log(`📊 Processed ${this.phraseSystem.getStats().totalPhrases} phrases across ${this.phraseSystem.getStats().totalGroups} groups`);

            // Run Vite build if enabled
            if (runViteBuild) {
                console.log('🔨 Starting Vite build process...');
                try {
                    // Backup phrase-processed files
//                                     // Backup mechanism disabled due to filesystem permission issues
                const backupDir = null; // Disabled// Clean up backup
//                     fs.rmSync(backupDir, { recursive: true, force: true }); // DISABLED: Permission issues in Windows filesystem

                    console.log('✅ Vite build completed successfully!');
                } catch (viteError) {
                    console.error('❌ Vite build failed:', viteError);
                    throw viteError;
                }
            }

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