#!/usr/bin/env node

/**
 * 修复文章作者引用脚本
 * 将已删除的作者引用替换为有效的作者
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

// 已删除的作者映射到新的作者
const authorMapping = {
  'sofia-martinez': 'brian-mitchell',
  'ahmed-khan': 'brian-mitchell',
  'chloe-nguyen': 'brian-mitchell',
  'emily-devis': 'emily-roberts',  // 相似名字
  'jane-doe': 'brian-mitchell',
  'john-smith': 'brian-mitchell',
  'liam-leonard': 'brian-mitchell',
  'maria-gonzalez': 'brian-mitchell',
  'olivier-brown': 'brian-mitchell',
  'rajesh-patel': 'priya-sharma',  // 相似背景
};

/**
 * 修复单个文章的作者引用
 */
function fixArticleAuthor(articlePath) {
  try {
    const content = fs.readFileSync(articlePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;
    
    // 检查并替换作者引用
    for (const [oldAuthor, newAuthor] of Object.entries(authorMapping)) {
      const regex = new RegExp(`- ${oldAuthor}`, 'g');
      if (regex.test(updatedContent)) {
        updatedContent = updatedContent.replace(regex, `- ${newAuthor}`);
        hasChanges = true;
      }
    }
    
    // 写回文件（如果有变化）
    if (hasChanges) {
      fs.writeFileSync(articlePath, updatedContent);
      return true;
    }
    
    return false;
  } catch (error) {
    log(`❌ 处理文件失败 ${articlePath}: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 扫描并修复所有文章
 */
function fixAllArticles() {
  log('\n🔧 修复文章作者引用...', 'cyan');
  
  try {
    const articleDirs = fs.readdirSync(CONFIG.articlesDir);
    let fixedCount = 0;
    let totalCount = 0;
    
    for (const dir of articleDirs) {
      const articlePath = path.join(CONFIG.articlesDir, dir, 'index.mdx');
      
      if (fs.existsSync(articlePath)) {
        totalCount++;
        const wasFixed = fixArticleAuthor(articlePath);
        
        if (wasFixed) {
          fixedCount++;
          log(`  ✅ 修复: ${dir}`, 'green');
        }
      }
    }
    
    log(`\n📊 处理结果:`, 'bright');
    log(`   📝 总文章数: ${totalCount}`, 'blue');
    log(`   🔧 已修复: ${fixedCount}`, 'green');
    log(`   ✅ 无需修复: ${totalCount - fixedCount}`, 'cyan');
    
  } catch (error) {
    log(`❌ 扫描文章失败: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 主函数
 */
function main() {
  log('\n🚀 作者引用修复脚本启动', 'bright');
  log('='.repeat(60), 'blue');
  log('🎯 替换已删除的作者引用为有效作者', 'cyan');
  log('='.repeat(60), 'blue');
  
  try {
    fixAllArticles();
    
    log('\n🎉 作者引用修复完成！', 'bright');
    log('💡 提示: 重启开发服务器查看效果', 'cyan');
    
  } catch (error) {
    log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行脚本
main();