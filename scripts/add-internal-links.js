#!/usr/bin/env node

/**
 * 添加内链脚本 - 为现有文章添加内链
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 美食相关的静态关键词映射
const FOOD_KEYWORD_MAPPINGS = {
  // 三文鱼相关
  'salmon recipes': 'salmon-recipes-simple-and-delicious-meal-ideas',
  'simple salmon': 'salmon-recipes-simple-and-delicious-meal-ideas',
  'delicious salmon': 'salmon-recipes-simple-and-delicious-meal-ideas',
  'leftover salmon': 'leftover-salmon-bowl-ideas-for-a-quick-healthy-dinner',
  'salmon bowl': 'leftover-salmon-bowl-ideas-for-a-quick-healthy-dinner',
  'quick healthy dinner': 'leftover-salmon-bowl-ideas-for-a-quick-healthy-dinner',
  
  // 意大利面和汤类
  'baked feta pasta': 'baked-feta-pasta-recipe-easy-amp-delicious',
  'feta pasta recipe': 'baked-feta-pasta-recipe-easy-amp-delicious',
  'lasagna soup': 'lasagna-soup-a-creative-take-on-traditional-lasagna',
  'creative lasagna': 'lasagna-soup-a-creative-take-on-traditional-lasagna',
  
  // 舒适食物
  'mac and cheese': 'tini-s-mac-and-cheese-the-ultimate-comfort-dish',
  'ultimate comfort': 'tini-s-mac-and-cheese-the-ultimate-comfort-dish',
  'comfort food': 'tini-s-mac-and-cheese-the-ultimate-comfort-dish',
  'comforting': 'tini-s-mac-and-cheese-the-ultimate-comfort-dish',
  
  // 健康营养
  'gut health': 'boost-gut-health-with-functional-foods-for-gut-health',
  'functional foods': 'boost-gut-health-with-functional-foods-for-gut-health',
  'probiotic foods': 'top-prebiotic-and-probiotic-foods-for-a-healthy-gut',
  'prebiotic foods': 'top-prebiotic-and-probiotic-foods-for-a-healthy-gut',
  'healthy gut': 'top-prebiotic-and-probiotic-foods-for-a-healthy-gut',
  
  // 特殊食材
  'cottage cheese': 'cottage-cheese-recipes-healthy-amp-tasty-meal-ideas',
  'functional mushrooms': 'functional-mushrooms-unlock-nature-s-potential',
  'mushroom benefits': 'functional-mushrooms-unlock-nature-s-potential',
  
  // 烹饪技术
  'slow cooking': 'the-ultimate-guide-to-slow-cooking-beef-chuck-roast',
  'beef chuck roast': 'the-ultimate-guide-to-slow-cooking-beef-chuck-roast',
  'miso soup': 'learn-how-to-master-cooking-miso-soup-with-ease',
  'cooking miso': 'learn-how-to-master-cooking-miso-soup-with-ease',
  'water cooking': 'water-based-cooking-methods-for-delicious-amp-nutritious-food',
  'cooking methods': 'water-based-cooking-methods-for-delicious-amp-nutritious-food',
  
  // 饮品
  'hot chocolate': 'hot-chocolate-bombs-for-rich-amp-creamy-hot-chocolate',
  'chocolate bombs': 'hot-chocolate-bombs-for-rich-amp-creamy-hot-chocolate',
  'brown sugar latte': 'treat-yourself-to-a-brown-sugar-latte',
  'sleepy girl mocktail': 'the-sleepy-girl-mocktail-a-delicious-path-to-better-rest',
  
  // 全球风味
  'global snacks': 'global-snacks-explore-international-flavors-and-treats',
  'international flavors': 'global-snacks-explore-international-flavors-and-treats',
  
  // 食物趋势
  'mini pancake cereal': 'mini-pancake-cereal-the-cute-breakfast-trend-explained',
  'natures cereal': 'natures-cereal-a-healthy-breakfast-option-explained',
  'pesto eggs': 'make-pesto-eggs-a-delicious-breakfast-idea',
  
  // 复古烹饪
  'retro cooking': 'retro-cooking-recipes-timeless-meals-for-modern-homes',
  'retro recipes': 'retro-cooking-recipes-timeless-meals-for-modern-homes'
};

/**
 * 检查文章是否已存在
 */
function articleExists(slug) {
  const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
  return fs.existsSync(articlePath);
}

/**
 * 为单篇文章添加内链
 */
function addLinksToArticle(articleSlug) {
  const articlePath = path.join(CONFIG.articlesDir, articleSlug, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    log(`  ❌ 文章不存在: ${articleSlug}`, 'red');
    return false;
  }
  
  let content = fs.readFileSync(articlePath, 'utf8');
  let addedLinks = 0;
  const maxLinksPerArticle = 3; // 限制每篇文章最多3个内链
  
  // 获取当前文章的slug，避免自链接
  const currentSlug = articleSlug;
  
  // 按关键词长度排序，优先处理长关键词避免冲突
  const sortedKeywords = Object.keys(FOOD_KEYWORD_MAPPINGS).sort((a, b) => b.length - a.length);
  
  for (const keyword of sortedKeywords) {
    if (addedLinks >= maxLinksPerArticle) break;
    
    const targetSlug = FOOD_KEYWORD_MAPPINGS[keyword];
    
    // 避免自链接和不存在的文章
    if (targetSlug === currentSlug) continue;
    if (!articleExists(targetSlug)) continue;
    
    // 检查是否已经包含这个链接
    if (content.includes(`/articles/${targetSlug}`)) continue;
    
    // 创建不区分大小写的正则表达式，确保是完整单词
    const regex = new RegExp(`\\b(${keyword.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})\\b`, 'i');
    const match = content.match(regex);
    
    if (match) {
      const matchedText = match[1];
      const linkText = `[${matchedText}](/articles/${targetSlug})`;
      
      // 替换第一个匹配项
      content = content.replace(regex, linkText);
      addedLinks++;
      
      log(`    🔗 添加内链: "${matchedText}" → ${targetSlug}`, 'cyan');
    }
  }
  
  if (addedLinks > 0) {
    fs.writeFileSync(articlePath, content);
    log(`  ✅ 为文章 ${articleSlug} 添加了 ${addedLinks} 个内链`, 'green');
    return true;
  } else {
    log(`  ⚠️  未找到合适的内链关键词: ${articleSlug}`, 'yellow');
    return false;
  }
}

/**
 * 为所有文章添加内链
 */
function addLinksToAllArticles() {
  log('\n🔗 开始为所有文章添加内链...', 'bright');
  log('=' .repeat(60), 'blue');
  
  if (!fs.existsSync(CONFIG.articlesDir)) {
    log('❌ 文章目录不存在', 'red');
    return;
  }
  
  const articles = fs.readdirSync(CONFIG.articlesDir);
  let processedCount = 0;
  let successCount = 0;
  
  for (const articleSlug of articles) {
    const articlePath = path.join(CONFIG.articlesDir, articleSlug);
    
    if (fs.statSync(articlePath).isDirectory()) {
      log(`\n📄 处理文章: ${articleSlug}`, 'blue');
      processedCount++;
      
      if (addLinksToArticle(articleSlug)) {
        successCount++;
      }
    }
  }
  
  log('\n' + '=' .repeat(60), 'blue');
  log(`📊 处理结果:`, 'bright');
  log(`   处理文章: ${processedCount} 篇`, 'blue');
  log(`   成功添加内链: ${successCount} 篇`, 'green');
  log(`   未添加内链: ${processedCount - successCount} 篇`, 'yellow');
  log('\n🎉 内链添加完成！', 'green');
}

/**
 * 为特定文章添加内链
 */
function addLinksToSpecificArticle(articleSlug) {
  log(`\n🔗 为文章 "${articleSlug}" 添加内链...`, 'bright');
  log('=' .repeat(60), 'blue');
  
  addLinksToArticle(articleSlug);
}

// 命令行参数处理
const command = process.argv[2];
const articleSlug = process.argv[3];

if (command === 'all') {
  addLinksToAllArticles();
} else if (command === 'article' && articleSlug) {
  addLinksToSpecificArticle(articleSlug);
} else {
  log('\n🔗 内链添加脚本', 'bright');
  log('=' .repeat(60), 'blue');
  log('用法:', 'yellow');
  log('  npm run add-internal-links all           # 为所有文章添加内链', 'cyan');
  log('  npm run add-internal-links article <slug> # 为特定文章添加内链', 'cyan');
  log('\n示例:', 'yellow');
  log('  npm run add-internal-links article salmon-recipes-simple-and-delicious-meal-ideas', 'cyan');
}