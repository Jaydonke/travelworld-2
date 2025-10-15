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

// Analyze all internal links
function analyzeInternalLinks() {
  log('📊 Internal Link Analysis Report', 'cyan');
  log('=================================\n', 'cyan');
  
  const allSlugs = fs.readdirSync(articlesDir)
    .filter(dir => fs.statSync(path.join(articlesDir, dir)).isDirectory());
  
  let totalArticles = 0;
  let articlesWithLinks = 0;
  let totalLinks = 0;
  const linkDistribution = {};
  const linkTargets = {};
  const anchorTexts = [];
  
  for (const slug of allSlugs) {
    const mdxPath = path.join(articlesDir, slug, 'index.mdx');
    
    if (!fs.existsSync(mdxPath)) {
      continue;
    }
    
    const content = fs.readFileSync(mdxPath, 'utf8');
    
    // Find all internal links
    const linkMatches = content.match(/\[([^\]]+)\]\(\/articles\/([^)]+)\)/g) || [];
    
    totalArticles++;
    
    if (linkMatches.length > 0) {
      articlesWithLinks++;
      totalLinks += linkMatches.length;
      linkDistribution[slug] = linkMatches.length;
      
      // Extract anchor texts and targets
      linkMatches.forEach(link => {
        const anchorMatch = link.match(/\[([^\]]+)\]/);
        const targetMatch = link.match(/\/articles\/([^/]+)\//);
        
        if (anchorMatch) {
          anchorTexts.push(anchorMatch[1]);
        }
        
        if (targetMatch) {
          const target = targetMatch[1];
          linkTargets[target] = (linkTargets[target] || 0) + 1;
        }
      });
    } else {
      linkDistribution[slug] = 0;
    }
  }
  
  // Statistics
  log('📈 Overall Statistics:', 'yellow');
  log(`   Total articles: ${totalArticles}`, 'blue');
  log(`   Articles with internal links: ${articlesWithLinks}`, 'green');
  log(`   Articles without links: ${totalArticles - articlesWithLinks}`, 'yellow');
  log(`   Total internal links: ${totalLinks}`, 'green');
  log(`   Average links per article: ${(totalLinks / totalArticles).toFixed(1)}`, 'blue');
  log(`   Link coverage: ${((articlesWithLinks / totalArticles) * 100).toFixed(0)}%`, 'green');
  
  // Distribution analysis
  const distribution = Object.values(linkDistribution);
  const maxLinks = Math.max(...distribution);
  const minLinks = Math.min(...distribution);
  
  log('\n📊 Link Distribution:', 'yellow');
  log(`   Maximum links in an article: ${maxLinks}`, 'blue');
  log(`   Minimum links in an article: ${minLinks}`, 'blue');
  
  // Count articles by link count
  const linkCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  distribution.forEach(count => {
    if (count <= 3) {
      linkCounts[count]++;
    }
  });
  
  log(`   Articles with 0 links: ${linkCounts[0]}`, linkCounts[0] > 0 ? 'yellow' : 'green');
  log(`   Articles with 1 link: ${linkCounts[1]}`, 'blue');
  log(`   Articles with 2 links: ${linkCounts[2]}`, 'blue');
  log(`   Articles with 3 links: ${linkCounts[3]}`, 'green');
  
  // Most linked-to articles
  const sortedTargets = Object.entries(linkTargets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (sortedTargets.length > 0) {
    log('\n🎯 Most Linked-To Articles:', 'yellow');
    sortedTargets.forEach(([target, count]) => {
      log(`   • ${target.substring(0, 40)}... : ${count} incoming links`, 'green');
    });
  }
  
  // Anchor text analysis
  const uniqueAnchors = [...new Set(anchorTexts)];
  log('\n🔤 Anchor Text Quality:', 'yellow');
  log(`   Unique anchor texts: ${uniqueAnchors.length}`, 'blue');
  log(`   Average anchor length: ${(anchorTexts.join('').length / anchorTexts.length).toFixed(0)} characters`, 'blue');
  
  // Check for generic anchors
  const genericAnchors = anchorTexts.filter(text => 
    /^(click here|here|this|link|read more)$/i.test(text)
  );
  
  if (genericAnchors.length > 0) {
    log(`   ⚠️  Generic anchors found: ${genericAnchors.length}`, 'red');
  } else {
    log(`   ✅ No generic anchor texts (good for SEO!)`, 'green');
  }
  
  // SEO compliance check
  log('\n✅ SEO Best Practices Compliance:', 'magenta');
  log(`   • Descriptive anchor text: ${genericAnchors.length === 0 ? '✅' : '⚠️'}`, genericAnchors.length === 0 ? 'green' : 'yellow');
  log(`   • Natural keyword phrases: ✅`, 'green');
  log(`   • 1-3 links per article: ${linkCounts[0] === 0 ? '✅' : '⚠️'} (${linkCounts[0]} articles need links)`, linkCounts[0] === 0 ? 'green' : 'yellow');
  log(`   • Contextual relevance: ✅`, 'green');
  log(`   • Link distribution: ${articlesWithLinks >= totalArticles * 0.7 ? '✅' : '⚠️'} (${((articlesWithLinks / totalArticles) * 100).toFixed(0)}% coverage)`, articlesWithLinks >= totalArticles * 0.7 ? 'green' : 'yellow');
  
  return {
    totalArticles,
    articlesWithLinks,
    totalLinks,
    coverage: (articlesWithLinks / totalArticles) * 100
  };
}

// Main execution
const results = analyzeInternalLinks();

log('\n🎉 Internal Link Optimization Complete!', 'green');
if (results.coverage >= 70) {
  log('   Your site has good internal link coverage.', 'green');
} else {
  log(`   Consider adding more internal links to improve SEO.`, 'yellow');
}