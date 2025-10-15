#!/usr/bin/env node

/**
 * 修复文章中重复的第一张图片问题
 * 
 * 问题：标题下的拉长封面图片和正文中的第一张图片是同一张，造成重复显示
 * 解决：从正文中移除第一张图片，保留作为封面使用
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles'),
  imagesDir: path.join(__dirname, '../src/assets/images/articles'),
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

/**
 * 检查文章中是否存在重复的第一张图片
 */
function checkForDuplicateFirstImage(content, articleSlug) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let frontmatterEnded = false;
  let firstImageFound = false;
  let firstImageLine = -1;
  let firstImageUrl = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测frontmatter
    if (line === '---') {
      if (!inFrontmatter && !frontmatterEnded) {
        inFrontmatter = true;
        continue;
      } else if (inFrontmatter) {
        inFrontmatter = false;
        frontmatterEnded = true;
        continue;
      }
    }
    
    // 跳过frontmatter和import语句
    if (inFrontmatter || line.startsWith('import ')) {
      continue;
    }
    
    // 查找第一张图片（Markdown格式）
    const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch && !firstImageFound) {
      firstImageFound = true;
      firstImageLine = i;
      firstImageUrl = imageMatch[2];
      
      // 检查这张图片是否可能与封面图片相同
      // 如果图片URL包含img_0（通常是第一张图片）或者是本地路径的第一张
      if (imageMatch[2].includes('img_0') || imageMatch[2].includes('/cover.')) {
        return {
          hasDuplicate: true,
          lineNumber: i + 1,
          imageUrl: imageMatch[2],
          imageLine: line,
          lineIndex: i
        };
      }
      
      break;
    }
  }
  
  return { hasDuplicate: false };
}

/**
 * 修复单篇文章的重复图片问题
 */
async function fixArticleDuplicateImage(articleDir) {
  const articlePath = path.join(articleDir, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    return { success: false, reason: 'no_mdx_file' };
  }
  
  try {
    const content = fs.readFileSync(articlePath, 'utf8');
    const articleSlug = path.basename(articleDir);
    
    log(`\n📄 检查文章: ${articleSlug}`, 'cyan');
    
    const duplicateCheck = checkForDuplicateFirstImage(content, articleSlug);
    
    if (!duplicateCheck.hasDuplicate) {
      log(`  ✅ 无重复图片问题`, 'green');
      return { success: true, reason: 'no_issue' };
    }
    
    log(`  🔍 发现重复的第一张图片 (第${duplicateCheck.lineNumber}行)`, 'yellow');
    log(`  📸 图片: ${duplicateCheck.imageUrl}`, 'blue');
    
    // 创建备份
    const backupPath = articlePath + '.backup.' + Date.now();
    fs.copyFileSync(articlePath, backupPath);
    log(`  💾 已创建备份: ${path.basename(backupPath)}`, 'cyan');
    
    // 移除重复的第一张图片
    const lines = content.split('\n');
    lines.splice(duplicateCheck.lineIndex, 1);
    
    // 如果移除图片后留下空行，也一起移除
    if (duplicateCheck.lineIndex < lines.length && lines[duplicateCheck.lineIndex].trim() === '') {
      lines.splice(duplicateCheck.lineIndex, 1);
    }
    
    const newContent = lines.join('\n');
    
    // 写入修复后的内容
    fs.writeFileSync(articlePath, newContent, 'utf8');
    
    log(`  ✅ 已移除重复的第一张图片`, 'green');
    
    return { 
      success: true, 
      reason: 'fixed',
      removedImage: duplicateCheck.imageUrl,
      backupFile: backupPath
    };
    
  } catch (error) {
    log(`  ❌ 处理失败: ${error.message}`, 'red');
    return { success: false, reason: 'processing_failed', error: error.message };
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n🔧 修复文章重复图片脚本启动', 'bright');
  log('=' .repeat(50), 'blue');
  log('🎯 目标: 移除正文中与封面重复的第一张图片', 'cyan');
  log('=' .repeat(50), 'blue');
  
  try {
    // 检查文章目录
    if (!fs.existsSync(CONFIG.articlesDir)) {
      log(`❌ 文章目录不存在: ${CONFIG.articlesDir}`, 'red');
      process.exit(1);
    }
    
    // 获取所有文章目录
    const articleDirs = fs.readdirSync(CONFIG.articlesDir)
      .filter(item => {
        const fullPath = path.join(CONFIG.articlesDir, item);
        return fs.statSync(fullPath).isDirectory();
      })
      .map(item => path.join(CONFIG.articlesDir, item));
    
    if (articleDirs.length === 0) {
      log('⚠️  没有找到文章目录', 'yellow');
      return;
    }
    
    log(`📋 找到 ${articleDirs.length} 个文章目录\n`, 'blue');
    
    // 处理每篇文章
    const results = [];
    for (let i = 0; i < articleDirs.length; i++) {
      const result = await fixArticleDuplicateImage(articleDirs[i]);
      results.push({
        ...result,
        articleDir: path.basename(articleDirs[i])
      });
    }
    
    // 统计结果
    const fixedCount = results.filter(r => r.reason === 'fixed').length;
    const noIssueCount = results.filter(r => r.reason === 'no_issue').length;
    const failedCount = results.filter(r => !r.success).length;
    const backupFiles = results.filter(r => r.backupFile).map(r => r.backupFile);
    
    log('\n' + '='.repeat(50), 'blue');
    log('📊 处理结果统计:', 'bright');
    log(`   🔧 修复重复图片: ${fixedCount} 篇`, fixedCount > 0 ? 'green' : 'reset');
    log(`   ✅ 无问题: ${noIssueCount} 篇`, 'green');
    log(`   ❌ 失败: ${failedCount} 篇`, failedCount > 0 ? 'red' : 'reset');
    
    if (fixedCount > 0) {
      log('\n🎉 重复图片修复完成！', 'green');
      log('💡 修复详情:', 'cyan');
      results.filter(r => r.reason === 'fixed').forEach(result => {
        log(`   📄 ${result.articleDir}`, 'cyan');
        log(`      移除图片: ${result.removedImage}`, 'yellow');
      });
      
      if (backupFiles.length > 0) {
        log('\n📦 备份文件:', 'cyan');
        backupFiles.forEach(backup => {
          log(`   💾 ${path.basename(backup)}`, 'blue');
        });
        log('💡 如需恢复，可以将备份文件重命名为 index.mdx', 'yellow');
      }
      
      log('\n🚀 运行 npm run dev 查看修复效果', 'bright');
    } else {
      log('\n✅ 所有文章都没有重复图片问题', 'green');
    }
    
    if (failedCount > 0) {
      log('\n⚠️  部分文章处理失败:', 'yellow');
      results.filter(r => !r.success).forEach(result => {
        log(`   ❌ ${result.articleDir}: ${result.error || result.reason}`, 'red');
      });
    }
    
  } catch (error) {
    log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行脚本
main().catch(error => {
  console.log(`\n❌ 致命错误: ${error.message}`);
  console.error(error);
  process.exit(1);
});

export { main };