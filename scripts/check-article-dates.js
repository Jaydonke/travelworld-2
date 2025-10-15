#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

// Get all articles
const articles = fs.readdirSync(articlesDir)
  .filter(file => fs.statSync(path.join(articlesDir, file)).isDirectory());

const now = new Date();
let futureArticles = [];
let pastArticles = [];

for (const article of articles) {
  const indexPath = path.join(articlesDir, article, 'index.mdx');
  if (!fs.existsSync(indexPath)) continue;
  
  const content = fs.readFileSync(indexPath, 'utf8');
  const publishedTimeMatch = content.match(/publishedTime:\s*(.+)/);
  
  if (publishedTimeMatch) {
    const publishedTime = new Date(publishedTimeMatch[1]);
    const titleMatch = content.match(/title:\s*["'](.+?)["']/);
    const title = titleMatch ? titleMatch[1] : article;
    
    if (publishedTime > now) {
      futureArticles.push({ slug: article, title, date: publishedTime });
    } else {
      pastArticles.push({ slug: article, title, date: publishedTime });
    }
  }
}

// Sort by date
futureArticles.sort((a, b) => a.date - b.date);
pastArticles.sort((a, b) => b.date - a.date);

console.log(`\n📅 Current Date: ${now.toISOString().split('T')[0]}`);
console.log(`\n📚 Total Articles: ${articles.length}`);
console.log(`✅ Published Articles: ${pastArticles.length}`);
console.log(`🔮 Future Articles: ${futureArticles.length}`);

if (futureArticles.length > 0) {
  console.log('\n🔮 Future Articles (next 15):');
  futureArticles.slice(0, 15).forEach((article, index) => {
    console.log(`${index + 1}. ${article.date.toISOString().split('T')[0]} - ${article.title}`);
    console.log(`   Slug: ${article.slug}`);
  });
}

console.log('\n✅ Latest Published Articles (for reference):');
pastArticles.slice(0, 5).forEach((article, index) => {
  console.log(`${index + 1}. ${article.date.toISOString().split('T')[0]} - ${article.title}`);
});