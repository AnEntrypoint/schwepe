    1→import fs from 'fs'
    2→import path from 'path'
    3→import { fileURLToPath } from 'url'
    4→import { build } from 'vite'
    5→import { createRequire } from 'module'
    6→import { Worker } from 'worker_threads'
    7→
    8→const __filename = fileURLToPath(import.meta.url)
    9→const __dirname = path.dirname(__filename)
   10→
   11→class OptimizedSSRBuilder {
   12→  constructor() {
   13→    this.startTime = Date.now()
   14→    this.metrics = {
   15→      phaseTimings: {},
   16→      fileCounts: {},
   17→      bundleSize: 0
   18→    }
   19→  }
   20→
   21→  async build() {
   22→    console.log('🚀 Starting optimized SSR build process...')
   23→
   24→    try {
   25→      await this.runPhraseBuild()
   26→      await this.buildClientAssets()
   27→      await this.copyStaticFiles()
   28→      await this.copyDirectories()
   29→      await this.generateBuildReport()
   30→
   31→      const totalTime = Date.now() - this.startTime
   32→      console.log(`🎉 Optimized SSR build completed in ${totalTime}ms!`)
   33→
   34→    } catch (error) {
   35→      console.error('❌ Optimized SSR build failed:', error)
   36→      process.exit(1)
   37→    }
   38→  }
   39→
   40→  async runPhraseBuild() {
   41→    const phaseStart = Date.now()
   42→    console.log('📝 Processing phrases and generating content...')
   43→
   44→    try {
   45→      const PhraseBuildProcess = (await import('./build-process.js')).default
   46→      const phraseProcess = new PhraseBuildProcess()
   47→
   48→      await phraseProcess.build({
   49→        inputDir: __dirname,
   50→        outputDir: path.join(__dirname, 'dist'),
   51→        loadFromCMS: true,
   52→        runViteBuild: false
   53→      })
   54→
   55→      this.metrics.phaseTimings.phraseBuild = Date.now() - phaseStart
   56→      console.log(`✅ Phrase processing completed in ${this.metrics.phaseTimings.phraseBuild}ms`)
   57→    } catch (error) {
   58→      console.warn('⚠️ Phrase build failed, continuing...')
   59→      this.metrics.phaseTimings.phraseBuild = Date.now() - phaseStart
   60→    }
   61→  }
   62→
   63→  async buildClientAssets() {
   64→    const phaseStart = Date.now()
   65→    console.log('🔨 Building client-side assets with optimizations...')
   66→
   67→    await build({
   68→      configFile: path.join(__dirname, 'vite.config.ssr.js'),
   69→      mode: 'production',
   70→      logLevel: 'warn'
   71→    })
   72→
   73→    this.metrics.phaseTimings.clientBuild = Date.now() - phaseStart
   74→    console.log(`✅ Client assets built in ${this.metrics.phaseTimings.clientBuild}ms`)
   75→  }
   76→
   77→  async copyStaticFiles() {
   78→    const phaseStart = Date.now()
   79→    console.log('📁 Copying static files with parallel processing...')
   80→
   81→    const staticFiles = [
   82→      'schwepe-descriptions.json',
   83→      'schwepe.gif',
   84→      'favicon.ico',
   85→      'navbar.html',
   86→      'navbar.css',
   87→      'lore.css',
   88→      'decap-cms.yml'
   89→    ]
   90→
   91→    // Use Promise.all for parallel copying
   92→    await Promise.all(staticFiles.map(async (file) => {
   93→      const src = path.join(__dirname, file)
   94→      const dest = path.join(__dirname, 'dist', file)
   95→      if (fs.existsSync(src)) {
   96→        await fs.promises.copyFile(src, dest)
   97→        console.log(`✅ Copied ${file}`)
   98→      }
   99→    }))
  100→
  101→    this.metrics.phaseTimings.staticCopy = Date.now() - phaseStart
  102→    this.metrics.fileCounts.staticFiles = staticFiles.length
  103→    console.log(`✅ Static files copied in ${this.metrics.phaseTimings.staticCopy}ms`)
  104→  }
  105→
  106→  async copyDirectories() {
  107→    const phaseStart = Date.now()
  108→    console.log('📁 Copying directories...')
  109→
  110→    const directories = ['schwepe', '
  111→
  112→    // Process directories in parallel batches
  113→    const batchSize = 3
  114→    for (let i = 0; i < directories.length; i += batchSize) {
  115→      const batch = directories.slice(i, i + batchSize)
  116→      await Promise.all(batch.map(dir => this.copyDirectory(dir)))
  117→    }
  118→
  119→    this.metrics.phaseTimings.directoryCopy = Date.now() - phaseStart
  120→    this.metrics.fileCounts.directories = directories.length
  121→    console.log(`✅ Directories copied in ${this.metrics.phaseTimings.directoryCopy}ms`)
  122→  }
  123→
  124→  async copyDirectory(dir) {
  125→    const src = path.join(__dirname, dir)
  126→    const dest = path.join(__dirname, 'dist', dir)
  127→
  128→    if (!fs.existsSync(src)) return
  129→
  130→    if (!fs.existsSync(dest)) {
  131→      fs.mkdirSync(dest, { recursive: true })
  132→    }
  133→
  134→    const entries = fs.readdirSync(src, { withFileTypes: true })
  135→    for (const entry of entries) {
  136→      const srcPath = path.join(src, entry.name)
  137→      const destPath = path.join(dest, entry.name)
  138→
  139→      if (entry.isDirectory()) {
  140→        await this.copyDirectoryRecursive(srcPath, destPath)
  141→      } else {
  142→        await fs.promises.copyFile(srcPath, destPath)
  143→      }
  144→    }
  145→
  146→    console.log(`✅ Copied ${dir}/`)
  147→  }
  148→
  149→  async copyDirectoryRecursive(src, dest) {
  150→    if (!fs.existsSync(dest)) {
  151→      fs.mkdirSync(dest, { recursive: true })
  152→    }
  153→
  154→    const entries = fs.readdirSync(src, { withFileTypes: true })
  155→    for (const entry of entries) {
  156→      const srcPath = path.join(src, entry.name)
  157→      const destPath = path.join(dest, entry.name)
  158→
  159→      if (entry.isDirectory()) {
  160→        await this.copyDirectoryRecursive(srcPath, destPath)
  161→      } else {
  162→        await fs.promises.copyFile(srcPath, destPath)
  163→      }
  164→    }
  165→  }
  166→
  167→  async generateBuildReport() {
  168→    const totalTime = Date.now() - this.startTime
  169→    const report = {
  170→      buildTime: totalTime,
  171→      phaseTimings: this.metrics.phaseTimings,
  172→      fileCounts: this.metrics.fileCounts,
  173→      timestamp: new Date().toISOString(),
  174→      optimization: 'optimized'
  175→    }
  176→
  177→    const reportPath = path.join(__dirname, 'dist', 'build-report.json')
  178→    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2))
  179→
  180→    console.log('\n📊 Build Report:')
  181→    console.log(`Total Time: ${totalTime}ms`)
  182→    Object.entries(this.metrics.phaseTimings).forEach(([phase, time]) => {
  183→      const percentage = ((time / totalTime) * 100).toFixed(1)
  184→      console.log(`  ${phase}: ${time}ms (${percentage}%)`)
  185→    })
  186→  }
  187→}
  188→
  189→// Run optimized build
  190→const builder = new OptimizedSSRBuilder()
  191→builder.build()
  192→