#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
class BuildOptimizer {
constructor() {
this.metrics = {
buildTimes: [],
bundleSizes: {},
assetCounts: {},
errors: [],
warnings: [],
optimizations: []
}
}
analyzeCurrentSetup() {
console.log('🔍 Analyzing current build setup...')
// Analyze package.json scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const buildScripts = Object.keys(packageJson.scripts).filter(script =>
script.includes('build') && script.includes('ssr')
)
console.log(`📋 Found ${buildScripts.length} SSR build scripts:`)
buildScripts.forEach(script => {
console.log(`  - ${script}: ${packageJson.scripts[script]}`)
})
// Analyze build files
const buildFiles = ['build-ssr.js', 'vite.config.ssr.js', 'vite.config.js']
buildFiles.forEach(file => {
if (fs.existsSync(file)) {
const stats = fs.statSync(file)
console.log(`📄 ${file}: ${stats.size} bytes`)
}
})
return buildScripts
}
generateOptimizationRecommendations() {
console.log('\n💡 Generating optimization recommendations...')
const recommendations = []
// Check Vite config optimizations
try {
const viteConfig = fs.readFileSync('vite.config.ssr.js', 'utf8')
if (!viteConfig.includes('chunks')) {
recommendations.push({
type: 'bundle-splitting',
description: 'Add manual chunk splitting for better caching',
impact: 'high',
implementation: `
build.rollupOptions.output.manualChunks = {
vendor: ['vite', 'express'],
utils: ['axios', 'mime']
}`
})
}
if (!viteConfig.includes('treeshaking')) {
recommendations.push({
type: 'treeshaking',
description: 'Enable tree shaking for unused dependencies',
impact: 'medium',
implementation: `
optimizeDeps: {
include: ['express', 'axios'],
exclude: ['@tensorflow/tfjs-node']
}`
})
}
if (viteConfig.includes('assetsInlineLimit: 0')) {
recommendations.push({
type: 'asset-optimization',
description: 'Increase asset inline limit for small assets',
impact: 'medium',
implementation: 'Change assetsInlineLimit from 0 to 4096'
})
}
} catch (error) {
console.warn('Could not analyze vite.config.ssr.js')
}
// Check build script optimizations
try {
const buildScript = fs.readFileSync('build-ssr.js', 'utf8')
if (!buildScript.includes('parallel')) {
recommendations.push({
type: 'parallel-processing',
description: 'Add parallel processing for file operations',
impact: 'high',
implementation: 'Use Promise.all() for concurrent file copying'
})
}
if (buildScript.includes('copyDirectory')) {
recommendations.push({
type: 'file-copy-optimization',
description: 'Optimize directory copying with better streaming',
impact: 'medium',
implementation: 'Use streams for large file copying'
})
}
} catch (error) {
console.warn('Could not analyze build-ssr.js')
}
// Check for potential npm optimizations
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 20) {
recommendations.push({
type: 'dependency-optimization',
description: 'Consider reducing dependencies or moving some to devDependencies',
impact: 'high',
implementation: 'Audit dependencies with npm audit and remove unused packages'
})
}
recommendations.sort((a, b) => {
const impactOrder = { high: 3, medium: 2, low: 1 }
return impactOrder[b.impact] - impactOrder[a.impact]
})
return recommendations
}
createOptimizedBuildScript() {
console.log('\n🔧 Creating optimized build script...')
const optimizedScript = `import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { build } from 'vite'
import { createRequire } from 'module'
import { Worker } from 'worker_threads'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
class OptimizedSSRBuilder {
constructor() {
this.startTime = Date.now()
this.metrics = {
phaseTimings: {},
fileCounts: {},
bundleSize: 0
}
}
async build() {
console.log('🚀 Starting optimized SSR build process...')
try {
await this.runPhraseBuild()
await this.buildClientAssets()
await this.copyStaticFiles()
await this.copyDirectories()
await this.generateBuildReport()
const totalTime = Date.now() - this.startTime
console.log(\\`🎉 Optimized SSR build completed in \${totalTime}ms!\`)
} catch (error) {
console.error('❌ Optimized SSR build failed:', error)
process.exit(1)
}
}
async runPhraseBuild() {
const phaseStart = Date.now()
console.log('📝 Processing phrases and generating content...')
try {
const PhraseBuildProcess = (await import('./build-process.js')).default
const phraseProcess = new PhraseBuildProcess()
await phraseProcess.build({
inputDir: __dirname,
outputDir: path.join(__dirname, 'dist'),
loadFromCMS: true,
runViteBuild: false
})
this.metrics.phaseTimings.phraseBuild = Date.now() - phaseStart
console.log(\`✅ Phrase processing completed in \${this.metrics.phaseTimings.phraseBuild}ms\\`)
} catch (error) {
console.warn('⚠️ Phrase build failed, continuing...')
this.metrics.phaseTimings.phraseBuild = Date.now() - phaseStart
}
}
async buildClientAssets() {
const phaseStart = Date.now()
console.log('🔨 Building client-side assets with optimizations...')
await build({
configFile: path.join(__dirname, 'vite.config.ssr.js'),
mode: 'production',
logLevel: 'warn'
})
this.metrics.phaseTimings.clientBuild = Date.now() - phaseStart
console.log(\`✅ Client assets built in \${this.metrics.phaseTimings.clientBuild}ms\`)
}
async copyStaticFiles() {
const phaseStart = Date.now()
console.log('📁 Copying static files with parallel processing...')
const staticFiles = [
'schwepe-descriptions.json',
'schwepe.gif',
'favicon.ico',
'navbar.html',
'navbar.css',
'lore.css',
'decap-cms.yml'
]
// Use Promise.all for parallel copying
await Promise.all(staticFiles.map(async (file) => {
const src = path.join(__dirname, file)
const dest = path.join(__dirname, 'dist', file)
if (fs.existsSync(src)) {
await fs.promises.copyFile(src, dest)
console.log(\\`✅ Copied \${file}\`)
}
}))
this.metrics.phaseTimings.staticCopy = Date.now() - phaseStart
this.metrics.fileCounts.staticFiles = staticFiles.length
console.log(\`✅ Static files copied in \${this.metrics.phaseTimings.staticCopy}ms\\`)
}
async copyDirectories() {
const phaseStart = Date.now()
console.log('📁 Copying directories...')
const directories = ['schwepe', '
// Process directories in parallel batches
const batchSize = 3
for (let i = 0; i < directories.length; i += batchSize) {
const batch = directories.slice(i, i + batchSize)
await Promise.all(batch.map(dir => this.copyDirectory(dir)))
}
this.metrics.phaseTimings.directoryCopy = Date.now() - phaseStart
this.metrics.fileCounts.directories = directories.length
console.log(\`✅ Directories copied in \${this.metrics.phaseTimings.directoryCopy}ms\`)
}
async copyDirectory(dir) {
const src = path.join(__dirname, dir)
const dest = path.join(__dirname, 'dist', dir)
if (!fs.existsSync(src)) return
if (!fs.existsSync(dest)) {
fs.mkdirSync(dest, { recursive: true })
}
const entries = fs.readdirSync(src, { withFileTypes: true })
for (const entry of entries) {
const srcPath = path.join(src, entry.name)
const destPath = path.join(dest, entry.name)
if (entry.isDirectory()) {
await this.copyDirectoryRecursive(srcPath, destPath)
} else {
await fs.promises.copyFile(srcPath, destPath)
}
}
console.log(\\`✅ Copied \${dir}/\`)
}
async copyDirectoryRecursive(src, dest) {
if (!fs.existsSync(dest)) {
fs.mkdirSync(dest, { recursive: true })
}
const entries = fs.readdirSync(src, { withFileTypes: true })
for (const entry of entries) {
const srcPath = path.join(src, entry.name)
const destPath = path.join(dest, entry.name)
if (entry.isDirectory()) {
await this.copyDirectoryRecursive(srcPath, destPath)
} else {
await fs.promises.copyFile(srcPath, destPath)
}
}
}
async generateBuildReport() {
const totalTime = Date.now() - this.startTime
const report = {
buildTime: totalTime,
phaseTimings: this.metrics.phaseTimings,
fileCounts: this.metrics.fileCounts,
timestamp: new Date().toISOString(),
optimization: 'optimized'
}
const reportPath = path.join(__dirname, 'dist', 'build-report.json')
await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2))
console.log('\\n📊 Build Report:')
console.log(\`Total Time: \${totalTime}ms\\`)
Object.entries(this.metrics.phaseTimings).forEach(([phase, time]) => {
const percentage = ((time / totalTime) * 100).toFixed(1)
console.log(\`  \${phase}: \${time}ms (\${percentage}%)\`)
})
}
}
// Run optimized build
const builder = new OptimizedSSRBuilder()
builder.build()
`
fs.writeFileSync('build-ssr-optimized.js', optimizedScript)
console.log('✅ Created optimized build script: build-ssr-optimized.js')
// Update package.json with new script
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
packageJson.scripts['build:ssr:optimized'] = 'node build-ssr-optimized.js'
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2))
console.log('✅ Added new npm script: build:ssr:optimized')
}
generateOptimizedViteConfig() {
console.log('\n⚡ Creating optimized Vite configuration...')
const optimizedConfig = `import { defineConfig } from 'vite'
import { resolve } from 'path'
// Optimized SSR-compatible Vite configuration
export default defineConfig({
root: '.',
build: {
outDir: 'dist',
rollupOptions: {
input: {
main: resolve(__dirname, 'index.html'),
gallery: resolve(__dirname, 'gallery.html'),
lore: resolve(__dirname, 'lore.html'),
videosThread: resolve(__dirname, 'videos-thread.html'),
imagesThread: resolve(__dirname, 'images-thread.html')
},
output: {
manualChunks: {
vendor: ['vite'],
utils: ['axios', 'mime'],
media: ['@tensorflow/tfjs-node', '@imgly/background-removal-node']
}
}
},
emptyOutDir: false,
assetsInlineLimit: 4096, // Increased from 0 for better performance
target: 'esnext',
minify: 'esbuild',
sourcemap: false, // Disabled for production builds
chunkSizeWarningLimit: 1000
},
// SSR configuration
ssr: {
noExternal: [],
target: 'node'
},
server: {
port: 3000,
cors: {
origin: '*',
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
credentials: false
},
host: true
},
preview: {
port: 4173,
cors: {
origin: '*',
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
credentials: false
},
host: true
},
// Optimized dependencies
optimizeDeps: {
include: ['express', 'axios', 'mime'],
exclude: ['@tensorflow/tfjs-node', '@imgly/background-removal-node']
},
// CSS processing
css: {
devSourcemap: false
},
// Build performance optimizations
esbuild: {
target: 'es2020',
drop: ['console', 'debugger']
}
})
`
fs.writeFileSync('vite.config.ssr.optimized.js', optimizedConfig)
console.log('✅ Created optimized Vite config: vite.config.ssr.optimized.js')
}
async runComparisonBuilds() {
console.log('\n🏁 Running comparison builds...')
if (!fs.existsSync('node_modules')) {
console.log('❌ node_modules not found. Please run npm install first.')
return false
}
const builds = ['original', 'optimized']
const results = {}
for (const buildType of builds) {
console.log(`\\n📦 Running ${buildType} build...`)
try {
const startTime = Date.now()
const script = buildType === 'original' ? 'build:ssr:production' : 'build:ssr:optimized'
// Run build and capture output
const output = execSync(`npm run ${script}`, {
encoding: 'utf8',
stdio: 'pipe',
timeout: 300000 // 5 minute timeout
})
const buildTime = Date.now() - startTime
// Analyze dist directory
const distStats = this.analyzeDistDirectory()
results[buildType] = {
buildTime,
success: true,
output,
...distStats
}
console.log(`✅ ${buildType} build completed in ${buildTime}ms`)
// Clean up for next build
if (fs.existsSync('dist')) {
fs.rmSync('dist', { recursive: true, force: true })
}
} catch (error) {
results[buildType] = {
buildTime: 0,
success: false,
error: error.message
}
console.log(`❌ ${buildType} build failed: ${error.message}`)
}
}
return results
}
analyzeDistDirectory() {
const distPath = 'dist'
if (!fs.existsSync(distPath)) {
return { totalSize: 0, fileCount: 0, directories: [] }
}
let totalSize = 0
let fileCount = 0
const directories = []
const analyzeDir = (dir, relativePath = '') => {
const entries = fs.readdirSync(dir, { withFileTypes: true })
for (const entry of entries) {
const fullPath = path.join(dir, entry.name)
const relativeFullPath = path.join(relativePath, entry.name)
if (entry.isDirectory()) {
directories.push(relativeFullPath)
analyzeDir(fullPath, relativeFullPath)
} else {
const stats = fs.statSync(fullPath)
totalSize += stats.size
fileCount++
}
}
}
analyzeDir(distPath)
return {
totalSize,
fileCount,
directoryCount: directories.length,
directories
}
}
generatePerformanceReport(results) {
console.log('\\n📊 Generating performance report...')
let report = '# SSR Build Performance Analysis Report\\n\\n'
report += `Generated: ${new Date().toISOString()}\\n\\n`
// Build time comparison
if (results.original && results.optimized) {
const timeImprovement = ((results.original.buildTime - results.optimized.buildTime) / results.original.buildTime * 100).toFixed(1)
const speedup = (results.original.buildTime / results.optimized.buildTime).toFixed(2)
report += '## Build Time Comparison\\n\\n'
report += '| Build Type | Time (ms) | Success |\\n'
report += '|------------|-----------|---------|\\n'
report += `| Original | ${results.original.buildTime} | ${results.original.success ? '✅' : '❌'} |\\n`
report += `| Optimized | ${results.optimized.buildTime} | ${results.optimized.success ? '✅' : '❌'} |\\n\\n`
if (results.original.success && results.optimized.success) {
report += `**Performance Improvement:** ${timeImprovement}% faster (${speedup}x speedup)\\n\\n`
}
}
// Bundle size analysis
if (results.original && results.optimized) {
report += '## Bundle Size Analysis\\n\\n'
report += '| Build Type | Total Size | File Count | Directories |\\n'
report += '|------------|------------|------------|-------------|\\n'
report += `| Original | ${this.formatBytes(results.original.totalSize)} | ${results.original.fileCount} | ${results.original.directoryCount} |\\n`
report += `| Optimized | ${this.formatBytes(results.optimized.totalSize)} | ${results.optimized.fileCount} | ${results.optimized.directoryCount} |\\n\\n`
if (results.original.totalSize && results.optimized.totalSize) {
const sizeImprovement = ((results.original.totalSize - results.optimized.totalSize) / results.original.totalSize * 100).toFixed(1)
report += `**Size Improvement:** ${sizeImprovement}% reduction\\n\\n`
}
}
// Optimization recommendations
const recommendations = this.generateOptimizationRecommendations()
if (recommendations.length > 0) {
report += '## Optimization Recommendations\\n\\n'
recommendations.forEach((rec, index) => {
report += `${index + 1}. **${rec.type}** (${rec.impact} impact)\\n`
report += `   - ${rec.description}\\n`
report += '   - Implementation: \\`\'\`javascript\\n${rec.implementation}\\n\\`\`\`\\n\\n`
})
}
// Error analysis
const errors = []
if (results.original && !results.original.success) errors.push(results.original.error)
if (results.optimized && !results.optimized.success) errors.push(results.optimized.error)
if (errors.length > 0) {
report += '## Build Errors\\n\\n'
errors.forEach((error, index) => {
report += `${index + 1}. ${error}\\n\\n`
})
}
return report
}
formatBytes(bytes) {
if (bytes === 0) return '0 Bytes'
const k = 1024
const sizes = ['Bytes', 'KB', 'MB', 'GB']
const i = Math.floor(Math.log(bytes) / Math.log(k))
return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
async saveReport(report) {
const reportPath = path.join(__dirname, 'build-performance-report.md')
await fs.promises.writeFile(reportPath, report)
console.log(`📄 Performance report saved to: ${reportPath}`)
}
}
// Main execution
async function main() {
const optimizer = new BuildOptimizer()
console.log('🚀 SSR Build System Optimizer')
console.log('================================')
// Analyze current setup
const buildScripts = optimizer.analyzeCurrentSetup()
// Generate recommendations
const recommendations = optimizer.generateOptimizationRecommendations()
console.log(`\\n💡 Generated ${recommendations.length} optimization recommendations`)
// Create optimized scripts
optimizer.createOptimizedBuildScript()
optimizer.generateOptimizedViteConfig()
// Run comparison builds
const results = await optimizer.runComparisonBuilds()
// Generate and save report
const report = optimizer.generatePerformanceReport(results)
await optimizer.saveReport(report)
console.log('\\n🎉 Build optimization analysis complete!')
console.log('📄 Check build-performance-report.md for detailed results')
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
main().catch(console.error)
}
export default BuildOptimizer