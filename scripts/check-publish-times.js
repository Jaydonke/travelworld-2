#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../src/content/articles');

// Get all articles and their publish times
const articles = fs.readdirSync(ARTICLES_DIR).filter(f => 
  fs.statSync(path.join(ARTICLES_DIR, f)).isDirectory()
);

const articleData = [];
const now = new Date();

for (const article of articles) {
  const mdxPath = path.join(ARTICLES_DIR, article, 'index.mdx');
  if (!fs.existsSync(mdxPath)) continue;
  
  const content = fs.readFileSync(mdxPath, 'utf8');
  
  // Extract publish time
  const timeMatch = content.match(/publishedTime:\s*(.+)/);
  if (!timeMatch) continue;
  
  const publishTime = new Date(timeMatch[1].trim());
  const isFuture = publishTime > now;
  
  articleData.push({
    slug: article,
    publishTime: publishTime,
    isFuture: isFuture,
    dateStr: publishTime.toLocaleDateString('zh-CN'),
    timeStr: publishTime.toLocaleTimeString('zh-CN')
  });
}

// Sort by publish time
articleData.sort((a, b) => a.publishTime - b.publishTime);

console.log('\n📅 文章发布时间统计');
console.log('='.repeat(80));

// Separate published and future
const published = articleData.filter(a => !a.isFuture);
const future = articleData.filter(a => a.isFuture);

console.log(`\n✅ 已发布文章 (${published.length}篇):`);
if (published.length > 0) {
  const last5Published = published.slice(-5);
  last5Published.forEach(article => {
    console.log(`  ${article.dateStr} ${article.timeStr} - ${article.slug.substring(0, 40)}...`);
  });
  if (published.length > 5) {
    console.log(`  ... 还有 ${published.length - 5} 篇更早的文章`);
  }
}

console.log(`\n📅 未来发布文章 (${future.length}篇):`);
if (future.length > 0) {
  future.forEach((article, index) => {
    // Calculate days between articles
    let daysBetween = '';
    if (index > 0) {
      const days = Math.round((article.publishTime - future[index - 1].publishTime) / (1000 * 60 * 60 * 24));
      daysBetween = ` (间隔${days}天)`;
    }
    console.log(`  ${article.dateStr} ${article.timeStr} - ${article.slug.substring(0, 40)}...${daysBetween}`);
  });
}

// Calculate intervals
if (future.length > 1) {
  console.log('\n📊 未来文章发布间隔分析:');
  const intervals = [];
  for (let i = 1; i < future.length; i++) {
    const days = Math.round((future[i].publishTime - future[i-1].publishTime) / (1000 * 60 * 60 * 24));
    intervals.push(days);
  }
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const minInterval = Math.min(...intervals);
  const maxInterval = Math.max(...intervals);
  
  console.log(`  平均间隔: ${avgInterval.toFixed(1)} 天`);
  console.log(`  最小间隔: ${minInterval} 天`);
  console.log(`  最大间隔: ${maxInterval} 天`);
}

console.log('\n' + '='.repeat(80));