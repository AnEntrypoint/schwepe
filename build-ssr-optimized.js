import fs from 'fs'
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
console.log(`🎉 Optimized SSR build completed in ${totalTime}ms!`)
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
console.log(`✅ Phrase processing completed in ${this.metrics.phaseTimings.phraseBuild}ms`)
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
console.log(`✅ Client assets built in ${this.metrics.phaseTimings.clientBuild}ms`)
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
console.log(`✅ Copied ${file}`)
}
}))
this.metrics.phaseTimings.staticCopy = Date.now() - phaseStart
this.metrics.fileCounts.staticFiles = staticFiles.length
console.log(`✅ Static files copied in ${this.metrics.phaseTimings.staticCopy}ms`)
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
console.log(`✅ Directories copied in ${this.metrics.phaseTimings.directoryCopy}ms`)
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
console.log(`✅ Copied ${dir}/`)
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
console.log('\n📊 Build Report:')
console.log(`Total Time: ${totalTime}ms`)
Object.entries(this.metrics.phaseTimings).forEach(([phase, time]) => {
const percentage = ((time / totalTime) * 100).toFixed(1)
console.log(`  ${phase}: ${time}ms (${percentage}%)`)
})
}
}
// Run optimized build
const builder = new OptimizedSSRBuilder()
builder.build()
