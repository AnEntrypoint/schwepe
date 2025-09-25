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
        'lore-intro': resolve(__dirname, 'lore-intro.html'),
        'lore-culture': resolve(__dirname, 'lore-culture.html'),
        'lore-multiverse': resolve(__dirname, 'lore-multiverse.html'),
        'lore-cult': resolve(__dirname, 'lore-cult.html'),
        'lore-economics': resolve(__dirname, 'lore-economics.html'),
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