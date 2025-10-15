#!/usr/bin/env node

/**
 * 修复文章描述中的HTML实体编码问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../src/content/articles');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 解码HTML实体
 */
function decodeHtmlEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * 修复单个文章的描述
 */
function fixArticleDescription(articlePath) {
  try {
    const content = fs.readFileSync(articlePath, 'utf8');
    
    // 检查是否有HTML实体编码的描述
    const descriptionMatch = content.match(/^description:\s*"([^"]*)"$/m);
    if (!descriptionMatch) {
      return false; // 没有找到描述或格式不匹配
    }
    
    const originalDescription = descriptionMatch[1];
    const decodedDescription = decodeHtmlEntities(originalDescription);
    
    // 如果没有变化，跳过
    if (originalDescription === decodedDescription) {
      return false;
    }
    
    // 替换描述
    const newContent = content.replace(
      /^description:\s*"([^"]*)"$/m,
      `description: "${decodedDescription}"`
    );
    
    fs.writeFileSync(articlePath, newContent);
    return true;
  } catch (error) {
    log(`❌ 处理文章失败: ${articlePath} - ${error.message}`, 'red');
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  log('🔧 开始修复文章描述中的HTML实体编码问题...', 'cyan');
  
  if (!fs.existsSync(ARTICLES_DIR)) {
    log('❌ 文章目录不存在', 'red');
    return;
  }
  
  let fixedCount = 0;
  let totalCount = 0;
  
  // 遍历所有文章目录
  const articleDirs = fs.readdirSync(ARTICLES_DIR);
  
  for (const dir of articleDirs) {
    const dirPath = path.join(ARTICLES_DIR, dir);
    const mdxFile = path.join(dirPath, 'index.mdx');
    
    if (fs.existsSync(mdxFile) && fs.statSync(dirPath).isDirectory()) {
      totalCount++;
      log(`📄 检查: ${dir}`, 'blue');
      
      if (fixArticleDescription(mdxFile)) {
        fixedCount++;
        log(`  ✅ 已修复描述编码问题`, 'green');
      } else {
        log(`  ⏭️  无需修复`, 'yellow');
      }
    }
  }
  
  log(`\n🎉 完成！`, 'cyan');
  log(`📊 统计:`, 'cyan');
  log(`   总文章数: ${totalCount}`, 'blue');
  log(`   已修复: ${fixedCount}`, 'green');
  log(`   无需修复: ${totalCount - fixedCount}`, 'yellow');
}

// 运行脚本
if (process.argv[1] && process.argv[1].endsWith('fix-description-encoding.js')) {
  main();
}

export { decodeHtmlEntities, fixArticleDescription };