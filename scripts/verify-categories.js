#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categoriesDir = path.join(__dirname, '../src/content/categories');

// Color output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Verify all category files
function verifyCategories() {
  log('🔍 Verifying Category Files', 'cyan');
  log('============================\n', 'cyan');
  
  const categoryDirs = fs.readdirSync(categoriesDir)
    .filter(dir => fs.statSync(path.join(categoriesDir, dir)).isDirectory());
  
  let validCount = 0;
  let invalidCount = 0;
  const issues = [];
  
  for (const categoryDir of categoryDirs) {
    const indexPath = path.join(categoriesDir, categoryDir, 'index.json');
    
    if (!fs.existsSync(indexPath)) {
      log(`❌ ${categoryDir}: Missing index.json`, 'red');
      issues.push(`${categoryDir}: Missing index.json`);
      invalidCount++;
      continue;
    }
    
    try {
      const content = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      const requiredFields = ['title', 'path'];
      const missingFields = [];
      
      for (const field of requiredFields) {
        if (!content[field]) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        log(`⚠️  ${categoryDir}: Missing fields: ${missingFields.join(', ')}`, 'yellow');
        issues.push(`${categoryDir}: Missing fields: ${missingFields.join(', ')}`);
        invalidCount++;
      } else if (content.path !== categoryDir) {
        log(`⚠️  ${categoryDir}: Path mismatch (expected: ${categoryDir}, got: ${content.path})`, 'yellow');
        issues.push(`${categoryDir}: Path mismatch`);
        invalidCount++;
      } else {
        log(`✅ ${categoryDir}: Valid (${content.title})`, 'green');
        validCount++;
      }
      
    } catch (error) {
      log(`❌ ${categoryDir}: Invalid JSON - ${error.message}`, 'red');
      issues.push(`${categoryDir}: Invalid JSON`);
      invalidCount++;
    }
  }
  
  // Summary
  log('\n📊 Verification Summary:', 'cyan');
  log('========================\n', 'cyan');
  log(`   Total categories: ${categoryDirs.length}`, 'blue');
  log(`   Valid: ${validCount}`, 'green');
  if (invalidCount > 0) {
    log(`   Invalid: ${invalidCount}`, 'red');
  }
  
  if (issues.length > 0) {
    log('\n⚠️  Issues Found:', 'yellow');
    issues.forEach(issue => log(`   • ${issue}`, 'yellow'));
  } else {
    log('\n✨ All categories are properly formatted!', 'green');
  }
  
  // Check article categories
  log('\n📄 Checking Article Categories:', 'cyan');
  
  const articlesDir = path.join(__dirname, '../src/content/articles');
  const articleDirs = fs.readdirSync(articlesDir)
    .filter(dir => fs.statSync(path.join(articlesDir, dir)).isDirectory());
  
  const usedCategories = new Set();
  let articlesWithValidCategory = 0;
  let articlesWithInvalidCategory = 0;
  
  for (const articleDir of articleDirs) {
    const mdxPath = path.join(articlesDir, articleDir, 'index.mdx');
    
    if (fs.existsSync(mdxPath)) {
      const content = fs.readFileSync(mdxPath, 'utf8');
      const categoryMatch = content.match(/category:\s*([\w-]+)/);
      
      if (categoryMatch) {
        const category = categoryMatch[1];
        usedCategories.add(category);
        
        if (categoryDirs.includes(category)) {
          articlesWithValidCategory++;
        } else {
          log(`   ⚠️  ${articleDir}: Invalid category "${category}"`, 'yellow');
          articlesWithInvalidCategory++;
        }
      }
    }
  }
  
  log(`\n   Articles with valid categories: ${articlesWithValidCategory}`, 'green');
  if (articlesWithInvalidCategory > 0) {
    log(`   Articles with invalid categories: ${articlesWithInvalidCategory}`, 'red');
  }
  
  // Show unused categories
  const unusedCategories = categoryDirs.filter(cat => !usedCategories.has(cat));
  if (unusedCategories.length > 0) {
    log('\n📁 Unused Categories:', 'yellow');
    unusedCategories.forEach(cat => {
      const indexPath = path.join(categoriesDir, cat, 'index.json');
      try {
        const content = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        log(`   • ${content.title} (${cat})`, 'yellow');
      } catch {
        log(`   • ${cat}`, 'yellow');
      }
    });
  }
  
  return { valid: validCount, invalid: invalidCount, total: categoryDirs.length };
}

// Main execution
const result = verifyCategories();

if (result.invalid === 0) {
  log('\n🎉 All categories are properly configured!', 'green');
  process.exit(0);
} else {
  log('\n⚠️  Some categories need attention', 'yellow');
  process.exit(1);
}