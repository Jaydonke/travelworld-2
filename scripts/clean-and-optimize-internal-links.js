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

// Step 3: Comprehensive keyword mapping for all articles
const internalLinkMappings = {
  // Affiliate Marketing Keywords
  'affiliate marketing strategies': 'affiliate-vs-sponsored-posts-what-s-the-difference',
  'evergreen affiliate content': 'building-wealth-with-evergreen-affiliate-pillars',
  'affiliate post creation': 'the-ultimate-guide-to-creating-how-to-affiliate-posts',
  'landing page templates': 'proven-affiliate-landing-templates-for-successful-campaigns',
  'affiliate blog optimization': 'improve-your-site-with-seo-for-affiliate-blogs',
  'discount codes and deals': 'get-affiliate-discount-codes-amp-save-on-your-purchases',
  'tracking affiliate performance': 'advanced-affiliate-tracking-tools-comparison',
  
  // Content Strategy Keywords
  'AI-powered content planning': 'streamline-your-content-with-ai-assisted-content-calendars',
  'content repurposing workflow': 'content-repurposing-roadmaps-a-step-by-step-guide',
  'long-form evergreen guides': 'maximize-impact-with-long-form-evergreen-guides',
  'niche roundup content': 'niche-roundup-posts-how-to-write-them-for-maximum-impact',
  'portfolio blogging approach': 'develop-a-winning-portfolio-blogging-strategy-today',
  'micro-blogging techniques': 'micro-blogging-tutorials-a-step-by-step-guide',
  'blog to course transformation': 'the-ultimate-blog-to-course-transformation-blueprint',
  'podcast monetization strategy': 'podcast-monetization-for-bloggers',
  'YouTube channel integration': 'youtube-channel-blog-integration',
  
  // SEO & Optimization Keywords
  'keyword clustering techniques': 'mastering-seo-keyword-clustering-for-better-search-rankings',
  'product review optimization': 'seo-for-product-reviews-boost-visibility-and-sales',
  'review post enhancement': 'review-post-optimization-tips-for-maximizing-online-impact',
  'voice search optimization': 'voice-search-optimization-complete-guide',
  'local SEO strategies': 'local-seo-for-blog-monetization',
  'WordPress speed optimization': 'wordpress-speed-optimization-advanced',
  
  // Monetization Keywords
  'blog advertising setup': 'how-to-setup-blog-advertising-slots-for-maximum-revenue',
  'income transparency practices': 'understanding-blog-income-transparency-and-its-importance',
  'sponsor outreach methods': 'boost-fundraising-with-proven-sponsor-prospect-outreach',
  'monetization strategies': 'content-monetization-strategies-for-2025',
  'membership site creation': 'building-profitable-membership-sites',
  'subscription box business': 'subscription-box-blog-business-model',
  
  // Email & Lead Generation Keywords
  'lead magnet strategies': 'the-ultimate-guide-to-landing-page-lead-magnets',
  'freebie lead generation': 'generate-leads-with-freebies-step-by-step',
  'newsletter cross-promotion': 'maximize-impact-niche-newsletters-cross-promotion-techniques',
  'email automation sequences': 'email-automation-sequences-that-convert',
  'webinar funnel optimization': 'webinar-funnel-optimization-guide',
  
  // Community & Audience Keywords
  'membership community building': 'membership-community-ideas-for-building-stronger-groups',
  'traffic analytics insights': 'unlock-insights-with-advanced-traffic-analytics-dashboards',
  'blog branding makeover': 'transform-your-online-presence-with-blog-branding-makeovers',
  'Pinterest traffic generation': 'pinterest-traffic-generation-masterclass',
  
  // Social Media Keywords
  'Instagram content strategy': 'instagram-content-strategy-for-bloggers',
  'influencer collaboration tactics': 'influencer-collaboration-strategies',
  'TikTok promotion strategies': 'tiktok-blog-promotion-strategies'
};

// Step 4: Add strategic internal links
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
    
    // Create flexible regex patterns
    const patterns = [
      new RegExp(`\\b(${keyword})\\b(?![^\\[]*\\]\\()`, 'gi'),
      new RegExp(`\\b(${keyword}s?)\\b(?![^\\[]*\\]\\()`, 'gi'),
      new RegExp(`\\b(${keyword.replace(/ /g, '[\\s-]')})\\b(?![^\\[]*\\]\\()`, 'gi')
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
        
        // Ensure we're not inside existing links or headers
        if (!beforeText.includes('[') && 
            !afterText.startsWith('](') && 
            !beforeText.includes('#')) {
          
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
  log('🔧 Cleaning and Optimizing Internal Links', 'cyan');
  log('==========================================\n', 'cyan');
  
  const allArticles = getAllArticles();
  let totalProcessed = 0;
  let totalCleaned = 0;
  let totalLinksAdded = 0;
  const linkDistribution = {};
  
  log('📋 Step 1: Cleaning all existing internal links...\n', 'yellow');
  
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
      log(`✅ ${slug.substring(0, 40)}... : Cleaned ${existingLinks}, Added ${linksAdded} new links`, 'green');
    } else {
      log(`⚠️  ${slug.substring(0, 40)}... : Cleaned ${existingLinks}, No matching keywords found`, 'yellow');
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
      coverage >= 70 ? 'green' : 'yellow');
  
  // Count distribution
  const distribution = { 0: 0, 1: 0, 2: 0, 3: 0 };
  Object.values(linkDistribution).forEach(count => {
    if (count <= 3) distribution[count]++;
  });
  
  log(`\n📊 Link Distribution:`, 'cyan');
  log(`   0 links: ${distribution[0]} articles`, distribution[0] > 5 ? 'yellow' : 'blue');
  log(`   1 link:  ${distribution[1]} articles`, 'blue');
  log(`   2 links: ${distribution[2]} articles`, 'blue');
  log(`   3 links: ${distribution[3]} articles`, 'green');
  
  log('\n✨ SEO Best Practices Applied:', 'magenta');
  log('   • All old links cleaned', 'blue');
  log('   • Descriptive keyword phrases as anchor text', 'blue');
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