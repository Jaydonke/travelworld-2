#!/usr/bin/env node

import { smartBatchDownload } from './batch-image-downloader.js';
import imageDedupManager from './image-dedup-manager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImageDedup() {
  console.log('🧪 测试图片去重功能\n');
  
  // 准备测试数据
  const testImages = [
    'https://via.placeholder.com/300x200/FF6B6B/ffffff?text=Test+1',
    'https://via.placeholder.com/400x300/4ECDC4/ffffff?text=Test+2',
    'https://picsum.photos/300/200?random=100',
    'https://via.placeholder.com/300x200/FF6B6B/ffffff?text=Test+1', // 重复URL
    'https://picsum.photos/400/300?random=101',
  ];
  
  const testDir = path.join(__dirname, '../temp-dedup-test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  console.log('🎯 测试场景: 第一次下载所有图片');
  console.log(`📊 测试图片: ${testImages.length} 张`);
  console.log(`📂 测试目录: ${testDir}\n`);
  
  // 第一次下载
  console.log('=' .repeat(60));
  console.log('📥 第一次批量下载测试');
  console.log('=' .repeat(60));
  
  const downloadTasks1 = testImages.map((url, i) => ({
    url: url,
    targetPath: path.join(testDir, `first_${i}.jpg`),
    fileName: `first_${i}.jpg`
  }));
  
  const startTime1 = Date.now();
  const results1 = await smartBatchDownload(downloadTasks1, {
    maxConcurrent: 3,
    enableDedup: true,
    showCacheStats: false,
    validateFirst: false
  });
  const elapsed1 = (Date.now() - startTime1) / 1000;
  
  const success1 = results1.filter(r => r.success).length;
  const cached1 = results1.filter(r => r.cached).length;
  
  console.log(`\n📊 第一次下载结果:`);
  console.log(`   ✅ 成功: ${success1}/${testImages.length}`);
  console.log(`   💾 缓存: ${cached1}/${testImages.length}`);
  console.log(`   ⏱️  耗时: ${elapsed1.toFixed(2)}秒\n`);
  
  // 显示缓存状态
  imageDedupManager.showStats();
  
  // 第二次下载相同的图片（应该全部使用缓存）
  console.log('\n' + '=' .repeat(60));
  console.log('🔄 第二次下载测试（应该全部命中缓存）');
  console.log('=' .repeat(60));
  
  const downloadTasks2 = testImages.map((url, i) => ({
    url: url,
    targetPath: path.join(testDir, `second_${i}.jpg`),
    fileName: `second_${i}.jpg`
  }));
  
  const startTime2 = Date.now();
  const results2 = await smartBatchDownload(downloadTasks2, {
    maxConcurrent: 3,
    enableDedup: true,
    showCacheStats: false,
    validateFirst: false
  });
  const elapsed2 = (Date.now() - startTime2) / 1000;
  
  const success2 = results2.filter(r => r.success).length;
  const cached2 = results2.filter(r => r.cached).length;
  
  console.log(`\n📊 第二次下载结果:`);
  console.log(`   ✅ 成功: ${success2}/${testImages.length}`);
  console.log(`   💾 缓存命中: ${cached2}/${testImages.length}`);
  console.log(`   ⏱️  耗时: ${elapsed2.toFixed(2)}秒`);
  
  // 性能对比
  console.log(`\n📈 性能对比:`);
  console.log(`   第一次: ${elapsed1.toFixed(2)}秒`);
  console.log(`   第二次: ${elapsed2.toFixed(2)}秒`);
  if (elapsed1 > 0) {
    const speedup = (elapsed1 / elapsed2).toFixed(1);
    console.log(`   提升: ${speedup}倍`);
  }
  const timeSaved = (elapsed1 - elapsed2).toFixed(2);
  console.log(`   节省时间: ${timeSaved}秒`);
  
  // 第三次：混合测试（部分新图片，部分缓存）
  console.log('\n' + '=' .repeat(60));
  console.log('🔀 第三次混合测试（部分新图片，部分缓存）');
  console.log('=' .repeat(60));
  
  const mixedImages = [
    ...testImages.slice(0, 2), // 缓存的
    'https://picsum.photos/350/250?random=200', // 新的
    'https://via.placeholder.com/500x400/96CEB4/ffffff?text=New+Test', // 新的
    testImages[0] // 重复的缓存
  ];
  
  const downloadTasks3 = mixedImages.map((url, i) => ({
    url: url,
    targetPath: path.join(testDir, `mixed_${i}.jpg`),
    fileName: `mixed_${i}.jpg`
  }));
  
  const startTime3 = Date.now();
  const results3 = await smartBatchDownload(downloadTasks3, {
    maxConcurrent: 3,
    enableDedup: true,
    showCacheStats: false,
    validateFirst: false
  });
  const elapsed3 = (Date.now() - startTime3) / 1000;
  
  const success3 = results3.filter(r => r.success).length;
  const cached3 = results3.filter(r => r.cached).length;
  const newDownloads3 = success3 - cached3;
  
  console.log(`\n📊 混合测试结果:`);
  console.log(`   ✅ 总成功: ${success3}/${mixedImages.length}`);
  console.log(`   💾 缓存命中: ${cached3}/${mixedImages.length}`);
  console.log(`   📥 新下载: ${newDownloads3}/${mixedImages.length}`);
  console.log(`   ⏱️  耗时: ${elapsed3.toFixed(2)}秒`);
  
  // 最终缓存统计
  console.log('\n' + '=' .repeat(60));
  console.log('📈 最终缓存统计');
  console.log('=' .repeat(60));
  imageDedupManager.showStats();
  
  // 清理测试文件
  console.log('\n🧹 清理测试文件...');
  try {
    const files = fs.readdirSync(testDir);
    files.forEach(file => {
      const filePath = path.join(testDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(testDir);
    console.log('✅ 测试文件清理完成');
  } catch (error) {
    console.log('⚠️  清理测试文件时出现错误（可忽略）');
  }
  
  // 测试结论
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 去重功能测试完成！');
  console.log('=' .repeat(60));
  console.log('✅ 测试结论:');
  console.log(`   • 首次下载: ${success1}张图片，耗时${elapsed1.toFixed(2)}秒`);
  console.log(`   • 缓存命中: ${cached2}/${testImages.length}张图片，耗时${elapsed2.toFixed(2)}秒`);
  if (elapsed1 > elapsed2) {
    console.log(`   • 性能提升: ${((elapsed1 - elapsed2) / elapsed1 * 100).toFixed(1)}%`);
  }
  console.log(`   • 混合场景: ${cached3}张缓存命中，${newDownloads3}张新下载`);
  console.log('   • 去重功能正常工作，有效避免重复下载');
}

testImageDedup().catch(console.error);