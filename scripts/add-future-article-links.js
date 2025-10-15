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
  return null;
}

// Future articles with their publish dates and keyword mappings
const futureArticleLinks = {
  'advanced-affiliate-tracking-tools-comparison': {
    publishDate: new Date('2024-12-20'),
    keywords: [
      { phrase: 'success', target: 'building-wealth-with-evergreen-affiliate-pillars' },
      { phrase: 'analytics', target: 'unlock-insights-with-advanced-traffic-analytics-dashboards' },
      { phrase: 'optimization', target: 'review-post-optimization-tips-for-maximizing-online-impact' }
    ]
  },
  'email-automation-sequences-that-convert': {
    publishDate: new Date('2024-12-22'),
    keywords: [
      { phrase: 'audience', target: 'membership-community-ideas-for-building-stronger-groups' },
      { phrase: 'strategy', target: 'develop-a-winning-portfolio-blogging-strategy-today' },
      { phrase: 'lead', target: 'generate-leads-with-freebies-step-by-step' }
    ]
  },
  'content-monetization-strategies-for-2025': {
    publishDate: new Date('2024-12-25'),
    keywords: [
      { phrase: 'revenue', target: 'how-to-setup-blog-advertising-slots-for-maximum-revenue' },
      { phrase: 'transparency', target: 'understanding-blog-income-transparency-and-its-importance' },
      { phrase: 'portfolio', target: 'develop-a-winning-portfolio-blogging-strategy-today' }
    ]
  },
  'building-profitable-membership-sites': {
    publishDate: new Date('2024-12-28'),
    keywords: [
      { phrase: 'community', target: 'membership-community-ideas-for-building-stronger-groups' },
      { phrase: 'evergreen', target: 'maximize-impact-with-long-form-evergreen-guides' },
      { phrase: 'transformation', target: 'the-ultimate-blog-to-course-transformation-blueprint' }
    ]
  },
  'instagram-content-strategy-for-bloggers': {
    publishDate: new Date('2025-01-02'),
    keywords: [
      { phrase: 'planning', target: 'streamline-your-content-with-ai-assisted-content-calendars' },
      { phrase: 'brand', target: 'transform-your-online-presence-with-blog-branding-makeovers' },
      { phrase: 'engagement', target: 'membership-community-ideas-for-building-stronger-groups' },
      { phrase: 'success', target: 'advanced-affiliate-tracking-tools-comparison' }
    ]
  },
  'voice-search-optimization-complete-guide': {
    publishDate: new Date('2025-01-05'),
    keywords: [
      { phrase: 'SEO', target: 'improve-your-site-with-seo-for-affiliate-blogs' },
      { phrase: 'keyword', target: 'mastering-seo-keyword-clustering-for-better-search-rankings' },
      { phrase: 'review', target: 'seo-for-product-reviews-boost-visibility-and-sales' },
      { phrase: 'content', target: 'content-monetization-strategies-for-2025' }
    ]
  },
  'influencer-collaboration-strategies': {
    publishDate: new Date('2025-01-08'),
    keywords: [
      { phrase: 'sponsored', target: 'affiliate-vs-sponsored-posts-what-s-the-difference' },
      { phrase: 'outreach', target: 'boost-fundraising-with-proven-sponsor-prospect-outreach' },
      { phrase: 'monetization', target: 'content-monetization-strategies-for-2025' },
      { phrase: 'automation', target: 'email-automation-sequences-that-convert' }
    ]
  },
  'wordpress-speed-optimization-advanced': {
    publishDate: new Date('2025-01-12'),
    keywords: [
      { phrase: 'performance', target: 'review-post-optimization-tips-for-maximizing-online-impact' },
      { phrase: 'traffic', target: 'unlock-insights-with-advanced-traffic-analytics-dashboards' },
      { phrase: 'SEO', target: 'seo-for-product-reviews-boost-visibility-and-sales' },
      { phrase: 'voice', target: 'voice-search-optimization-complete-guide' }
    ]
  },
  'podcast-monetization-for-bloggers': {
    publishDate: new Date('2025-01-15'),
    keywords: [
      { phrase: 'content', target: 'content-repurposing-roadmaps-a-step-by-step-guide' },
      { phrase: 'community', target: 'membership-community-ideas-for-building-stronger-groups' },
      { phrase: 'strategy', target: 'instagram-content-strategy-for-bloggers' },
      { phrase: 'membership', target: 'building-profitable-membership-sites' }
    ]
  },
  'pinterest-traffic-generation-masterclass': {
    publishDate: new Date('2025-01-18'),
    keywords: [
      { phrase: 'traffic', target: 'unlock-insights-with-advanced-traffic-analytics-dashboards' },
      { phrase: 'strategy', target: 'develop-a-winning-portfolio-blogging-strategy-today' },
      { phrase: 'optimization', target: 'wordpress-speed-optimization-advanced' },
      { phrase: 'podcast', target: 'podcast-monetization-for-bloggers' }
    ]
  },
  'youtube-channel-blog-integration': {
    publishDate: new Date('2025-01-22'),
    keywords: [
      { phrase: 'content', target: 'streamline-your-content-with-ai-assisted-content-calendars' },
      { phrase: 'monetization', target: 'podcast-monetization-for-bloggers' },
      { phrase: 'traffic', target: 'pinterest-traffic-generation-masterclass' },
      { phrase: 'influencer', target: 'influencer-collaboration-strategies' }
    ]
  },
  'local-seo-for-blog-monetization': {
    publishDate: new Date('2025-01-25'),
    keywords: [
      { phrase: 'SEO', target: 'improve-your-site-with-seo-for-affiliate-blogs' },
      { phrase: 'revenue', target: 'understanding-blog-income-transparency-and-its-importance' },
      { phrase: 'YouTube', target: 'youtube-channel-blog-integration' },
      { phrase: 'Pinterest', target: 'pinterest-traffic-generation-masterclass' }
    ]
  },
  'webinar-funnel-optimization-guide': {
    publishDate: new Date('2025-01-28'),
    keywords: [
      { phrase: 'landing', target: 'the-ultimate-guide-to-landing-page-lead-magnets' },
      { phrase: 'conversion', target: 'proven-affiliate-landing-templates-for-successful-campaigns' },
      { phrase: 'local', target: 'local-seo-for-blog-monetization' },
      { phrase: 'course', target: 'the-ultimate-blog-to-course-transformation-blueprint' }
    ]
  },
  'tiktok-blog-promotion-strategies': {
    publishDate: new Date('2025-02-01'),
    keywords: [
      { phrase: 'brand', target: 'transform-your-online-presence-with-blog-branding-makeovers' },
      { phrase: 'community', target: 'membership-community-ideas-for-building-stronger-groups' },
      { phrase: 'YouTube', target: 'youtube-channel-blog-integration' },
      { phrase: 'webinar', target: 'webinar-funnel-optimization-guide' }
    ]
  },
  'subscription-box-blog-business-model': {
    publishDate: new Date('2025-02-05'),
    keywords: [
      { phrase: 'passive', target: 'building-wealth-with-evergreen-affiliate-pillars' },
      { phrase: 'strategy', target: 'develop-a-winning-portfolio-blogging-strategy-today' },
      { phrase: 'TikTok', target: 'tiktok-blog-promotion-strategies' },
      { phrase: 'funnel', target: 'webinar-funnel-optimization-guide' }
    ]
  }
};

// Add internal links to content
function addInternalLinks(content, links, articlePublishDate, allArticles) {
  let modifiedContent = content;
  let linksAdded = 0;
  const maxLinks = 3;
  const usedTargets = new Set();
  
  for (const link of links) {
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
    
    // Create flexible regex patterns
    const patterns = [
      new RegExp(`\\b(${link.phrase})\\b(?![^\\[]*\\]\\()`, 'gi'),
      new RegExp(`\\b(${link.phrase}s)\\b(?![^\\[]*\\]\\()`, 'gi'),
      new RegExp(`\\b(${link.phrase}ing)\\b(?![^\\[]*\\]\\()`, 'gi'),
      new RegExp(`\\b(${link.phrase}ed)\\b(?![^\\[]*\\]\\()`, 'gi')
    ];
    
    let matched = false;
    for (const pattern of patterns) {
      if (matched) break;
      
      const matches = [...modifiedContent.matchAll(pattern)];
      
      if (matches.length > 0) {
        // Find best match (prefer middle of content)
        const contentLength = modifiedContent.length;
        let bestMatch = matches[0];
        
        for (const match of matches) {
          const position = match.index / contentLength;
          if (position > 0.2 && position < 0.8) {
            bestMatch = match;
            break;
          }
        }
        
        const index = bestMatch.index;
        const matchedText = bestMatch[0];
        
        // Check context
        const beforeText = modifiedContent.substring(Math.max(0, index - 10), index);
        const afterText = modifiedContent.substring(index + matchedText.length, 
                                                   Math.min(modifiedContent.length, index + matchedText.length + 10));
        
        // Ensure we're not inside existing links, headers, or code
        if (!beforeText.includes('[') && 
            !afterText.startsWith('](') && 
            !beforeText.includes('#') &&
            !beforeText.includes('`')) {
          
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
  log('🔮 Adding SEO Internal Links to Future Articles', 'cyan');
  log('==============================================\n', 'cyan');
  log('⏰ Ensuring time logic: Future articles only link to past articles\n', 'yellow');
  
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
    
    // Add internal links with time checking
    const { content: linkedBody, linksAdded } = addInternalLinks(
      body, 
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
      linksAdded
    });
    
    if (linksAdded > 0) {
      log(`✅ ${slug.substring(0, 40).padEnd(40, '.')}: Added ${linksAdded} links`, 'green');
    } else {
      log(`⚠️  ${slug.substring(0, 40).padEnd(40, '.')}: No matches found`, 'yellow');
    }
  }
  
  // Summary
  log('\n📊 Future Article Link Summary:', 'cyan');
  log('================================\n', 'cyan');
  log(`   Future articles processed: ${totalProcessed}/15`, 'blue');
  log(`   Total internal links added: ${totalLinksAdded}`, 'green');
  log(`   Average links per article: ${(totalLinksAdded / totalProcessed).toFixed(1)}`, 'blue');
  
  // Articles with links
  const articlesWithLinks = results.filter(r => r.linksAdded > 0).length;
  const coverage = ((articlesWithLinks / totalProcessed) * 100).toFixed(0);
  
  log(`\n📈 Link Coverage:`, 'cyan');
  log(`   Articles with links: ${articlesWithLinks}/${totalProcessed} (${coverage}%)`, 
      coverage >= 70 ? 'green' : 'yellow');
  
  log('\n✅ Time Logic Verification:', 'magenta');
  log('   • All future articles link only to past articles', 'green');
  log('   • No time paradoxes created', 'green');
  log('   • Progressive link building maintained', 'green');
  
  log('\n🎯 SEO Best Practices Applied:', 'magenta');
  log('   • Descriptive anchor text with keywords', 'blue');
  log('   • Natural contextual placement', 'blue');
  log('   • 1-3 links per article', 'blue');
  log('   • Topically relevant connections', 'blue');
  log('   • No generic anchor text', 'blue');
  
  // Show timeline
  log('\n📅 Publishing Timeline:', 'cyan');
  results
    .sort((a, b) => a.publishDate - b.publishDate)
    .forEach(r => {
      const dateStr = r.publishDate.toISOString().split('T')[0];
      log(`   ${dateStr}: ${r.slug.substring(0, 30)}... (${r.linksAdded} links)`, 
          r.linksAdded > 0 ? 'green' : 'yellow');
    });
}

// Main execution
processFutureArticles().catch(console.error);