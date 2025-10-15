#!/usr/bin/env node

/**
 * 修复重复分类名称问题
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
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 分类映射：将错误的分类名映射到正确的分类名
const categoryFix = {
  'ai-business-tips-business': 'ai-business',
  'ai-automation-tips-automation': 'ai-automation',
  'ai-automation-automation': 'ai-automation',
  'ai-development-tips-development': 'ai-development',
  'ai-development-development': 'ai-development',
  'ai-analysis-tips-analysis': 'ai-analysis',
  'ai-analysis-analysis': 'ai-analysis',
  'ai-content-content': 'ai-content',
  'ai-tools-tools': 'ai-tools',
  'food-travel-travel': 'food-travel',
  'destinations-content': 'destinations',
  'travel-tips': 'travel-tips',
  'planning': 'planning',
  'accommodation': 'accommodation',
  'culture': 'culture',
  'food-travel': 'food-travel',
  'adventure': 'adventure'
};

async function fixArticleCategory(articleDir) {
  const mdxPath = path.join(CONFIG.articlesDir, articleDir, 'index.mdx');
  
  if (!fs.existsSync(mdxPath)) {
    return false;
  }
  
  let content = fs.readFileSync(mdxPath, 'utf8');
  let isFixed = false;
  
  // 提取当前分类
  const categoryMatch = content.match(/category:\s*([^\n]+)/);
  if (!categoryMatch) {
    return false;
  }
  
  const currentCategory = categoryMatch[1].trim();
  
  // 检查是否需要修复
  if (categoryFix.hasOwnProperty(currentCategory)) {
    const correctCategory = categoryFix[currentCategory];
    
    // 创建备份
    const backupPath = `${mdxPath}.backup.${Date.now()}`;
    fs.copyFileSync(mdxPath, backupPath);
    
    // 修复分类
    const updatedContent = content.replace(
      /category:\s*[^\n]+/,
      `category: ${correctCategory}`
    );
    
    fs.writeFileSync(mdxPath, updatedContent);
    
    log(`  ✅ 修复分类: ${currentCategory} → ${correctCategory}`, 'green');
    isFixed = true;
  }
  
  return isFixed;
}

async function main() {
  log('🔧 开始修复重复分类名称', 'bright');
  log('=' .repeat(50), 'cyan');
  
  // 获取所有文章目录
  const articleDirs = fs.readdirSync(CONFIG.articlesDir)
    .filter(file => {
      const fullPath = path.join(CONFIG.articlesDir, file);
      return fs.statSync(fullPath).isDirectory();
    });
  
  log(`📊 找到 ${articleDirs.length} 篇文章`, 'blue');
  
  let fixedCount = 0;
  
  for (const articleDir of articleDirs) {
    log(`\n📝 检查文章: ${articleDir}`, 'cyan');
    
    const wasFixed = await fixArticleCategory(articleDir);
    if (wasFixed) {
      fixedCount++;
    } else {
      log(`  ℹ️  分类正常，无需修复`, 'blue');
    }
  }
  
  log('\n🎉 修复完成！', 'green');
  log(`📊 修复文章: ${fixedCount} 篇`, 'green');
  log(`📊 正常文章: ${articleDirs.length - fixedCount} 篇`, 'blue');
  
  if (fixedCount > 0) {
    log('\n💡 提示:', 'yellow');
    log('  1. 所有修改的文章都已备份 (.backup.时间戳)', 'yellow');
    log('  2. 请运行 npm run build 重新构建网站', 'yellow');
  }
}

main().catch(console.error);