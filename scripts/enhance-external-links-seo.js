#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles'),
  maxExternalLinks: 5  // 提升到5个外链以满足SEO要求
};

// 按类别扩展外部资源
const ENHANCED_EXTERNAL_LINKS = {
  'marketing': [
    { url: 'https://moz.com/beginners-guide-to-seo', text: 'comprehensive SEO guide', domain: 'Moz' },
    { url: 'https://blog.hubspot.com/marketing', text: 'marketing best practices', domain: 'HubSpot' },
    { url: 'https://neilpatel.com/blog/', text: 'digital marketing insights', domain: 'Neil Patel' },
    { url: 'https://www.semrush.com/blog/', text: 'SEO and marketing strategies', domain: 'SEMrush' },
    { url: 'https://blog.google/products/ads/', text: 'Google Ads best practices', domain: 'Google' }
  ],
  'business': [
    { url: 'https://www.sba.gov/business-guide', text: 'Small Business Administration guide', domain: 'SBA.gov' },
    { url: 'https://blog.ycombinator.com/', text: 'startup guidance', domain: 'Y Combinator' },
    { url: 'https://www.entrepreneur.com/', text: 'entrepreneurship resources', domain: 'Entrepreneur' },
    { url: 'https://hbr.org/', text: 'business strategy insights', domain: 'Harvard Business Review' },
    { url: 'https://www.inc.com/', text: 'small business advice', domain: 'Inc.' }
  ],
  'finance': [
    { url: 'https://www.investopedia.com/', text: 'financial education resources', domain: 'Investopedia' },
    { url: 'https://www.sec.gov/investor/pubs/tenthingstoconsider.htm', text: 'SEC investment guide', domain: 'SEC.gov' },
    { url: 'https://www.mint.com/blog/', text: 'personal finance tips', domain: 'Mint' },
    { url: 'https://www.morningstar.com/', text: 'investment research', domain: 'Morningstar' },
    { url: 'https://www.fool.com/', text: 'investment advice', domain: 'The Motley Fool' }
  ],
  'productivity': [
    { url: 'https://blog.asana.com/category/productivity/', text: 'productivity strategies', domain: 'Asana' },
    { url: 'https://zapier.com/blog/productivity/', text: 'workflow optimization', domain: 'Zapier' },
    { url: 'https://todoist.com/productivity-methods', text: 'productivity methods', domain: 'Todoist' },
    { url: 'https://blog.trello.com/productivity', text: 'project management tips', domain: 'Trello' },
    { url: 'https://www.notion.so/blog', text: 'workspace organization', domain: 'Notion' }
  ],
  'freelancing': [
    { url: 'https://www.upwork.com/resources/', text: 'freelancing resources', domain: 'Upwork' },
    { url: 'https://blog.freelancer.com/', text: 'freelancer guidance', domain: 'Freelancer' },
    { url: 'https://contently.com/strategist/', text: 'content creation insights', domain: 'Contently' },
    { url: 'https://www.fiverr.com/resources/', text: 'gig economy tips', domain: 'Fiverr' },
    { url: 'https://blog.toggl.com/', text: 'time tracking for freelancers', domain: 'Toggl' }
  ],
  'web-development': [
    { url: 'https://developer.mozilla.org/en-US/docs/Web', text: 'web development documentation', domain: 'MDN' },
    { url: 'https://www.w3schools.com/', text: 'web development tutorials', domain: 'W3Schools' },
    { url: 'https://css-tricks.com/', text: 'CSS and frontend tips', domain: 'CSS-Tricks' },
    { url: 'https://web.dev/', text: 'modern web development', domain: 'Google Developers' },
    { url: 'https://smashingmagazine.com/', text: 'web design and development', domain: 'Smashing Magazine' }
  ],
  'e-commerce': [
    { url: 'https://www.shopify.com/blog', text: 'e-commerce best practices', domain: 'Shopify' },
    { url: 'https://blog.hubspot.com/marketing/ecommerce', text: 'e-commerce marketing strategies', domain: 'HubSpot' },
    { url: 'https://www.bigcommerce.com/blog/', text: 'online store optimization', domain: 'BigCommerce' },
    { url: 'https://www.woocommerce.com/blog/', text: 'WooCommerce insights', domain: 'WooCommerce' },
    { url: 'https://baymard.com/blog', text: 'e-commerce usability research', domain: 'Baymard Institute' }
  ]
};

// 文章分类映射
const ARTICLE_CATEGORIES = {
  'marketing': [
    'boost-your-seo-with-these-keyword-research-tips',
    'effective-content-marketing-solutions-for-your-business',
    'elevate-your-marketing-with-impactful-email-campaigns',
    'online-marketing-solutions-grow-your-business-today',
    'mastering-pay-per-click-advertising-for-business-growth',
    'video-marketing-experts-boost-your-online-presence',
    'streamline-your-social-media-with-powerful-management-solutions'
  ],
  'business': [
    'building-a-profitable-online-business-from-scratch',
    'low-cost-startups-proven-strategies-for-entrepreneurs',
    'top-home-business-tips-to-grow-your-online-business',
    'profitable-microservices-a-guide-to-implementation'
  ],
  'finance': [
    'beginner-investing-a-step-by-step-guide-to-investing',
    'boost-your-savings-proven-cashback-strategies-explained',
    'rental-income-tips-how-to-maximize-your-earnings',
    'discover-top-ai-money-tools-for-financial-success'
  ],
  'productivity': [
    '7-biophilic-design-tweaks-to-instantly-upgrade-home-workspace',
    'remote-work-ideas-to-enhance-your-home-office',
    'remote-services-empowering-your-productivity-anywhere'
  ],
  'freelancing': [
    '8-quick-design-to-invoice-steps-first-freelance-gig-steps'
  ],
  'web-development': [
    'responsive-website-development-unlock-the-power-of-adaptability',
    'mobile-friendly-website-design-enhance-user-experience-on-any-device',
    'elevate-your-online-presence-with-our-website-design-amp-development'
  ],
  'e-commerce': [
    'maximize-your-digital-product-sales-online-today',
    'proven-e-commerce-optimization-techniques-to-grow-sales',
    'optimize-your-conversions-expert-tips-for-success',
    'elevate-your-life-with-these-must-have-digital-products'
  ]
};

function getArticleCategory(slug) {
  for (const [category, articles] of Object.entries(ARTICLE_CATEGORIES)) {
    if (articles.includes(slug)) {
      return category;
    }
  }
  return 'business'; // default category
}

function enhanceExternalLinks(content, category) {
  const links = ENHANCED_EXTERNAL_LINKS[category] || ENHANCED_EXTERNAL_LINKS['business'];
  
  // 检查是否已存在外链部分
  const hasExternalSection = content.includes('## Useful Resources');
  
  if (!hasExternalSection) {
    return content; // 如果没有外链部分，跳过
  }
  
  // 查找现有的外链部分
  const externalLinkRegex = /## Useful Resources[\s\S]*?(?=\n## |\n###|$)/;
  const match = content.match(externalLinkRegex);
  
  if (match) {
    // 计算当前外链数量
    const currentLinks = (match[0].match(/\d+\. \[/g) || []).length;
    
    if (currentLinks >= CONFIG.maxExternalLinks) {
      return content; // 已经有足够的外链
    }
    
    // 生成新的外链部分
    const selectedLinks = links.slice(0, CONFIG.maxExternalLinks);
    const newExternalSection = `## Useful Resources

For additional insights, check out these valuable resources:

${selectedLinks.map((link, index) => 
  `${index + 1}. [${link.text}](${link.url}) - ${link.domain}`
).join('\n')}`;

    return content.replace(externalLinkRegex, newExternalSection);
  }
  
  return content;
}

async function main() {
  console.log('🔗 增强外链SEO优化脚本');
  console.log(`📂 文章目录: ${CONFIG.articlesDir}`);
  console.log(`🎯 目标外链数: ${CONFIG.maxExternalLinks}`);
  
  if (!fs.existsSync(CONFIG.articlesDir)) {
    console.error(`❌ 文章目录不存在: ${CONFIG.articlesDir}`);
    return;
  }
  
  // 获取所有文章目录
  const articleDirs = fs.readdirSync(CONFIG.articlesDir).filter(item => {
    const fullPath = path.join(CONFIG.articlesDir, item);
    return fs.statSync(fullPath).isDirectory() && 
           fs.existsSync(path.join(fullPath, 'index.mdx'));
  });
  
  console.log(`📄 找到 ${articleDirs.length} 篇文章`);
  
  let updatedCount = 0;
  
  for (const slug of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    let content = fs.readFileSync(articlePath, 'utf8');
    
    const category = getArticleCategory(slug);
    const originalContent = content;
    
    content = enhanceExternalLinks(content, category);
    
    if (content !== originalContent) {
      fs.writeFileSync(articlePath, content, 'utf8');
      console.log(`✅ ${slug}: 已优化外链`);
      updatedCount++;
    } else {
      console.log(`ℹ️  ${slug}: 外链已达标`);
    }
  }
  
  console.log(`\n📊 优化统计:`);
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`✅ 已优化: ${updatedCount}`);
  console.log(`🎉 SEO外链优化完成！`);
}

main().catch(console.error);