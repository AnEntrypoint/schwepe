// Enhanced Media Generator Module with Video Duration Detection
// Generates JSON lists for images and videos with metadata processing, video duration extraction, and scheduling

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to detect CI/CD environment
function isCICDEnvironment() {
    return process.env.CI === 'true' ||
           process.env.CONTINUOUS_INTEGRATION === 'true' ||
           process.env.GITHUB_ACTIONS === 'true' ||
           process.env.GITLAB_CI === 'true' ||
           process.env.TRAVIS === 'true' ||
           process.env.CIRCLECI === 'true' ||
           process.env.COOLIFY === 'true' ||
           process.env.NODE_ENV === 'production';
}

// Helper function to check if FFprobe is available
function isFFprobeAvailable() {
    try {
        execSync('ffprobe -version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Video duration extraction using fast-video-metadata (CI/CD friendly)
async function extractVideoDurationFast(filePath) {
    try {
        // Dynamic import to avoid bundling issues in CI/CD
        const { getMetadata } = await import('fast-video-metadata');
        const metadata = await getMetadata(filePath);
        return metadata?.duration ? Math.round(metadata.duration) : null;
    } catch (error) {
        // Silently fall back if fast-video-metadata fails or isn't available
        return null;
    }
}

// Video duration extraction using FFprobe (fallback for comprehensive format support)
function extractVideoDurationFFprobe(filePath) {
    return new Promise((resolve) => {
        if (!isFFprobeAvailable()) {
            resolve(null);
            return;
        }

        const ffprobe = spawn('ffprobe', [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            filePath
        ]);

        let output = '';
        let error = '';

        ffprobe.stdout.on('data', (data) => {
            output += data.toString();
        });

        ffprobe.stderr.on('data', (data) => {
            error += data.toString();
        });

        ffprobe.on('close', (code) => {
            if (code === 0 && output.trim()) {
                const duration = parseFloat(output.trim());
                resolve(isNaN(duration) ? null : Math.round(duration));
            } else {
                resolve(null);
            }
        });

        // Timeout after 10 seconds for CI/CD environments
        const timeout = setTimeout(() => {
            ffprobe.kill();
            resolve(null);
        }, isCICDEnvironment() ? 5000 : 15000);

        ffprobe.on('close', () => {
            clearTimeout(timeout);
        });
    });
}

export class MediaGenerator {
    constructor(options = {}) {
        this.options = {
            baseDir: process.cwd(),
            imageDir: 'saved_images',
            videoDir: 'saved_videos',
            outputDir: '.',
            imageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.avif'],
            videoExtensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'],
            generateTimestamps: true,
            sortByDate: true,
            sortOrder: 'desc', // 'asc' or 'desc'
            includeMetadata: true,
            outputFormat: 'json',
            prettyPrint: true,
            extractVideoDurations: true,
            durationExtractionTimeout: isCICDEnvironment() ? 3000 : 10000,
            fallbackToFFprobe: true,
            enableScheduling: false,
            schedulingConfig: {
                defaultVideoDuration: 600, // 10 minutes
                minGapBetweenVideos: 300, // 5 minutes
                maxVideosPerDay: 10,
                preferredTimes: ['09:00', '14:00', '19:00'],
                timezone: 'UTC'
            },
            ...options
        };

        this.baseDir = path.resolve(this.options.baseDir);
        this.imageDir = path.join(this.baseDir, this.options.imageDir);
        this.videoDir = path.join(this.baseDir, this.options.videoDir);
        this.outputDir = path.join(this.baseDir, this.options.outputDir);

        // Cache for duration extraction to avoid repeated processing
        this.durationCache = new Map();
    }

    // Extract timestamp from filename
    extractTimestamp(filename) {
        // Pattern: 2024-03-15T14-30-45-123Z
        const timestampMatch = filename.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
        return timestampMatch ? timestampMatch[1] : null;
    }

    // Get file metadata
    getFileMetadata(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory()
            };
        } catch (error) {
            console.warn(`⚠️ Failed to get metadata for ${filePath}:`, error.message);
            return null;
        }
    }

    // Enhanced video duration extraction with fallback strategies
    async extractVideoDuration(filePath) {
        // Check cache first
        const cacheKey = `${filePath}_${fs.statSync(filePath).mtime.getTime()}`;
        if (this.durationCache.has(cacheKey)) {
            return this.durationCache.get(cacheKey);
        }

        let duration = null;

        // Strategy 1: Try fast-video-metadata first (CI/CD friendly, no external deps)
        if (this.options.extractVideoDurations) {
            try {
                duration = await Promise.race([
                    extractVideoDurationFast(filePath),
                    new Promise(resolve =>
                        setTimeout(() => resolve(null), this.options.durationExtractionTimeout)
                    )
                ]);
            } catch (error) {
                // Silently continue to fallback
            }
        }

        // Strategy 2: Use FFprobe as fallback (more comprehensive format support)
        if (!duration && this.options.fallbackToFFprobe) {
            try {
                duration = await Promise.race([
                    extractVideoDurationFFprobe(filePath),
                    new Promise(resolve =>
                        setTimeout(() => resolve(null), this.options.durationExtractionTimeout)
                    )
                ]);
            } catch (error) {
                // Silently continue without duration
            }
        }

        // Strategy 3: Estimate duration based on file size as last resort
        if (!duration) {
            const stats = this.getFileMetadata(filePath);
            if (stats) {
                // Rough estimate: 1MB ≈ 1 minute for standard quality video
                // But set reasonable bounds to prevent scheduling issues
                const estimatedMinutes = Math.max(1, Math.min(180, Math.round(stats.size / (1024 * 1024))));
                duration = estimatedMinutes * 60; // Convert to seconds

                // Warn about estimation
                console.warn(`⚠️ Estimated duration for ${path.basename(filePath)}: ${estimatedMinutes} minutes based on file size`);
            }
        }

        // Validate duration is reasonable (30s to 2 hours)
        if (duration && (duration < 30 || duration > 7200)) {
            console.warn(`⚠️ Unusual duration detected for ${path.basename(filePath)}: ${duration}s, using fallback`);
            // Use a reasonable default duration
            duration = duration < 30 ? 600 : Math.min(7200, duration);
        }

        // Cache the result
        if (duration) {
            this.durationCache.set(cacheKey, duration);
        }

        return duration;
    }

    // Process media files in a directory
    async processMediaFiles(directory, extensions, type) {
        if (!fs.existsSync(directory)) {
            console.warn(`⚠️ Directory not found: ${directory}`);
            return [];
        }

        const files = fs.readdirSync(directory, { withFileTypes: true });
        const mediaFiles = [];

        for (const file of files) {
            if (!file.isFile()) continue;

            const ext = path.extname(file.name).toLowerCase();

            if (extensions.includes(ext)) {
                const filePath = path.join(directory, file.name);
                const metadata = this.getFileMetadata(filePath);

                if (!metadata) continue;

                // Extract date from filename or use file creation time
                let date = metadata.created.toISOString();
                if (this.options.generateTimestamps) {
                    const timestamp = this.extractTimestamp(file.name);
                    if (timestamp) {
                        date = timestamp;
                    }
                }

                const mediaFile = {
                    filename: file.name,
                    path: path.relative(this.baseDir, filePath),
                    date: date,
                    extension: ext,
                    type: type
                };

                // Add metadata if enabled
                if (this.options.includeMetadata) {
                    mediaFile.metadata = {
                        size: metadata.size,
                        created: metadata.created.toISOString(),
                        modified: metadata.modified.toISOString(),
                        accessed: metadata.accessed.toISOString()
                    };
                }

                // Add additional info based on file type
                if (type === 'image') {
                    mediaFile.category = this.getImageCategory(file.name, ext);
                } else if (type === 'video') {
                    mediaFile.category = this.getVideoCategory(file.name, ext);

                    // Extract video duration
                    if (this.options.extractVideoDurations) {
                        try {
                            const duration = await this.extractVideoDuration(filePath);
                            if (duration) {
                                mediaFile.duration = duration;
                                if (mediaFile.metadata) {
                                    mediaFile.metadata.duration = duration;
                                    mediaFile.metadata.formattedDuration = this.formatDuration(duration);
                                }
                            }
                        } catch (error) {
                            // Silently continue without duration
                            if (!isCICDEnvironment()) {
                                console.warn(`⚠️ Could not extract duration for ${file.name}:`, error.message);
                            }
                        }
                    }
                }

                mediaFiles.push(mediaFile);
            }
        }

        return mediaFiles;
    }

    // Categorize images based on filename patterns
    getImageCategory(filename, extension) {
        const name = filename.toLowerCase();

        if (name.includes('thumbnail') || name.includes('thumb')) return 'thumbnail';
        if (name.includes('banner') || name.includes('header')) return 'banner';
        if (name.includes('avatar') || name.includes('profile')) return 'avatar';
        if (name.includes('screenshot') || name.includes('screen')) return 'screenshot';
        if (name.includes('meme')) return 'meme';
        if (name.includes('logo')) return 'logo';

        // Categorize by extension
        if (extension === '.gif') return 'animated';
        if (extension === '.svg') return 'vector';
        if (extension === '.webp' || extension === '.avif') return 'modern';

        return 'general';
    }

    // Categorize videos based on filename patterns
    getVideoCategory(filename, extension) {
        const name = filename.toLowerCase();

        if (name.includes('tutorial') || name.includes('guide')) return 'tutorial';
        if (name.includes('trailer') || name.includes('preview')) return 'trailer';
        if (name.includes('stream') || name.includes('live')) return 'stream';
        if (name.includes('clip') || name.includes('short')) return 'clip';
        if (name.includes('meme') || name.includes('funny')) return 'meme';
        if (name.includes('screen') || name.includes('record')) return 'recording';

        // Categorize by extension
        if (extension === '.gif') return 'animated';
        if (extension === '.webm') return 'web';

        return 'general';
    }

    // Sort media files by date
    sortMediaFiles(files) {
        if (!this.options.sortByDate) return files;

        return files.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);

            if (this.options.sortOrder === 'asc') {
                return dateA - dateB;
            } else {
                return dateB - dateA; // desc (default)
            }
        });
    }

    // Format duration in human-readable format
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // Generate images list
    async generateImagesList() {
        console.log('🖼️ Generating images list...');

        const images = await this.processMediaFiles(this.imageDir, this.options.imageExtensions, 'image');
        const sortedImages = this.sortMediaFiles(images);

        // Save to file
        const outputPath = path.join(this.outputDir, 'saved_images.json');
        const content = this.options.prettyPrint
            ? JSON.stringify(sortedImages, null, 2)
            : JSON.stringify(sortedImages);

        fs.writeFileSync(outputPath, content, 'utf8');
        console.log(`✅ Generated saved_images.json with ${sortedImages.length} images`);

        return sortedImages;
    }

    // Generate videos list with duration extraction
    async generateVideosList() {
        console.log('🎥 Generating videos list...');

        const videos = await this.processMediaFiles(this.videoDir, this.options.videoExtensions, 'video');
        const sortedVideos = this.sortMediaFiles(videos);

        // Save to file
        const outputPath = path.join(this.outputDir, 'saved_videos.json');
        const content = this.options.prettyPrint
            ? JSON.stringify(sortedVideos, null, 2)
            : JSON.stringify(sortedVideos);

        fs.writeFileSync(outputPath, content, 'utf8');
        console.log(`✅ Generated saved_videos.json with ${sortedVideos.length} videos`);

        // Report duration extraction statistics
        const videosWithDuration = sortedVideos.filter(v => v.duration);
        if (videosWithDuration.length > 0) {
            const totalDuration = videosWithDuration.reduce((sum, v) => sum + v.duration, 0);
            console.log(`📊 Extracted durations for ${videosWithDuration.length}/${sortedVideos.length} videos`);
            console.log(`⏱️ Total content duration: ${this.formatDuration(totalDuration)}`);
        } else if (this.options.extractVideoDurations) {
            console.log(`⚠️ Could not extract durations (expected in CI/CD environments)`);
        }

        return sortedVideos;
    }

    // Generate both images and videos lists
    async generateAllLists() {
        console.log('🚀 Generating media lists...');

        const results = {};

        try {
            results.images = await this.generateImagesList();
        } catch (error) {
            console.error('❌ Failed to generate images list:', error.message);
            results.images = [];
        }

        try {
            results.videos = await this.generateVideosList();
        } catch (error) {
            console.error('❌ Failed to generate videos list:', error.message);
            results.videos = [];
        }

        // Generate combined media list
        const allMedia = [...(results.images || []), ...(results.videos || [])];
        const sortedMedia = this.sortMediaFiles(allMedia);

        try {
            const outputPath = path.join(this.outputDir, 'saved_media.json');
            const content = this.options.prettyPrint
                ? JSON.stringify(sortedMedia, null, 2)
                : JSON.stringify(sortedMedia);

            fs.writeFileSync(outputPath, content, 'utf8');
            console.log(`✅ Generated saved_media.json with ${sortedMedia.length} total media files`);
            results.all = sortedMedia;
        } catch (error) {
            console.error('❌ Failed to generate combined media list:', error.message);
            results.all = [];
        }

        console.log('🎉 Media list generation completed!');

        // Generate statistics
        const stats = this.generateStatistics(results);
        console.log(`📊 Statistics: ${stats.totalImages} images, ${stats.totalVideos} videos, ${stats.totalMedia} total files`);

        // Generate video schedule if enabled
        if (this.options.enableScheduling && results.videos?.length > 0) {
            try {
                results.schedule = await this.generateVideoSchedule(results.videos);
                console.log(`📅 Generated video schedule with ${results.schedule.schedule.length} entries`);
            } catch (error) {
                console.error('❌ Failed to generate video schedule:', error.message);
                results.schedule = null;
            }
        }

        return { ...results, stats };
    }

    // Generate video schedule based on duration analysis
    async generateVideoSchedule(videos) {
        const config = this.options.schedulingConfig;
        const schedule = {
            schedule: [],
            settings: {
                timezone: config.timezone,
                autoPublish: true,
                maxConcurrentUploads: 2,
                retryAttempts: 3,
                generatedAt: new Date().toISOString(),
                totalVideos: videos.length
            }
        };

        let currentTime = new Date();
        currentTime.setHours(9, 0, 0, 0); // Start at 9 AM
        if (currentTime <= new Date()) {
            currentTime.setDate(currentTime.getDate() + 1);
        }

        const videosWithDuration = videos.filter(v => v.duration);

        for (let i = 0; i < videosWithDuration.length; i++) {
            const video = videosWithDuration[i];
            const scheduledTime = new Date(currentTime);

            // Add gap between videos
            if (i > 0) {
                scheduledTime.setSeconds(scheduledTime.getSeconds() + config.minGapBetweenVideos);
            }

            const scheduleEntry = {
                id: `video_${String(i + 1).padStart(3, '0')}`,
                title: video.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                filename: video.filename,
                duration: video.duration,
                scheduledTime: scheduledTime.toISOString(),
                category: video.category || 'general',
                tags: [video.category || 'general', 'auto-scheduled'],
                metadata: {
                    size: video.metadata?.size || 0,
                    resolution: 'auto-detected',
                    codec: 'auto-detected',
                    formattedDuration: video.metadata?.formattedDuration || this.formatDuration(video.duration)
                }
            };

            schedule.schedule.push(scheduleEntry);

            // Calculate next video time
            const videoEndTime = new Date(scheduledTime.getTime() + video.duration * 1000);
            currentTime = new Date(Math.max(
                videoEndTime.getTime() + config.minGapBetweenVideos * 1000,
                currentTime.getTime() + 3600000 // At least 1 hour later
            ));

            // Skip to next day if too many videos today
            const videosToday = schedule.schedule.filter(v =>
                new Date(v.scheduledTime).toDateString() === scheduledTime.toDateString()
            ).length;

            if (videosToday >= config.maxVideosPerDay) {
                currentTime.setDate(currentTime.getDate() + 1);
                currentTime.setHours(9, 0, 0, 0);
            }
        }

        // Save schedule to file
        const schedulePath = path.join(this.outputDir, 'video-schedule.json');
        const content = this.options.prettyPrint
            ? JSON.stringify(schedule, null, 2)
            : JSON.stringify(schedule);

        fs.writeFileSync(schedulePath, content, 'utf8');

        return schedule;
    }

    // Generate statistics about media files
    generateStatistics(results) {
        const stats = {
            totalImages: results.images?.length || 0,
            totalVideos: results.videos?.length || 0,
            totalMedia: results.all?.length || 0,
            imageCategories: {},
            videoCategories: {},
            totalSize: 0,
            totalDuration: 0,
            averageVideoDuration: 0
        };

        // Calculate categories, sizes, and durations
        if (results.images) {
            results.images.forEach(image => {
                const category = image.category || 'general';
                stats.imageCategories[category] = (stats.imageCategories[category] || 0) + 1;
                if (image.metadata?.size) {
                    stats.totalSize += image.metadata.size;
                }
            });
        }

        if (results.videos) {
            const videosWithDuration = results.videos.filter(v => v.duration);
            let totalDuration = 0;

            results.videos.forEach(video => {
                const category = video.category || 'general';
                stats.videoCategories[category] = (stats.videoCategories[category] || 0) + 1;
                if (video.metadata?.size) {
                    stats.totalSize += video.metadata.size;
                }
                if (video.duration) {
                    totalDuration += video.duration;
                }
            });

            stats.totalDuration = totalDuration;
            stats.averageVideoDuration = videosWithDuration.length > 0 ?
                Math.round(totalDuration / videosWithDuration.length) : 0;
        }

        // Format file size and duration
        stats.formattedSize = this.formatFileSize(stats.totalSize);
        stats.formattedDuration = this.formatDuration(stats.totalDuration);

        return stats;
    }

    // Format file size in human-readable format
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Watch for changes in media directories
    watchDirectories(callback) {
        const chokidar = require('chokidar');

        const watcher = chokidar.watch([
            path.join(this.imageDir, '**/*'),
            path.join(this.videoDir, '**/*')
        ]);

        watcher.on('add', (filePath) => {
            console.log(`📁 New file detected: ${filePath}`);
            this.generateAllLists().then(callback);
        });

        watcher.on('unlink', (filePath) => {
            console.log(`🗑️ File deleted: ${filePath}`);
            this.generateAllLists().then(callback);
        });

        console.log('👀 Watching media directories for changes...');
        return watcher;
    }

    // Validate media files
    validateMediaFiles() {
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            processed: 0,
            durationExtractionAvailable: this.options.extractVideoDurations && (
                !isCICDEnvironment() || isFFprobeAvailable()
            )
        };

        // Validate images
        if (fs.existsSync(this.imageDir)) {
            const imageFiles = fs.readdirSync(this.imageDir);
            imageFiles.forEach(file => {
                const ext = path.extname(file).toLowerCase();
                if (!this.options.imageExtensions.includes(ext)) {
                    validation.warnings.push(`Image file with unsupported extension: ${file}`);
                }
                validation.processed++;
            });
        }

        // Validate videos
        if (fs.existsSync(this.videoDir)) {
            const videoFiles = fs.readdirSync(this.videoDir);
            videoFiles.forEach(file => {
                const ext = path.extname(file).toLowerCase();
                if (!this.options.videoExtensions.includes(ext)) {
                    validation.warnings.push(`Video file with unsupported extension: ${file}`);
                }
                validation.processed++;
            });
        }

        // Add environment-specific warnings
        if (isCICDEnvironment() && !isFFprobeAvailable()) {
            validation.warnings.push(
                'CI/CD environment detected: Video duration extraction may be limited without FFprobe'
            );
        }

        return validation;
    }

    // Clean up old/invalid entries
    cleanup(options = {}) {
        const cleanupOptions = {
            removeMissing: true,
            removeDuplicates: true,
            dryRun: false,
            clearDurationCache: true,
            ...options
        };

        console.log('🧹 Cleaning up media lists...');

        if (cleanupOptions.removeMissing) {
            this.removeMissingFiles();
        }

        if (cleanupOptions.removeDuplicates) {
            this.removeDuplicateEntries();
        }

        if (cleanupOptions.clearDurationCache) {
            this.durationCache.clear();
            console.log('🗑️ Cleared duration cache');
        }

        console.log('✅ Cleanup completed');
    }

    // Remove entries for files that no longer exist
    removeMissingFiles() {
        ['saved_images.json', 'saved_videos.json'].forEach(filename => {
            const filePath = path.join(this.outputDir, filename);

            if (fs.existsSync(filePath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    const validFiles = data.filter(item => {
                        const fullPath = path.join(this.baseDir, item.path);
                        return fs.existsSync(fullPath);
                    });

                    if (validFiles.length !== data.length) {
                        fs.writeFileSync(filePath, JSON.stringify(validFiles, null, 2));
                        console.log(`🗑️ Removed ${data.length - validFiles.length} missing entries from ${filename}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to clean ${filename}:`, error.message);
                }
            }
        });
    }

    // Remove duplicate entries
    removeDuplicateEntries() {
        ['saved_images.json', 'saved_videos.json'].forEach(filename => {
            const filePath = path.join(this.outputDir, filename);

            if (fs.existsSync(filePath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    const uniqueFiles = [];
                    const seen = new Set();

                    data.forEach(item => {
                        const key = `${item.filename}_${item.metadata?.size || 0}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            uniqueFiles.push(item);
                        }
                    });

                    if (uniqueFiles.length !== data.length) {
                        fs.writeFileSync(filePath, JSON.stringify(uniqueFiles, null, 2));
                        console.log(`🗑️ Removed ${data.length - uniqueFiles.length} duplicate entries from ${filename}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to deduplicate ${filename}:`, error.message);
                }
            }
        });
    }

    // Export duration cache for persistence
    exportDurationCache() {
        return {
            cache: Array.from(this.durationCache.entries()),
            timestamp: new Date().toISOString(),
            environment: {
                isCI: isCICDEnvironment(),
                hasFFprobe: isFFprobeAvailable()
            }
        };
    }

    // Import duration cache from previous runs
    importDurationCache(cacheData) {
        if (cacheData?.cache && Array.isArray(cacheData.cache)) {
            this.durationCache = new Map(cacheData.cache);
            console.log(`📥 Imported duration cache with ${this.durationCache.size} entries`);
        }
    }
}

// Convenience function for quick usage
export async function generateMediaLists(options = {}) {
    const generator = new MediaGenerator(options);
    return await generator.generateAllLists();
}

// Export default class
export default MediaGenerator;