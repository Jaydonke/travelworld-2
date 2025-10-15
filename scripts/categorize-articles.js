#!/usr/bin/env node

/**
 * Intelligent Article Categorization Script
 * Automatically categorizes all articles based on title and content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles'),
  categoriesDir: path.join(__dirname, '../src/content/categories')
};

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

// Use dynamic categorization system
import { loadCategorizationRules, categorizeArticle } from './dynamic-categorization.js';

function extractArticleInfo(articlePath) {
  const mdxPath = path.join(articlePath, 'index.mdx');
  
  if (!fs.existsSync(mdxPath)) {
    return null;
  }
  
  const content = fs.readFileSync(mdxPath, 'utf8');
  
  // Extract frontmatter
  const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;
  
  const frontmatter = frontmatterMatch[1];
  
  // Extract title
  const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : '';
  
  // Extract description
  const descriptionMatch = frontmatter.match(/description:\s*"([^"]+)"/);
  const description = descriptionMatch ? descriptionMatch[1] : '';
  
  // Extract current category
  const categoryMatch = frontmatter.match(/category:\s*([\w-]+)/);
  const currentCategory = categoryMatch ? categoryMatch[1] : 'productivity';
  
  // Extract first 500 characters of body content for analysis
  const bodyContent = content.replace(/---\n[\s\S]*?\n---/, '').substring(0, 500);
  
  return {
    title,
    description,
    currentCategory,
    content: bodyContent,
    fullText: (title + ' ' + description + ' ' + bodyContent).toLowerCase()
  };
}

// Removed old categorization function, using function from dynamic categorization system

async function updateArticleCategory(articleSlug, newCategory) {
  const articlePath = path.join(CONFIG.articlesDir, articleSlug);
  const mdxPath = path.join(articlePath, 'index.mdx');
  
  if (!fs.existsSync(mdxPath)) {
    log(`  ⚠️  Article file not found: ${articleSlug}`, 'yellow');
    return false;
  }
  
  let content = fs.readFileSync(mdxPath, 'utf8');
  
  // Create backup
  const backupPath = `${mdxPath}.backup.${Date.now()}`;
  fs.copyFileSync(mdxPath, backupPath);
  
  // Update category
  const categoryRegex = /category:\s*[\w-]+/;
  if (categoryRegex.test(content)) {
    content = content.replace(categoryRegex, `category: ${newCategory}`);
  } else {
    // If no category field exists, add it
    content = content.replace(
      /(description:\s*"[^"]+")/, 
      `$1\ncategory: ${newCategory}`
    );
  }
  
  fs.writeFileSync(mdxPath, content);
  return true;
}

async function main() {
  log('🎯 Starting intelligent article categorization', 'cyan');
  log(`📂 Articles directory: ${CONFIG.articlesDir}`, 'blue');
  
  // Load categorization rules for current theme
  const { theme, rules, settings } = loadCategorizationRules();
  log(`🎨 Using theme: ${rules.name}`, 'cyan');
  
  // Get all articles
  const articleDirs = fs.readdirSync(CONFIG.articlesDir)
    .filter(file => {
      const fullPath = path.join(CONFIG.articlesDir, file);
      return fs.statSync(fullPath).isDirectory();
    });
  
  log(`\n📊 Found ${articleDirs.length} articles`, 'blue');
  
  // Analyze and categorize each article
  const categoryStats = {};
  let processed = 0;
  let updated = 0;
  
  for (const articleSlug of articleDirs) {
    log(`\n📝 Analyzing article: ${articleSlug}`, 'cyan');
    
    const articlePath = path.join(CONFIG.articlesDir, articleSlug);
    const articleInfo = extractArticleInfo(articlePath);
    
    if (!articleInfo) {
      log(`  ❌ Unable to read article information`, 'red');
      continue;
    }
    
    processed++;
    
    const suggestedCategory = categorizeArticle(
      articleInfo.title, 
      articleInfo.description, 
      articleInfo.content, 
      rules, 
      settings
    );
    const currentCategory = articleInfo.currentCategory;
    
    log(`  📖 Title: ${articleInfo.title}`, 'blue');
    log(`  📂 Current category: ${currentCategory}`, 'yellow');
    log(`  🎯 Suggested category: ${suggestedCategory}`, 'green');
    
    // Update category (if different)
    if (currentCategory !== suggestedCategory) {
      const success = await updateArticleCategory(articleSlug, suggestedCategory);
      if (success) {
        updated++;
        log(`  ✅ Updated category: ${currentCategory} → ${suggestedCategory}`, 'green');
      }
    } else {
      log(`  ℹ️  Category unchanged`, 'cyan');
    }
    
    // Category statistics
    if (!categoryStats[suggestedCategory]) {
      categoryStats[suggestedCategory] = 0;
    }
    categoryStats[suggestedCategory]++;
  }
  
  log('\n🎉 Categorization completed!', 'green');
  log(`📊 Processed articles: ${processed}`, 'blue');
  log(`🔄 Updated articles: ${updated}`, 'green');
  
  log('\n📈 Category statistics:', 'magenta');
  for (const [category, count] of Object.entries(categoryStats)) {
    const categoryData = rules.categories[category];
    const description = categoryData ? categoryData.description : 'Other';
    log(`  ${category}: ${count} articles (${description})`, 'cyan');
  }
  
  log('\n💡 Tips:', 'yellow');
  log('  1. All modified articles have been backed up (.backup.timestamp)', 'yellow');
  log(`  2. Current theme: ${theme}`, 'yellow');
  log('  3. Switch theme: node scripts/dynamic-categorization.js switch <theme-name>', 'yellow');
  log('  4. List available themes: node scripts/dynamic-categorization.js list', 'yellow');
  log('  5. Run npm run build to rebuild the website', 'yellow');
}

main().catch(console.error);