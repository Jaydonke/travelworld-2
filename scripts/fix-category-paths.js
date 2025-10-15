#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categoriesDir = path.join(__dirname, '../src/content/categories');

// Categories that need to be fixed
const categoriesToFix = [
  'smart-storage',
  'home-renovation', 
  'interior-design',
  'furniture-hacks',
  'sustainable-living',
  'smart-home',
  'outdoor-spaces',
  'flooring-walls',
  'home-office'
];

// Fix each category
for (const categoryId of categoriesToFix) {
  const categoryPath = path.join(categoriesDir, categoryId);
  const indexPath = path.join(categoryPath, 'index.json');
  
  if (!fs.existsSync(indexPath)) {
    console.log(`⚠️  Category "${categoryId}" does not exist`);
    continue;
  }
  
  // Read current content
  const currentContent = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  
  // Add the required path field
  const updatedContent = {
    title: currentContent.title,
    path: categoryId
  };
  
  // Write updated content
  fs.writeFileSync(indexPath, JSON.stringify(updatedContent, null, 2));
  console.log(`✓ Fixed category: ${categoryId}`);
}

console.log('\n✨ All category paths have been fixed!');