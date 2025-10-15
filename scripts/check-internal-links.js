#!/usr/bin/env node

/**
 * Check internal links to ensure published articles don't link to unpublished ones
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

// Check for invalid links
function checkLinks() {
  const articles = getAllArticlesData();
  const today = new Date();
  const issues = [];
  
  console.log('📝 Checking internal links...\n');
  
  for (const [slug, article] of Object.entries(articles)) {
    if (!article.publishTime) continue;
    
    // Check if article is published (not future)
    const isPublished = article.publishTime <= today;
    
    for (const link of article.links) {
      const targetArticle = articles[link.target];
      
      if (!targetArticle) {
        console.log(`❌ Broken link in ${slug}: links to non-existent article ${link.target}`);
        issues.push({ type: 'broken', from: slug, to: link.target });
        continue;
      }
      
      if (!targetArticle.publishTime) continue;
      
      // Check if published article links to future article
      if (isPublished && targetArticle.publishTime > today) {
        console.log(`⚠️  Issue in ${slug}`);
        console.log(`   Published: ${article.publishTime.toISOString().split('T')[0]}`);
        console.log(`   Links to: ${link.target}`);
        console.log(`   Target published: ${targetArticle.publishTime.toISOString().split('T')[0]}`);
        console.log(`   Problem: Published article links to future article\n`);
        
        issues.push({
          type: 'future-link',
          from: slug,
          fromDate: article.publishTime,
          to: link.target,
          toDate: targetArticle.publishTime,
          linkText: link.text
        });
      }
      
      // Check if older article links to newer article (this is a problem!)
      if (article.publishTime < targetArticle.publishTime) {
        const daysDiff = Math.floor((targetArticle.publishTime - article.publishTime) / (1000 * 60 * 60 * 24));
        if (daysDiff > 0) {
          console.log(`❌ Problem in ${slug}`);
          console.log(`   Published: ${article.publishTime.toISOString().split('T')[0]}`);
          console.log(`   Links to: ${link.target}`);
          console.log(`   Target published: ${targetArticle.publishTime.toISOString().split('T')[0]} (${daysDiff} days later)`);
          console.log(`   Issue: Article links to content that wasn't published yet!\n`);
          
          issues.push({
            type: 'future-link',
            from: slug,
            fromDate: article.publishTime,
            to: link.target,
            toDate: targetArticle.publishTime,
            linkText: link.text,
            daysDiff
          });
        }
      }
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`Total articles: ${Object.keys(articles).length}`);
  console.log(`Articles with links: ${Object.values(articles).filter(a => a.links.length > 0).length}`);
  console.log(`Total internal links: ${Object.values(articles).reduce((sum, a) => sum + a.links.length, 0)}`);
  
  if (issues.length > 0) {
    console.log(`\n❌ Found ${issues.filter(i => i.type === 'future-link').length} problematic links to fix`);
    console.log(`❌ Found ${issues.filter(i => i.type === 'broken').length} broken links`);
    
    // Generate fix suggestions
    console.log('\n🔧 Suggested fixes:');
    for (const issue of issues.filter(i => i.type === 'future-link')) {
      console.log(`\nIn ${issue.from}:`);
      console.log(`  Remove or replace link: "${issue.linkText}" -> ${issue.to}`);
    }
  } else {
    console.log('\n✅ All internal links are valid!');
  }
  
  return issues;
}

// Run the check
checkLinks();