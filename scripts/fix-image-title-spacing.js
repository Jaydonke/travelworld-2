#!/usr/bin/env node

/**
 * 修复图片后标题格式脚本
 * 
 * 功能：
 * 1. 修复图片后紧接标题的格式问题
 * 2. 在图片和标题之间添加换行符
 * 3. 确保正确的Markdown格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles'),
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m', 
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 修复单篇文章的图片标题格式
 */
function fixImageTitleSpacing(articleDir) {
  const articlePath = path.join(CONFIG.articlesDir, articleDir, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    return { success: false, error: 'Article file not found' };
  }
  
  try {
    let content = fs.readFileSync(articlePath, 'utf8');
    let fixCount = 0;
    
    // 匹配图片后紧接着的标题（没有换行符）
    // 格式: ![alt](path)### Title 或 ![alt](path)## Title 等
    const patterns = [
      // 匹配 ![...](...)\)### Title
      {
        regex: /(!\[[^\]]*\]\([^)]+\))(#{1,6}\s+[^\n]+)/g,
        name: 'image-title'
      }
    ];
    
    patterns.forEach(({ regex, name }) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const [fullMatch, imageTag, titleTag] = match;
        const replacement = `${imageTag}\n${titleTag}`;
        
        content = content.replace(fullMatch, replacement);
        fixCount++;
        
        log(`    🔧 修复格式: ${titleTag.substring(0, 30)}...`, 'blue');
        
        // 重置regex索引以避免无限循环
        regex.lastIndex = match.index + replacement.length;
      }
    });
    
    const hasChanges = fixCount > 0;
    
    if (hasChanges) {
      // 创建备份
      const backupPath = articlePath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, fs.readFileSync(articlePath, 'utf8'));
      
      // 写入修复后的内容
      fs.writeFileSync(articlePath, content);
    }
    
    return { 
      success: true, 
      changes: hasChanges,
      fixCount 
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n🔧 修复图片标题格式脚本', 'bright');
  log('=' .repeat(60), 'blue');
  log('🎯 功能: 修复图片后标题格式 | 添加换行符 | 改善显示', 'cyan');
  log('=' .repeat(60), 'blue');

  try {
    // 获取所有文章目录
    const articleDirs = fs.readdirSync(CONFIG.articlesDir)
      .filter(item => {
        const fullPath = path.join(CONFIG.articlesDir, item);
        return fs.statSync(fullPath).isDirectory();
      });
    
    if (articleDirs.length === 0) {
      log('📭 没有找到任何文章目录', 'yellow');
      return;
    }

    log(`\n📋 找到 ${articleDirs.length} 篇文章`, 'blue');
    
    const results = [];
    let totalFixes = 0;
    let articlesChanged = 0;
    let errorCount = 0;

    // 处理所有文章
    for (let i = 0; i < articleDirs.length; i++) {
      const articleDir = articleDirs[i];
      log(`\n📄 处理进度: ${i + 1}/${articleDirs.length} - ${articleDir}`, 'magenta');
      
      const result = fixImageTitleSpacing(articleDir);
      result.slug = articleDir;
      results.push(result);
      
      if (result.success) {
        if (result.changes) {
          log(`  ✅ 修复完成 - 修复了 ${result.fixCount} 个格式问题`, 'green');
          totalFixes += result.fixCount || 0;
          articlesChanged++;
        } else {
          log(`  ➡️  格式正确，无需修改`, 'cyan');
        }
      } else {
        log(`  ❌ 失败: ${result.error}`, 'red');
        errorCount++;
      }
    }

    // 显示结果统计
    log('\n' + '='.repeat(60), 'green');
    log('📊 图片标题格式修复完成', 'bright');
    log(`   📚 总文章数: ${articleDirs.length}`, 'blue');
    log(`   📝 修改的文章: ${articlesChanged}`, 'yellow');
    log(`   🔧 修复的格式: ${totalFixes}`, 'cyan');
    log(`   ❌ 处理失败: ${errorCount}`, errorCount > 0 ? 'red' : 'green');

    if (errorCount > 0) {
      log('\n⚠️  处理失败的文章:', 'yellow');
      results.filter(r => !r.success).forEach(result => {
        log(`   • ${result.slug}: ${result.error}`, 'red');
      });
    }

    if (articlesChanged > 0) {
      log('\n🎉 图片标题格式修复完成！', 'green');
      log('💡 建议:', 'cyan');
      log('   • 运行 npm run dev 查看效果', 'blue');
      log('   • 检查文章显示是否正常', 'blue');
      log('   • 验证标题格式是否正确', 'blue');
    } else {
      log('\n👍 所有文章格式都是正确的！', 'green');
    }

  } catch (error) {
    log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行脚本
main().catch(error => {
  log(`\n❌ 致命错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

export { main };