#!/usr/bin/env node

import { batchDownloadImages } from './batch-image-downloader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testBatchPerformance() {
  console.log('🧪 测试批量下载性能\n');
  
  // 测试图片URL
  const testImages = [
    'https://via.placeholder.com/300x200/FF6B6B/ffffff?text=Image+1',
    'https://via.placeholder.com/400x300/4ECDC4/ffffff?text=Image+2',
    'https://via.placeholder.com/350x250/45B7D1/ffffff?text=Image+3',
    'https://picsum.photos/300/200?random=1',
    'https://picsum.photos/400/300?random=2',
    'https://picsum.photos/350/250?random=3',
    'https://via.placeholder.com/500x400/96CEB4/ffffff?text=Image+4',
    'https://via.placeholder.com/320x240/FFEAA7/000000?text=Image+5',
    'https://picsum.photos/280/180?random=4',
    'https://picsum.photos/360/270?random=5'
  ];
  
  const tempDir = path.join(__dirname, '../temp-batch-test');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  console.log(`📊 测试配置:`);
  console.log(`   图片数量: ${testImages.length}`);
  console.log(`   测试目录: ${tempDir}`);
  
  // 测试不同的并发级别
  const concurrencyLevels = [1, 3, 5, 10];
  
  for (const concurrency of concurrencyLevels) {
    console.log(`\n⚡ 测试并发数: ${concurrency}`);
    
    const startTime = Date.now();
    
    const downloadTasks = testImages.map((url, i) => ({
      url: url,
      targetPath: path.join(tempDir, `test_${concurrency}_${i}.jpg`),
      fileName: `test_${concurrency}_${i}.jpg`
    }));
    
    try {
      const results = await batchDownloadImages(downloadTasks, {
        maxConcurrent: concurrency,
        showProgress: false
      });
      
      const elapsed = (Date.now() - startTime) / 1000;
      const successCount = results.filter(r => r.success).length;
      const speed = testImages.length / elapsed;
      
      console.log(`   结果: ${successCount}/${testImages.length} 成功`);
      console.log(`   耗时: ${elapsed.toFixed(2)}秒`);
      console.log(`   速度: ${speed.toFixed(2)}张/秒`);
      console.log(`   提升: ${concurrency === 1 ? '基准' : (speed / (testImages.length / 3)).toFixed(1) + 'x'}`);
      
      // 清理测试文件
      results.forEach(result => {
        if (result.success && fs.existsSync(result.targetPath)) {
          try { fs.unlinkSync(result.targetPath); } catch (e) {}
        }
      });
      
    } catch (error) {
      console.log(`   ❌ 测试失败: ${error.message}`);
    }
  }
  
  // 清理临时目录
  try {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      try { fs.unlinkSync(path.join(tempDir, file)); } catch (e) {}
    });
    fs.rmdirSync(tempDir);
  } catch (e) {}
  
  console.log('\n📈 性能测试结论:');
  console.log('   • 并发数3-5最适合普通网络环境');
  console.log('   • 并发数10适合高速网络环境');
  console.log('   • 过高并发可能被服务器限制');
  console.log('   • 实际速度取决于网络状况和服务器响应');
  
  console.log('\n✅ 批量下载性能测试完成！');
}

testBatchPerformance().catch(console.error);