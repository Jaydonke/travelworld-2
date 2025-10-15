#!/usr/bin/env node

/**
 * 修复MDX文章格式脚本
 * 
 * 功能：
 * 1. 恢复缺失的frontmatter
 * 2. 添加必要的import语句
 * 3. 保持现有的内链
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
 * 从备份文件提取frontmatter和import
 */
function extractFromBackup(articleDir) {
  const backupFiles = fs.readdirSync(path.join(CONFIG.articlesDir, articleDir))
    .filter(file => file.includes('.backup.'))
    .sort()
    .reverse(); // 最新的备份在前

  for (const backupFile of backupFiles) {
    const backupPath = path.join(CONFIG.articlesDir, articleDir, backupFile);
    try {
      const backupContent = fs.readFileSync(backupPath, 'utf8');
      
      // 提取frontmatter
      const frontmatterMatch = backupContent.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) continue;
      
      // 提取import语句
      const contentAfterFrontmatter = backupContent.substring(frontmatterMatch[0].length);
      const importMatch = contentAfterFrontmatter.match(/^(\s*import.*?;?\s*\n)*/);
      const imports = importMatch ? importMatch[0].trim() : '';
      
      return {
        frontmatter: frontmatterMatch[0],
        imports: imports
      };
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * 修复单篇文章
 */
function fixArticle(articleDir) {
  const articlePath = path.join(CONFIG.articlesDir, articleDir, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    return { success: false, error: 'Article file not found' };
  }
  
  try {
    const currentContent = fs.readFileSync(articlePath, 'utf8');
    
    // 检查是否已经有frontmatter
    if (currentContent.startsWith('---')) {
      return { success: true, skipped: true, reason: 'Already has frontmatter' };
    }
    
    // 从备份文件中提取信息
    const backupInfo = extractFromBackup(articleDir);
    if (!backupInfo) {
      return { success: false, error: 'No valid backup found' };
    }
    
    // 构建新内容
    let newContent = backupInfo.frontmatter + '\n';
    if (backupInfo.imports) {
      newContent += backupInfo.imports + '\n\n';
    }
    newContent += currentContent;
    
    // 创建当前文件备份
    const backupPath = articlePath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, currentContent);
    
    // 写入修复后的内容
    fs.writeFileSync(articlePath, newContent);
    
    return { success: true, fixed: true };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n🔧 修复MDX文章格式脚本', 'bright');
  log('=' .repeat(50), 'blue');
  log('🎯 功能: 恢复frontmatter | 添加imports | 保持内链', 'cyan');
  log('=' .repeat(50), 'blue');

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
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 处理所有文章
    for (let i = 0; i < articleDirs.length; i++) {
      const articleDir = articleDirs[i];
      log(`\n📄 处理进度: ${i + 1}/${articleDirs.length} - ${articleDir}`, 'magenta');
      
      const result = fixArticle(articleDir);
      result.slug = articleDir;
      results.push(result);
      
      if (result.success) {
        if (result.fixed) {
          log(`  ✅ 已修复`, 'green');
          fixedCount++;
        } else if (result.skipped) {
          log(`  ➡️  跳过: ${result.reason}`, 'cyan');
          skippedCount++;
        }
      } else {
        log(`  ❌ 失败: ${result.error}`, 'red');
        errorCount++;
      }
    }

    // 显示结果统计
    log('\n' + '='.repeat(50), 'green');
    log('📊 修复完成', 'bright');
    log(`   📚 总文章数: ${articleDirs.length}`, 'blue');
    log(`   ✅ 修复成功: ${fixedCount}`, 'green');
    log(`   ➡️  跳过文章: ${skippedCount}`, 'cyan');
    log(`   ❌ 修复失败: ${errorCount}`, errorCount > 0 ? 'red' : 'green');

    if (errorCount > 0) {
      log('\n⚠️  修复失败的文章:', 'yellow');
      results.filter(r => !r.success).forEach(result => {
        log(`   • ${result.slug}: ${result.error}`, 'red');
      });
    }

    if (fixedCount > 0) {
      log('\n🎉 MDX格式修复完成！', 'green');
      log('💡 建议:', 'cyan');
      log('   • 运行 npm run dev 查看效果', 'blue');
      log('   • 检查文章是否正常显示', 'blue');
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