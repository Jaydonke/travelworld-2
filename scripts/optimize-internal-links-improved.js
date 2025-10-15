#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

// Color output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Step 1: Clean ALL existing internal links
function cleanAllInternalLinks(content) {
  // Remove markdown links pointing to internal articles
  let cleaned = content.replace(/\[([^\]]+)\]\(\/articles\/[^)]+\)/g, '$1');
  
  // Remove HTML anchor tags for internal links
  cleaned = cleaned.replace(/<a[^>]*href="\/articles\/[^"]*"[^>]*>([^<]+)<\/a>/gi, '$1');
  
  return cleaned;
}

// Step 2: Get all articles for validation
function getAllArticles() {
  return fs.readdirSync(articlesDir)
    .filter(dir => fs.statSync(path.join(articlesDir, dir)).isDirectory());
}

// Step 3: More generic keyword mappings using common words
const internalLinkMappings = {
  // Very common marketing/blogging terms
  'monetize': 'how-to-setup-blog-advertising-slots-for-maximum-revenue',
  'monetization': 'how-to-setup-blog-advertising-slots-for-maximum-revenue',
  'revenue': 'building-wealth-with-evergreen-affiliate-pillars',
  'income': 'understanding-blog-income-transparency-and-its-importance',
  'earning': 'building-wealth-with-evergreen-affiliate-pillars',
  'traffic': 'unlock-insights-with-advanced-traffic-analytics-dashboards',
  'visitors': 'unlock-insights-with-advanced-traffic-analytics-dashboards',
  'audience': 'membership-community-ideas-for-building-stronger-groups',
  'community': 'membership-community-ideas-for-building-stronger-groups',
  'brand': 'transform-your-online-presence-with-blog-branding-makeovers',
  'branding': 'transform-your-online-presence-with-blog-branding-makeovers',
  'SEO': 'improve-your-site-with-seo-for-affiliate-blogs',
  'optimization': 'review-post-optimization-tips-for-maximizing-online-impact',
  'optimize': 'review-post-optimization-tips-for-maximizing-online-impact',
  'content strategy': 'streamline-your-content-with-ai-assisted-content-calendars',
  'content planning': 'streamline-your-content-with-ai-assisted-content-calendars',
  'calendar': 'streamline-your-content-with-ai-assisted-content-calendars',
  'affiliate': 'affiliate-vs-sponsored-posts-what-s-the-difference',
  'sponsored': 'affiliate-vs-sponsored-posts-what-s-the-difference',
  'sponsor': 'boost-fundraising-with-proven-sponsor-prospect-outreach',
  'lead': 'generate-leads-with-freebies-step-by-step',
  'leads': 'the-ultimate-guide-to-landing-page-lead-magnets',
  'evergreen': 'maximize-impact-with-long-form-evergreen-guides',
  'long-form': 'maximize-impact-with-long-form-evergreen-guides',
  'repurpose': 'content-repurposing-roadmaps-a-step-by-step-guide',
  'repurposing': 'content-repurposing-roadmaps-a-step-by-step-guide',
  'keyword': 'mastering-seo-keyword-clustering-for-better-search-rankings',
  'keywords': 'mastering-seo-keyword-clustering-for-better-search-rankings',
  'newsletter': 'maximize-impact-niche-newsletters-cross-promotion-techniques',
  'newsletters': 'maximize-impact-niche-newsletters-cross-promotion-techniques',
  'landing page': 'proven-affiliate-landing-templates-for-successful-campaigns',
  'landing pages': 'the-ultimate-guide-to-landing-page-lead-magnets',
  'review': 'seo-for-product-reviews-boost-visibility-and-sales',
  'reviews': 'review-post-optimization-tips-for-maximizing-online-impact',
  'product review': 'seo-for-product-reviews-boost-visibility-and-sales',
  'discount': 'get-affiliate-discount-codes-amp-save-on-your-purchases',
  'coupon': 'get-affiliate-discount-codes-amp-save-on-your-purchases',
  'portfolio': 'develop-a-winning-portfolio-blogging-strategy-today',
  'micro-blog': 'micro-blogging-tutorials-a-step-by-step-guide',
  'course': 'the-ultimate-blog-to-course-transformation-blueprint',
  'roundup': 'niche-roundup-posts-how-to-write-them-for-maximum-impact',
  'analytics': 'unlock-insights-with-advanced-traffic-analytics-dashboards',
  'transparency': 'understanding-blog-income-transparency-and-its-importance',
  'advertising': 'how-to-setup-blog-advertising-slots-for-maximum-revenue',
  
  // Single words that commonly appear
  'success': 'develop-a-winning-portfolio-blogging-strategy-today',
  'strategy': 'develop-a-winning-portfolio-blogging-strategy-today',
  'guide': 'the-ultimate-guide-to-creating-how-to-affiliate-posts',
  'tutorial': 'micro-blogging-tutorials-a-step-by-step-guide',
  'tips': 'review-post-optimization-tips-for-maximizing-online-impact',
  'ideas': 'membership-community-ideas-for-building-stronger-groups',
  'template': 'proven-affiliate-landing-templates-for-successful-campaigns',
  'tool': 'unlock-insights-with-advanced-traffic-analytics-dashboards',
  'platform': 'transform-your-online-presence-with-blog-branding-makeovers',
  'engagement': 'membership-community-ideas-for-building-stronger-groups',
  'conversion': 'the-ultimate-guide-to-landing-page-lead-magnets',
  'promote': 'maximize-impact-niche-newsletters-cross-promotion-techniques',
  'promotion': 'maximize-impact-niche-newsletters-cross-promotion-techniques',
  'outreach': 'boost-fundraising-with-proven-sponsor-prospect-outreach',
  'visibility': 'seo-for-product-reviews-boost-visibility-and-sales',
  'ranking': 'mastering-seo-keyword-clustering-for-better-search-rankings',
  'search': 'mastering-seo-keyword-clustering-for-better-search-rankings',
  'impact': 'niche-roundup-posts-how-to-write-them-for-maximum-impact',
  'niche': 'niche-roundup-posts-how-to-write-them-for-maximum-impact',
  'freebie': 'generate-leads-with-freebies-step-by-step',
  'wealth': 'building-wealth-with-evergreen-affiliate-pillars',
  'transform': 'the-ultimate-blog-to-course-transformation-blueprint'
};

// Step 4: Add strategic internal links with better matching
function addStrategicInternalLinks(content, currentSlug, allArticles) {
  let modifiedContent = content;
  let linksAdded = 0;
  const maxLinks = 3;
  const usedTargets = new Set();
  
  // Sort keywords by length (longer phrases first to avoid partial matches)
  const sortedKeywords = Object.keys(internalLinkMappings)
    .sort((a, b) => b.length - a.length);
  
  for (const keyword of sortedKeywords) {
    if (linksAdded >= maxLinks) break;
    
    const targetSlug = internalLinkMappings[keyword];
    
    // Skip if: target doesn't exist, is same as current, or already used
    if (!allArticles.includes(targetSlug) || 
        targetSlug === currentSlug || 
        usedTargets.has(targetSlug)) {
      continue;
    }
    
    // Create flexible regex patterns - case insensitive, word boundaries
    const patterns = [
      // Exact match
      new RegExp(`\\b(${keyword})\\b(?![^\\[]*\\]\\()`, 'gi'),
      // Plural form
      new RegExp(`\\b(${keyword}s)\\b(?![^\\[]*\\]\\()`, 'gi'),
      // Possessive form
      new RegExp(`\\b(${keyword}'s)\\b(?![^\\[]*\\]\\()`, 'gi'),
      // -ing form
      new RegExp(`\\b(${keyword.replace(/e$/, '')}ing)\\b(?![^\\[]*\\]\\()`, 'gi')
    ];
    
    let matched = false;
    for (const pattern of patterns) {
      if (matched) break;
      
      const matches = [...modifiedContent.matchAll(pattern)];
      
      if (matches.length > 0) {
        // Find best match (prefer middle of content over beginning)
        const contentLength = modifiedContent.length;
        let bestMatch = matches[0];
        
        for (const match of matches) {
          const position = match.index / contentLength;
          // Prefer matches between 20% and 80% of content
          if (position > 0.2 && position < 0.8) {
            bestMatch = match;
            break;
          }
        }
        
        const index = bestMatch.index;
        const matchedText = bestMatch[0];
        
        // Check context to avoid breaking existing structures
        const beforeText = modifiedContent.substring(Math.max(0, index - 10), index);
        const afterText = modifiedContent.substring(index + matchedText.length, 
                                                   Math.min(modifiedContent.length, index + matchedText.length + 10));
        
        // Ensure we're not inside existing links, headers, or code blocks
        if (!beforeText.includes('[') && 
            !afterText.startsWith('](') && 
            !beforeText.includes('#') &&
            !beforeText.includes('`') &&
            !afterText.startsWith('`')) {
          
          // Add the link
          modifiedContent = modifiedContent.substring(0, index) + 
                          `[${matchedText}](/articles/${targetSlug}/)` + 
                          modifiedContent.substring(index + matchedText.length);
          
          linksAdded++;
          usedTargets.add(targetSlug);
          matched = true;
        }
      }
    }
  }
  
  return { content: modifiedContent, linksAdded };
}

// Main processing function
async function cleanAndOptimizeInternalLinks() {
  log('🔧 Optimizing Internal Links with Improved Matching', 'cyan');
  log('==================================================\n', 'cyan');
  
  const allArticles = getAllArticles();
  let totalProcessed = 0;
  let totalCleaned = 0;
  let totalLinksAdded = 0;
  const linkDistribution = {};
  
  log('📋 Step 1: Processing all articles...\n', 'yellow');
  
  for (const slug of allArticles) {
    const mdxPath = path.join(articlesDir, slug, 'index.mdx');
    
    if (!fs.existsSync(mdxPath)) {
      continue;
    }
    
    // Read content
    let content = fs.readFileSync(mdxPath, 'utf8');
    
    // Count existing links before cleaning
    const existingLinks = (content.match(/\[([^\]]+)\]\(\/articles\/[^)]+\)/g) || []).length;
    if (existingLinks > 0) {
      totalCleaned += existingLinks;
    }
    
    // Separate frontmatter and body
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      log(`⚠️  ${slug}: No frontmatter found`, 'yellow');
      continue;
    }
    
    const frontmatter = frontmatterMatch[0];
    const body = content.slice(frontmatter.length);
    
    // Clean all internal links
    const cleanedBody = cleanAllInternalLinks(body);
    
    // Add new strategic internal links
    const { content: optimizedBody, linksAdded } = addStrategicInternalLinks(cleanedBody, slug, allArticles);
    
    // Write updated content
    fs.writeFileSync(mdxPath, frontmatter + optimizedBody, 'utf8');
    
    totalProcessed++;
    totalLinksAdded += linksAdded;
    linkDistribution[slug] = linksAdded;
    
    if (linksAdded > 0) {
      log(`✅ ${slug.substring(0, 40).padEnd(40, '.')} : Added ${linksAdded} links`, 'green');
    } else {
      log(`⚠️  ${slug.substring(0, 40).padEnd(40, '.')} : No matches found`, 'yellow');
    }
  }
  
  // Summary statistics
  log('\n📊 Optimization Summary:', 'cyan');
  log('========================\n', 'cyan');
  log(`   Total articles processed: ${totalProcessed}`, 'blue');
  log(`   Total links cleaned: ${totalCleaned}`, 'yellow');
  log(`   Total new links added: ${totalLinksAdded}`, 'green');
  log(`   Average links per article: ${(totalLinksAdded / totalProcessed).toFixed(1)}`, 'blue');
  
  // Distribution analysis
  const articlesWithLinks = Object.values(linkDistribution).filter(count => count > 0).length;
  const coverage = ((articlesWithLinks / totalProcessed) * 100).toFixed(0);
  
  log(`\n📈 Link Coverage:`, 'cyan');
  log(`   Articles with links: ${articlesWithLinks}/${totalProcessed} (${coverage}%)`, 
      coverage >= 70 ? 'green' : coverage >= 50 ? 'yellow' : 'red');
  
  // Count distribution
  const distribution = { 0: 0, 1: 0, 2: 0, 3: 0 };
  Object.values(linkDistribution).forEach(count => {
    if (count <= 3) distribution[count]++;
  });
  
  log(`\n📊 Link Distribution:`, 'cyan');
  log(`   0 links: ${distribution[0]} articles`, distribution[0] > 10 ? 'yellow' : 'blue');
  log(`   1 link:  ${distribution[1]} articles`, 'blue');
  log(`   2 links: ${distribution[2]} articles`, 'blue');
  log(`   3 links: ${distribution[3]} articles`, 'green');
  
  log('\n✨ SEO Best Practices Applied:', 'magenta');
  log('   • All old links cleaned', 'blue');
  log('   • Using common, generic keywords for better matching', 'blue');
  log('   • Natural contextual placement', 'blue');
  log('   • 1-3 strategic links per article', 'blue');
  log('   • No generic "click here" text', 'blue');
  log('   • Topically relevant connections', 'blue');
  
  return {
    processed: totalProcessed,
    cleaned: totalCleaned,
    added: totalLinksAdded,
    coverage: articlesWithLinks
  };
}

// Execute the optimization
cleanAndOptimizeInternalLinks().catch(console.error);