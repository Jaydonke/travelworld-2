#!/usr/bin/env node

/**
 * 清理备份文件脚本
 * 移除所有 .backup.* 文件以避免 Astro 构建警告
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

function findBackupFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .git 目录
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== '.astro') {
        findBackupFiles(filePath, fileList);
      }
    } else if (file.includes('.backup.')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function main() {
  console.log(colors.bold(colors.cyan('\n🧹 清理备份文件\n')));
  
  const projectRoot = path.join(__dirname, '..');
  const srcDir = path.join(projectRoot, 'src');
  const backupsDir = path.join(projectRoot, 'backups');
  
  // 创建 backups 目录（如果不存在）
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log(colors.green('✅ 创建了 backups 目录'));
  }
  
  // 查找所有备份文件
  console.log(colors.cyan('🔍 正在查找备份文件...'));
  const backupFiles = findBackupFiles(srcDir);
  
  if (backupFiles.length === 0) {
    console.log(colors.yellow('📭 没有找到备份文件'));
    return;
  }
  
  console.log(colors.cyan(`\n📁 找到 ${backupFiles.length} 个备份文件\n`));
  
  let movedCount = 0;
  let deletedCount = 0;
  
  backupFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    const targetPath = path.join(backupsDir, fileName);
    
    try {
      // 如果目标文件已存在，直接删除源文件
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(filePath);
        console.log(colors.yellow(`🗑️  删除: ${path.relative(projectRoot, filePath)}`));
        deletedCount++;
      } else {
        // 移动文件到 backups 目录
        fs.renameSync(filePath, targetPath);
        console.log(colors.green(`📦 移动: ${path.relative(projectRoot, filePath)} → backups/`));
        movedCount++;
      }
    } catch (error) {
      console.log(colors.red(`❌ 处理失败: ${fileName} - ${error.message}`));
    }
  });
  
  console.log(colors.bold(colors.green(`\n✨ 清理完成！`)));
  if (movedCount > 0) {
    console.log(colors.green(`   📦 移动了 ${movedCount} 个文件到 backups 目录`));
  }
  if (deletedCount > 0) {
    console.log(colors.yellow(`   🗑️  删除了 ${deletedCount} 个重复的备份文件`));
  }
  console.log(colors.cyan('\n💡 Astro 构建警告应该已经解决'));
}

main();