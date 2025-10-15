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

// Enhanced keyword map with more variations for better coverage
const enhancedLinkMap = {
  // Affiliate Marketing Keywords
  'affiliate revenue': 'building-wealth-with-evergreen-affiliate-pillars',
  'commission tracking': 'affiliate-vs-sponsored-posts-what-s-the-difference',
  'affiliate templates': 'proven-affiliate-landing-templates-for-successful-campaigns',
  'affiliate SEO': 'improve-your-site-with-seo-for-affiliate-blogs',
  'how-to guides': 'the-ultimate-guide-to-creating-how-to-affiliate-posts',
  'promo codes': 'get-affiliate-discount-codes-amp-save-on-your-purchases',
  
  // Content Creation Keywords
  'AI content tools': 'streamline-your-content-with-ai-assisted-content-calendars',
  'content roadmap': 'content-repurposing-roadmaps-a-step-by-step-guide',
  'long-form content': 'maximize-impact-with-long-form-evergreen-guides',
  'roundup posts': 'niche-roundup-posts-how-to-write-them-for-maximum-impact',
  'portfolio strategy': 'develop-a-winning-portfolio-blogging-strategy-today',
  'micro-blog': 'micro-blogging-tutorials-a-step-by-step-guide',
  'course creation': 'the-ultimate-blog-to-course-transformation-blueprint',
  
  // SEO Keywords
  'keyword research': 'mastering-seo-keyword-clustering-for-better-search-rankings',
  'search rankings': 'mastering-seo-keyword-clustering-for-better-search-rankings',
  'review SEO': 'seo-for-product-reviews-boost-visibility-and-sales',
  'optimize reviews': 'review-post-optimization-tips-for-maximizing-online-impact',
  
  // Monetization Keywords
  'ad slots': 'how-to-setup-blog-advertising-slots-for-maximum-revenue',
  'revenue streams': 'understanding-blog-income-transparency-and-its-importance',
  'income transparency': 'understanding-blog-income-transparency-and-its-importance',
  'sponsorship deals': 'boost-fundraising-with-proven-sponsor-prospect-outreach',
  
  // Lead Generation Keywords
  'landing pages': 'the-ultimate-guide-to-landing-page-lead-magnets',
  'free resources': 'generate-leads-with-freebies-step-by-step',
  'email lists': 'maximize-impact-niche-newsletters-cross-promotion-techniques',
  
  // Community & Analytics Keywords
  'online community': 'membership-community-ideas-for-building-stronger-groups',
  'website analytics': 'unlock-insights-with-advanced-traffic-analytics-dashboards',
  'brand identity': 'transform-your-online-presence-with-blog-branding-makeovers'
};

// Get all article slugs
function getAllArticleSlugs() {
  return fs.readdirSync(articlesDir)
    .filter(dir => fs.statSync(path.join(articlesDir, dir)).isDirectory());
}

// Enhanced link addition with better context checking
function addEnhancedLinks(content, currentSlug, allSlugs, existingLinks) {
  let linkedContent = content;
  let linksAdded = existingLinks || 0;
  const usedTargets = new Set();
  const maxLinks = 3;
  
  // Sort keywords by length (longer phrases first)
  const sortedKeywords = Object.keys(enhancedLinkMap).sort((a, b) => b.length - a.length);
  
  for (const keyword of sortedKeywords) {
    if (linksAdded >= maxLinks) break;
    
    const targetSlug = enhancedLinkMap[keyword];
    
    // Skip if target doesn't exist, is same as current, or already used
    if (!allSlugs.includes(targetSlug) || targetSlug === currentSlug || usedTargets.has(targetSlug)) {
      continue;
    }
    
    // Create regex with word boundaries
    const regex = new RegExp(`\\b(${keyword})s?\\b(?![^\\[]*\\]\\()`, 'gi');
    
    // Find all matches
    const matches = [...linkedContent.matchAll(regex)];
    
    if (matches.length > 0) {
      // Use the first match
      const match = matches[0];
      const index = match.index;
      const matchedText = match[0];
      
      // Check context to avoid breaking existing links
      const beforeText = linkedContent.substring(Math.max(0, index - 50), index);
      const afterText = linkedContent.substring(index + matchedText.length, Math.min(linkedContent.length, index + matchedText.length + 50));
      
      if (!beforeText.includes('[') && !afterText.startsWith('](')) {
        // Replace the match with a link
        linkedContent = linkedContent.substring(0, index) + 
                       `[${matchedText}](/articles/${targetSlug}/)` + 
                       linkedContent.substring(index + matchedText.length);
        
        linksAdded++;
        usedTargets.add(targetSlug);
      }
    }
  }
  
  return { content: linkedContent, linksAdded };
}

// Process articles that need more links
async function enhanceArticles() {
  log('🚀 Enhancing Internal Links for Better SEO Coverage', 'cyan');
  log('==================================================\n', 'cyan');
  
  const allSlugs = getAllArticleSlugs();
  let totalProcessed = 0;
  let totalLinksAdded = 0;
  const linkStats = {};
  
  // Target articles that had no links previously
  const articlesToEnhance = [
    'get-affiliate-discount-codes-amp-save-on-your-purchases',
    'improve-your-site-with-seo-for-affiliate-blogs',
    'mastering-seo-keyword-clustering-for-better-search-rankings',
    'maximize-impact-niche-newsletters-cross-promotion-techniques',
    'niche-roundup-posts-how-to-write-them-for-maximum-impact',
    'review-post-optimization-tips-for-maximizing-online-impact',
    'seo-for-product-reviews-boost-visibility-and-sales',
    'streamline-your-content-with-ai-assisted-content-calendars',
    'the-ultimate-guide-to-landing-page-lead-magnets',
    'transform-your-online-presence-with-blog-branding-makeovers',
    'unlock-insights-with-advanced-traffic-analytics-dashboards'
  ];
  
  for (const slug of articlesToEnhance) {
    const mdxPath = path.join(articlesDir, slug, 'index.mdx');
    
    if (!fs.existsSync(mdxPath)) {
      continue;
    }
    
    // Read content
    let content = fs.readFileSync(mdxPath, 'utf8');
    
    // Separate frontmatter and body
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      continue;
    }
    
    const frontmatter = frontmatterMatch[0];
    const body = content.slice(frontmatter.length);
    
    // Count existing links
    const existingLinks = (body.match(/\[([^\]]+)\]\(\/articles\/[^)]+\)/g) || []).length;
    
    // Add enhanced links
    const { content: linkedBody, linksAdded } = addEnhancedLinks(body, slug, allSlugs, existingLinks);
    
    const newLinksAdded = linksAdded - existingLinks;
    
    if (newLinksAdded > 0) {
      // Write updated content
      fs.writeFileSync(mdxPath, frontmatter + linkedBody, 'utf8');
      
      totalProcessed++;
      totalLinksAdded += newLinksAdded;
      linkStats[slug] = newLinksAdded;
      
      log(`✅ ${slug.substring(0, 40)}... : Added ${newLinksAdded} new links`, 'green');
    } else {
      log(`⚠️  ${slug.substring(0, 40)}... : No additional keywords found`, 'yellow');
    }
  }
  
  // Summary
  log('\n📊 Enhancement Summary:', 'cyan');
  log('======================\n', 'cyan');
  log(`   Articles enhanced: ${totalProcessed}`, 'blue');
  log(`   New links added: ${totalLinksAdded}`, 'green');
  
  if (totalProcessed > 0) {
    log(`   Average new links per enhanced article: ${(totalLinksAdded / totalProcessed).toFixed(1)}`, 'blue');
  }
  
  log('\n✨ Enhanced SEO Strategy:', 'magenta');
  log('   • More keyword variations covered', 'blue');
  log('   • Better topical relevance', 'blue');
  log('   • Improved content discoverability', 'blue');
  log('   • Stronger site architecture', 'blue');
}

// Main execution
enhanceArticles().catch(console.error);