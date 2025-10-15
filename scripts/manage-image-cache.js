#!/usr/bin/env node

import imageDedupManager from './image-dedup-manager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = {
  stats: showStats,
  cleanup: cleanupCache,
  clear: clearCache,
  list: listCache,
  help: showHelp
};

function showStats() {
  console.log('📊 图片缓存管理器');
  console.log('=' .repeat(50));
  imageDedupManager.showStats();
}

function cleanupCache() {
  console.log('🧹 清理图片缓存...');
  imageDedupManager.cleanupCache();
  console.log('✅ 缓存清理完成');
}

function clearCache() {
  console.log('🗑️  清空图片缓存...');
  
  // 删除缓存文件
  const cacheFile = path.join(__dirname, '../.image-cache/image-cache.json');
  if (fs.existsSync(cacheFile)) {
    fs.unlinkSync(cacheFile);
    console.log('✅ 缓存文件已删除');
  } else {
    console.log('ℹ️  缓存文件不存在');
  }
  
  console.log('✅ 缓存清空完成');
}

function listCache() {
  console.log('📋 缓存列表');
  console.log('=' .repeat(50));
  
  const cache = imageDedupManager.cache;
  const entries = Object.values(cache.urlHashes);
  
  if (entries.length === 0) {
    console.log('📭 缓存为空');
    return;
  }
  
  entries.forEach((entry, index) => {
    const fileExists = fs.existsSync(entry.filePath);
    const statusIcon = fileExists ? '✅' : '❌';
    const sizeKB = entry.fileSize ? (entry.fileSize / 1024).toFixed(1) : '?';
    const fileName = path.basename(entry.filePath);
    
    console.log(`${(index + 1).toString().padStart(3)}. ${statusIcon} ${fileName} (${sizeKB}KB)`);
    console.log(`     URL: ${entry.url.substring(0, 60)}...`);
    console.log(`     路径: ${entry.filePath}`);
    console.log(`     时间: ${new Date(entry.downloadTime).toLocaleString()}`);
    console.log();
  });
}

function showHelp() {
  console.log('🔧 图片缓存管理工具');
  console.log('=' .repeat(50));
  console.log('用法: node scripts/manage-image-cache.js <command>');
  console.log();
  console.log('可用命令:');
  console.log('  stats    - 显示缓存统计信息');
  console.log('  cleanup  - 清理无效的缓存条目');
  console.log('  clear    - 清空所有缓存');
  console.log('  list     - 列出所有缓存条目');
  console.log('  help     - 显示此帮助信息');
  console.log();
  console.log('示例:');
  console.log('  npm run manage-cache stats');
  console.log('  npm run manage-cache cleanup');
}

async function main() {
  const command = process.argv[2] || 'stats';
  
  if (commands[command]) {
    await commands[command]();
  } else {
    console.error(`❌ 未知命令: ${command}`);
    console.log('使用 "help" 查看可用命令');
    showHelp();
    process.exit(1);
  }
}

main().catch(console.error);