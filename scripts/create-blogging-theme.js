#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categoriesDir = path.join(__dirname, '../src/content/categories');

// Colors for console output
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

// Define blogging/monetization themed categories
const bloggingCategories = {
  'affiliate-marketing': {
    title: 'Affiliate Marketing',
    path: 'affiliate-marketing',
    description: 'Learn how to monetize your blog through affiliate partnerships and programs',
    keywords: ['affiliate', 'commission', 'partner', 'referral', 'amazon', 'clickbank']
  },
  'blog-monetization': {
    title: 'Blog Monetization', 
    path: 'blog-monetization',
    description: 'Strategies and techniques to generate income from your blog',
    keywords: ['monetize', 'revenue', 'income', 'earnings', 'profit', 'money']
  },
  'content-strategy': {
    title: 'Content Strategy',
    path: 'content-strategy',
    description: 'Plan and create content that engages your audience and drives traffic',
    keywords: ['content', 'strategy', 'planning', 'editorial', 'calendar', 'topics']
  },
  'seo-optimization': {
    title: 'SEO & Optimization',
    path: 'seo-optimization',
    description: 'Improve your blog visibility and search engine rankings',
    keywords: ['seo', 'search', 'google', 'ranking', 'keyword', 'optimization']
  },
  'email-marketing': {
    title: 'Email Marketing',
    path: 'email-marketing',
    description: 'Build and engage your email list for better conversions',
    keywords: ['email', 'newsletter', 'subscriber', 'list', 'mailchimp', 'convert']
  },
  'social-media': {
    title: 'Social Media Marketing',
    path: 'social-media',
    description: 'Promote your blog content across social media platforms',
    keywords: ['social', 'facebook', 'twitter', 'instagram', 'linkedin', 'viral']
  },
  'sponsored-content': {
    title: 'Sponsored Content',
    path: 'sponsored-content',
    description: 'Work with brands and create sponsored posts for your blog',
    keywords: ['sponsor', 'brand', 'partnership', 'collaboration', 'advertise']
  },
  'blogging-tools': {
    title: 'Blogging Tools',
    path: 'blogging-tools',
    description: 'Essential tools and resources for successful blogging',
    keywords: ['tools', 'software', 'plugin', 'wordpress', 'analytics', 'hosting']
  },
  'audience-growth': {
    title: 'Audience Growth',
    path: 'audience-growth',
    description: 'Strategies to grow your blog readership and engagement',
    keywords: ['traffic', 'audience', 'growth', 'engagement', 'community', 'reader']
  },
  'passive-income': {
    title: 'Passive Income',
    path: 'passive-income',
    description: 'Create sustainable passive income streams from your blog',
    keywords: ['passive', 'evergreen', 'residual', 'recurring', 'automated']
  }
};

// Clean existing categories
function cleanExistingCategories() {
  log('\n🧹 Cleaning existing categories...', 'yellow');
  
  const existingDirs = fs.readdirSync(categoriesDir)
    .filter(dir => fs.statSync(path.join(categoriesDir, dir)).isDirectory());
  
  for (const dir of existingDirs) {
    const dirPath = path.join(categoriesDir, dir);
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  
  log(`   Removed ${existingDirs.length} existing categories`, 'green');
}

// Create new category structure
function createCategories() {
  log('\n📁 Creating blogging theme categories...', 'cyan');
  
  for (const [categoryId, categoryData] of Object.entries(bloggingCategories)) {
    const categoryPath = path.join(categoriesDir, categoryId);
    
    // Create directory
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
    }
    
    // Create index.json
    const indexContent = {
      title: categoryData.title,
      path: categoryData.path,
      description: categoryData.description
    };
    
    fs.writeFileSync(
      path.join(categoryPath, 'index.json'),
      JSON.stringify(indexContent, null, 2),
      'utf8'
    );
    
    log(`   ✅ Created: ${categoryId} - ${categoryData.title}`, 'green');
  }
}

// Verify category structure
function verifyCategories() {
  log('\n🔍 Verifying category structure...', 'blue');
  
  let valid = 0;
  let invalid = 0;
  
  for (const categoryId of Object.keys(bloggingCategories)) {
    const categoryPath = path.join(categoriesDir, categoryId);
    const indexPath = path.join(categoryPath, 'index.json');
    
    if (fs.existsSync(indexPath)) {
      try {
        const content = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        if (content.title && content.path) {
          valid++;
        } else {
          log(`   ⚠️  Missing fields in ${categoryId}`, 'yellow');
          invalid++;
        }
      } catch (e) {
        log(`   ❌ Invalid JSON in ${categoryId}`, 'red');
        invalid++;
      }
    } else {
      log(`   ❌ Missing index.json for ${categoryId}`, 'red');
      invalid++;
    }
  }
  
  log(`\n   Valid categories: ${valid}`, 'green');
  if (invalid > 0) {
    log(`   Invalid categories: ${invalid}`, 'red');
  }
}

// Update dynamic categorization rules
function updateCategorizationRules() {
  log('\n📝 Creating categorization rules...', 'cyan');
  
  const rulesPath = path.join(__dirname, 'categorization-rules.json');
  
  const rules = {
    theme: 'blogging-monetization',
    categories: bloggingCategories,
    keywords: Object.entries(bloggingCategories).reduce((acc, [id, cat]) => {
      acc[id] = cat.keywords;
      return acc;
    }, {})
  };
  
  fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf8');
  log('   ✅ Categorization rules updated', 'green');
}

// Main execution
async function main() {
  log('🎨 Creating Blogging & Monetization Theme', 'magenta');
  log('==========================================\n', 'magenta');
  
  cleanExistingCategories();
  createCategories();
  verifyCategories();
  updateCategorizationRules();
  
  log('\n✨ Blogging theme created successfully!', 'green');
  log('\n📊 Summary:', 'cyan');
  log(`   Total categories: ${Object.keys(bloggingCategories).length}`, 'blue');
  log('   Theme: Professional Blogging & Monetization', 'blue');
  
  log('\n📌 Next steps:', 'yellow');
  log('   1. Run: node scripts/categorize-articles.js', 'blue');
  log('   2. This will automatically categorize all articles', 'blue');
  log('   3. Build the site to see the new categories', 'blue');
}

main().catch(console.error);