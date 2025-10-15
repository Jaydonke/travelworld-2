#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles'),
  siteUrl: 'https://entryearns.com',
  maxInternalLinks: 8,  // 增加内链数量以提升SEO
  maxExternalLinks: 5   // 增加外链数量以提升权威性
};

// 文章分类和相关主题
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

// 优质外部资源 (增加更多权威来源以提升SEO)
const EXTERNAL_LINKS = {
  'marketing': [
    { url: 'https://moz.com/beginners-guide-to-seo', text: 'comprehensive SEO guide', domain: 'Moz' },
    { url: 'https://blog.hubspot.com/marketing', text: 'marketing best practices', domain: 'HubSpot' },
    { url: 'https://neilpatel.com/blog/', text: 'digital marketing insights', domain: 'Neil Patel' },
    { url: 'https://www.semrush.com/blog/', text: 'SEO and marketing strategies', domain: 'SEMrush' },
    { url: 'https://blog.google/products/ads/', text: 'Google Ads best practices', domain: 'Google' },
    { url: 'https://contentmarketinginstitute.com/', text: 'content marketing expertise', domain: 'CMI' }
  ],
  'business': [
    { url: 'https://www.sba.gov/business-guide', text: 'Small Business Administration guide', domain: 'SBA.gov' },
    { url: 'https://blog.ycombinator.com/', text: 'startup guidance', domain: 'Y Combinator' },
    { url: 'https://www.entrepreneur.com/', text: 'entrepreneurship resources', domain: 'Entrepreneur' },
    { url: 'https://hbr.org/', text: 'business strategy insights', domain: 'Harvard Business Review' },
    { url: 'https://www.inc.com/', text: 'small business advice', domain: 'Inc.' },
    { url: 'https://www.forbes.com/business/', text: 'business news and trends', domain: 'Forbes' }
  ],
  'finance': [
    { url: 'https://www.investopedia.com/', text: 'financial education resources', domain: 'Investopedia' },
    { url: 'https://www.sec.gov/investor/pubs/tenthingstoconsider.htm', text: 'SEC investment guide', domain: 'SEC.gov' },
    { url: 'https://www.mint.com/blog/', text: 'personal finance tips', domain: 'Mint' },
    { url: 'https://www.morningstar.com/', text: 'investment research', domain: 'Morningstar' },
    { url: 'https://www.fool.com/', text: 'investment advice', domain: 'The Motley Fool' },
    { url: 'https://www.bankrate.com/', text: 'financial calculators and guides', domain: 'Bankrate' }
  ],
  'productivity': [
    { url: 'https://blog.asana.com/category/productivity/', text: 'productivity strategies', domain: 'Asana' },
    { url: 'https://zapier.com/blog/productivity/', text: 'workflow optimization', domain: 'Zapier' },
    { url: 'https://todoist.com/productivity-methods', text: 'productivity methods', domain: 'Todoist' },
    { url: 'https://blog.trello.com/productivity', text: 'project management tips', domain: 'Trello' },
    { url: 'https://www.notion.so/blog', text: 'workspace organization', domain: 'Notion' },
    { url: 'https://blog.monday.com/productivity/', text: 'team productivity insights', domain: 'Monday.com' }
  ],
  'freelancing': [
    { url: 'https://www.upwork.com/resources/', text: 'freelancing resources', domain: 'Upwork' },
    { url: 'https://blog.freelancer.com/', text: 'freelancer guidance', domain: 'Freelancer' },
    { url: 'https://contently.com/strategist/', text: 'content creation insights', domain: 'Contently' },
    { url: 'https://www.fiverr.com/resources/', text: 'gig economy tips', domain: 'Fiverr' },
    { url: 'https://blog.toggl.com/', text: 'time tracking for freelancers', domain: 'Toggl' },
    { url: 'https://freshbooks.com/blog/', text: 'freelance business management', domain: 'FreshBooks' }
  ],
  'web-development': [
    { url: 'https://developer.mozilla.org/en-US/docs/Web', text: 'web development documentation', domain: 'MDN' },
    { url: 'https://www.w3schools.com/', text: 'web development tutorials', domain: 'W3Schools' },
    { url: 'https://css-tricks.com/', text: 'CSS and frontend tips', domain: 'CSS-Tricks' },
    { url: 'https://web.dev/', text: 'modern web development', domain: 'Google Developers' },
    { url: 'https://smashingmagazine.com/', text: 'web design and development', domain: 'Smashing Magazine' },
    { url: 'https://www.freecodecamp.org/', text: 'coding tutorials and guides', domain: 'freeCodeCamp' }
  ],
  'e-commerce': [
    { url: 'https://www.shopify.com/blog', text: 'e-commerce best practices', domain: 'Shopify' },
    { url: 'https://blog.hubspot.com/marketing/ecommerce', text: 'e-commerce marketing strategies', domain: 'HubSpot' },
    { url: 'https://www.bigcommerce.com/blog/', text: 'online store optimization', domain: 'BigCommerce' },
    { url: 'https://www.woocommerce.com/blog/', text: 'WooCommerce insights', domain: 'WooCommerce' },
    { url: 'https://baymard.com/blog', text: 'e-commerce usability research', domain: 'Baymard Institute' },
    { url: 'https://ecommerceguide.com/', text: 'e-commerce industry trends', domain: 'Ecommerce Guide' }
  ]
};

// 关键词到内链的映射
const INTERNAL_LINK_KEYWORDS = {
  'SEO': ['boost-your-seo-with-these-keyword-research-tips'],
  'search engine optimization': ['boost-your-seo-with-these-keyword-research-tips'],
  'keyword research': ['boost-your-seo-with-these-keyword-research-tips'],
  'content marketing': ['effective-content-marketing-solutions-for-your-business'],
  'email marketing': ['elevate-your-marketing-with-impactful-email-campaigns'],
  'email campaigns': ['elevate-your-marketing-with-impactful-email-campaigns'],
  'social media': ['streamline-your-social-media-with-powerful-management-solutions'],
  'social media management': ['streamline-your-social-media-with-powerful-management-solutions'],
  'video marketing': ['video-marketing-experts-boost-your-online-presence'],
  'online business': ['building-a-profitable-online-business-from-scratch', 'top-home-business-tips-to-grow-your-online-business'],
  'profitable business': ['building-a-profitable-online-business-from-scratch'],
  'home business': ['top-home-business-tips-to-grow-your-online-business'],
  'startup': ['low-cost-startups-proven-strategies-for-entrepreneurs'],
  'entrepreneurs': ['low-cost-startups-proven-strategies-for-entrepreneurs'],
  'freelancing': ['8-quick-design-to-invoice-steps-first-freelance-gig-steps'],
  'freelance': ['8-quick-design-to-invoice-steps-first-freelance-gig-steps'],
  'investing': ['beginner-investing-a-step-by-step-guide-to-investing'],
  'investment': ['beginner-investing-a-step-by-step-guide-to-investing'],
  'beginner investing': ['beginner-investing-a-step-by-step-guide-to-investing'],
  'saving money': ['boost-your-savings-proven-cashback-strategies-explained'],
  'cashback': ['boost-your-savings-proven-cashback-strategies-explained'],
  'savings': ['boost-your-savings-proven-cashback-strategies-explained'],
  'passive income': ['rental-income-tips-how-to-maximize-your-earnings'],
  'rental income': ['rental-income-tips-how-to-maximize-your-earnings'],
  'AI tools': ['discover-top-ai-money-tools-for-financial-success'],
  'financial tools': ['discover-top-ai-money-tools-for-financial-success'],
  'responsive design': ['responsive-website-development-unlock-the-power-of-adaptability'],
  'responsive website': ['responsive-website-development-unlock-the-power-of-adaptability'],
  'mobile design': ['mobile-friendly-website-design-enhance-user-experience-on-any-device'],
  'mobile-friendly': ['mobile-friendly-website-design-enhance-user-experience-on-any-device'],
  'web design': ['elevate-your-online-presence-with-our-website-design-amp-development'],
  'website design': ['elevate-your-online-presence-with-our-website-design-amp-development'],
  'e-commerce': ['proven-e-commerce-optimization-techniques-to-grow-sales', 'maximize-your-digital-product-sales-online-today'],
  'ecommerce': ['proven-e-commerce-optimization-techniques-to-grow-sales'],
  'conversion optimization': ['optimize-your-conversions-expert-tips-for-success'],
  'conversions': ['optimize-your-conversions-expert-tips-for-success'],
  'remote work': ['remote-work-ideas-to-enhance-your-home-office', 'remote-services-empowering-your-productivity-anywhere'],
  'working remotely': ['remote-work-ideas-to-enhance-your-home-office'],
  'home office': ['7-biophilic-design-tweaks-to-instantly-upgrade-home-workspace', 'remote-work-ideas-to-enhance-your-home-office'],
  'workspace': ['7-biophilic-design-tweaks-to-instantly-upgrade-home-workspace'],
  'biophilic design': ['7-biophilic-design-tweaks-to-instantly-upgrade-home-workspace'],
  'digital products': ['elevate-your-life-with-these-must-have-digital-products', 'maximize-your-digital-product-sales-online-today'],
  'digital product sales': ['maximize-your-digital-product-sales-online-today'],
  'PPC advertising': ['mastering-pay-per-click-advertising-for-business-growth'],
  'pay-per-click': ['mastering-pay-per-click-advertising-for-business-growth'],
  'online marketing': ['online-marketing-solutions-grow-your-business-today'],
  'marketing solutions': ['online-marketing-solutions-grow-your-business-today'],
  'microservices': ['profitable-microservices-a-guide-to-implementation'],
  'remote services': ['remote-services-empowering-your-productivity-anywhere'],
  'productivity': ['remote-services-empowering-your-productivity-anywhere'],
  'business': ['building-a-profitable-online-business-from-scratch', 'top-home-business-tips-to-grow-your-online-business'],
  'marketing': ['online-marketing-solutions-grow-your-business-today', 'effective-content-marketing-solutions-for-your-business'],
  'website': ['responsive-website-development-unlock-the-power-of-adaptability', 'mobile-friendly-website-design-enhance-user-experience-on-any-device'],
  'money': ['rental-income-tips-how-to-maximize-your-earnings', 'boost-your-savings-proven-cashback-strategies-explained'],
  'financial': ['beginner-investing-a-step-by-step-guide-to-investing', 'discover-top-ai-money-tools-for-financial-success'],
  
  // 添加更多SEO友好的关键词变体
  'search optimization': ['boost-your-seo-with-these-keyword-research-tips'],
  'keyword strategy': ['boost-your-seo-with-these-keyword-research-tips'],
  'content strategy': ['effective-content-marketing-solutions-for-your-business'],
  'email automation': ['elevate-your-marketing-with-impactful-email-campaigns'],
  'newsletter marketing': ['elevate-your-marketing-with-impactful-email-campaigns'],
  'social platforms': ['streamline-your-social-media-with-powerful-management-solutions'],
  'social strategy': ['streamline-your-social-media-with-powerful-management-solutions'],
  'video content': ['video-marketing-experts-boost-your-online-presence'],
  'video strategy': ['video-marketing-experts-boost-your-online-presence'],
  'profitable ventures': ['building-a-profitable-online-business-from-scratch'],
  'business growth': ['building-a-profitable-online-business-from-scratch', 'top-home-business-tips-to-grow-your-online-business'],
  'home-based business': ['top-home-business-tips-to-grow-your-online-business'],
  'business ideas': ['top-home-business-tips-to-grow-your-online-business', 'low-cost-startups-proven-strategies-for-entrepreneurs'],
  'startup costs': ['low-cost-startups-proven-strategies-for-entrepreneurs'],
  'budget startups': ['low-cost-startups-proven-strategies-for-entrepreneurs'],
  'freelance gigs': ['8-quick-design-to-invoice-steps-first-freelance-gig-steps'],
  'freelance career': ['8-quick-design-to-invoice-steps-first-freelance-gig-steps'],
  'investment strategies': ['beginner-investing-a-step-by-step-guide-to-investing'],
  'portfolio management': ['beginner-investing-a-step-by-step-guide-to-investing'],
  'financial planning': ['beginner-investing-a-step-by-step-guide-to-investing'],
  'money saving': ['boost-your-savings-proven-cashback-strategies-explained'],
  'rewards programs': ['boost-your-savings-proven-cashback-strategies-explained'],
  'property investment': ['rental-income-tips-how-to-maximize-your-earnings'],
  'real estate income': ['rental-income-tips-how-to-maximize-your-earnings'],
  'artificial intelligence': ['discover-top-ai-money-tools-for-financial-success'],
  'automation tools': ['discover-top-ai-money-tools-for-financial-success'],
  'mobile optimization': ['mobile-friendly-website-design-enhance-user-experience-on-any-device'],
  'user experience': ['mobile-friendly-website-design-enhance-user-experience-on-any-device'],
  'UX design': ['mobile-friendly-website-design-enhance-user-experience-on-any-device'],
  'web development': ['responsive-website-development-unlock-the-power-of-adaptability'],
  'frontend development': ['responsive-website-development-unlock-the-power-of-adaptability'],
  'online presence': ['elevate-your-online-presence-with-our-website-design-amp-development'],
  'brand presence': ['elevate-your-online-presence-with-our-website-design-amp-development'],
  'sales optimization': ['proven-e-commerce-optimization-techniques-to-grow-sales'],
  'online sales': ['proven-e-commerce-optimization-techniques-to-grow-sales'],
  'sales growth': ['maximize-your-digital-product-sales-online-today'],
  'product marketing': ['maximize-your-digital-product-sales-online-today'],
  'conversion rates': ['optimize-your-conversions-expert-tips-for-success'],
  'CRO': ['optimize-your-conversions-expert-tips-for-success'],
  'must-have products': ['elevate-your-life-with-these-must-have-digital-products'],
  'digital tools': ['elevate-your-life-with-these-must-have-digital-products'],
  'Google Ads': ['mastering-pay-per-click-advertising-for-business-growth'],
  'paid advertising': ['mastering-pay-per-click-advertising-for-business-growth'],
  'digital marketing': ['online-marketing-solutions-grow-your-business-today'],
  'marketing strategies': ['online-marketing-solutions-grow-your-business-today'],
  'architecture patterns': ['profitable-microservices-a-guide-to-implementation'],
  'software architecture': ['profitable-microservices-a-guide-to-implementation'],
  'telecommuting': ['remote-work-ideas-to-enhance-your-home-office'],
  'work from home': ['remote-work-ideas-to-enhance-your-home-office'],
  'office setup': ['7-biophilic-design-tweaks-to-instantly-upgrade-home-workspace'],
  'workspace design': ['7-biophilic-design-tweaks-to-instantly-upgrade-home-workspace'],
  'productivity tips': ['remote-services-empowering-your-productivity-anywhere'],
  'remote productivity': ['remote-services-empowering-your-productivity-anywhere']
};

function getArticleCategory(slug) {
  for (const [category, articles] of Object.entries(ARTICLE_CATEGORIES)) {
    if (articles.includes(slug)) {
      return category;
    }
  }
  return 'business'; // default category
}

function getRelatedArticles(currentSlug, maxCount = 3) {
  const category = getArticleCategory(currentSlug);
  const relatedArticles = ARTICLE_CATEGORIES[category] || [];
  
  // 排除当前文章，随机选择相关文章
  const others = relatedArticles.filter(slug => slug !== currentSlug);
  return others.slice(0, maxCount);
}

function getExternalLinks(category, maxCount = 3) {
  const links = EXTERNAL_LINKS[category] || EXTERNAL_LINKS['business'];
  return links.slice(0, maxCount);
}

function insertInternalLinks(content, currentSlug) {
  let modifiedContent = content;
  let linksAdded = 0;
  const maxLinks = CONFIG.maxInternalLinks;
  
  // 分离frontmatter和内容
  const frontmatterEnd = modifiedContent.indexOf('---', 3) + 3;
  if (frontmatterEnd === 2) return modifiedContent; // 没有找到frontmatter
  
  const frontmatter = modifiedContent.substring(0, frontmatterEnd);
  let bodyContent = modifiedContent.substring(frontmatterEnd);
  
  // 遍历关键词映射
  for (const [keyword, targetSlugs] of Object.entries(INTERNAL_LINK_KEYWORDS)) {
    if (linksAdded >= maxLinks) break;
    
    // 跳过指向当前文章的链接
    const validTargets = targetSlugs.filter(slug => slug !== currentSlug);
    if (validTargets.length === 0) continue;
    
    // 查找关键词（不区分大小写，避免已链接的文本）
    const keywordRegex = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'gi'
    );
    
    // 检查是否已经是链接
    const linkCheckRegex = new RegExp(
      `\\[([^\\]]*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\]]*)\\]\\([^)]+\\)`,
      'gi'
    );
    
    // 检查是否存在该关键词且尚未被链接化
    if (keywordRegex.test(bodyContent) && !linkCheckRegex.test(bodyContent)) {
      const targetSlug = validTargets[0]; // 选择第一个目标
      const replacement = `[${keyword}](${CONFIG.siteUrl}/articles/${targetSlug})`;
      
      // 只替换第一个匹配项
      bodyContent = bodyContent.replace(keywordRegex, replacement);
      linksAdded++;
    }
  }
  
  return frontmatter + bodyContent;
}

function insertExternalLinks(content, category) {
  let modifiedContent = content;
  const externalLinks = getExternalLinks(category, CONFIG.maxExternalLinks);
  
  // 检查是否已存在 "## Useful Resources" 部分
  if (modifiedContent.includes('## Useful Resources')) {
    console.log('  外链已存在，跳过插入');
    return modifiedContent;
  }
  
  // 在文章末尾的适当位置插入外部链接
  const faqIndex = modifiedContent.indexOf('## FAQ');
  const insertionPoint = faqIndex !== -1 ? faqIndex : modifiedContent.length;
  
  if (externalLinks.length > 0) {
    let linkSection = '\n## Useful Resources\n\n';
    linkSection += 'For additional insights, check out these valuable resources:\n\n';
    
    externalLinks.forEach((link, index) => {
      linkSection += `${index + 1}. [${link.text}](${link.url}) - ${link.domain}\n`;
    });
    
    linkSection += '\n';
    
    // 插入链接部分
    modifiedContent = 
      modifiedContent.slice(0, insertionPoint) + 
      linkSection + 
      modifiedContent.slice(insertionPoint);
  }
  
  return modifiedContent;
}

function processArticle(slug) {
  const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    console.log(`⚠️  文章不存在: ${slug}`);
    return false;
  }
  
  console.log(`\\n📄 处理: ${slug}`);
  
  let content = fs.readFileSync(articlePath, 'utf8');
  const originalContent = content;
  
  // 获取文章类别
  const category = getArticleCategory(slug);
  console.log(`  📂 类别: ${category}`);
  
  // 插入内链
  content = insertInternalLinks(content, slug);
  
  // 插入外链
  content = insertExternalLinks(content, category);
  
  // 检查是否有修改
  if (content !== originalContent) {
    fs.writeFileSync(articlePath, content);
    console.log(`  ✅ 已添加链接`);
    return true;
  }
  
  console.log(`  ℹ️  无需修改`);
  return false;
}

async function main() {
  console.log('🔗 批量添加内链和外链脚本');
  console.log(`🌐 网站域名: ${CONFIG.siteUrl}`);
  console.log(`📂 文章目录: ${CONFIG.articlesDir}`);
  
  if (!fs.existsSync(CONFIG.articlesDir)) {
    console.error(`❌ 文章目录不存在: ${CONFIG.articlesDir}`);
    return;
  }
  
  // 获取所有文章
  const articleDirs = fs.readdirSync(CONFIG.articlesDir).filter(item => {
    const fullPath = path.join(CONFIG.articlesDir, item);
    return fs.statSync(fullPath).isDirectory() && 
           fs.existsSync(path.join(fullPath, 'index.mdx'));
  });
  
  console.log(`📊 找到 ${articleDirs.length} 篇文章`);
  
  let processed = 0;
  
  for (const slug of articleDirs) {
    if (processArticle(slug)) {
      processed++;
    }
  }
  
  console.log('\\n📊 处理统计:');
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`✅ 已处理: ${processed}`);
  console.log(`🎉 完成！`);
}

main().catch(console.error);