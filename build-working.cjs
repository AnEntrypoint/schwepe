#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const items = fs.readdirSync(src);
    for (const item of items) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('🚀 Building sites...');

const projectRoot = process.cwd();
const distPath = path.join(projectRoot, 'dist');

// Clean dist
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });

// Copy shared assets
copyRecursive(path.join(projectRoot, 'public'), path.join(distPath, 'public'));
copyRecursive(path.join(projectRoot, 'static'), path.join(distPath, 'static'));
console.log('✓ Copied public and static directories');

// Build sites
const sitesDir = path.join(projectRoot, 'sites');
const sites = fs.readdirSync(sitesDir)
  .filter(s => !s.startsWith('.') && s !== 'README.md')
  .filter(s => fs.statSync(path.join(sitesDir, s)).isDirectory());

for (const siteId of sites) {
  console.log(`Building site: ${siteId}`);
  const siteDir = path.join(sitesDir, siteId);
  const siteDist = path.join(distPath, siteId);
  
  // Copy templates
  const templatesDir = path.join(siteDir, 'templates');
  if (fs.existsSync(templatesDir)) {
    if (!fs.existsSync(siteDist)) {
      fs.mkdirSync(siteDist, { recursive: true });
    }
    const templates = fs.readdirSync(templatesDir);
    for (const template of templates) {
      fs.copyFileSync(path.join(templatesDir, template), path.join(siteDist, template));
      console.log(`  ✓ ${template}`);
    }
  }
  
  // Copy assets
  copyRecursive(path.join(siteDir, 'site-assets'), path.join(siteDist, 'site-assets'));
  console.log(`✓ Built ${siteId}`);
}

// Write build log
fs.writeFileSync('build.log', JSON.stringify({
  timestamp: new Date().toISOString(),
  sites: sites,
  success: true
}, null, 2));

console.log('🎉 All sites built successfully!');

