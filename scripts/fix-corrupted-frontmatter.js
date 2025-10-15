#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../src/content/articles');

function fixArticle(articleDir) {
  const mdxPath = path.join(ARTICLES_DIR, articleDir, 'index.mdx');
  
  if (!fs.existsSync(mdxPath)) {
    return false;
  }
  
  let content = fs.readFileSync(mdxPath, 'utf8');
  let modified = false;
  
  // Fix corrupted publishedTime field
  content = content.replace(/publishedTime: ([0-9T:\-\.]+)[^Z]*Z/g, (match, datetime) => {
    if (match.includes('[') || match.includes('(')) {
      modified = true;
      console.log(`  Fixed publishedTime: ${articleDir}`);
      return `publishedTime: ${datetime}Z`;
    }
    return match;
  });
  
  // Fix corrupted description field - ensure no markdown links
  content = content.replace(/description: "([^"]+)"/g, (match, desc) => {
    if (desc.includes('[') || desc.includes('](')) {
      const clean = desc.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      modified = true;
      console.log(`  Fixed description: ${articleDir}`);
      return `description: "${clean}"`;
    }
    return match;
  });
  
  // Ensure description is under 300 chars
  content = content.replace(/description: "([^"]+)"/g, (match, desc) => {
    if (desc.length > 299) {
      modified = true;
      return `description: "${desc.substring(0, 296)}..."`;
    }
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(mdxPath, content);
  }
  
  return modified;
}

// Main
console.log('Fixing corrupted frontmatter...');

const articles = fs.readdirSync(ARTICLES_DIR).filter(f => 
  fs.statSync(path.join(ARTICLES_DIR, f)).isDirectory()
);

let fixed = 0;
for (const article of articles) {
  if (fixArticle(article)) {
    fixed++;
  }
}

console.log(`Fixed ${fixed} articles`);