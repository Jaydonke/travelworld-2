#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

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

// Load categorization rules
const rules = JSON.parse(fs.readFileSync(path.join(__dirname, 'categorization-rules.json'), 'utf8'));

// Categorize article based on title and content
function categorizeArticle(title, description, content) {
  const fullText = (title + ' ' + description + ' ' + content).toLowerCase();
  const scores = {};
  
  // Calculate scores for each category
  for (const [categoryId, keywords] of Object.entries(rules.keywords)) {
    scores[categoryId] = 0;
    
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = fullText.match(regex);
      if (matches) {
        scores[categoryId] += matches.length;
      }
    }
  }
  
  // Find category with highest score
  let bestCategory = 'content-strategy'; // default
  let highestScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }
  
  return { category: bestCategory, score: highestScore };
}

// Process each article
async function processArticles() {
  log('📚 Categorizing Blog Articles', 'cyan');
  log('==============================\n', 'cyan');
  
  const articleDirs = fs.readdirSync(articlesDir)
    .filter(dir => fs.statSync(path.join(articlesDir, dir)).isDirectory());
  
  const categoryStats = {};
  let processedCount = 0;
  
  for (const articleDir of articleDirs) {
    const mdxPath = path.join(articlesDir, articleDir, 'index.mdx');
    
    if (!fs.existsSync(mdxPath)) {
      log(`⏭️  Skipping ${articleDir} (no index.mdx)`, 'yellow');
      continue;
    }
    
    // Read article content
    let content = fs.readFileSync(mdxPath, 'utf8');
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      log(`⚠️  ${articleDir}: No frontmatter found`, 'yellow');
      continue;
    }
    
    const frontmatter = frontmatterMatch[1];
    
    // Extract title and description
    const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
    const descriptionMatch = frontmatter.match(/description:\s*"([^"]+)"/);
    const description = descriptionMatch ? descriptionMatch[1] : '';
    
    // Get article body (first 1000 chars)
    const body = content.replace(/^---\n[\s\S]*?\n---/, '').substring(0, 1000);
    
    // Categorize the article
    const { category, score } = categorizeArticle(title, description, body);
    
    // Update category in frontmatter
    const categoryRegex = /category:\s*[\w-]+/;
    if (categoryRegex.test(frontmatter)) {
      content = content.replace(categoryRegex, `category: ${category}`);
    } else {
      // Add category after title
      content = content.replace(
        /(title:\s*"[^"]+"\n)/,
        `$1category: ${category}\n`
      );
    }
    
    // Write updated content
    fs.writeFileSync(mdxPath, content, 'utf8');
    
    // Update stats
    categoryStats[category] = (categoryStats[category] || 0) + 1;
    processedCount++;
    
    log(`✅ ${articleDir.substring(0, 40)}... → ${category} (score: ${score})`, 'green');
  }
  
  // Display summary
  log('\n📊 Categorization Summary:', 'cyan');
  log('==========================\n', 'cyan');
  
  for (const [categoryId, count] of Object.entries(categoryStats)) {
    const categoryInfo = rules.categories[categoryId];
    log(`   ${categoryInfo.title}: ${count} articles`, 'blue');
  }
  
  log(`\n✨ Total articles processed: ${processedCount}`, 'green');
  
  // List all available categories
  log('\n📁 Available Categories:', 'yellow');
  for (const [id, cat] of Object.entries(rules.categories)) {
    const used = categoryStats[id] || 0;
    log(`   • ${cat.title} (${id}): ${used} articles`, used > 0 ? 'green' : 'gray');
  }
}

// Main execution
processArticles().catch(console.error);