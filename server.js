import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { DomainRouter } from './lib/domain-router.js';
import { TemplateEngine } from './lib/template-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

async function createServer() {
  const app = express();
  
  const domainRouter = new DomainRouter('./sites');
  await domainRouter.initialize();
  
  const templateEngine = new TemplateEngine('./sites');
  
  app.use(domainRouter.middleware());
  
  app.use('/site-assets', (req, res, next) => {
    const sitePath = path.join(__dirname, 'sites', req.siteId);
    express.static(sitePath)(req, res, next);
  });
  
  app.use('/static', express.static(path.join(__dirname, 'static')));
  app.use(express.static(path.join(__dirname, 'public')));
  
  app.get('/api/:siteId/schedule', async (req, res) => {
    try {
      const schedulePath = path.join(__dirname, 'sites', req.params.siteId, 'schedule.json');
      const schedule = await fs.promises.readFile(schedulePath, 'utf-8');
      res.json(JSON.parse(schedule));
    } catch (error) {
      res.status(404).json({ error: 'Schedule not found' });
    }
  });
  
  app.get('/api/:siteId/media/:type', async (req, res) => {
    try {
      const { siteId, type } = req.params;
      const mediaPath = path.join(__dirname, 'sites', siteId, 'media', type);
      
      if (!fs.existsSync(mediaPath)) {
        return res.json([]);
      }
      
      const files = fs.readdirSync(mediaPath);
      const validExts = type === 'images' 
        ? ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
        : ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.gif'];
      
      const mediaFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return validExts.includes(ext);
      });
      
      const mediaData = mediaFiles.map(file => {
        const filePath = path.join(mediaPath, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      }).sort((a, b) => new Date(b.created) - new Date(a.created));
      
      res.json(mediaData);
    } catch (error) {
      console.error('Error serving media API:', error);
      res.json([]);
    }
  });
  
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
  }
  
  const routes = ['', 'gallery', 'lore', 'videos-thread', 'images-thread'];
  
  routes.forEach(route => {
    app.get(`/${route}`, async (req, res) => {
      try {
        const templateName = route === '' ? 'index.html' : `${route}.html`;
        const config = await templateEngine.loadSiteConfig(req.siteId);
        
        let html;
        if (isDev) {
          html = await templateEngine.render(req.siteId, templateName, {});
          html = await vite.transformIndexHtml(req.url, html);
        } else {
          const distPath = path.join(__dirname, 'dist', req.siteId, templateName);
          if (fs.existsSync(distPath)) {
            html = await fs.promises.readFile(distPath, 'utf-8');
          } else {
            html = await templateEngine.render(req.siteId, templateName, {});
          }
        }
        
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        console.error(`Error serving ${route}:`, error);
        res.status(500).send('Server Error');
      }
    });
  });
  
  app.use('*', (req, res) => {
    res.status(404).send('Page not found');
  });
  
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Environment: ${isDev ? 'development' : 'production'}`);
    console.log('Sites:', Array.from(domainRouter.domainMap.entries()));
  });
}

createServer().catch(console.error);
