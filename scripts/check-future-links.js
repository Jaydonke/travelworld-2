#!/usr/bin/env node

/**
 * Check internal links in future articles only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../src/content/articles');

// Get all articles with their publish times and internal links
function getAllArticlesData() {
  const articles = {};
  const dirs = fs.readdirSync(ARTICLES_DIR)
    .filter(dir => fs.statSync(path.join(ARTICLES_DIR, dir)).isDirectory());
  
  for (const dir of dirs) {
    const mdxPath = path.join(ARTICLES_DIR, dir, 'index.mdx');
    if (!fs.existsSync(mdxPath)) continue;
    
    const content = fs.readFileSync(mdxPath, 'utf8');
    
    // Extract publish time
    const publishTimeMatch = content.match(/publishedTime:\s*([^\n]+)/);
    const publishTime = publishTimeMatch ? new Date(publishTimeMatch[1]) : null;
    
    // Extract internal links
    const linkPattern = /\[([^\]]+)\]\(\/articles\/([^\/\)]+)\/?\)/g;
    const links = [];
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      links.push({
        text: match[1],
        target: match[2]
      });
    }
    
    articles[dir] = {
      slug: dir,
      publishTime,
      links
    };
  }
  
  return articles;
}

// Check for invalid links in future articles only
function checkFutureLinks() {
  const articles = getAllArticlesData();
  const today = new Date();
  const issues = [];
  
  // Identify future articles
  const futureArticles = Object.values(articles)
    .filter(a => a.publishTime && a.publishTime > today)
    .sort((a, b) => a.publishTime - b.publishTime);
  
  console.log('📅 Future articles (not yet published):');
  console.log('=' .repeat(50));
  futureArticles.forEach(a => {
    console.log(`  ${a.publishTime.toISOString().split('T')[0]} - ${a.slug}`);
  });
  console.log('\nTotal future articles: ' + futureArticles.length);
  console.log('=' .repeat(50));
  
  console.log('\n📝 Checking internal links in future articles...\n');
  
  for (const article of futureArticles) {
    for (const link of article.links) {
      const targetArticle = articles[link.target];
      
      if (!targetArticle) {
        console.log(`❌ Broken link in ${article.slug}: links to non-existent article ${link.target}`);
        issues.push({ type: 'broken', from: article.slug, to: link.target });
        continue;
      }
      
      if (!targetArticle.publishTime) continue;
      
      // Check if future article links to an even more future article
      if (targetArticle.publishTime > article.publishTime) {
        const daysDiff = Math.floor((targetArticle.publishTime - article.publishTime) / (1000 * 60 * 60 * 24));
        console.log(`❌ Problem in future article: ${article.slug}`);
        console.log(`   Will be published: ${article.publishTime.toISOString().split('T')[0]}`);
        console.log(`   Links to: ${link.target}`);
        console.log(`   Target published: ${targetArticle.publishTime.toISOString().split('T')[0]} (${daysDiff} days later)`);
        console.log(`   Issue: Article will link to content that won't exist yet when it publishes!\n`);
        
        issues.push({
          type: 'future-link',
          from: article.slug,
          fromDate: article.publishTime,
          to: link.target,
          toDate: targetArticle.publishTime,
          linkText: link.text,
          daysDiff
        });
      }
    }
  }
  
  // Summary
  console.log('\n📊 Summary for future articles:');
  const futureWithLinks = futureArticles.filter(a => a.links.length > 0);
  console.log(`Future articles with links: ${futureWithLinks.length}`);
  console.log(`Total internal links in future articles: ${futureArticles.reduce((sum, a) => sum + a.links.length, 0)}`);
  
  if (issues.length > 0) {
    console.log(`\n❌ Found ${issues.filter(i => i.type === 'future-link').length} problematic links to fix`);
    console.log(`❌ Found ${issues.filter(i => i.type === 'broken').length} broken links`);
    
    // Generate fix suggestions
    console.log('\n🔧 Articles that need link removal:');
    for (const issue of issues.filter(i => i.type === 'future-link')) {
      console.log(`\nIn ${issue.from}:`);
      console.log(`  Remove link: "${issue.linkText}" -> ${issue.to}`);
    }
  } else {
    console.log('\n✅ All internal links in future articles are valid!');
  }
  
  return issues;
}

// Run the check
checkFutureLinks();