#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categoriesDir = path.join(__dirname, '../src/content/categories');

console.log('🔍 Verifying all category files...\n');

const categories = fs.readdirSync(categoriesDir)
  .filter(file => fs.statSync(path.join(categoriesDir, file)).isDirectory());

let validCount = 0;
let invalidCount = 0;
const invalidCategories = [];

for (const category of categories) {
  const indexPath = path.join(categoriesDir, category, 'index.json');
  
  if (!fs.existsSync(indexPath)) {
    console.log(`❌ ${category}: Missing index.json`);
    invalidCount++;
    invalidCategories.push(category);
    continue;
  }
  
  try {
    const content = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    
    // Check for required fields
    if (!content.title) {
      console.log(`❌ ${category}: Missing 'title' field`);
      invalidCount++;
      invalidCategories.push(category);
    } else if (!content.path) {
      console.log(`❌ ${category}: Missing 'path' field`);
      invalidCount++;
      invalidCategories.push(category);
    } else if (content.path !== category) {
      console.log(`⚠️  ${category}: Path mismatch (expected: ${category}, found: ${content.path})`);
      invalidCount++;
      invalidCategories.push(category);
    } else {
      console.log(`✅ ${category}: Valid`);
      validCount++;
    }
  } catch (error) {
    console.log(`❌ ${category}: Invalid JSON - ${error.message}`);
    invalidCount++;
    invalidCategories.push(category);
  }
}

console.log('\n📊 Summary:');
console.log(`   Total categories: ${categories.length}`);
console.log(`   Valid: ${validCount}`);
console.log(`   Invalid: ${invalidCount}`);

if (invalidCategories.length > 0) {
  console.log('\n🔧 Fixing invalid categories...');
  
  for (const category of invalidCategories) {
    const indexPath = path.join(categoriesDir, category, 'index.json');
    
    // Try to read existing content
    let title = category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    if (fs.existsSync(indexPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        if (existing.title) {
          title = existing.title;
        }
      } catch (e) {
        // Use generated title
      }
    }
    
    // Write corrected file
    const correctedContent = {
      title: title,
      path: category
    };
    
    fs.writeFileSync(indexPath, JSON.stringify(correctedContent, null, 2));
    console.log(`   ✅ Fixed: ${category}`);
  }
  
  console.log('\n✨ All categories have been fixed!');
} else {
  console.log('\n✨ All categories are valid!');
}