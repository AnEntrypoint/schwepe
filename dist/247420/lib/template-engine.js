import fs from 'fs/promises';
import path from 'path';

export class TemplateEngine {
  constructor(sitesRoot = './sites') {
    this.sitesRoot = sitesRoot;
    this.cache = new Map();
  }

  async loadSiteConfig(siteId) {
    const cacheKey = `config:${siteId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const configPath = path.join(this.sitesRoot, siteId, 'config.json');
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    this.cache.set(cacheKey, config);
    return config;
  }

  async loadTemplate(siteId, templateName) {
    const cacheKey = `template:${siteId}:${templateName}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const config = await this.loadSiteConfig(siteId);
    const templatePath = path.join(this.sitesRoot, siteId, 'templates', templateName);
    const content = await fs.readFile(templatePath, 'utf-8');
    this.cache.set(cacheKey, content);
    return content;
  }

  async render(siteId, templateName, data = {}) {
    const config = await this.loadSiteConfig(siteId);
    let template = await this.loadTemplate(siteId, templateName);
    
    const context = {
      ...config,
      ...data,
      site: config
    };
    
    template = this.replaceVariables(template, context);
    template = this.replaceConditionals(template, context);
    template = this.replaceLoops(template, context);
    
    return template;
  }

  replaceVariables(template, context) {
    return template.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (match, path) => {
      return this.getNestedValue(context, path) || '';
    });
  }

  replaceConditionals(template, context) {
    return template.replace(/\{%\s*if\s+([\w\.]+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, 
      (match, condition, content) => {
        return this.getNestedValue(context, condition) ? content : '';
      });
  }

  replaceLoops(template, context) {
    return template.replace(/\{%\s*for\s+(\w+)\s+in\s+([\w\.]+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g,
      (match, itemName, arrayPath, loopContent) => {
        const array = this.getNestedValue(context, arrayPath);
        if (!Array.isArray(array)) return '';
        
        return array.map(item => {
          const loopContext = { ...context, [itemName]: item };
          return this.replaceVariables(loopContent, loopContext);
        }).join('');
      });
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  clearCache() {
    this.cache.clear();
  }
}
