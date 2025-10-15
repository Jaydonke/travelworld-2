#!/usr/bin/env node

/**
 * Internal Links Analysis Script
 * Analyzes the new SEO-optimized internal linking system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../src/content/articles');

// Color output functions
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

// Static keyword mappings from the internal links system - updated with natural phrases
const staticKeywordMappings = {
  // Debt Management (phrases that appear in articles)
  'debt snowball': 'debt-snowball-method-revival-a-fresh-start-for-your-finances',
  'debt repayment': 'debt-snowball-method-revival-a-fresh-start-for-your-finances', 
  'paying off debt': 'debt-snowball-method-revival-a-fresh-start-for-your-finances',
  'smallest balance': 'debt-snowball-method-revival-a-fresh-start-for-your-finances',
  'student loan': 'student-loan-repayment-changes-what-you-need-to-know',
  
  // Budgeting & Savings (actual phrases from budget article)
  'personal budget': 'personal-budget-tips-for-effective-money-management',
  'monthly budget': 'personal-budget-tips-for-effective-money-management',
  'spending plan': 'personal-budget-tips-for-effective-money-management',
  'budget categories': 'personal-budget-tips-for-effective-money-management',
  'net income': 'personal-budget-tips-for-effective-money-management',
  'fixed expenses': 'personal-budget-tips-for-effective-money-management',
  'variable expenses': 'personal-budget-tips-for-effective-money-management',
  'emergency fund': 'personal-budget-tips-for-effective-money-management',
  'financial goals': 'setting-clear-financial-goals-a-path-to-financial-freedom',
  'saving money': 'saving-more-as-top-resolution-achieve-financial-goals',
  'spending tracker': 'spending-tracker-monitor-your-daily-expenses',
  
  // Digital Banking & Investment
  'digital banking': 'digital-banks-a-guide-to-online-banking-options',
  'mobile banking': 'mobile-banking-secure-convenient-financial-management',
  'online banking': 'digital-banks-a-guide-to-online-banking-options',
  'cryptocurrency': 'understanding-crypto-investment-momentum-and-its-impact',
  'crypto investment': 'understanding-crypto-investment-momentum-and-its-impact',
  'stablecoins': 'stablecoins-explained-benefits-and-use-cases',
  
  // Financial Planning & Housing
  'tax cuts': 'new-tax-cuts-2025-how-to-maximize-your-savings',
  'tax savings': 'new-tax-cuts-2025-how-to-maximize-your-savings',
  'homebuying': 'navigating-the-homebuying-gridlocked-housing-market',
  'housing market': 'navigating-the-homebuying-gridlocked-housing-market',
  'financial stress': 'inflation-anxiety-how-to-manage-financial-stress',
  'interest rates': 'interest-rates-higher-for-longer-how-it-affects-your-finances',
  
  // Financial Services
  'credit monitoring': 'stay-ahead-with-real-time-credit-monitoring-amp-alerts',
  'buy now pay later': 'discover-the-best-bnpl-options-for-online-shopping',
  'rent insurance': 'understanding-rent-insurance-coverage-amp-benefits'
};

/**
 * Get all article information
 */
function getAllArticles() {
  const articleDirs = fs.readdirSync(ARTICLES_DIR)
    .filter(file => {
      const fullPath = path.join(ARTICLES_DIR, file);
      return fs.statSync(fullPath).isDirectory();
    });

  return articleDirs.map(slug => {
    const mdxPath = path.join(ARTICLES_DIR, slug, 'index.mdx');
    
    if (!fs.existsSync(mdxPath)) {
      return null;
    }

    const content = fs.readFileSync(mdxPath, 'utf8');
    
    // Extract title from frontmatter
    const titleMatch = content.match(/title:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : slug;

    // Extract category
    const categoryMatch = content.match(/category:\s*([\w-]+)/);
    const category = categoryMatch ? categoryMatch[1] : 'uncategorized';

    return {
      slug,
      title,
      category,
      content: content.slice(0, 1000) // First 1000 chars for analysis
    };
  }).filter(Boolean);
}

/**
 * Analyze potential internal links
 */
function analyzeInternalLinks() {
  const articles = getAllArticles();
  const linkOpportunities = [];
  const stats = {
    totalArticles: articles.length,
    totalKeywords: Object.keys(staticKeywordMappings).length,
    linksFound: 0,
    potentialLinks: 0
  };

  log('\n🔗 Internal Links Analysis Report', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  log(`\n📊 Overview:`, 'blue');
  log(`   Total Articles: ${stats.totalArticles}`, 'reset');
  log(`   Total Keywords: ${stats.totalKeywords}`, 'reset');

  log(`\n🎯 SEO Keyword Mappings:`, 'blue');
  Object.entries(staticKeywordMappings).forEach(([keyword, targetSlug]) => {
    const targetArticle = articles.find(a => a.slug === targetSlug);
    const targetTitle = targetArticle ? targetArticle.title : 'Not Found';
    log(`   "${keyword}" → ${targetTitle}`, 'green');
  });

  log(`\n🔍 Link Opportunity Analysis:`, 'blue');
  
  articles.forEach(article => {
    const opportunities = [];
    
    Object.entries(staticKeywordMappings).forEach(([keyword, targetSlug]) => {
      if (targetSlug === article.slug) return; // Skip self-linking
      
      // Check if keyword appears in article content
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = article.content.match(regex);
      
      if (matches) {
        opportunities.push({
          keyword,
          targetSlug,
          matches: matches.length
        });
        stats.potentialLinks += matches.length;
      }
    });

    if (opportunities.length > 0) {
      log(`\n   📝 ${article.title}`, 'yellow');
      opportunities.slice(0, 3).forEach(opp => { // Limit to 3 per Backlinko guidelines
        const targetArticle = articles.find(a => a.slug === opp.targetSlug);
        log(`      → "${opp.keyword}" (${opp.matches}x) → ${targetArticle?.title || opp.targetSlug}`, 'green');
        stats.linksFound++;
      });
      
      if (opportunities.length > 3) {
        log(`      ... and ${opportunities.length - 3} more opportunities`, 'cyan');
      }
    }

    linkOpportunities.push({
      article: article.slug,
      title: article.title,
      opportunities: opportunities.slice(0, 3) // Follow max 3 links per article
    });
  });

  log(`\n📈 Statistics:`, 'magenta');
  log(`   Articles with Link Opportunities: ${linkOpportunities.filter(a => a.opportunities.length > 0).length}`, 'reset');
  log(`   Total Potential Links: ${stats.potentialLinks}`, 'reset');
  log(`   SEO-Optimized Links (≤3 per article): ${stats.linksFound}`, 'reset');

  log(`\n✅ SEO Best Practices Applied:`, 'green');
  log(`   ✓ Descriptive anchor text (no generic "click here")`, 'reset');
  log(`   ✓ Limited to 3 links per article (Backlinko recommendation)`, 'reset');
  log(`   ✓ Financial-specific long-tail keywords`, 'reset');
  log(`   ✓ Natural keyword integration`, 'reset');
  log(`   ✓ No self-linking`, 'reset');

  // Generate markdown report
  generateMarkdownReport(linkOpportunities, stats);
  
  log(`\n💡 Tips for Optimization:`, 'yellow');
  log(`   • Internal links are automatically added during build`, 'reset');
  log(`   • Edit src/lib/rehype/internal-links.js to add more keywords`, 'reset');
  log(`   • Follow Backlinko's guidelines: use descriptive anchor text`, 'reset');
  log(`   • Monitor click-through rates on internal links`, 'reset');

  log(`\n📄 Report saved to: internal-links-report.md`, 'cyan');
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(linkOpportunities, stats) {
  const report = `# Internal Links Analysis Report

## Overview
- **Total Articles**: ${stats.totalArticles}
- **Total SEO Keywords**: ${Object.keys(staticKeywordMappings).length}
- **Articles with Links**: ${linkOpportunities.filter(a => a.opportunities.length > 0).length}
- **Total Link Opportunities**: ${stats.potentialLinks}

## SEO Strategy
Based on **Backlinko's Internal Link Guidelines**:
- ✅ Maximum 3 internal links per article
- ✅ Descriptive anchor text (financial-specific phrases)
- ✅ Natural keyword integration
- ✅ No self-linking
- ✅ Long-tail keyword focus

## Active Keyword Mappings

${Object.entries(staticKeywordMappings).map(([keyword, slug]) => 
  `- **"${keyword}"** → \`${slug}\``
).join('\n')}

## Link Opportunities by Article

${linkOpportunities
  .filter(article => article.opportunities.length > 0)
  .map(article => `
### ${article.title}
${article.opportunities.map(opp => 
  `- **"${opp.keyword}"** (${opp.matches} matches) → \`${opp.targetSlug}\``
).join('\n')}
`).join('')}

## Implementation Status
✅ **Active**: Internal links are automatically generated during build process
✅ **SEO Optimized**: Following Backlinko best practices
✅ **Financial Focus**: Keywords tailored to personal finance content

---
*Generated on: ${new Date().toISOString()}*
*Script: analyze-internal-links.js*`;

  fs.writeFileSync(path.join(__dirname, '../internal-links-report.md'), report);
}

// Run analysis
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  analyzeInternalLinks();
}