#!/usr/bin/env node

import { smartDownloadImage } from './enhanced-image-downloader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  console.log('🧪 测试智能图片下载器\n');
  
  const testUrls = [
    {
      url: 'https://via.placeholder.com/300x200/4CAF50/ffffff?text=Test',
      name: 'placeholder.jpg',
      desc: '占位符图片服务'
    },
    {
      url: 'https://picsum.photos/300/200',
      name: 'picsum.jpg',
      desc: 'Lorem Picsum 随机图片'
    },
    {
      url: 'https://nonexistent-domain-12345.com/image.jpg',
      name: 'broken.jpg',
      desc: '不存在的域名（应该失败）'
    }
  ];
  
  const tempDir = path.join(__dirname, '../temp-test');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  for (const test of testUrls) {
    console.log(`\n📌 测试: ${test.desc}`);
    console.log(`   URL: ${test.url}`);
    
    const targetPath = path.join(tempDir, test.name);
    
    const success = await smartDownloadImage(test.url, targetPath, {
      maxRetries: 2,
      retryDelay: 1000,
      verbose: true
    });
    
    if (success) {
      const stats = fs.statSync(targetPath);
      console.log(`   ✅ 成功！文件大小: ${stats.size} bytes`);
      fs.unlinkSync(targetPath);
    } else {
      console.log(`   ❌ 失败（预期行为）`);
    }
  }
  
  // 清理
  try {
    fs.rmdirSync(tempDir);
  } catch (e) {}
  
  console.log('\n✅ 测试完成！');
}

test().catch(console.error);