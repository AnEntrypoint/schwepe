#!/usr/bin/env node

/**
 * Working Multi-Site Builder
 * Simplified, non-blocking version that actually works
 */

const fs = require('fs');
const path = require('path');

class WorkingBuilder {
  constructor() {
    this.projectRoot = process.cwd();
    this.sitesDir = path.join(this.projectRoot, 'sites');
    this.distDir = path.join(this.projectRoot, 'dist');
  }

  log(message) {
    console.log(message);
  }

  async copyDirectory(src, dest) {
    if (!fs.existsSync(src)) {
      this.log(`⚠️  Source directory does not exist: ${src}`);
      return;
    }

    // Create destination if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    // Copy all files
    const files = fs.readdirSync(src);
    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async buildSite(siteId) {
    this.log(`Building site: ${siteId}`);
    
    const siteDir = path.join(this.sitesDir, siteId);
    const distSiteDir = path.join(this.distDir, siteId);
    
    // Create site dist directory
    if (fs.existsSync(distSiteDir)) {
      fs.rmSync(distSiteDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distSiteDir, { recursive: true });

    // Copy templates as HTML files
    const templatesDir = path.join(siteDir, 'templates');
    if (fs.existsSync(templatesDir)) {
      const templates = fs.readdirSync(templatesDir);
      for (const template of templates) {
        const srcPath = path.join(templatesDir, template);
        const destPath = path.join(distSiteDir, template);
        fs.copyFileSync(srcPath, destPath);
        this.log(`  ✓ Copied ${template}`);
      }
    }

    // Copy site assets
    const assetsDir = path.join(siteDir, 'site-assets');
    const distAssetsDir = path.join(distSiteDir, 'site-assets');
    await this.copyDirectory(assetsDir, distAssetsDir);
    
    this.log(`✓ Built ${siteId}`);
  }

  async buildAll() {
    this.log('Building all sites...');
    
    // Clean and create dist directory
    if (fs.existsSync(this.distDir)) {
      fs.rmSync(this.distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.distDir, { recursive: true });

    // Copy public and static directories
    await this.copyDirectory(path.join(this.projectRoot, 'public'), path.join(this.distDir, 'public'));
    this.log('✓ Copied public directory');
    
    await this.copyDirectory(path.join(this.projectRoot, 'static'), path.join(this.distDir, 'static'));
    this.log('✓ Copied static directory');

    // Build each site
    const sites = fs.readdirSync(this.sitesDir)
      .filter(site => !site.startsWith('.') && site !== 'README.md')
      .filter(site => {
        const sitePath = path.join(this.sitesDir, site);
        return fs.statSync(sitePath).isDirectory();
      });

    for (const siteId of sites) {
      await this.buildSite(siteId);
    }

    this.log('✓ All sites built successfully');
    
    // Write build log
    const buildLog = {
      timestamp: new Date().toISOString(),
      sites: sites,
      success: true
    };
    fs.writeFileSync(path.join(this.projectRoot, 'build.log'), JSON.stringify(buildLog, null, 2));
  }
}

// Run the builder
const builder = new WorkingBuilder();
builder.buildAll().catch(console.error);

