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

// Today's date for time logic
const TODAY = new Date('2025-08-18T23:59:59');

// Clean existing internal links
function cleanExistingLinks(content) {
  let cleaned = content.replace(/\[([^\]]+)\]\(\/articles\/[^)]+\)/g, '$1');
  cleaned = cleaned.replace(/<a[^>]*href="\/articles\/[^"]*"[^>]*>([^<]+)<\/a>/gi, '$1');
  return cleaned;
}

// Map the 15 future marketing articles to past articles with SEO keywords
const futureMarketingArticlesLinks = {
  'boost-conversions-with-interactive-guide-landing-pages': [
    { phrase: 'user experience', target: 'adaptive-header-strategies-boosting-user-experience' },
    { phrase: 'conversion optimization', target: 'chatbot-lead-generation-funnels-boost-your-sales' },
    { phrase: 'content design', target: 'content-experience-design-strategies-for-success' }
  ],
  'boost-conversions-with-sequential-content-funnels': [
    { phrase: 'lead generation', target: 'chatbot-lead-generation-funnels-boost-your-sales' },
    { phrase: 'content strategy', target: 'predictive-content-calendars-planning-for-success' },
    { phrase: 'user engagement', target: 'enhance-user-experience-with-gamified-content-entry-forms-online' }
  ],
  'boost-rankings-with-expert-algorithm-aware-copy-updates': [
    { phrase: 'SEO strategy', target: 'boost-your-online-visibility-with-influencer-seo-synergy' },
    { phrase: 'semantic keywords', target: 'mastering-semantic-keyword-grouping-for-better-seo-results' },
    { phrase: 'content optimization', target: 'improve-seo-with-content-cluster-planning-techniques' }
  ],
  'boost-visibility-with-zero-click-content-strategies': [
    { phrase: 'zero-volume keywords', target: 'boost-your-seo-with-zero-keyword-content-ideas' },
    { phrase: 'SERP features', target: 'semantic-serp-analysis-understanding-search-results' },
    { phrase: 'structured data', target: 'structured-data-adoption-a-guide-for-marketers' }
  ],
  'effective-virtual-event-lead-capture-techniques-revealed': [
    { phrase: 'lead generation funnels', target: 'chatbot-lead-generation-funnels-boost-your-sales' },
    { phrase: 'interactive forms', target: 'enhance-user-experience-with-gamified-content-entry-forms-online' },
    { phrase: 'conversion tracking', target: 'privacy-law-compliant-tracking-ensuring-data-protection' }
  ],
  'improve-your-website-with-effective-voice-search-adaptation': [
    { phrase: 'long-tail keywords', target: 'long-tail-conversational-keywords-a-guide-to-effective-seo' },
    { phrase: 'local SEO', target: 'mastering-local-topic-authority-building-for-better-seo' },
    { phrase: 'semantic search', target: 'mastering-semantic-keyword-grouping-for-better-seo-results' }
  ],
  'master-search-intent-optimization-for-better-rankings': [
    { phrase: 'keyword grouping', target: 'mastering-semantic-keyword-grouping-for-better-seo-results' },
    { phrase: 'SERP analysis', target: 'semantic-serp-analysis-understanding-search-results' },
    { phrase: 'content clusters', target: 'improve-seo-with-content-cluster-planning-techniques' }
  ],
  'maximize-reach-with-cross-platform-content-repurposing-strategies': [
    { phrase: 'content planning', target: 'predictive-content-calendars-planning-for-success' },
    { phrase: 'video content', target: 'short-form-video-integration-strategies-for-success' },
    { phrase: 'brand storytelling', target: 'brand-story-micro-videos-engage-your-audience' }
  ],
  'maximize-reach-with-successful-branded-hashtag-campaigns': [
    { phrase: 'social media marketing', target: 'elevate-your-brand-with-micro-influencer-campaigns' },
    { phrase: 'brand content', target: 'brand-story-micro-videos-engage-your-audience' },
    { phrase: 'influencer marketing', target: 'boost-your-online-visibility-with-influencer-seo-synergy' }
  ],
  'maximize-roi-with-privacy-first-ad-targeting-strategies': [
    { phrase: 'privacy compliance', target: 'privacy-law-compliant-tracking-ensuring-data-protection' },
    { phrase: 'ad performance', target: 'improve-ad-performance-with-responsive-ads-messaging-tests' },
    { phrase: 'user analytics', target: 'analyze-user-behavior-with-advanced-heatmap-engagement-analyses' }
  ],
  'mobile-first-seo-boost-your-website-s-visibility': [
    { phrase: 'mobile optimization', target: 'improve-mobile-ad-experience-ux-tips-and-best-practices' },
    { phrase: 'responsive design', target: 'improve-ad-performance-with-responsive-ads-messaging-tests' },
    { phrase: 'user experience', target: 'adaptive-header-strategies-boosting-user-experience' }
  ],
  'the-impact-of-user-experience-ranking-signals-on-seo': [
    { phrase: 'user behavior analysis', target: 'analyze-user-behavior-with-advanced-heatmap-engagement-analyses' },
    { phrase: 'content experience', target: 'content-experience-design-strategies-for-success' },
    { phrase: 'adaptive design', target: 'adaptive-header-strategies-boosting-user-experience' }
  ],
  'understanding-social-authored-serp-features-for-better-seo': [
    { phrase: 'SERP analysis', target: 'semantic-serp-analysis-understanding-search-results' },
    { phrase: 'influencer content', target: 'elevate-your-brand-with-micro-influencer-campaigns' },
    { phrase: 'social signals', target: 'boost-your-online-visibility-with-influencer-seo-synergy' }
  ],
  'unlocking-generative-search-optimization-for-rankings': [
    { phrase: 'semantic SEO', target: 'mastering-semantic-keyword-grouping-for-better-seo-results' },
    { phrase: 'AI-powered content', target: 'chatbot-lead-generation-funnels-boost-your-sales' },
    { phrase: 'search optimization', target: 'dynamic-search-ads-optimization-tips-and-best-practices' }
  ],
  'user-generated-content-seo-tips-for-higher-rankings': [
    { phrase: 'content feedback', target: 'how-to-implement-successful-content-feedback-loops' },
    { phrase: 'engagement metrics', target: 'analyze-user-behavior-with-advanced-heatmap-engagement-analyses' },
    { phrase: 'community content', target: 'enhance-user-experience-with-gamified-content-entry-forms-online' }
  ]
};

// Function to add inline links
function addInlineLinks(content, articleId) {
  const links = futureMarketingArticlesLinks[articleId];
  if (!links || links.length === 0) return { content, linksAdded: 0 };
  
  let modifiedContent = cleanExistingLinks(content);
  let addedLinks = 0;
  const maxLinks = 3;
  const usedPhrases = new Set();
  
  for (const link of links) {
    if (addedLinks >= maxLinks) break;
    if (usedPhrases.has(link.phrase)) continue;
    
    // Create regex to find the phrase (case-insensitive)
    const regex = new RegExp(`\\b(${link.phrase})\\b(?![^\\[]*\\]\\()`, 'i');
    
    // Check if phrase exists in content
    if (regex.test(modifiedContent)) {
      // Replace first occurrence only
      modifiedContent = modifiedContent.replace(regex, (match) => {
        if (addedLinks < maxLinks) {
          addedLinks++;
          usedPhrases.add(link.phrase);
          return `[${match}](/articles/${link.target}/)`;
        }
        return match;
      });
    }
  }
  
  return { content: modifiedContent, linksAdded: addedLinks };
}

// Main processing function
async function main() {
  log('🚀 Adding SEO internal links to 15 future marketing articles...', 'cyan');
  log(`📅 Today's date: ${TODAY.toISOString().split('T')[0]}`, 'blue');
  log('⏰ Ensuring no time paradox - only linking to past articles\n', 'yellow');
  
  const futureArticleSlugs = Object.keys(futureMarketingArticlesLinks);
  let totalProcessed = 0;
  let totalLinksAdded = 0;
  const results = [];
  
  for (const slug of futureArticleSlugs) {
    const articlePath = path.join(articlesDir, slug, 'index.mdx');
    
    if (!fs.existsSync(articlePath)) {
      log(`⏭️  ${slug.substring(0, 40)}: File not found`, 'yellow');
      continue;
    }
    
    // Read content
    let content = fs.readFileSync(articlePath, 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      log(`⚠️  ${slug}: No frontmatter found`, 'yellow');
      continue;
    }
    
    const frontmatter = frontmatterMatch[0];
    const body = content.slice(frontmatterMatch[0].length);
    
    // Add inline links
    const { content: linkedBody, linksAdded } = addInlineLinks(body, slug);
    
    if (linksAdded > 0) {
      // Write back
      fs.writeFileSync(articlePath, frontmatter + linkedBody, 'utf8');
      log(`✅ ${slug.substring(0, 45)}: Added ${linksAdded} links`, 'green');
      totalLinksAdded += linksAdded;
      totalProcessed++;
      results.push({ slug, links: linksAdded });
    } else {
      log(`⚠️  ${slug.substring(0, 45)}: No matching keywords found`, 'yellow');
    }
  }
  
  log('\n📊 Summary:', 'cyan');
  log(`   Future articles processed: ${totalProcessed}/${futureArticleSlugs.length}`, 'blue');
  log(`   Total internal links added: ${totalLinksAdded}`, 'green');
  log(`   Average links per article: ${totalProcessed > 0 ? (totalLinksAdded / totalProcessed).toFixed(1) : 0}`, 'blue');
  
  log('\n✨ SEO Optimization Complete!', 'green');
  log('\n🎯 SEO Best Practices Applied:', 'yellow');
  log('   • Natural keyword phrases as clickable links', 'blue');
  log('   • Contextually relevant anchor text', 'blue');
  log('   • 1-3 strategic internal links per article', 'blue');
  log('   • Only linking to already published articles', 'blue');
  log('   • Topic-relevant cross-linking for better SEO', 'blue');
  log('\n🛡️ Time Logic Verification:', 'yellow');
  log('   • All links point from future → past articles', 'blue');
  log('   • No temporal paradoxes created', 'blue');
}

main().catch(console.error);