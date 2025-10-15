#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../src/content/articles');

// Check all articles for correct link direction
const now = new Date();
const issues = [];

const articles = fs.readdirSync(ARTICLES_DIR).filter(f => 
  fs.statSync(path.join(ARTICLES_DIR, f)).isDirectory()
);

for (const article of articles) {
  const mdxPath = path.join(ARTICLES_DIR, article, 'index.mdx');
  if (!fs.existsSync(mdxPath)) continue;
  
  const content = fs.readFileSync(mdxPath, 'utf8');
  
  // Get publish time of this article
  const timeMatch = content.match(/publishedTime: ([^\n]+)/);
  if (!timeMatch) continue;
  
  const articleTime = new Date(timeMatch[1]);
  const isPublished = articleTime <= now;
  
  // Find all internal links
  const links = content.match(/\[([^\]]+)\]\(\/articles\/([^)]+)\)/g) || [];
  
  for (const link of links) {
    const targetMatch = link.match(/\/articles\/([^)]+)/);
    if (!targetMatch) continue;
    
    const targetSlug = targetMatch[1];
    const targetPath = path.join(ARTICLES_DIR, targetSlug, 'index.mdx');
    
    if (fs.existsSync(targetPath)) {
      const targetContent = fs.readFileSync(targetPath, 'utf8');
      const targetTimeMatch = targetContent.match(/publishedTime: ([^\n]+)/);
      
      if (targetTimeMatch) {
        const targetTime = new Date(targetTimeMatch[1]);
        const targetIsPublished = targetTime <= now;
        
        // Check for violations
        if (isPublished && !targetIsPublished) {
          issues.push({
            from: article,
            to: targetSlug,
            violation: 'Published article links to future article'
          });
        }
      }
    }
  }
}

console.log('🔍 Link Direction Verification');
console.log('==============================\n');

if (issues.length === 0) {
  console.log('✅ All internal links follow correct direction!');
  console.log('   - Future articles link only to published articles');
  console.log('   - No published articles link to future articles');
} else {
  console.log('⚠️  Found link direction issues:\n');
  issues.forEach(issue => {
    console.log(`❌ ${issue.from}`);
    console.log(`   → ${issue.to}`);
    console.log(`   Issue: ${issue.violation}\n`);
  });
}

// Summary stats
const futureCount = articles.filter(a => {
  const p = path.join(ARTICLES_DIR, a, 'index.mdx');
  if (!fs.existsSync(p)) return false;
  const c = fs.readFileSync(p, 'utf8');
  const m = c.match(/publishedTime: ([^\n]+)/);
  return m && new Date(m[1]) > now;
}).length;

const publishedCount = articles.length - futureCount;

console.log('\n📊 Statistics:');
console.log(`   Published articles: ${publishedCount}`);
console.log(`   Future articles: ${futureCount}`);
console.log(`   Total: ${articles.length}`);