// Sitemap configuration
export const SITEMAP_CONFIG = {
  site: 'https://aicraftdeck.com',
  changefreq: 'weekly',
  priority: 0.7,
  lastmod: new Date().toISOString(),
  
  // Page priorities
  pagePriorities: {
    '/': 1.0,
    '/articles': 0.9,
    '/articles/*': 0.8,
    '/about': 0.6,
    '/contact': 0.5
  }
};

export default SITEMAP_CONFIG;