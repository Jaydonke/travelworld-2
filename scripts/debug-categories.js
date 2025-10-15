#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

console.log('🔍 Debugging Categories\n');

// Get all article directories
const articleDirs = fs.readdirSync(articlesDir).filter(item => {
  const itemPath = path.join(articlesDir, item);
  return fs.statSync(itemPath).isDirectory();
});

console.log(`Found ${articleDirs.length} articles\n`);

// Check each article's category
const categories = new Map();

articleDirs.forEach(dir => {
  const mdxPath = path.join(articlesDir, dir, 'index.mdx');
  if (fs.existsSync(mdxPath)) {
    const content = fs.readFileSync(mdxPath, 'utf8');
    const { data } = matter(content);
    
    console.log(`Article: ${dir}`);
    console.log(`  - Category: ${data.category || 'NONE'}`);
    console.log(`  - Categories: ${data.categories || 'NONE'}`);
    
    // Count categories
    if (data.category) {
      const count = categories.get(data.category) || 0;
      categories.set(data.category, count + 1);
    }
    if (data.categories) {
      const cats = Array.isArray(data.categories) ? data.categories : [data.categories];
      cats.forEach(cat => {
        const count = categories.get(cat) || 0;
        categories.set(cat, count + 1);
      });
    }
  }
});

console.log('\n📊 Category Summary:');
console.log('===================');
if (categories.size === 0) {
  console.log('❌ No categories found!');
} else {
  categories.forEach((count, cat) => {
    console.log(`  ${cat}: ${count} articles`);
  });
}

// Check data structure
console.log('\n📁 Checking data structure:');
const dataDir = path.join(__dirname, '../src/content');
if (fs.existsSync(dataDir)) {
  const dataDirs = fs.readdirSync(dataDir);
  console.log('  src/content/ contains:', dataDirs.join(', '));
  
  // Check if blog directory exists
  const blogDir = path.join(dataDir, 'blog');
  if (fs.existsSync(blogDir)) {
    const blogContents = fs.readdirSync(blogDir);
    console.log('  src/content/blog/ contains:', blogContents.join(', '));
  }
}