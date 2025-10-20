    1→import { defineConfig } from 'vite'
    2→import { resolve } from 'path'
    3→import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
    4→import { dirname, join } from 'path'
    5→import { corsProxyPlugin } from './vite-cors-plugin.js'
    6→
    7→function recursiveCopy(src, dest) {
    8→  if (!existsSync(src)) return
    9→
   10→  const stats = statSync(src)
   11→  if (stats.isFile()) {
   12→    copyFileSync(src, dest)
   13→  } else if (stats.isDirectory()) {
   14→    if (!existsSync(dest)) {
   15→      mkdirSync(dest, { recursive: true })
   16→    }
   17→    const files = readdirSync(src)
   18→    files.forEach(file => {
   19→      recursiveCopy(join(src, file), join(dest, file))
   20→    })
   21→  }
   22→}
   23→
   24→export default defineConfig({
   25→  root: '.', // Use root as the base directory
   26→  resolve: {
   27→    alias: {
   28→      '420kit-shared': resolve(__dirname, '../420kit/dist'),
   29→      '420kit-shared/tv-guide.js': resolve(__dirname, '../420kit/dist/tv-guide.js')
   30→    }
   31→  },
   32→  build: {
   33→    outDir: 'dist',
   34→    rollupOptions: {
   35→      input: {
   36→        main: resolve(__dirname, 'index.html'),
   37→        gallery: resolve(__dirname, 'gallery.html'),
   38→        lore: resolve(__dirname, 'lore.html'),
   39→        imagesThread: resolve(__dirname, 'images-thread.html'),
   40→        videosThread: resolve(__dirname, 'videos-thread.html')
   41→      }
   42→    },
   43→    // Hook to copy additional files after build
   44→    emptyOutDir: false,
   45→    assetsInlineLimit: 0
   46→  },
   47→  plugins: [
   48→    corsProxyPlugin(),
   49→    {
   50→      name: 'copy-static-files',
   51→      closeBundle: {
   52→        sequential: true,
   53→        handler() {
   54→          console.log('Copying additional static files...')
   55→
   56→          // Copy JSON file
   57→          const jsonFile = resolve(__dirname, 'schwepe-descriptions.json')
   58→          if (existsSync(jsonFile)) {
   59→            copyFileSync(jsonFile, resolve(__dirname, 'dist', 'schwepe-descriptions.json'))
   60→            console.log('✅ Copied schwepe-descriptions.json')
   61→          }
   62→
   63→          // Copy media JSON files
   64→          const imagesJsonFile = resolve(__dirname, 'saved_images.json')
   65→          if (existsSync(imagesJsonFile)) {
   66→            copyFileSync(imagesJsonFile, resolve(__dirname, 'dist', 'saved_images.json'))
   67→            console.log('✅ Copied saved_images.json')
   68→          }
   69→
   70→          const videosJsonFile = resolve(__dirname, 'saved_videos.json')
   71→          if (existsSync(videosJsonFile)) {
   72→            copyFileSync(videosJsonFile, resolve(__dirname, 'dist', 'saved_videos.json'))
   73→            console.log('✅ Copied saved_videos.json')
   74→          }
   75→
   76→          // Copy videos.json
   77→          const videosListFile = resolve(__dirname, 'videos.json')
   78→          if (existsSync(videosListFile)) {
   79→            copyFileSync(videosListFile, resolve(__dirname, 'dist', 'videos.json'))
   80→            console.log('✅ Copied videos.json')
   81→          }
   82→
   83→          // Copy images.json
   84→          const imagesListFile = resolve(__dirname, 'images.json')
   85→          if (existsSync(imagesListFile)) {
   86→            copyFileSync(imagesListFile, resolve(__dirname, 'dist', 'images.json'))
   87→            console.log('✅ Copied images.json')
   88→          }
   89→
   90→          // Copy navbar file
   91→          const navbarFile = resolve(__dirname, 'navbar.html')
   92→          if (existsSync(navbarFile)) {
   93→            copyFileSync(navbarFile, resolve(__dirname, 'dist', 'navbar.html'))
   94→            console.log('✅ Copied navbar.html')
   95→          }
   96→
   97→          // Copy navbar CSS file
   98→          const navbarCssFile = resolve(__dirname, 'navbar.css')
   99→          if (existsSync(navbarCssFile)) {
  100→            copyFileSync(navbarCssFile, resolve(__dirname, 'dist', 'navbar.css'))
  101→            console.log('✅ Copied navbar.css')
  102→          }
  103→
  104→          // Copy TV Guide client JS file
  105→          const tvGuideClientFile = resolve(__dirname, 'tv-guide-client.js')
  106→          if (existsSync(tvGuideClientFile)) {
  107→            copyFileSync(tvGuideClientFile, resolve(__dirname, 'dist', 'tv-guide-client.js'))
  108→            console.log('✅ Copied tv-guide-client.js')
  109→          }
  110→
  111→          // Note: images-thread.html and videos-thread.html are processed by Vite rollupOptions
  112→          // Do not copy them here as it would overwrite Vite's bundled output
  113→
  114→          // Copy lore data file
  115→          const loreDataFile = resolve(__dirname, 'lore-data.json')
  116→          if (existsSync(loreDataFile)) {
  117→            copyFileSync(loreDataFile, resolve(__dirname, 'dist', 'lore-data.json'))
  118→            console.log('✅ Copied lore-data.json')
  119→          }
  120→
  121→          // Copy lore CSS file
  122→          const loreCssFile = resolve(__dirname, 'lore.css')
  123→          if (existsSync(loreCssFile)) {
  124→            copyFileSync(loreCssFile, resolve(__dirname, 'dist', 'lore.css'))
  125→            console.log('✅ Copied lore.css')
  126→          }
  127→
  128→          // Copy decap CMS config
  129→          const decapConfigFile = resolve(__dirname, 'decap-cms.yml')
  130→          if (existsSync(decapConfigFile)) {
  131→            copyFileSync(decapConfigFile, resolve(__dirname, 'dist', 'decap-cms.yml'))
  132→            console.log('✅ Copied decap-cms.yml')
  133→          }
  134→
  135→          // Copy static folder
  136→          const sourceStaticDir = resolve(__dirname, 'static')
  137→          const destStaticDir = resolve(__dirname, 'dist', 'static')
  138→          if (existsSync(sourceStaticDir)) {
  139→            if (!existsSync(destStaticDir)) {
  140→              mkdirSync(destStaticDir, { recursive: true })
  141→            }
  142→
  143→            // Copy all files from static folder
  144→            const staticFiles = readdirSync(sourceStaticDir)
  145→            staticFiles.forEach(file => {
  146→              const srcFile = join(sourceStaticDir, file)
  147→              const destFile = join(destStaticDir, file)
  148→              copyFileSync(srcFile, destFile)
  149→            })
  150→            console.log('✅ Copied static folder')
  151→          }
  152→
  153→          // Copy saved_images folder
  154→          const sourceImagesDir = resolve(__dirname, 'saved_images')
  155→          const destImagesDir = resolve(__dirname, 'dist', 'saved_images')
  156→          if (existsSync(sourceImagesDir)) {
  157→            if (!existsSync(destImagesDir)) {
  158→              mkdirSync(destImagesDir, { recursive: true })
  159→            }
  160→
  161→            // Copy all files from saved_images folder
  162→            const imageFiles = readdirSync(sourceImagesDir)
  163→            imageFiles.forEach(file => {
  164→              const srcFile = join(sourceImagesDir, file)
  165→              const destFile = join(destImagesDir, file)
  166→              copyFileSync(srcFile, destFile)
  167→            })
  168→            console.log('✅ Copied saved_images folder')
  169→          }
  170→
  171→          // Copy saved_videos folder
  172→          const sourceVideosDir = resolve(__dirname, 'saved_videos')
  173→          const destVideosDir = resolve(__dirname, 'dist', 'saved_videos')
  174→          if (existsSync(sourceVideosDir)) {
  175→            if (!existsSync(destVideosDir)) {
  176→              mkdirSync(destVideosDir, { recursive: true })
  177→            }
  178→
  179→            // Copy all files from saved_videos folder
  180→            const videoFiles = readdirSync(sourceVideosDir)
  181→            videoFiles.forEach(file => {
  182→              const srcFile = join(sourceVideosDir, file)
  183→              const destFile = join(destVideosDir, file)
  184→              copyFileSync(srcFile, destFile)
  185→            })
  186→            console.log('✅ Copied saved_videos folder')
  187→          }
  188→
  189→          // Copy schwepe folder if it doesn't exist in dist
  190→          const sourceSchwepeDir = resolve(__dirname, 'schwepe')
  191→          const destSchwepeDir = resolve(__dirname, 'dist', 'schwepe')
  192→          if (existsSync(sourceSchwepeDir)) {
  193→            if (!existsSync(destSchwepeDir)) {
  194→              mkdirSync(destSchwepeDir, { recursive: true })
  195→            }
  196→
  197→            // Copy all files from schwepe folder
  198→            const files = readdirSync(sourceSchwepeDir)
  199→            files.forEach(file => {
  200→              const srcFile = join(sourceSchwepeDir, file)
  201→              const destFile = join(destSchwepeDir, file)
  202→              copyFileSync(srcFile, destFile)
  203→            })
  204→            console.log('✅ Copied schwepe folder')
  205→          }
  206→
  207→          // Copy public folder recursively
  208→          const sourcePublicDir = resolve(__dirname, 'public')
  209→          const destPublicDir = resolve(__dirname, 'dist', 'public')
  210→          if (existsSync(sourcePublicDir)) {
  211→            recursiveCopy(sourcePublicDir, destPublicDir)
  212→            console.log('✅ Copied public folder (recursive)')
  213→          }
  214→
  215→          
  241→          }
  242→
  243→          // Copy favicon to root of dist
  244→          const faviconFile = resolve(__dirname, 'public', 'favicon.ico')
  245→          if (existsSync(faviconFile)) {
  246→            copyFileSync(faviconFile, resolve(__dirname, 'dist', 'favicon.ico'))
  247→            console.log('✅ Copied favicon.ico to root')
  248→          }
  249→        }
  250→      }
  251→    }
  252→  ],
  253→  server: {
  254→    port: 3000,
  255→    cors: {
  256→      origin: '*',
  257→      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  258→      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  259→      credentials: false
  260→    },
  261→    host: true, // Allow external connections
  262→    proxy: {
  263→      '/api': {
  264→        target: 'https://api.github.com',
  265→        changeOrigin: true,
  266→        rewrite: (path) => path.replace(/^\/api/, ''),
  267→        secure: true
  268→      }
  269→    }
  270→  },
  271→  // Add custom middleware for serving media APIs during development
  272→  configureServer(server) {
  273→    server.middlewares.use('/api/saved-images', async (req, res, next) => {
  274→      if (req.method !== 'GET') return next();
  275→
  276→      try {
  277→        const fs = require('fs');
  278→        const path = require('path');
  279→        const imagesDir = path.join(__dirname, 'saved_images');
  280→
  281→        if (!fs.existsSync(imagesDir)) {
  282→          res.writeHead(404, { 'Content-Type': 'application/json' });
  283→          res.end(JSON.stringify({ error: 'Images directory not found' }));
  284→          return;
  285→        }
  286→
  287→        const files = fs.readdirSync(imagesDir);
  288→        const imageFiles = files
  289→          .filter(file => {
  290→            const ext = path.extname(file).toLowerCase();
  291→            return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
  292→          })
  293→          .map(file => {
  294→            const filePath = path.join(imagesDir, file);
  295→            const stats = fs.statSync(filePath);
  296→            const timestampMatch = file.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
  297→            const date = timestampMatch ? timestampMatch[1].replace(/-/g, ':').replace('T', 'T').replace(/Z/, 'Z') : stats.birthtime.toISOString();
  298→
  299→            return {
  300→              filename: file,
  301→              date: date,
  302→              size: stats.size,
  303→              created: stats.birthtime,
  304→              modified: stats.mtime
  305→            };
  306→          })
  307→          .sort((a, b) => new Date(b.date) - new Date(a.date));
  308→
  309→        res.writeHead(200, { 'Content-Type': 'application/json' });
  310→        res.end(JSON.stringify(imageFiles));
  311→      } catch (error) {
  312→        console.error('Error serving images API:', error);
  313→        res.writeHead(500, { 'Content-Type': 'application/json' });
  314→        res.end(JSON.stringify({ error: 'Failed to read images directory' }));
  315→      }
  316→    });
  317→
  318→    server.middlewares.use('/api/saved-videos', async (req, res, next) => {
  319→      if (req.method !== 'GET') return next();
  320→
  321→      try {
  322→        const fs = require('fs');
  323→        const path = require('path');
  324→        const videosDir = path.join(__dirname, 'saved_videos');
  325→
  326→        if (!fs.existsSync(videosDir)) {
  327→          res.writeHead(404, { 'Content-Type': 'application/json' });
  328→          res.end(JSON.stringify({ error: 'Videos directory not found' }));
  329→          return;
  330→        }
  331→
  332→        const files = fs.readdirSync(videosDir);
  333→        const videoFiles = files
  334→          .filter(file => {
  335→            const ext = path.extname(file).toLowerCase();
  336→            return ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.gif'].includes(ext);
  337→          })
  338→          .map(file => {
  339→            const filePath = path.join(videosDir, file);
  340→            const stats = fs.statSync(filePath);
  341→            const timestampMatch = file.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
  342→            const date = timestampMatch ? timestampMatch[1].replace(/-/g, ':').replace('T', 'T').replace(/Z/, 'Z') : stats.birthtime.toISOString();
  343→
  344→            return {
  345→              filename: file,
  346→              date: date,
  347→              size: stats.size,
  348→              created: stats.birthtime,
  349→              modified: stats.mtime
  350→            };
  351→          })
  352→          .sort((a, b) => new Date(b.date) - new Date(a.date));
  353→
  354→        res.writeHead(200, { 'Content-Type': 'application/json' });
  355→        res.end(JSON.stringify(videoFiles));
  356→      } catch (error) {
  357→        console.error('Error serving videos API:', error);
  358→        res.writeHead(500, { 'Content-Type': 'application/json' });
  359→        res.end(JSON.stringify({ error: 'Failed to read videos directory' }));
  360→      }
  361→    });
  362→  },
  363→  preview: {
  364→    port: 4173,
  365→    cors: {
  366→      origin: '*',
  367→      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  368→      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  369→      credentials: false
  370→    },
  371→    host: true, // Allow external connections
  372→    proxy: {
  373→      '/api': {
  374→        target: 'https://api.github.com',
  375→        changeOrigin: true,
  376→        rewrite: (path) => path.replace(/^\/api/, ''),
  377→        secure: true
  378→      }
  379→    }
  380→  }
  381→})