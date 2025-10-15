#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

// Get all articles with their publish dates
function getAllArticlesWithDates() {
  const articles = fs.readdirSync(articlesDir)
    .filter(file => fs.statSync(path.join(articlesDir, file)).isDirectory());
  
  const articlesWithDates = [];
  const now = new Date();
  
  for (const article of articles) {
    const indexPath = path.join(articlesDir, article, 'index.mdx');
    if (!fs.existsSync(indexPath)) continue;
    
    const content = fs.readFileSync(indexPath, 'utf8');
    const publishedTimeMatch = content.match(/publishedTime:\s*(.+)/);
    
    if (publishedTimeMatch) {
      const publishedTime = new Date(publishedTimeMatch[1]);
      const isFuture = publishedTime > now;
      
      // Extract all internal links
      const internalLinks = [];
      const linkPattern = /\[([^\]]+)\]\(\/articles\/([^)]+)\)/g;
      let match;
      
      while ((match = linkPattern.exec(content)) !== null) {
        internalLinks.push({
          text: match[1],
          target: match[2]
        });
      }
      
      articlesWithDates.push({
        slug: article,
        publishedTime,
        isFuture,
        links: internalLinks
      });
    }
  }
  
  return articlesWithDates;
}

// Check for time paradoxes
function checkTimeParadoxes() {
  const articles = getAllArticlesWithDates();
  const articleMap = new Map(articles.map(a => [a.slug, a]));
  
  let violations = [];
  let validLinks = 0;
  
  for (const article of articles) {
    if (!article.isFuture) {
      // Past article - check if it links to any future articles
      for (const link of article.links) {
        const targetArticle = articleMap.get(link.target);
        if (targetArticle && targetArticle.isFuture) {
          violations.push({
            from: article.slug,
            to: link.target,
            fromDate: article.publishedTime,
            toDate: targetArticle.publishedTime,
            linkText: link.text
          });
        } else {
          validLinks++;
        }
      }
    } else {
      // Future article - all links should be to past articles
      for (const link of article.links) {
        const targetArticle = articleMap.get(link.target);
        if (targetArticle && targetArticle.isFuture) {
          violations.push({
            from: article.slug,
            to: link.target,
            fromDate: article.publishedTime,
            toDate: targetArticle.publishedTime,
            linkText: link.text,
            type: 'future-to-future'
          });
        } else {
          validLinks++;
        }
      }
    }
  }
  
  return { violations, validLinks, articles };
}

// Main function
function main() {
  console.log('🔍 Verifying internal links time logic...\n');
  
  const { violations, validLinks, articles } = checkTimeParadoxes();
  
  const pastArticles = articles.filter(a => !a.isFuture);
  const futureArticles = articles.filter(a => a.isFuture);
  
  console.log(`📊 Article Statistics:`);
  console.log(`   Total articles: ${articles.length}`);
  console.log(`   Past articles: ${pastArticles.length}`);
  console.log(`   Future articles: ${futureArticles.length}`);
  console.log(`   Total internal links: ${validLinks + violations.length}\n`);
  
  if (violations.length > 0) {
    console.log('❌ TIME PARADOX VIOLATIONS FOUND:\n');
    for (const v of violations) {
      console.log(`   ⚠️  ${v.from} (${v.fromDate.toISOString().split('T')[0]})`);
      console.log(`      → links to ${v.to} (${v.toDate.toISOString().split('T')[0]})`);
      console.log(`      Link text: "${v.linkText}"`);
      if (v.type === 'future-to-future') {
        console.log(`      Type: Future article linking to another future article`);
      }
      console.log('');
    }
  } else {
    console.log('✅ No time paradox violations found!');
    console.log('   All internal links respect chronological order.\n');
  }
  
  // Show link distribution
  console.log('📈 Link Distribution:');
  console.log(`   Valid links: ${validLinks}`);
  console.log(`   Violations: ${violations.length}`);
  
  // Show future articles with their links
  console.log('\n🔮 Future Articles Internal Links:');
  for (const article of futureArticles) {
    if (article.links.length > 0) {
      console.log(`   ${article.slug.substring(0, 40)}: ${article.links.length} links`);
    }
  }
}

main();