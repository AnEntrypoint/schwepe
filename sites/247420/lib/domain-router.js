import fs from 'fs/promises';
import path from 'path';

export class DomainRouter {
  constructor(sitesRoot = './sites') {
    this.sitesRoot = sitesRoot;
    this.domainMap = new Map();
    this.defaultSite = null;
  }

  async initialize() {
    const sites = await fs.readdir(this.sitesRoot);
    
    for (const siteId of sites) {
      const sitePath = path.join(this.sitesRoot, siteId);
      const stat = await fs.stat(sitePath);
      if (!stat.isDirectory()) {
        continue;
      }
      
      const configPath = path.join(this.sitesRoot, siteId, 'config.json');
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(content);
        
        if (config.domain) {
          this.domainMap.set(config.domain, siteId);
        }
        
        if (!this.defaultSite) {
          this.defaultSite = siteId;
        }
      } catch (error) {
        console.warn(`Failed to load config for ${siteId}:`, error.message);
      }
    }
    
    console.log('Domain map:', Object.fromEntries(this.domainMap));
  }

  getSiteForDomain(hostname) {
    if (this.domainMap.has(hostname)) {
      return this.domainMap.get(hostname);
    }
    
    for (const [domain, siteId] of this.domainMap.entries()) {
      if (hostname.endsWith(domain)) {
        return siteId;
      }
    }
    
    return this.defaultSite;
  }

  middleware() {
    return (req, res, next) => {
      const hostname = req.hostname || req.headers.host?.split(':')[0] || 'localhost';
      const siteId = this.getSiteForDomain(hostname);
      
      req.siteId = siteId;
      req.sitePath = path.join(this.sitesRoot, siteId);
      
      next();
    };
  }
}
