#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../src/content/articles');

function cleanDescription(desc) {
  // Remove any markdown links from description
  let clean = desc.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Ensure it's under 300 characters
  if (clean.length > 299) {
    clean = clean.substring(0, 296) + '...';
  }
  
  return clean;
}

function processArticle(articleDir) {
  const mdxPath = path.join(ARTICLES_DIR, articleDir, 'index.mdx');
  
  if (!fs.existsSync(mdxPath)) {
    return false;
  }
  
  let content = fs.readFileSync(mdxPath, 'utf8');
  let modified = false;
  
  // Fix description
  content = content.replace(/description: "([^"]+)"/g, (match, desc) => {
    const clean = cleanDescription(desc);
    if (clean !== desc) {
      modified = true;
      console.log(`  Fixed: ${articleDir}`);
    }
    return `description: "${clean}"`;
  });
  
  if (modified) {
    fs.writeFileSync(mdxPath, content);
  }
  
  return modified;
}

// Main
console.log('Fixing long descriptions...');

const articles = fs.readdirSync(ARTICLES_DIR).filter(f => 
  fs.statSync(path.join(ARTICLES_DIR, f)).isDirectory()
);

let fixed = 0;
for (const article of articles) {
  if (processArticle(article)) {
    fixed++;
  }
}

console.log(`Fixed ${fixed} articles`);