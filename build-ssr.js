    1→import fs from 'fs'
    2→import path from 'path'
    3→import { fileURLToPath } from 'url'
    4→import { build } from 'vite'
    5→import PhraseBuildProcess from './build-process.js'
    6→
    7→const __filename = fileURLToPath(import.meta.url)
    8→const __dirname = path.dirname(__filename)
    9→
   10→async function buildSSR() {
   11→  console.log('🚀 Starting SSR build process...')
   12→
   13→  try {
   14→    // Step 1: Run phrase build process
   15→    console.log('📝 Processing phrases and generating content...')
   16→    const phraseProcess = new PhraseBuildProcess()
   17→    await phraseProcess.build({
   18→      inputDir: __dirname,
   19→      outputDir: path.join(__dirname, 'dist'),
   20→      loadFromCMS: true,
   21→      runViteBuild: false
   22→    })
   23→
   24→    // Step 2: Build client-side assets
   25→    console.log('🔨 Building client-side assets...')
   26→    await build({
   27→      configFile: path.join(__dirname, 'vite.config.ssr.js'),
   28→      mode: 'production'
   29→    })
   30→
   31→    // Step 3: Copy static files
   32→    console.log('📁 Copying static files...')
   33→    const staticFiles = [
   34→      'schwepe-descriptions.json',
   35→      'schwepe.gif',
   36→      'favicon.ico',
   37→      'navbar.html',
   38→      'navbar.css',
   39→      'lore.css',
   40→      'decap-cms.yml',
   41→      'tv-guide-client.js'
   42→    ]
   43→
   44→    staticFiles.forEach(file => {
   45→      const src = path.join(__dirname, file)
   46→      const dest = path.join(__dirname, 'dist', file)
   47→      if (fs.existsSync(src)) {
   48→        fs.copyFileSync(src, dest)
   49→        console.log(`✅ Copied ${file}`)
   50→      }
   51→    })
   52→
   53→    // Step 4: Copy directories and static content
   54→    const directories = ['schwepe', '
   55→    directories.forEach(dir => {
   56→      const src = path.join(__dirname, dir)
   57→      const dest = path.join(__dirname, 'dist', dir)
   58→      if (fs.existsSync(src)) {
   59→        copyDirectory(src, dest)
   60→        console.log(`✅ Copied ${dir}/`)
   61→      }
   62→    })
   63→
   64→    console.log('🎉 SSR build completed successfully!')
   65→    console.log('📦 Ready for deployment with node server.js')
   66→
   67→  } catch (error) {
   68→    console.error('❌ SSR build failed:', error)
   69→    process.exit(1)
   70→  }
   71→}
   72→
   73→function copyDirectory(src, dest) {
   74→  if (!fs.existsSync(dest)) {
   75→    fs.mkdirSync(dest, { recursive: true })
   76→  }
   77→
   78→  const entries = fs.readdirSync(src, { withFileTypes: true })
   79→  for (const entry of entries) {
   80→    const srcPath = path.join(src, entry.name)
   81→    const destPath = path.join(dest, entry.name)
   82→
   83→    if (entry.isDirectory()) {
   84→      copyDirectory(srcPath, destPath)
   85→    } else {
   86→      fs.copyFileSync(srcPath, destPath)
   87→    }
   88→  }
   89→}
   90→
   91→buildSSR()