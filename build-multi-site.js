import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TemplateEngine } from './lib/template-engine.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildSite(siteId) {
  console.log(`Building site: ${siteId}`);
  
  const templateEngine = new TemplateEngine('./sites');
  const config = await templateEngine.loadSiteConfig(siteId);
  
  const distPath = path.join(__dirname, 'dist', siteId);
  await fs.mkdir(distPath, { recursive: true });
  
  const templates = Object.values(config.templates);
  
  for (const template of templates) {
    console.log(`  Rendering ${template}`);
    const html = await templateEngine.render(siteId, template, {});
    await fs.writeFile(path.join(distPath, template), html);
  }
  
  const sitePath = path.join(__dirname, 'sites', siteId);
  const siteDistPath = path.join(distPath, 'site-assets');
  
  await execAsync(`cp -r "${sitePath}" "${siteDistPath}"`);
  
  console.log(`✓ Built ${siteId}`);
}

async function buildAll() {
  console.log('Building all sites...');
  
  const sitesDir = path.join(__dirname, 'sites');
  const sites = await fs.readdir(sitesDir);
  
  await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
  await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
  
  await execAsync('cp -r public dist/public');
  await execAsync('cp -r static dist/static');
  
  for (const siteId of sites.filter(s => !s.startsWith('.') && s !== 'README.md')) {
    const statResult = await fs.stat(path.join(sitesDir, siteId));
    if (statResult.isDirectory()) {
      await buildSite(siteId);
    }
  }
  
  console.log('✓ All sites built successfully');
}

buildAll().catch(console.error);
