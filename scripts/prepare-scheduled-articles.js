#!/usr/bin/env node

/**
 * 准备定时文章脚本
 * 清空newarticle文件夹，将scheduledarticle文件夹中的所有文件移动到newarticle
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const CONFIG = {
  newarticleDir: path.join(__dirname, '../newarticle'),
  scheduledDir: path.join(__dirname, '../scheduledarticle')
};

/**
 * 清空目录
 */
function clearDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
    return files.length;
  }
  return 0;
}

/**
 * 复制目录内容
 */
function copyDirectoryContents(srcDir, destDir) {
  let copiedCount = 0;
  
  if (!fs.existsSync(srcDir)) {
    return copiedCount;
  }
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const items = fs.readdirSync(srcDir);
  
  for (const item of items) {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      // 递归复制子目录
      fs.mkdirSync(destPath, { recursive: true });
      const subCount = copyDirectoryContents(srcPath, destPath);
      copiedCount += subCount;
    } else {
      // 复制文件
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
    }
  }
  
  return copiedCount;
}

/**
 * 获取目录中的文件统计
 */
function getDirectoryStats(dirPath) {
  let fileCount = 0;
  let totalSize = 0;
  let mdxCount = 0;
  
  if (!fs.existsSync(dirPath)) {
    return { fileCount, totalSize, mdxCount };
  }
  
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        fileCount++;
        totalSize += stat.size;
        if (path.extname(item) === '.mdx') {
          mdxCount++;
        }
      }
    }
  }
  
  scanDir(dirPath);
  return { fileCount, totalSize, mdxCount };
}

/**
 * 主函数
 */
async function main() {
  log('\n====================================', 'bright');
  log('    准备定时文章', 'bright');
  log('====================================', 'bright');
  
  try {
    // 检查scheduledarticle目录
    if (!fs.existsSync(CONFIG.scheduledDir)) {
      log('\n⚠️  scheduledarticle目录不存在', 'yellow');
      log(`   路径: ${CONFIG.scheduledDir}`, 'blue');
      log('   将创建空的newarticle目录...', 'blue');
      
      if (!fs.existsSync(CONFIG.newarticleDir)) {
        fs.mkdirSync(CONFIG.newarticleDir, { recursive: true });
        log('   ✅ 创建了newarticle目录', 'green');
      }
      return;
    }
    
    // 获取scheduledarticle统计
    const scheduledStats = getDirectoryStats(CONFIG.scheduledDir);
    
    if (scheduledStats.fileCount === 0) {
      log('\n📭 scheduledarticle目录为空', 'yellow');
      
      // 清空newarticle
      if (fs.existsSync(CONFIG.newarticleDir)) {
        const clearedCount = clearDirectory(CONFIG.newarticleDir);
        if (clearedCount > 0) {
          log(`   🗑️  清空了newarticle目录 (删除了${clearedCount}个项目)`, 'cyan');
        }
      } else {
        fs.mkdirSync(CONFIG.newarticleDir, { recursive: true });
        log('   ✅ 创建了空的newarticle目录', 'green');
      }
      return;
    }
    
    log('\n📊 scheduledarticle统计:', 'cyan');
    log(`   📄 文件总数: ${scheduledStats.fileCount}`, 'blue');
    log(`   📝 MDX文章: ${scheduledStats.mdxCount}`, 'blue');
    log(`   💾 总大小: ${(scheduledStats.totalSize / 1024 / 1024).toFixed(2)} MB`, 'blue');
    
    // 步骤1: 清空newarticle目录
    log('\n[1/3] 清空newarticle目录...', 'cyan');
    
    if (!fs.existsSync(CONFIG.newarticleDir)) {
      fs.mkdirSync(CONFIG.newarticleDir, { recursive: true });
      log('   ✅ 创建了newarticle目录', 'green');
    } else {
      const clearedCount = clearDirectory(CONFIG.newarticleDir);
      if (clearedCount > 0) {
        log(`   🗑️  清空完成 (删除了${clearedCount}个项目)`, 'green');
      } else {
        log('   📭 目录已经是空的', 'blue');
      }
    }
    
    // 步骤2: 复制文件
    log('\n[2/3] 复制scheduledarticle内容到newarticle...', 'cyan');
    
    const copiedCount = copyDirectoryContents(CONFIG.scheduledDir, CONFIG.newarticleDir);
    
    if (copiedCount > 0) {
      log(`   ✅ 成功复制 ${copiedCount} 个文件`, 'green');
    } else {
      log('   ⚠️  没有文件被复制', 'yellow');
    }
    
    // 步骤3: 验证
    log('\n[3/3] 验证结果...', 'cyan');
    
    const newStats = getDirectoryStats(CONFIG.newarticleDir);
    
    if (newStats.fileCount === scheduledStats.fileCount) {
      log('   ✅ 文件数量匹配', 'green');
    } else {
      log(`   ⚠️  文件数量不匹配 (源: ${scheduledStats.fileCount}, 目标: ${newStats.fileCount})`, 'yellow');
    }
    
    log('\n📊 最终结果:', 'cyan');
    log(`   📁 newarticle目录:`, 'blue');
    log(`      📄 文件总数: ${newStats.fileCount}`, 'blue');
    log(`      📝 MDX文章: ${newStats.mdxCount}`, 'blue');
    log(`      💾 总大小: ${(newStats.totalSize / 1024 / 1024).toFixed(2)} MB`, 'blue');
    
    log('\n✅ 定时文章准备完成！', 'green');
    log('   现在可以运行 npm run add-articles-improved 来添加这些文章', 'cyan');
    
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