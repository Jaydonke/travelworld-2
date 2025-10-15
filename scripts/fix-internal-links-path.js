#!/usr/bin/env node

/**
 * 修复内链路径脚本
 * 
 * 功能：
 * 1. 修复缺少 /articles/ 前缀的内链
 * 2. 清理剩余的旧"相关阅读"块
 * 3. 确保所有内链使用正确格式
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
 * 获取所有文章slug列表
 */
function getAllArticleSlugs() {
  if (!fs.existsSync(CONFIG.articlesDir)) {
    return [];
  }

  return fs.readdirSync(CONFIG.articlesDir)
    .filter(item => {
      const fullPath = path.join(CONFIG.articlesDir, item);
      return fs.statSync(fullPath).isDirectory();
    });
}

/**
 * 修复文章内链路径
 */
function fixArticleLinks(articleDir, allSlugs) {
  const articlePath = path.join(CONFIG.articlesDir, articleDir, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    return { success: false, error: 'Article file not found' };
  }
  
  try {
    let content = fs.readFileSync(articlePath, 'utf8');
    let changes = 0;
    let removedOldLinks = 0;
    
    // 1. 清理旧的"相关阅读"块（可能还有残留）
    const oldRelatedPattern = /💡\s*\*\*相关阅读\*\*:?\s*\[.*?\]\(.*?\)/g;
    const oldMatches = content.match(oldRelatedPattern);
    if (oldMatches) {
      content = content.replace(oldRelatedPattern, '');
      removedOldLinks = oldMatches.length;
      log(`    🗑️  清理了 ${removedOldLinks} 个旧的相关阅读块`, 'yellow');
    }
    
    // 2. 修复缺少 /articles/ 前缀的内链
    // 匹配格式: [text](/article-slug) 但不是 [text](/articles/article-slug)
    const linkPattern = /\[([^\]]+)\]\(\/([^\/][^)]+)\)/g;
    let match;
    
    while ((match = linkPattern.exec(content)) !== null) {
      const [fullMatch, linkText, slug] = match;
      
      // 检查这个slug是否存在于文章列表中
      if (allSlugs.includes(slug)) {
        const correctedLink = `[${linkText}](/articles/${slug})`;
        content = content.replace(fullMatch, correctedLink);
        changes++;
        log(`    🔗 修复链接: "${linkText}" → /articles/${slug}`, 'blue');
      }
      
      // 重置regex索引以避免无限循环
      linkPattern.lastIndex = match.index + 1;
    }
    
    // 3. 清理多余的空行
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    const hasChanges = changes > 0 || removedOldLinks > 0;
    
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
      linksFixed: changes,
      oldLinksRemoved: removedOldLinks
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n🔧 修复内链路径脚本', 'bright');
  log('=' .repeat(60), 'blue');
  log('🎯 功能: 添加/articles/前缀 | 清理旧链接 | 修复路径', 'cyan');
  log('=' .repeat(60), 'blue');

  try {
    // 获取所有文章slug
    const allSlugs = getAllArticleSlugs();
    
    if (allSlugs.length === 0) {
      log('📭 没有找到任何文章目录', 'yellow');
      return;
    }

    log(`\n📋 找到 ${allSlugs.length} 篇文章`, 'blue');
    
    const results = [];
    let totalLinksFixed = 0;
    let totalOldLinksRemoved = 0;
    let articlesChanged = 0;
    let errorCount = 0;

    // 处理所有文章
    for (let i = 0; i < allSlugs.length; i++) {
      const articleDir = allSlugs[i];
      log(`\n📄 处理进度: ${i + 1}/${allSlugs.length} - ${articleDir}`, 'magenta');
      
      const result = fixArticleLinks(articleDir, allSlugs);
      result.slug = articleDir;
      results.push(result);
      
      if (result.success) {
        if (result.changes) {
          log(`  ✅ 修复完成 - 链接:${result.linksFixed} | 清理:${result.oldLinksRemoved}`, 'green');
          totalLinksFixed += result.linksFixed || 0;
          totalOldLinksRemoved += result.oldLinksRemoved || 0;
          articlesChanged++;
        } else {
          log(`  ➡️  无需修改`, 'cyan');
        }
      } else {
        log(`  ❌ 失败: ${result.error}`, 'red');
        errorCount++;
      }
    }

    // 显示结果统计
    log('\n' + '='.repeat(60), 'green');
    log('📊 内链路径修复完成', 'bright');
    log(`   📚 总文章数: ${allSlugs.length}`, 'blue');
    log(`   📝 修改的文章: ${articlesChanged}`, 'yellow');
    log(`   🔗 修复的链接: ${totalLinksFixed}`, 'cyan');
    log(`   🗑️  清理的旧链接: ${totalOldLinksRemoved}`, 'yellow');
    log(`   ❌ 处理失败: ${errorCount}`, errorCount > 0 ? 'red' : 'green');

    if (errorCount > 0) {
      log('\n⚠️  处理失败的文章:', 'yellow');
      results.filter(r => !r.success).forEach(result => {
        log(`   • ${result.slug}: ${result.error}`, 'red');
      });
    }

    if (articlesChanged > 0) {
      log('\n🎉 内链路径修复完成！', 'green');
      log('💡 建议:', 'cyan');
      log('   • 运行 npm run dev 测试链接', 'blue');
      log('   • 检查文章链接是否正常跳转', 'blue');
      log('   • 验证所有内链格式正确', 'blue');
    } else {
      log('\n👍 所有链接格式都是正确的！', 'green');
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