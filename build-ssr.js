import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  const files = fs.readdirSync(src)
  files.forEach(file => {
    const srcPath = path.join(src, file)
    const destPath = path.join(dest, file)
    const stat = fs.statSync(srcPath)
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath)
    } else {
      try {
          fs.copyFileSync(srcPath, destPath);
      } catch (error) {
          console.warn('Could not copy file:', srcPath, error.message);
      }
    }
  })
}

function ensureDistExists() {
  const distPath = path.join(__dirname, 'dist')
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true })
  }
}

function copyDirectoriesToDist() {
  const directories = ['schwepe', 'public', 'static']
  directories.forEach(dir => {
    const src = path.join(__dirname, dir)
    const dest = path.join(__dirname, 'dist', dir)
    if (fs.existsSync(src)) {
      copyDirectory(src, dest)
      console.log(`✅ Copied ${dir}/`)
    }
  })
}

function copySiteAssets() {
  const sitesDir = path.join(__dirname, 'sites')
  if (fs.existsSync(sitesDir)) {
    const sites = fs.readdirSync(sitesDir)
    sites.forEach(siteId => {
      const siteDir = path.join(sitesDir, siteId)
      if (fs.existsSync(siteDir)) {
        const stat = fs.statSync(siteDir)
        if (stat.isDirectory()) {
          const destDir = path.join(__dirname, 'dist', siteId, 'site-assets')
          try {
            copyDirectory(siteDir, destDir)
            console.log(`✅ Copied site assets for ${siteId}/`)
          } catch (error) {
            console.warn(`⚠️ Warning copying ${siteId} assets:`, error.message)
          }
        }
      }
    })
  }
}

console.log('🔨 Building SSR structure...')
ensureDistExists()
copyDirectoriesToDist()
copySiteAssets()
console.log('✅ SSR build completed successfully!')
