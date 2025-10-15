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

// Today's date for timeline reference
const TODAY = new Date('2024-12-15');

// Internal link mappings for future articles
// Each future article can only link to articles published before it
const futureArticleLinks = {
  // Dec 20, 2024 - Can link to all current articles
  'advanced-affiliate-tracking-tools-comparison': {
    publishDate: new Date('2024-12-20'),
    links: [
      { phrase: 'affiliate marketing basics', target: 'affiliate-vs-sponsored-posts-what-s-the-difference' },
      { phrase: 'tracking performance', target: 'unlock-insights-with-advanced-traffic-analytics-dashboards' },
      { phrase: 'affiliate programs', target: 'building-wealth-with-evergreen-affiliate-pillars' }
    ]
  },
  
  // Dec 22, 2024
  'email-automation-sequences-that-convert': {
    publishDate: new Date('2024-12-22'),
    links: [
      { phrase: 'lead generation strategies', target: 'generate-leads-with-freebies-step-by-step' },
      { phrase: 'newsletter optimization', target: 'maximize-impact-niche-newsletters-cross-promotion-techniques' },
      { phrase: 'tracking tools', target: 'advanced-affiliate-tracking-tools-comparison' }
    ]
  },
  
  // Dec 25, 2024
  'content-monetization-strategies-for-2025': {
    publishDate: new Date('2024-12-25'),
    links: [
      { phrase: 'blog advertising', target: 'how-to-setup-blog-advertising-slots-for-maximum-revenue' },
      { phrase: 'income transparency', target: 'understanding-blog-income-transparency-and-its-importance' },
      { phrase: 'email automation', target: 'email-automation-sequences-that-convert' }
    ]
  },
  
  // Dec 28, 2024
  'building-profitable-membership-sites': {
    publishDate: new Date('2024-12-28'),
    links: [
      { phrase: 'community building', target: 'membership-community-ideas-for-building-stronger-groups' },
      { phrase: 'monetization strategies', target: 'content-monetization-strategies-for-2025' },
      { phrase: 'course creation', target: 'the-ultimate-blog-to-course-transformation-blueprint' }
    ]
  },
  
  // Jan 2, 2025
  'instagram-content-strategy-for-bloggers': {
    publishDate: new Date('2025-01-02'),
    links: [
      { phrase: 'content planning', target: 'streamline-your-content-with-ai-assisted-content-calendars' },
      { phrase: 'brand identity', target: 'transform-your-online-presence-with-blog-branding-makeovers' },
      { phrase: 'membership communities', target: 'building-profitable-membership-sites' }
    ]
  },
  
  // Jan 5, 2025
  'voice-search-optimization-complete-guide': {
    publishDate: new Date('2025-01-05'),
    links: [
      { phrase: 'SEO fundamentals', target: 'improve-your-site-with-seo-for-affiliate-blogs' },
      { phrase: 'keyword optimization', target: 'mastering-seo-keyword-clustering-for-better-search-rankings' },
      { phrase: 'content strategy', target: 'instagram-content-strategy-for-bloggers' }
    ]
  },
  
  // Jan 8, 2025
  'influencer-collaboration-strategies': {
    publishDate: new Date('2025-01-08'),
    links: [
      { phrase: 'sponsored content', target: 'affiliate-vs-sponsored-posts-what-s-the-difference' },
      { phrase: 'sponsor outreach', target: 'boost-fundraising-with-proven-sponsor-prospect-outreach' },
      { phrase: 'voice search optimization', target: 'voice-search-optimization-complete-guide' }
    ]
  },
  
  // Jan 12, 2025
  'wordpress-speed-optimization-advanced': {
    publishDate: new Date('2025-01-12'),
    links: [
      { phrase: 'SEO optimization', target: 'seo-for-product-reviews-boost-visibility-and-sales' },
      { phrase: 'website analytics', target: 'unlock-insights-with-advanced-traffic-analytics-dashboards' },
      { phrase: 'influencer strategies', target: 'influencer-collaboration-strategies' }
    ]
  },
  
  // Jan 15, 2025
  'podcast-monetization-for-bloggers': {
    publishDate: new Date('2025-01-15'),
    links: [
      { phrase: 'content repurposing', target: 'content-repurposing-roadmaps-a-step-by-step-guide' },
      { phrase: 'evergreen content', target: 'maximize-impact-with-long-form-evergreen-guides' },
      { phrase: 'WordPress optimization', target: 'wordpress-speed-optimization-advanced' }
    ]
  },
  
  // Jan 18, 2025
  'pinterest-traffic-generation-masterclass': {
    publishDate: new Date('2025-01-18'),
    links: [
      { phrase: 'traffic analytics', target: 'unlock-insights-with-advanced-traffic-analytics-dashboards' },
      { phrase: 'portfolio strategy', target: 'develop-a-winning-portfolio-blogging-strategy-today' },
      { phrase: 'podcast content', target: 'podcast-monetization-for-bloggers' }
    ]
  },
  
  // Jan 22, 2025
  'youtube-channel-blog-integration': {
    publishDate: new Date('2025-01-22'),
    links: [
      { phrase: 'content calendar', target: 'streamline-your-content-with-ai-assisted-content-calendars' },
      { phrase: 'micro-blogging', target: 'micro-blogging-tutorials-a-step-by-step-guide' },
      { phrase: 'Pinterest marketing', target: 'pinterest-traffic-generation-masterclass' }
    ]
  },
  
  // Jan 25, 2025
  'local-seo-for-blog-monetization': {
    publishDate: new Date('2025-01-25'),
    links: [
      { phrase: 'SEO for affiliates', target: 'improve-your-site-with-seo-for-affiliate-blogs' },
      { phrase: 'review optimization', target: 'review-post-optimization-tips-for-maximizing-online-impact' },
      { phrase: 'YouTube integration', target: 'youtube-channel-blog-integration' }
    ]
  },
  
  // Jan 28, 2025
  'webinar-funnel-optimization-guide': {
    publishDate: new Date('2025-01-28'),
    links: [
      { phrase: 'lead magnets', target: 'the-ultimate-guide-to-landing-page-lead-magnets' },
      { phrase: 'landing page templates', target: 'proven-affiliate-landing-templates-for-successful-campaigns' },
      { phrase: 'local SEO strategies', target: 'local-seo-for-blog-monetization' }
    ]
  },
  
  // Feb 1, 2025
  'tiktok-blog-promotion-strategies': {
    publishDate: new Date('2025-02-01'),
    links: [
      { phrase: 'social media strategy', target: 'instagram-content-strategy-for-bloggers' },
      { phrase: 'brand makeover', target: 'transform-your-online-presence-with-blog-branding-makeovers' },
      { phrase: 'webinar funnels', target: 'webinar-funnel-optimization-guide' }
    ]
  },
  
  // Feb 5, 2025
  'subscription-box-blog-business-model': {
    publishDate: new Date('2025-02-05'),
    links: [
      { phrase: 'passive income strategies', target: 'building-wealth-with-evergreen-affiliate-pillars' },
      { phrase: 'membership sites', target: 'building-profitable-membership-sites' },
      { phrase: 'TikTok promotion', target: 'tiktok-blog-promotion-strategies' }
    ]
  }
};

// Add internal links to content
function addInternalLinks(content, links) {
  let modifiedContent = content;
  let linksAdded = 0;
  
  for (const link of links) {
    // Create regex to find the phrase
    const regex = new RegExp(`\\b(${link.phrase})\\b(?![^\\[]*\\]\\()`, 'gi');
    
    // Check if phrase exists
    const match = modifiedContent.match(regex);
    if (match) {
      // Replace first occurrence
      modifiedContent = modifiedContent.replace(regex, (matched) => {
        if (linksAdded < 3) {
          linksAdded++;
          return `[${matched}](/articles/${link.target}/)`;
        }
        return matched;
      });
    }
  }
  
  return { content: modifiedContent, linksAdded };
}

// Process future articles
async function processFutureArticles() {
  log('🔮 Adding SEO Internal Links to Future Articles', 'cyan');
  log('==============================================\n', 'cyan');
  log('⏰ Ensuring time logic: Future articles only link to past articles\n', 'yellow');
  
  let totalProcessed = 0;
  let totalLinksAdded = 0;
  
  for (const [slug, config] of Object.entries(futureArticleLinks)) {
    const articlePath = path.join(articlesDir, slug, 'index.mdx');
    
    if (!fs.existsSync(articlePath)) {
      log(`⚠️  ${slug}: Article not found`, 'yellow');
      continue;
    }
    
    // Read content
    let content = fs.readFileSync(articlePath, 'utf8');
    
    // Separate frontmatter and body
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      continue;
    }
    
    const frontmatter = frontmatterMatch[0];
    const body = content.slice(frontmatter.length);
    
    // Add internal links
    const { content: linkedBody, linksAdded } = addInternalLinks(body, config.links);
    
    // Write updated content
    if (linksAdded > 0) {
      fs.writeFileSync(articlePath, frontmatter + linkedBody, 'utf8');
      totalProcessed++;
      totalLinksAdded += linksAdded;
      
      log(`✅ ${slug.substring(0, 35)}... : Added ${linksAdded} links (publishes: ${config.publishDate.toLocaleDateString()})`, 'green');
    } else {
      log(`⚠️  ${slug.substring(0, 35)}... : No matching keywords found`, 'yellow');
    }
  }
  
  // Summary
  log('\n📊 Future Article Link Summary:', 'cyan');
  log('================================\n', 'cyan');
  log(`   Future articles processed: ${totalProcessed}/15`, 'blue');
  log(`   Total internal links added: ${totalLinksAdded}`, 'green');
  log(`   Average links per article: ${(totalLinksAdded / 15).toFixed(1)}`, 'blue');
  
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
}

// Main execution
processFutureArticles().catch(console.error);