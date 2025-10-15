#!/usr/bin/env node

/**
 * 清理图片缓存脚本
 * 当手动删除了图片文件后，清理对应的缓存记录
 */

import imageDedupManager from './image-dedup-manager.js';

function log(message, color = 'cyan') {
  const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

log('🚀 开始清理图片缓存...', 'cyan');

// 清理缓存
imageDedupManager.cleanupCache();

// 显示统计信息
const stats = imageDedupManager.getCacheStats();
log('\n📊 缓存统计信息:', 'yellow');
log(`  📁 缓存文件数: ${stats.totalCached}`, 'cyan');
log(`  💾 缓存大小: ${stats.cacheSize}KB`, 'cyan');
log(`  🗑️  重复发现: ${stats.duplicatesFound}`, 'cyan');

log('\n✅ 图片缓存清理完成！', 'green');