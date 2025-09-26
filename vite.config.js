import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { dirname, join } from 'path'

export default defineConfig({
  root: '.', // Use root as the base directory
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        lore: resolve(__dirname, 'lore.html'),
        stats: resolve(__dirname, 'stats.html')
      }
    },
    // Hook to copy additional files after build
    emptyOutDir: false,
    assetsInlineLimit: 0
  },
  plugins: [
    {
      name: 'copy-static-files',
      closeBundle: {
        sequential: true,
        handler() {
          console.log('Copying additional static files...')

          // Copy JSON file
          const jsonFile = resolve(__dirname, 'schwepe-descriptions.json')
          if (existsSync(jsonFile)) {
            copyFileSync(jsonFile, resolve(__dirname, 'dist', 'schwepe-descriptions.json'))
            console.log('✅ Copied schwepe-descriptions.json')
          }

          // Copy navbar file
          const navbarFile = resolve(__dirname, 'navbar.html')
          if (existsSync(navbarFile)) {
            copyFileSync(navbarFile, resolve(__dirname, 'dist', 'navbar.html'))
            console.log('✅ Copied navbar.html')
          }

          // Copy lore data file
          const loreDataFile = resolve(__dirname, 'lore-data.json')
          if (existsSync(loreDataFile)) {
            copyFileSync(loreDataFile, resolve(__dirname, 'dist', 'lore-data.json'))
            console.log('✅ Copied lore-data.json')
          }

          // Copy lore CSS file
          const loreCssFile = resolve(__dirname, 'lore.css')
          if (existsSync(loreCssFile)) {
            copyFileSync(loreCssFile, resolve(__dirname, 'dist', 'lore.css'))
            console.log('✅ Copied lore.css')
          }

          // Copy decap CMS config
          const decapConfigFile = resolve(__dirname, 'decap-cms.yml')
          if (existsSync(decapConfigFile)) {
            copyFileSync(decapConfigFile, resolve(__dirname, 'dist', 'decap-cms.yml'))
            console.log('✅ Copied decap-cms.yml')
          }

          // Copy static folder
          const sourceStaticDir = resolve(__dirname, 'static')
          const destStaticDir = resolve(__dirname, 'dist', 'static')
          if (existsSync(sourceStaticDir)) {
            if (!existsSync(destStaticDir)) {
              mkdirSync(destStaticDir, { recursive: true })
            }

            // Copy all files from static folder
            const staticFiles = readdirSync(sourceStaticDir)
            staticFiles.forEach(file => {
              const srcFile = join(sourceStaticDir, file)
              const destFile = join(destStaticDir, file)
              copyFileSync(srcFile, destFile)
            })
            console.log('✅ Copied static folder')
          }

          // Copy schwepe folder if it doesn't exist in dist
          const sourceSchwepeDir = resolve(__dirname, 'schwepe')
          const destSchwepeDir = resolve(__dirname, 'dist', 'schwepe')
          if (existsSync(sourceSchwepeDir)) {
            if (!existsSync(destSchwepeDir)) {
              mkdirSync(destSchwepeDir, { recursive: true })
            }

            // Copy all files from schwepe folder
            const files = readdirSync(sourceSchwepeDir)
            files.forEach(file => {
              const srcFile = join(sourceSchwepeDir, file)
              const destFile = join(destSchwepeDir, file)
              copyFileSync(srcFile, destFile)
            })
            console.log('✅ Copied schwepe folder')
          }
        }
      }
    }
  ],
  server: {
    port: 3000
  }
})