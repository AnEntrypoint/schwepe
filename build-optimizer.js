    1→#!/usr/bin/env node
    2→
    3→import fs from 'fs'
    4→import path from 'path'
    5→import { fileURLToPath } from 'url'
    6→import { execSync } from 'child_process'
    7→
    8→const __filename = fileURLToPath(import.meta.url)
    9→const __dirname = path.dirname(__filename)
   10→
   11→class BuildOptimizer {
   12→  constructor() {
   13→    this.metrics = {
   14→      buildTimes: [],
   15→      bundleSizes: {},
   16→      assetCounts: {},
   17→      errors: [],
   18→      warnings: [],
   19→      optimizations: []
   20→    }
   21→  }
   22→
   23→  analyzeCurrentSetup() {
   24→    console.log('🔍 Analyzing current build setup...')
   25→
   26→    // Analyze package.json scripts
   27→    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
   28→    const buildScripts = Object.keys(packageJson.scripts).filter(script =>
   29→      script.includes('build') && script.includes('ssr')
   30→    )
   31→
   32→    console.log(`📋 Found ${buildScripts.length} SSR build scripts:`)
   33→    buildScripts.forEach(script => {
   34→      console.log(`  - ${script}: ${packageJson.scripts[script]}`)
   35→    })
   36→
   37→    // Analyze build files
   38→    const buildFiles = ['build-ssr.js', 'vite.config.ssr.js', 'vite.config.js']
   39→    buildFiles.forEach(file => {
   40→      if (fs.existsSync(file)) {
   41→        const stats = fs.statSync(file)
   42→        console.log(`📄 ${file}: ${stats.size} bytes`)
   43→      }
   44→    })
   45→
   46→    return buildScripts
   47→  }
   48→
   49→  generateOptimizationRecommendations() {
   50→    console.log('\n💡 Generating optimization recommendations...')
   51→
   52→    const recommendations = []
   53→
   54→    // Check Vite config optimizations
   55→    try {
   56→      const viteConfig = fs.readFileSync('vite.config.ssr.js', 'utf8')
   57→
   58→      if (!viteConfig.includes('chunks')) {
   59→        recommendations.push({
   60→          type: 'bundle-splitting',
   61→          description: 'Add manual chunk splitting for better caching',
   62→          impact: 'high',
   63→          implementation: `
   64→build.rollupOptions.output.manualChunks = {
   65→  vendor: ['vite', 'express'],
   66→  utils: ['axios', 'mime']
   67→}`
   68→        })
   69→      }
   70→
   71→      if (!viteConfig.includes('treeshaking')) {
   72→        recommendations.push({
   73→          type: 'treeshaking',
   74→          description: 'Enable tree shaking for unused dependencies',
   75→          impact: 'medium',
   76→          implementation: `
   77→optimizeDeps: {
   78→  include: ['express', 'axios'],
   79→  exclude: ['@tensorflow/tfjs-node']
   80→}`
   81→        })
   82→      }
   83→
   84→      if (viteConfig.includes('assetsInlineLimit: 0')) {
   85→        recommendations.push({
   86→          type: 'asset-optimization',
   87→          description: 'Increase asset inline limit for small assets',
   88→          impact: 'medium',
   89→          implementation: 'Change assetsInlineLimit from 0 to 4096'
   90→        })
   91→      }
   92→    } catch (error) {
   93→      console.warn('Could not analyze vite.config.ssr.js')
   94→    }
   95→
   96→    // Check build script optimizations
   97→    try {
   98→      const buildScript = fs.readFileSync('build-ssr.js', 'utf8')
   99→
  100→      if (!buildScript.includes('parallel')) {
  101→        recommendations.push({
  102→          type: 'parallel-processing',
  103→          description: 'Add parallel processing for file operations',
  104→          impact: 'high',
  105→          implementation: 'Use Promise.all() for concurrent file copying'
  106→        })
  107→      }
  108→
  109→      if (buildScript.includes('copyDirectory')) {
  110→        recommendations.push({
  111→          type: 'file-copy-optimization',
  112→          description: 'Optimize directory copying with better streaming',
  113→          impact: 'medium',
  114→          implementation: 'Use streams for large file copying'
  115→        })
  116→      }
  117→    } catch (error) {
  118→      console.warn('Could not analyze build-ssr.js')
  119→    }
  120→
  121→    // Check for potential npm optimizations
  122→    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  123→    if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 20) {
  124→      recommendations.push({
  125→        type: 'dependency-optimization',
  126→        description: 'Consider reducing dependencies or moving some to devDependencies',
  127→        impact: 'high',
  128→        implementation: 'Audit dependencies with npm audit and remove unused packages'
  129→      })
  130→    }
  131→
  132→    recommendations.sort((a, b) => {
  133→      const impactOrder = { high: 3, medium: 2, low: 1 }
  134→      return impactOrder[b.impact] - impactOrder[a.impact]
  135→    })
  136→
  137→    return recommendations
  138→  }
  139→
  140→  createOptimizedBuildScript() {
  141→    console.log('\n🔧 Creating optimized build script...')
  142→
  143→    const optimizedScript = `import fs from 'fs'
  144→import path from 'path'
  145→import { fileURLToPath } from 'url'
  146→import { build } from 'vite'
  147→import { createRequire } from 'module'
  148→import { Worker } from 'worker_threads'
  149→
  150→const __filename = fileURLToPath(import.meta.url)
  151→const __dirname = path.dirname(__filename)
  152→
  153→class OptimizedSSRBuilder {
  154→  constructor() {
  155→    this.startTime = Date.now()
  156→    this.metrics = {
  157→      phaseTimings: {},
  158→      fileCounts: {},
  159→      bundleSize: 0
  160→    }
  161→  }
  162→
  163→  async build() {
  164→    console.log('🚀 Starting optimized SSR build process...')
  165→
  166→    try {
  167→      await this.runPhraseBuild()
  168→      await this.buildClientAssets()
  169→      await this.copyStaticFiles()
  170→      await this.copyDirectories()
  171→      await this.generateBuildReport()
  172→
  173→      const totalTime = Date.now() - this.startTime
  174→      console.log(\\`🎉 Optimized SSR build completed in \${totalTime}ms!\`)
  175→
  176→    } catch (error) {
  177→      console.error('❌ Optimized SSR build failed:', error)
  178→      process.exit(1)
  179→    }
  180→  }
  181→
  182→  async runPhraseBuild() {
  183→    const phaseStart = Date.now()
  184→    console.log('📝 Processing phrases and generating content...')
  185→
  186→    try {
  187→      const PhraseBuildProcess = (await import('./build-process.js')).default
  188→      const phraseProcess = new PhraseBuildProcess()
  189→
  190→      await phraseProcess.build({
  191→        inputDir: __dirname,
  192→        outputDir: path.join(__dirname, 'dist'),
  193→        loadFromCMS: true,
  194→        runViteBuild: false
  195→      })
  196→
  197→      this.metrics.phaseTimings.phraseBuild = Date.now() - phaseStart
  198→      console.log(\`✅ Phrase processing completed in \${this.metrics.phaseTimings.phraseBuild}ms\\`)
  199→    } catch (error) {
  200→      console.warn('⚠️ Phrase build failed, continuing...')
  201→      this.metrics.phaseTimings.phraseBuild = Date.now() - phaseStart
  202→    }
  203→  }
  204→
  205→  async buildClientAssets() {
  206→    const phaseStart = Date.now()
  207→    console.log('🔨 Building client-side assets with optimizations...')
  208→
  209→    await build({
  210→      configFile: path.join(__dirname, 'vite.config.ssr.js'),
  211→      mode: 'production',
  212→      logLevel: 'warn'
  213→    })
  214→
  215→    this.metrics.phaseTimings.clientBuild = Date.now() - phaseStart
  216→    console.log(\`✅ Client assets built in \${this.metrics.phaseTimings.clientBuild}ms\`)
  217→  }
  218→
  219→  async copyStaticFiles() {
  220→    const phaseStart = Date.now()
  221→    console.log('📁 Copying static files with parallel processing...')
  222→
  223→    const staticFiles = [
  224→      'schwepe-descriptions.json',
  225→      'schwepe.gif',
  226→      'favicon.ico',
  227→      'navbar.html',
  228→      'navbar.css',
  229→      'lore.css',
  230→      'decap-cms.yml'
  231→    ]
  232→
  233→    // Use Promise.all for parallel copying
  234→    await Promise.all(staticFiles.map(async (file) => {
  235→      const src = path.join(__dirname, file)
  236→      const dest = path.join(__dirname, 'dist', file)
  237→      if (fs.existsSync(src)) {
  238→        await fs.promises.copyFile(src, dest)
  239→        console.log(\\`✅ Copied \${file}\`)
  240→      }
  241→    }))
  242→
  243→    this.metrics.phaseTimings.staticCopy = Date.now() - phaseStart
  244→    this.metrics.fileCounts.staticFiles = staticFiles.length
  245→    console.log(\`✅ Static files copied in \${this.metrics.phaseTimings.staticCopy}ms\\`)
  246→  }
  247→
  248→  async copyDirectories() {
  249→    const phaseStart = Date.now()
  250→    console.log('📁 Copying directories...')
  251→
  252→    const directories = ['schwepe', '
  253→
  254→    // Process directories in parallel batches
  255→    const batchSize = 3
  256→    for (let i = 0; i < directories.length; i += batchSize) {
  257→      const batch = directories.slice(i, i + batchSize)
  258→      await Promise.all(batch.map(dir => this.copyDirectory(dir)))
  259→    }
  260→
  261→    this.metrics.phaseTimings.directoryCopy = Date.now() - phaseStart
  262→    this.metrics.fileCounts.directories = directories.length
  263→    console.log(\`✅ Directories copied in \${this.metrics.phaseTimings.directoryCopy}ms\`)
  264→  }
  265→
  266→  async copyDirectory(dir) {
  267→    const src = path.join(__dirname, dir)
  268→    const dest = path.join(__dirname, 'dist', dir)
  269→
  270→    if (!fs.existsSync(src)) return
  271→
  272→    if (!fs.existsSync(dest)) {
  273→      fs.mkdirSync(dest, { recursive: true })
  274→    }
  275→
  276→    const entries = fs.readdirSync(src, { withFileTypes: true })
  277→    for (const entry of entries) {
  278→      const srcPath = path.join(src, entry.name)
  279→      const destPath = path.join(dest, entry.name)
  280→
  281→      if (entry.isDirectory()) {
  282→        await this.copyDirectoryRecursive(srcPath, destPath)
  283→      } else {
  284→        await fs.promises.copyFile(srcPath, destPath)
  285→      }
  286→    }
  287→
  288→    console.log(\\`✅ Copied \${dir}/\`)
  289→  }
  290→
  291→  async copyDirectoryRecursive(src, dest) {
  292→    if (!fs.existsSync(dest)) {
  293→      fs.mkdirSync(dest, { recursive: true })
  294→    }
  295→
  296→    const entries = fs.readdirSync(src, { withFileTypes: true })
  297→    for (const entry of entries) {
  298→      const srcPath = path.join(src, entry.name)
  299→      const destPath = path.join(dest, entry.name)
  300→
  301→      if (entry.isDirectory()) {
  302→        await this.copyDirectoryRecursive(srcPath, destPath)
  303→      } else {
  304→        await fs.promises.copyFile(srcPath, destPath)
  305→      }
  306→    }
  307→  }
  308→
  309→  async generateBuildReport() {
  310→    const totalTime = Date.now() - this.startTime
  311→    const report = {
  312→      buildTime: totalTime,
  313→      phaseTimings: this.metrics.phaseTimings,
  314→      fileCounts: this.metrics.fileCounts,
  315→      timestamp: new Date().toISOString(),
  316→      optimization: 'optimized'
  317→    }
  318→
  319→    const reportPath = path.join(__dirname, 'dist', 'build-report.json')
  320→    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2))
  321→
  322→    console.log('\\n📊 Build Report:')
  323→    console.log(\`Total Time: \${totalTime}ms\\`)
  324→    Object.entries(this.metrics.phaseTimings).forEach(([phase, time]) => {
  325→      const percentage = ((time / totalTime) * 100).toFixed(1)
  326→      console.log(\`  \${phase}: \${time}ms (\${percentage}%)\`)
  327→    })
  328→  }
  329→}
  330→
  331→// Run optimized build
  332→const builder = new OptimizedSSRBuilder()
  333→builder.build()
  334→`
  335→
  336→    fs.writeFileSync('build-ssr-optimized.js', optimizedScript)
  337→    console.log('✅ Created optimized build script: build-ssr-optimized.js')
  338→
  339→    // Update package.json with new script
  340→    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  341→    packageJson.scripts['build:ssr:optimized'] = 'node build-ssr-optimized.js'
  342→    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2))
  343→
  344→    console.log('✅ Added new npm script: build:ssr:optimized')
  345→  }
  346→
  347→  generateOptimizedViteConfig() {
  348→    console.log('\n⚡ Creating optimized Vite configuration...')
  349→
  350→    const optimizedConfig = `import { defineConfig } from 'vite'
  351→import { resolve } from 'path'
  352→
  353→// Optimized SSR-compatible Vite configuration
  354→export default defineConfig({
  355→  root: '.',
  356→  build: {
  357→    outDir: 'dist',
  358→    rollupOptions: {
  359→      input: {
  360→        main: resolve(__dirname, 'index.html'),
  361→        gallery: resolve(__dirname, 'gallery.html'),
  362→        lore: resolve(__dirname, 'lore.html'),
  363→        videosThread: resolve(__dirname, 'videos-thread.html'),
  364→        imagesThread: resolve(__dirname, 'images-thread.html')
  365→      },
  366→      output: {
  367→        manualChunks: {
  368→          vendor: ['vite'],
  369→          utils: ['axios', 'mime'],
  370→          media: ['@tensorflow/tfjs-node', '@imgly/background-removal-node']
  371→        }
  372→      }
  373→    },
  374→    emptyOutDir: false,
  375→    assetsInlineLimit: 4096, // Increased from 0 for better performance
  376→    target: 'esnext',
  377→    minify: 'esbuild',
  378→    sourcemap: false, // Disabled for production builds
  379→    chunkSizeWarningLimit: 1000
  380→  },
  381→
  382→  // SSR configuration
  383→  ssr: {
  384→    noExternal: [],
  385→    target: 'node'
  386→  },
  387→
  388→  server: {
  389→    port: 3000,
  390→    cors: {
  391→      origin: '*',
  392→      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  393→      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  394→      credentials: false
  395→    },
  396→    host: true
  397→  },
  398→
  399→  preview: {
  400→    port: 4173,
  401→    cors: {
  402→      origin: '*',
  403→      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  404→      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  405→      credentials: false
  406→    },
  407→    host: true
  408→  },
  409→
  410→  // Optimized dependencies
  411→  optimizeDeps: {
  412→    include: ['express', 'axios', 'mime'],
  413→    exclude: ['@tensorflow/tfjs-node', '@imgly/background-removal-node']
  414→  },
  415→
  416→  // CSS processing
  417→  css: {
  418→    devSourcemap: false
  419→  },
  420→
  421→  // Build performance optimizations
  422→  esbuild: {
  423→    target: 'es2020',
  424→    drop: ['console', 'debugger']
  425→  }
  426→})
  427→`
  428→
  429→    fs.writeFileSync('vite.config.ssr.optimized.js', optimizedConfig)
  430→    console.log('✅ Created optimized Vite config: vite.config.ssr.optimized.js')
  431→  }
  432→
  433→  async runComparisonBuilds() {
  434→    console.log('\n🏁 Running comparison builds...')
  435→
  436→    if (!fs.existsSync('node_modules')) {
  437→      console.log('❌ node_modules not found. Please run npm install first.')
  438→      return false
  439→    }
  440→
  441→    const builds = ['original', 'optimized']
  442→    const results = {}
  443→
  444→    for (const buildType of builds) {
  445→      console.log(`\\n📦 Running ${buildType} build...`)
  446→
  447→      try {
  448→        const startTime = Date.now()
  449→        const script = buildType === 'original' ? 'build:ssr:production' : 'build:ssr:optimized'
  450→
  451→        // Run build and capture output
  452→        const output = execSync(`npm run ${script}`, {
  453→          encoding: 'utf8',
  454→          stdio: 'pipe',
  455→          timeout: 300000 // 5 minute timeout
  456→        })
  457→
  458→        const buildTime = Date.now() - startTime
  459→
  460→        // Analyze dist directory
  461→        const distStats = this.analyzeDistDirectory()
  462→
  463→        results[buildType] = {
  464→          buildTime,
  465→          success: true,
  466→          output,
  467→          ...distStats
  468→        }
  469→
  470→        console.log(`✅ ${buildType} build completed in ${buildTime}ms`)
  471→
  472→        // Clean up for next build
  473→        if (fs.existsSync('dist')) {
  474→          fs.rmSync('dist', { recursive: true, force: true })
  475→        }
  476→
  477→      } catch (error) {
  478→        results[buildType] = {
  479→          buildTime: 0,
  480→          success: false,
  481→          error: error.message
  482→        }
  483→
  484→        console.log(`❌ ${buildType} build failed: ${error.message}`)
  485→      }
  486→    }
  487→
  488→    return results
  489→  }
  490→
  491→  analyzeDistDirectory() {
  492→    const distPath = 'dist'
  493→    if (!fs.existsSync(distPath)) {
  494→      return { totalSize: 0, fileCount: 0, directories: [] }
  495→    }
  496→
  497→    let totalSize = 0
  498→    let fileCount = 0
  499→    const directories = []
  500→
  501→    const analyzeDir = (dir, relativePath = '') => {
  502→      const entries = fs.readdirSync(dir, { withFileTypes: true })
  503→
  504→      for (const entry of entries) {
  505→        const fullPath = path.join(dir, entry.name)
  506→        const relativeFullPath = path.join(relativePath, entry.name)
  507→
  508→        if (entry.isDirectory()) {
  509→          directories.push(relativeFullPath)
  510→          analyzeDir(fullPath, relativeFullPath)
  511→        } else {
  512→          const stats = fs.statSync(fullPath)
  513→          totalSize += stats.size
  514→          fileCount++
  515→        }
  516→      }
  517→    }
  518→
  519→    analyzeDir(distPath)
  520→
  521→    return {
  522→      totalSize,
  523→      fileCount,
  524→      directoryCount: directories.length,
  525→      directories
  526→    }
  527→  }
  528→
  529→  generatePerformanceReport(results) {
  530→    console.log('\\n📊 Generating performance report...')
  531→
  532→    let report = '# SSR Build Performance Analysis Report\\n\\n'
  533→    report += `Generated: ${new Date().toISOString()}\\n\\n`
  534→
  535→    // Build time comparison
  536→    if (results.original && results.optimized) {
  537→      const timeImprovement = ((results.original.buildTime - results.optimized.buildTime) / results.original.buildTime * 100).toFixed(1)
  538→      const speedup = (results.original.buildTime / results.optimized.buildTime).toFixed(2)
  539→
  540→      report += '## Build Time Comparison\\n\\n'
  541→      report += '| Build Type | Time (ms) | Success |\\n'
  542→      report += '|------------|-----------|---------|\\n'
  543→      report += `| Original | ${results.original.buildTime} | ${results.original.success ? '✅' : '❌'} |\\n`
  544→      report += `| Optimized | ${results.optimized.buildTime} | ${results.optimized.success ? '✅' : '❌'} |\\n\\n`
  545→
  546→      if (results.original.success && results.optimized.success) {
  547→        report += `**Performance Improvement:** ${timeImprovement}% faster (${speedup}x speedup)\\n\\n`
  548→      }
  549→    }
  550→
  551→    // Bundle size analysis
  552→    if (results.original && results.optimized) {
  553→      report += '## Bundle Size Analysis\\n\\n'
  554→      report += '| Build Type | Total Size | File Count | Directories |\\n'
  555→      report += '|------------|------------|------------|-------------|\\n'
  556→      report += `| Original | ${this.formatBytes(results.original.totalSize)} | ${results.original.fileCount} | ${results.original.directoryCount} |\\n`
  557→      report += `| Optimized | ${this.formatBytes(results.optimized.totalSize)} | ${results.optimized.fileCount} | ${results.optimized.directoryCount} |\\n\\n`
  558→
  559→      if (results.original.totalSize && results.optimized.totalSize) {
  560→        const sizeImprovement = ((results.original.totalSize - results.optimized.totalSize) / results.original.totalSize * 100).toFixed(1)
  561→        report += `**Size Improvement:** ${sizeImprovement}% reduction\\n\\n`
  562→      }
  563→    }
  564→
  565→    // Optimization recommendations
  566→    const recommendations = this.generateOptimizationRecommendations()
  567→    if (recommendations.length > 0) {
  568→      report += '## Optimization Recommendations\\n\\n'
  569→      recommendations.forEach((rec, index) => {
  570→        report += `${index + 1}. **${rec.type}** (${rec.impact} impact)\\n`
  571→        report += `   - ${rec.description}\\n`
  572→        report += '   - Implementation: \\`\'\`javascript\\n${rec.implementation}\\n\\`\`\`\\n\\n`
  573→      })
  574→    }
  575→
  576→    // Error analysis
  577→    const errors = []
  578→    if (results.original && !results.original.success) errors.push(results.original.error)
  579→    if (results.optimized && !results.optimized.success) errors.push(results.optimized.error)
  580→
  581→    if (errors.length > 0) {
  582→      report += '## Build Errors\\n\\n'
  583→      errors.forEach((error, index) => {
  584→        report += `${index + 1}. ${error}\\n\\n`
  585→      })
  586→    }
  587→
  588→    return report
  589→  }
  590→
  591→  formatBytes(bytes) {
  592→    if (bytes === 0) return '0 Bytes'
  593→    const k = 1024
  594→    const sizes = ['Bytes', 'KB', 'MB', 'GB']
  595→    const i = Math.floor(Math.log(bytes) / Math.log(k))
  596→    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  597→  }
  598→
  599→  async saveReport(report) {
  600→    const reportPath = path.join(__dirname, 'build-performance-report.md')
  601→    await fs.promises.writeFile(reportPath, report)
  602→    console.log(`📄 Performance report saved to: ${reportPath}`)
  603→  }
  604→}
  605→
  606→// Main execution
  607→async function main() {
  608→  const optimizer = new BuildOptimizer()
  609→
  610→  console.log('🚀 SSR Build System Optimizer')
  611→  console.log('================================')
  612→
  613→  // Analyze current setup
  614→  const buildScripts = optimizer.analyzeCurrentSetup()
  615→
  616→  // Generate recommendations
  617→  const recommendations = optimizer.generateOptimizationRecommendations()
  618→  console.log(`\\n💡 Generated ${recommendations.length} optimization recommendations`)
  619→
  620→  // Create optimized scripts
  621→  optimizer.createOptimizedBuildScript()
  622→  optimizer.generateOptimizedViteConfig()
  623→
  624→  // Run comparison builds
  625→  const results = await optimizer.runComparisonBuilds()
  626→
  627→  // Generate and save report
  628→  const report = optimizer.generatePerformanceReport(results)
  629→  await optimizer.saveReport(report)
  630→
  631→  console.log('\\n🎉 Build optimization analysis complete!')
  632→  console.log('📄 Check build-performance-report.md for detailed results')
  633→}
  634→
  635→// Run if called directly
  636→if (import.meta.url === `file://${process.argv[1]}`) {
  637→  main().catch(console.error)
  638→}
  639→
  640→export default BuildOptimizer