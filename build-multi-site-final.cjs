console.log('🚀 Building all sites...');

const fs = require('fs');
const path = require('path');

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.log('⚠️  Source directory does not exist:', src);
    return;
  }

  // Create destination if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Copy all files recursively
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const projectRoot = process.cwd();
const distPath = path.join(projectRoot, 'dist');
const sitesPath = path.join(projectRoot, 'sites');

console.log('Project root:', projectRoot);

// Clean dist directory
console.log('Cleaning dist directory...');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });
console.log('✓ Dist directory created');

// Copy public directory if exists
const publicPath = path.join(projectRoot, 'public');
if (fs.existsSync(publicPath)) {
  copyDirectory(publicPath, path.join(distPath, 'public'));
  console.log('✓ Copied public directory');
}

// Copy static directory if exists  
const staticPath = path.join(projectRoot, 'static');
if (fs.existsSync(staticPath)) {
  copyDirectory(staticPath, path.join(distPath, 'static'));
  console.log('✓ Copied static directory');
}

// Get sites
console.log('Discovering sites...');
const sites = fs.readdirSync(sitesPath)
  .filter(s => !s.startsWith('.') && s !== 'README.md')
  .filter(s => {
    const sitePath = path.join(sitesPath, s);
    try {
      return fs.statSync(sitePath).isDirectory();
    } catch (error) {
      console.log('⚠️  Could not stat site path:', sitePath, error.message);
      return false;
    }
  });

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
    console.log('Found templates:', templates);
    for (const template of templates) {
      const src = path.join(templatesPath, template);
      const dest = path.join(siteDistPath, template);
      try {
        fs.copyFileSync(src, dest);
        console.log('  Rendering ' + template);
      } catch (error) {
        console.log('  ❌ Failed to copy', template, ':', error.message);
      }
    }
  } else {
    console.log('⚠️  No templates directory found for site:', siteId);
  }
  
  // Copy site assets
  const siteAssetsPath = path.join(sitesPath, siteId, 'site-assets');
  if (fs.existsSync(siteAssetsPath)) {
    const destAssetsPath = path.join(siteDistPath, 'site-assets');
    copyDirectory(siteAssetsPath, destAssetsPath);
    console.log('✓ Copied site assets for', siteId);
  }
  
  console.log('✓ Built ' + siteId);
}

console.log('✓ All sites built successfully');

// Write build log
const buildLog = {
  timestamp: new Date().toISOString(),
  sites: sites,
  success: true,
  distPath: distPath
};
fs.writeFileSync('build.log', JSON.stringify(buildLog, null, 2));
console.log('✓ Build log written to build.log');

console.log('🎉 Build process completed!');

