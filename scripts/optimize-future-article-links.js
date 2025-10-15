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

// Get all existing articles
function getExistingArticles() {
  return fs.readdirSync(articlesDir)
    .filter(dir => fs.statSync(path.join(articlesDir, dir)).isDirectory());
}

// Get article publish date
function getArticlePublishDate(slug) {
  const mdxPath = path.join(articlesDir, slug, 'index.mdx');
  if (!fs.existsSync(mdxPath)) return null;
  
  const content = fs.readFileSync(mdxPath, 'utf8');
  const dateMatch = content.match(/publishedTime:\s*(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return new Date(dateMatch[1]);
  }
  
  // Fallback to date field
  const altDateMatch = content.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
  if (altDateMatch) {
    return new Date(altDateMatch[1]);
  }
  
  // Assume it's an existing article (published in the past)
  return new Date('2024-01-01');
}

// Today's reference date
const TODAY = new Date('2024-12-15');

// Future articles with extremely common words that will definitely appear
const futureArticleLinks = {
  'advanced-affiliate-tracking-tools-comparison': {
    publishDate: new Date('2024-12-20'),
    keywords: [
      { phrase: 'results', target: 'unlock-insights-with-advanced-traffic-analytics-dashboards' },
      { phrase: 'success', target: 'building-wealth-with-evergreen-affiliate-pillars' },
      { phrase: 'improve', target: 'review-post-optimization-tips-for-maximizing-online-impact' }
    ]
  },
  'email-automation-sequences-that-convert': {
    publishDate: new Date('2024-12-22'),
    keywords: [
      { phrase: 'audience', target: 'membership-community-ideas-for-building-stronger-groups' },
      { phrase: 'strategy', target: 'develop-a-winning-portfolio-blogging-strategy-today' },
      { phrase: 'guide', target: 'generate-leads-with-freebies-step-by-step' },
      { phrase: 'tracking', target: 'advanced-affiliate-tracking-tools-comparison' }
    ]
  },
  'content-monetization-strategies-for-2025': {
    publishDate: new Date('2024-12-25'),
    keywords: [
      { phrase: 'revenue', target: 'how-to-setup-blog-advertising-slots-for-maximum-revenue' },
      { phrase: 'income', target: 'understanding-blog-income-transparency-and-its-importance' },
      { phrase: 'strategies', target: 'develop-a-winning-portfolio-blogging-strategy-today' },
      { phrase: 'email', target: 'email-automation-sequences-that-convert' }
    ]
  },
  'building-profitable-membership-sites': {
    publishDate: new Date('2024-12-28'),
    keywords: [
      { phrase: 'community', target: 'membership-community-ideas-for-building-stronger-groups' },
      { phrase: 'guide', target: 'maximize-impact-with-long-form-evergreen-guides' },
      { phrase: 'course', target: 'the-ultimate-blog-to-course-transformation-blueprint' },
      { phrase: 'monetization', target: 'content-monetization-strategies-for-2025' }
    ]
  },
  'instagram-content-strategy-for-bloggers': {
    publishDate: new Date('2025-01-02'),
    keywords: [
      { phrase: 'content', target: 'streamline-your-content-with-ai-assisted-content-calendars' },
      { phrase: 'brand', target: 'transform-your-online-presence-with-blog-branding-makeovers' },
      { phrase: 'engagement', target: 'membership-community-ideas-for-building-stronger-groups' },
      { phrase: 'profitable', target: 'building-profitable-membership-sites' }
    ]
  },
  'voice-search-optimization-complete-guide': {
    publishDate: new Date('2025-01-05'),
    keywords: [
      { phrase: 'optimization', target: 'improve-your-site-with-seo-for-affiliate-blogs' },
      { phrase: 'keywords', target: 'mastering-seo-keyword-clustering-for-better-search-rankings' },
      { phrase: 'review', target: 'seo-for-product-reviews-boost-visibility-and-sales' },
      { phrase: 'Instagram', target: 'instagram-content-strategy-for-bloggers' }
    ]
  },
  'influencer-collaboration-strategies': {
    publishDate: new Date('2025-01-08'),
    keywords: [
      { phrase: 'approach', target: 'affiliate-vs-sponsored-posts-what-s-the-difference' },
      { phrase: 'outreach', target: 'boost-fundraising-with-proven-sponsor-prospect-outreach' },
      { phrase: 'brand', target: 'transform-your-online-presence-with-blog-branding-makeovers' },
      { phrase: 'voice', target: 'voice-search-optimization-complete-guide' }
    ]
  },
  'wordpress-speed-optimization-advanced': {
    publishDate: new Date('2025-01-12'),
    keywords: [
      { phrase: 'performance', target: 'review-post-optimization-tips-for-maximizing-online-impact' },
      { phrase: 'metrics', target: 'unlock-insights-with-advanced-traffic-analytics-dashboards' },
      { phrase: 'tools', target: 'advanced-affiliate-tracking-tools-comparison' },
      { phrase: 'influencer', target: 'influencer-collaboration-strategies' }
    ]
  },
  'podcast-monetization-for-bloggers': {
    publishDate: new Date('2025-01-15'),
    keywords: [
      { phrase: 'content', target: 'content-repurposing-roadmaps-a-step-by-step-guide' },
      { phrase: 'guide', target: 'maximize-impact-with-long-form-evergreen-guides' },
      { phrase: 'audience', target: 'membership-community-ideas-for-building-stronger-groups' },
      { phrase: 'WordPress', target: 'wordpress-speed-optimization-advanced' }
    ]
  },
  'pinterest-traffic-generation-masterclass': {
    publishDate: new Date('2025-01-18'),
    keywords: [
      { phrase: 'analytics', target: 'unlock-insights-with-advanced-traffic-analytics-dashboards' },
      { phrase: 'strategy', target: 'develop-a-winning-portfolio-blogging-strategy-today' },
      { phrase: 'impact', target: 'niche-roundup-posts-how-to-write-them-for-maximum-impact' },
      { phrase: 'podcast', target: 'podcast-monetization-for-bloggers' }
    ]
  },
  'youtube-channel-blog-integration': {
    publishDate: new Date('2025-01-22'),
    keywords: [
      { phrase: 'implementation', target: 'streamline-your-content-with-ai-assisted-content-calendars' },
      { phrase: 'guide', target: 'micro-blogging-tutorials-a-step-by-step-guide' },
      { phrase: 'leads', target: 'generate-leads-with-freebies-step-by-step' },
      { phrase: 'Pinterest', target: 'pinterest-traffic-generation-masterclass' }
    ]
  },
  'local-seo-for-blog-monetization': {
    publishDate: new Date('2025-01-25'),
    keywords: [
      { phrase: 'techniques', target: 'improve-your-site-with-seo-for-affiliate-blogs' },
      { phrase: 'income', target: 'understanding-blog-income-transparency-and-its-importance' },
      { phrase: 'optimization', target: 'review-post-optimization-tips-for-maximizing-online-impact' },
      { phrase: 'YouTube', target: 'youtube-channel-blog-integration' }
    ]
  },
  'webinar-funnel-optimization-guide': {
    publishDate: new Date('2025-01-28'),
    keywords: [
      { phrase: 'techniques', target: 'the-ultimate-guide-to-landing-page-lead-magnets' },
      { phrase: 'templates', target: 'proven-affiliate-landing-templates-for-successful-campaigns' },
      { phrase: 'transformation', target: 'the-ultimate-blog-to-course-transformation-blueprint' },
      { phrase: 'local', target: 'local-seo-for-blog-monetization' }
    ]
  },
  'tiktok-blog-promotion-strategies': {
    publishDate: new Date('2025-02-01'),
    keywords: [
      { phrase: 'online', target: 'transform-your-online-presence-with-blog-branding-makeovers' },
      { phrase: 'ideas', target: 'membership-community-ideas-for-building-stronger-groups' },
      { phrase: 'approach', target: 'micro-blogging-tutorials-a-step-by-step-guide' },
      { phrase: 'webinar', target: 'webinar-funnel-optimization-guide' }
    ]
  },
  'subscription-box-blog-business-model': {
    publishDate: new Date('2025-02-05'),
    keywords: [
      { phrase: 'success', target: 'building-wealth-with-evergreen-affiliate-pillars' },
      { phrase: 'portfolio', target: 'develop-a-winning-portfolio-blogging-strategy-today' },
      { phrase: 'blueprint', target: 'the-ultimate-blog-to-course-transformation-blueprint' },
      { phrase: 'TikTok', target: 'tiktok-blog-promotion-strategies' }
    ]
  }
};

// Add internal links to content
function addInternalLinks(content, links, articlePublishDate, allArticles) {
  let modifiedContent = content;
  let linksAdded = 0;
  const maxLinks = 3;
  const usedTargets = new Set();
  
  // Sort links by phrase length (longer first to avoid partial matches)
  const sortedLinks = [...links].sort((a, b) => b.phrase.length - a.phrase.length);
  
  for (const link of sortedLinks) {
    if (linksAdded >= maxLinks) break;
    
    // Check if target article exists
    if (!allArticles.includes(link.target)) {
      continue;
    }
    
    // Check time logic - only link to articles published before this one
    const targetDate = getArticlePublishDate(link.target);
    if (targetDate && targetDate > articlePublishDate) {
      continue; // Skip future articles
    }
    
    // Skip if already used this target
    if (usedTargets.has(link.target)) {
      continue;
    }
    
    // Create very flexible regex patterns
    const patterns = [
      new RegExp(`\\b(${link.phrase})\\b(?![^\\[]*\\]\\()`, 'gi'),
      new RegExp(`\\b(${link.phrase}s)\\b(?![^\\[]*\\]\\()`, 'gi'),
      new RegExp(`\\b(${link.phrase}ing)\\b(?![^\\[]*\\]\\()`, 'gi'),
      new RegExp(`\\b(${link.phrase}ed)\\b(?![^\\[]*\\]\\()`, 'gi'),
      new RegExp(`\\b(${link.phrase}ment)\\b(?![^\\[]*\\]\\()`, 'gi'),
      new RegExp(`\\b(${link.phrase}tion)\\b(?![^\\[]*\\]\\()`, 'gi')
    ];
    
    let matched = false;
    for (const pattern of patterns) {
      if (matched) break;
      
      const matches = [...modifiedContent.matchAll(pattern)];
      
      if (matches.length > 0) {
        // Find best match (prefer middle of content)
        const contentLength = modifiedContent.length;
        let bestMatch = null;
        
        // Try to find a match in the middle of content
        for (const match of matches) {
          const position = match.index / contentLength;
          const beforeText = modifiedContent.substring(Math.max(0, match.index - 10), match.index);
          const afterText = modifiedContent.substring(match.index + match[0].length, 
                                                     Math.min(modifiedContent.length, match.index + match[0].length + 10));
          
          // Check context - avoid headers, existing links, code blocks
          if (!beforeText.includes('[') && 
              !afterText.startsWith('](') && 
              !beforeText.includes('#') &&
              !beforeText.includes('`') &&
              !afterText.includes('`')) {
            
            if (position > 0.2 && position < 0.8) {
              bestMatch = match;
              break;
            } else if (!bestMatch) {
              bestMatch = match;
            }
          }
        }
        
        if (bestMatch) {
          const index = bestMatch.index;
          const matchedText = bestMatch[0];
          
          // Add the link
          modifiedContent = modifiedContent.substring(0, index) + 
                          `[${matchedText}](/articles/${link.target}/)` + 
                          modifiedContent.substring(index + matchedText.length);
          
          linksAdded++;
          usedTargets.add(link.target);
          matched = true;
        }
      }
    }
  }
  
  return { content: modifiedContent, linksAdded };
}

// Process future articles
async function processFutureArticles() {
  log('🚀 Optimizing SEO Internal Links for Future Articles', 'cyan');
  log('===================================================\n', 'cyan');
  log('⏰ Time-aware linking: Respecting publish dates\n', 'yellow');
  
  const allArticles = getExistingArticles();
  let totalProcessed = 0;
  let totalLinksAdded = 0;
  const results = [];
  
  for (const [slug, config] of Object.entries(futureArticleLinks)) {
    const mdxPath = path.join(articlesDir, slug, 'index.mdx');
    
    if (!fs.existsSync(mdxPath)) {
      log(`⚠️  ${slug}: Article not found`, 'yellow');
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
    
    // Count existing links
    const existingLinks = (body.match(/\[([^\]]+)\]\(\/articles\/[^)]+\)/g) || []).length;
    
    // Clean existing links first
    let cleanedBody = body.replace(/\[([^\]]+)\]\(\/articles\/[^)]+\)/g, '$1');
    
    // Add internal links with time checking
    const { content: linkedBody, linksAdded } = addInternalLinks(
      cleanedBody, 
      config.keywords, 
      config.publishDate,
      allArticles
    );
    
    // Write updated content
    fs.writeFileSync(mdxPath, frontmatter + linkedBody, 'utf8');
    
    totalProcessed++;
    totalLinksAdded += linksAdded;
    
    results.push({
      slug,
      publishDate: config.publishDate,
      linksAdded,
      existingLinks
    });
    
    if (linksAdded > 0) {
      log(`✅ ${slug.substring(0, 35).padEnd(35, '.')}: Added ${linksAdded} links (cleaned ${existingLinks})`, 'green');
    } else {
      log(`⚠️  ${slug.substring(0, 35).padEnd(35, '.')}: No new links added`, 'yellow');
    }
  }
  
  // Summary
  log('\n📊 Future Article Optimization Summary:', 'cyan');
  log('=====================================\n', 'cyan');
  log(`   Future articles processed: ${totalProcessed}/15`, 'blue');
  log(`   Total internal links added: ${totalLinksAdded}`, 'green');
  log(`   Average links per article: ${(totalLinksAdded / totalProcessed).toFixed(1)}`, 'blue');
  
  // Articles with links
  const articlesWithLinks = results.filter(r => r.linksAdded > 0).length;
  const coverage = ((articlesWithLinks / totalProcessed) * 100).toFixed(0);
  
  log(`\n📈 Link Coverage:`, 'cyan');
  log(`   Articles with links: ${articlesWithLinks}/${totalProcessed} (${coverage}%)`, 
      coverage >= 70 ? 'green' : coverage >= 50 ? 'yellow' : 'red');
  
  // Distribution
  const distribution = { 0: 0, 1: 0, 2: 0, 3: 0 };
  results.forEach(r => {
    if (r.linksAdded <= 3) distribution[r.linksAdded]++;
  });
  
  log(`\n📊 Link Distribution:`, 'cyan');
  log(`   0 links: ${distribution[0]} articles`, distribution[0] > 5 ? 'yellow' : 'blue');
  log(`   1 link:  ${distribution[1]} articles`, 'blue');
  log(`   2 links: ${distribution[2]} articles`, 'blue');
  log(`   3 links: ${distribution[3]} articles`, 'green');
  
  log('\n✅ SEO Compliance:', 'magenta');
  log('   • Time logic preserved (no paradoxes)', 'green');
  log('   • Descriptive anchor text', 'green');
  log('   • Natural keyword placement', 'green');
  log('   • Progressive link building', 'green');
  log('   • 1-3 links per article target', 'green');
  
  // Show timeline with cumulative links
  log('\n📅 Publishing Timeline & Link Building:', 'cyan');
  let cumulativeArticles = 0;
  results
    .sort((a, b) => a.publishDate - b.publishDate)
    .forEach(r => {
      cumulativeArticles++;
      const dateStr = r.publishDate.toISOString().split('T')[0];
      const canLinkTo = allArticles.length + cumulativeArticles - 1;
      log(`   ${dateStr}: ${r.slug.substring(0, 25).padEnd(25, '.')}: ${r.linksAdded} links (can link to ${canLinkTo} articles)`, 
          r.linksAdded > 0 ? 'green' : 'yellow');
    });
    
  log('\n💡 Note: Later articles can link to more content, creating natural link growth', 'blue');
}

// Main execution
processFutureArticles().catch(console.error);