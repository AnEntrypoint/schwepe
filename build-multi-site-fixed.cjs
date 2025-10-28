#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Building all sites...');

const projectRoot = process.cwd();
const distPath = path.join(projectRoot, 'dist');
const sitesPath = path.join(projectRoot, 'sites');

// Clean dist directory
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });

// Copy public directory if exists
const publicPath = path.join(projectRoot, 'public');
if (fs.existsSync(publicPath)) {
  execSync('cp -r "' + publicPath + '" "' + path.join(distPath, 'public') + '"');
  console.log('✓ Copied public directory');
}

// Copy static directory if exists  
const staticPath = path.join(projectRoot, 'static');
if (fs.existsSync(staticPath)) {
  execSync('cp -r "' + staticPath + '" "' + path.join(distPath, 'static') + '"');
  console.log('✓ Copied static directory');
}

// Get sites
const sites = fs.readdirSync(sitesPath)
  .filter(s => !s.startsWith('.') && s !== 'README.md')
  .filter(s => fs.statSync(path.join(sitesPath, s)).isDirectory());

console.log('Found sites:', sites);

// Build each site
for (const siteId of sites) {
  console.log('Building site: ' + siteId);
  
  const siteDistPath = path.join(distPath, siteId);
  fs.mkdirSync(siteDistPath, { recursive: true });
  
  // Copy templates
  const templatesPath = path.join(sitesPath, siteId, 'templates');
  if (fs.existsSync(templatesPath)) {
    const templates = fs.readdirSync(templatesPath);
    for (const template of templates) {
      const src = path.join(templatesPath, template);
      const dest = path.join(siteDistPath, template);
      fs.copyFileSync(src, dest);
      console.log('  Rendering ' + template);
    }
  }
  
  // Copy site assets
  const siteAssetsPath = path.join(sitesPath, siteId, 'site-assets');
  if (fs.existsSync(siteAssetsPath)) {
    const destAssetsPath = path.join(siteDistPath, 'site-assets');
    execSync('cp -r "' + siteAssetsPath + '" "' + destAssetsPath + '"');
  }
  
  console.log('✓ Built ' + siteId);
}

console.log('✓ All sites built successfully');

// Write build log
fs.writeFileSync('build.log', JSON.stringify({
  timestamp: new Date().toISOString(),
  sites: sites,
  success: true
}, null, 2));

