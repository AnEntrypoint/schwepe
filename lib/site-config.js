export class SiteConfig {
  constructor() {
    this.siteId = this.detectSiteId();
  }
  
  detectSiteId() {
    const metaTag = document.querySelector('meta[name="site-id"]');
    if (metaTag) {
      return metaTag.content;
    }
    
    const hostname = window.location.hostname;
    const domainMap = {
      '247420.xyz': '247420',
      'schwepe.247420.xyz': 'schwepe',
      'localhost': '247420'
    };
    
    return domainMap[hostname] || '247420';
  }
  
  getApiUrl(endpoint) {
    return `/api/${this.siteId}/${endpoint}`;
  }
  
  getAssetUrl(path) {
    return `/site-assets/${path}`;
  }
}

export const siteConfig = new SiteConfig();
