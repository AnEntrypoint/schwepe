import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TemplateEngine } from './lib/template-engine.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we're working from the correct directory
const projectRoot = __dirname;

async function buildSite(siteId) {
  console.log('Building site: ' + siteId);
  
  const templateEngine = new TemplateEngine(path.join(projectRoot, 'sites'));
  const config = await templateEngine.loadSiteConfig(siteId);
  
  const distPath = path.join(projectRoot, 'dist', siteId);
  await fs.mkdir(distPath, { recursive: true });
  
  const templates = Object.values(config.templates);
  
  for (const template of templates) {
    console.log('  Rendering ' + template);
    const html = await templateEngine.render(siteId, template, {});
    await fs.writeFile(path.join(distPath, template), html);
  }
  
  const sitePath = path.join(projectRoot, 'sites', siteId);
  const siteDistPath = path.join(distPath, 'site-assets');

  await fs.mkdir(siteDistPath, { recursive: true });

  const itemsToCopy = ['config.json', 'templates', 'styles', 'scripts'];
  for (const item of itemsToCopy) {
    const source = path.join(sitePath, item);
    const dest = path.join(siteDistPath, item);
    try {
      await fs.access(source);
      if ((await fs.stat(source)).isDirectory()) {
        await execAsync('cp -r "' + source + '" "' + dest + '"');
      } else {
        await execAsync('cp "' + source + '" "' + dest + '"');
      }
    } catch (err) {
    }
  }

  const faviconSource = path.join(sitePath, 'media', 'static', 'favicon.ico');
  const faviconDest = path.join(distPath, 'favicon.ico');
  try {
    await fs.access(faviconSource);
    await execAsync('cp "' + faviconSource + '" "' + faviconDest + '"');
  } catch (err) {
  }

  const logoSource = path.join(sitePath, 'media', 'static', 'logo.gif');
  const logoDest = path.join(distPath, 'logo.gif');
  try {
    await fs.access(logoSource);
    await execAsync('cp "' + logoSource + '" "' + logoDest + '"');
  } catch (err) {
  }

  // Copy JavaScript modules and assets to dist root for module imports
  const modulesToCopy = ['schwelevision.js', 'playback-handler.js', 'tv-scheduler.js', 'navbar.js', 'navbar.html', 'navbar.css'];
  for (const module of modulesToCopy) {
    const source = path.join(sitePath, module);
    const dest = path.join(distPath, module);
    try {
      await fs.access(source);
      await execAsync('cp "' + source + '" "' + dest + '"');
      console.log('  ✓ Copied ' + module);
    } catch (err) {
      console.log('  ⚠ Skipped ' + module + ' (not found)');
    }
  }

  const libSource = path.join(sitePath, 'lib');
  const libDest = path.join(distPath, 'lib');
  try {
    await fs.access(libSource);
    await execAsync('cp -r "' + libSource + '" "' + libDest + '"');
    console.log('  ✓ Copied lib/ directory');
  } catch (err) {
    console.log('  ⚠ Skipped lib/ directory (not found)');
  }

  console.log('✓ Built ' + siteId);
}

async function buildAll() {
  console.log('Building all sites...');
  
  const sitesDir = path.join(projectRoot, 'sites');
  const sites = await fs.readdir(sitesDir);
  
  const distPath = path.join(projectRoot, 'dist');
  await fs.rm(distPath, { recursive: true, force: true });
  await fs.mkdir(distPath, { recursive: true });
  
  // Copy public and static directories if they exist
  const publicPath = path.join(projectRoot, 'public');
  const staticPath = path.join(projectRoot, 'static');
  
  try {
    await fs.access(publicPath);
    await execAsync('cp -r "' + publicPath + '" "' + path.join(distPath, 'public') + '"');
    console.log('✓ Copied public directory');
  } catch (err) {
    console.log('⚠ Public directory not found, skipping');
  }
  
  try {
    await fs.access(staticPath);
    await execAsync('cp -r "' + staticPath + '" "' + path.join(distPath, 'static') + '"');
    console.log('✓ Copied static directory');
  } catch (err) {
    console.log('⚠ Static directory not found, skipping');
  }

  // Copy package-lock.json for deployment
  try {
    await fs.access(path.join(projectRoot, 'package-lock.json'));
    await fs.copyFile(
      path.join(projectRoot, 'package-lock.json'),
      path.join(distPath, 'package-lock.json')
    );
    console.log('✓ Copied package-lock.json');
  } catch (err) {
    console.log('⚠ package-lock.json not found, skipping');
  }
  
  for (const siteId of sites.filter(s => !s.startsWith('.') && s !== 'README.md')) {
    const statResult = await fs.stat(path.join(sitesDir, siteId));
    if (statResult.isDirectory()) {
      await buildSite(siteId);
    }
  }
  
  console.log('✓ All sites built successfully');
}

// Handle both direct execution and module import
if (import.meta.url === 'file://' + process.argv[1]) {
  buildAll().catch(console.error);
}

export { buildSite, buildAll };
