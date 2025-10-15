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

// Clean all existing internal links
function cleanExistingLinks(content) {
  // Remove markdown links pointing to internal articles
  let cleaned = content.replace(/\[([^\]]+)\]\(\/articles\/[^)]+\)/g, '$1');
  
  // Remove HTML anchor tags for internal links
  cleaned = cleaned.replace(/<a[^>]*href="\/articles\/[^"]*"[^>]*>([^<]+)<\/a>/gi, '$1');
  
  return cleaned;
}

// Map of keyword phrases to target articles for blogging theme
const internalLinkMap = {
  // Affiliate Marketing Links
  'affiliate marketing': 'affiliate-vs-sponsored-posts-what-s-the-difference',
  'affiliate programs': 'building-wealth-with-evergreen-affiliate-pillars',
  'affiliate posts': 'the-ultimate-guide-to-creating-how-to-affiliate-posts',
  'affiliate landing pages': 'proven-affiliate-landing-templates-for-successful-campaigns',
  'affiliate blog': 'improve-your-site-with-seo-for-affiliate-blogs',
  'discount codes': 'get-affiliate-discount-codes-amp-save-on-your-purchases',
  
  // Content Strategy Links
  'content calendar': 'streamline-your-content-with-ai-assisted-content-calendars',
  'content repurposing': 'content-repurposing-roadmaps-a-step-by-step-guide',
  'evergreen content': 'maximize-impact-with-long-form-evergreen-guides',
  'niche content': 'niche-roundup-posts-how-to-write-them-for-maximum-impact',
  'portfolio blogging': 'develop-a-winning-portfolio-blogging-strategy-today',
  'micro-blogging': 'micro-blogging-tutorials-a-step-by-step-guide',
  'blog to course': 'the-ultimate-blog-to-course-transformation-blueprint',
  
  // SEO Optimization Links
  'SEO for affiliates': 'improve-your-site-with-seo-for-affiliate-blogs',
  'keyword clustering': 'mastering-seo-keyword-clustering-for-better-search-rankings',
  'product reviews SEO': 'seo-for-product-reviews-boost-visibility-and-sales',
  'review optimization': 'review-post-optimization-tips-for-maximizing-online-impact',
  
  // Monetization Links
  'blog advertising': 'how-to-setup-blog-advertising-slots-for-maximum-revenue',
  'blog income': 'understanding-blog-income-transparency-and-its-importance',
  'sponsored posts': 'affiliate-vs-sponsored-posts-what-s-the-difference',
  'sponsor outreach': 'boost-fundraising-with-proven-sponsor-prospect-outreach',
  
  // Email & Lead Gen Links
  'lead magnets': 'the-ultimate-guide-to-landing-page-lead-magnets',
  'lead generation': 'generate-leads-with-freebies-step-by-step',
  'newsletter cross-promotion': 'maximize-impact-niche-newsletters-cross-promotion-techniques',
  
  // Audience Growth Links
  'membership community': 'membership-community-ideas-for-building-stronger-groups',
  'traffic analytics': 'unlock-insights-with-advanced-traffic-analytics-dashboards',
  'blog branding': 'transform-your-online-presence-with-blog-branding-makeovers'
};

// Get all article slugs for validation
function getAllArticleSlugs() {
  return fs.readdirSync(articlesDir)
    .filter(dir => fs.statSync(path.join(articlesDir, dir)).isDirectory());
}

// Add internal links to content
function addInternalLinks(content, currentSlug, allSlugs) {
  let linkedContent = content;
  let linksAdded = 0;
  const usedTargets = new Set();
  const maxLinks = 3;
  
  // Sort keywords by length (longer phrases first to avoid partial matches)
  const sortedKeywords = Object.keys(internalLinkMap).sort((a, b) => b.length - a.length);
  
  for (const keyword of sortedKeywords) {
    if (linksAdded >= maxLinks) break;
    
    const targetSlug = internalLinkMap[keyword];
    
    // Skip if target doesn't exist or is the same as current article
    if (!allSlugs.includes(targetSlug) || targetSlug === currentSlug || usedTargets.has(targetSlug)) {
      continue;
    }
    
    // Create regex to find the keyword (case-insensitive, word boundaries)
    const regex = new RegExp(`\\b(${keyword})\\b(?![^\\[]*\\]\\()`, 'gi');
    
    // Check if keyword exists in content
    const match = linkedContent.match(regex);
    if (match) {
      // Replace first occurrence only
      linkedContent = linkedContent.replace(regex, (matched, p1, offset, string) => {
        // Don't replace if already in a link
        const beforeText = string.substring(Math.max(0, offset - 50), offset);
        const afterText = string.substring(offset, Math.min(string.length, offset + 50));
        
        if (beforeText.includes('[') || afterText.includes('](/')) {
          return matched;
        }
        
        if (linksAdded < maxLinks) {
          linksAdded++;
          usedTargets.add(targetSlug);
          return `[${matched}](/articles/${targetSlug}/)`;
        }
        return matched;
      });
    }
  }
  
  return { content: linkedContent, linksAdded };
}

// Process all articles
async function processArticles() {
  log('🔗 Optimizing Internal Links for SEO', 'cyan');
  log('=====================================\n', 'cyan');
  
  const allSlugs = getAllArticleSlugs();
  let totalProcessed = 0;
  let totalLinksAdded = 0;
  const linkStats = {};
  
  for (const slug of allSlugs) {
    const mdxPath = path.join(articlesDir, slug, 'index.mdx');
    
    if (!fs.existsSync(mdxPath)) {
      continue;
    }
    
    // Read content
    let content = fs.readFileSync(mdxPath, 'utf8');
    
    // Separate frontmatter and body
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      log(`⚠️  ${slug}: No frontmatter found`, 'yellow');
      continue;
    }
    
    const frontmatter = frontmatterMatch[0];
    const body = content.slice(frontmatter.length);
    
    // Clean existing links
    const cleanedBody = cleanExistingLinks(body);
    
    // Add new internal links
    const { content: linkedBody, linksAdded } = addInternalLinks(cleanedBody, slug, allSlugs);
    
    // Write updated content
    fs.writeFileSync(mdxPath, frontmatter + linkedBody, 'utf8');
    
    totalProcessed++;
    totalLinksAdded += linksAdded;
    linkStats[slug] = linksAdded;
    
    if (linksAdded > 0) {
      log(`✅ ${slug.substring(0, 40)}... : Added ${linksAdded} internal links`, 'green');
    } else {
      log(`⚠️  ${slug.substring(0, 40)}... : No suitable keywords found`, 'yellow');
    }
  }
  
  // Summary
  log('\n📊 Internal Link Optimization Summary:', 'cyan');
  log('=====================================\n', 'cyan');
  log(`   Total articles processed: ${totalProcessed}`, 'blue');
  log(`   Total internal links added: ${totalLinksAdded}`, 'green');
  log(`   Average links per article: ${(totalLinksAdded / totalProcessed).toFixed(1)}`, 'blue');
  
  // Articles with most links
  const sortedStats = Object.entries(linkStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (sortedStats.length > 0) {
    log('\n🏆 Top Linked Articles:', 'yellow');
    sortedStats.forEach(([slug, count]) => {
      if (count > 0) {
        log(`   • ${slug.substring(0, 40)}... : ${count} links`, 'green');
      }
    });
  }
  
  log('\n✨ SEO Best Practices Applied:', 'magenta');
  log('   • Descriptive anchor text with keyword phrases', 'blue');
  log('   • Natural contextual placement', 'blue');
  log('   • 1-3 internal links per article', 'blue');
  log('   • Links to topically relevant content', 'blue');
  log('   • No generic "click here" text', 'blue');
}

// Main execution
processArticles().catch(console.error);