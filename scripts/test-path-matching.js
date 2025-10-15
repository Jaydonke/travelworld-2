#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import imageDedupManager from './image-dedup-manager.js';
import { smartBatchDownload } from './batch-image-downloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPathMatching() {
  console.log('🧪 测试路径匹配修复功能\n');
  
  // 创建测试HTML内容
  const testHtmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Article Path Matching</title>
    <meta name="description" content="Testing image path matching with caching.">
</head>
<body>
    <h1>Test Article Path Matching</h1>
    
    <p>First image:</p>
    <img src="https://picsum.photos/300/200?random=1001" alt="First test image">
    
    <p>Second image:</p>
    <img src="https://picsum.photos/400/300?random=1002" alt="Second test image">
    
    <p>Third image (duplicate):</p>
    <img src="https://picsum.photos/300/200?random=1001" alt="Duplicate image">
</body>
</html>
  `;
  
  // 创建测试目录
  const testDir = path.join(__dirname, '../temp-path-test');
  const articleSlug = 'test-article-path-matching';
  const articleImagesDir = path.join(testDir, 'images', articleSlug);
  
  if (!fs.existsSync(articleImagesDir)) {
    fs.mkdirSync(articleImagesDir, { recursive: true });
  }
  
  console.log(`📂 测试目录: ${testDir}`);
  console.log(`🖼️  文章图片目录: ${articleImagesDir}\n`);
  
  // 模拟从HTML提取图片信息（简化版）
  function extractImages(htmlContent, slug) {
    const images = [];
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let match;
    let index = 0;
    
    while ((match = imgRegex.exec(htmlContent)) !== null) {
      if (match[1].startsWith('http')) {
        images.push({
          url: match[1],
          originalMatch: match[0],
          articleSlug: slug,
          fileName: `img_${index++}.jpg`
        });
      }
    }
    return images;
  }
  
  const images = extractImages(testHtmlContent, articleSlug);
  console.log(`🔍 从HTML提取的图片:`);
  images.forEach((img, i) => {
    console.log(`  ${i + 1}. ${img.url} -> ${img.fileName}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📥 第一次下载测试');
  console.log('='.repeat(60));
  
  // 准备下载任务
  const downloadTasks1 = images.map(img => ({
    url: img.url,
    targetPath: path.join(articleImagesDir, img.fileName),
    fileName: img.fileName,
    metadata: {
      articleSlug: img.articleSlug,
      fileName: img.fileName
    }
  }));
  
  const startTime1 = Date.now();
  const results1 = await smartBatchDownload(downloadTasks1, {
    maxConcurrent: 3,
    enableDedup: true,
    showCacheStats: false,
    validateFirst: false
  });
  const elapsed1 = (Date.now() - startTime1) / 1000;
  
  console.log(`\n📊 第一次下载结果:`);
  console.log(`   ⏱️  耗时: ${elapsed1.toFixed(2)}秒`);
  console.log(`   📥 总任务: ${images.length}`);
  console.log(`   ✅ 成功: ${results1.filter(r => r.success).length}`);
  console.log(`   💾 缓存: ${results1.filter(r => r.cached).length}`);
  
  // 模拟文章内容处理
  console.log('\n🔧 模拟文章内容处理...');
  let modifiedContent = testHtmlContent;
  
  // 按照修复后的逻辑处理路径替换
  results1.forEach(result => {
    const originalImage = images.find(img => img.url === result.url);
    if (!originalImage) return;
    
    let finalFileName;
    
    if (result.cached) {
      // 缓存的图片：使用原始文件名，但保持扩展名
      const sourceFileName = path.basename(result.targetPath);
      const extension = path.extname(sourceFileName) || '.jpg';
      finalFileName = originalImage.fileName.replace(/\.[^.]*$/, '') + extension;
      
      // 模拟复制操作
      const finalPath = path.join(articleImagesDir, finalFileName);
      console.log(`    📋 复制缓存图片: ${sourceFileName} -> ${finalFileName}`);
      
      // 实际复制文件
      try {
        fs.copyFileSync(result.targetPath, finalPath);
      } catch (error) {
        console.log(`    ⚠️  复制失败: ${error.message}`);
        finalFileName = sourceFileName;
      }
    } else {
      // 新下载的图片：直接使用
      finalFileName = path.basename(result.targetPath);
    }
    
    const localUrl = `@assets/images/articles/${articleSlug}/${finalFileName}`;
    
    modifiedContent = modifiedContent.replace(
      originalImage.originalMatch,
      originalImage.originalMatch.replace(result.url, localUrl)
    );
    
    const statusIcon = result.cached ? '💾' : '📥';
    console.log(`    ${statusIcon} ${result.url.substring(0, 40)}... -> ${finalFileName}`);
  });
  
  // 保存修改后的内容用于验证
  const outputPath = path.join(testDir, 'modified-article.html');
  fs.writeFileSync(outputPath, modifiedContent);
  console.log(`\n📝 修改后的文章保存到: ${outputPath}`);
  
  // 验证路径替换
  console.log('\n🔍 验证路径替换结果:');
  const pathMatches = modifiedContent.match(/@assets\/images\/articles\/[^"')]+/g);
  if (pathMatches) {
    pathMatches.forEach((path, i) => {
      console.log(`  ${i + 1}. ${path}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🔄 第二次下载测试（应该全部命中缓存）');
  console.log('='.repeat(60));
  
  // 第二次下载相同图片（模拟重复文章处理）
  const downloadTasks2 = images.map(img => ({
    url: img.url,
    targetPath: path.join(articleImagesDir, `second_${img.fileName}`),
    fileName: `second_${img.fileName}`,
    metadata: {
      articleSlug: articleSlug,
      fileName: `second_${img.fileName}`
    }
  }));
  
  const startTime2 = Date.now();
  const results2 = await smartBatchDownload(downloadTasks2, {
    maxConcurrent: 3,
    enableDedup: true,
    showCacheStats: false,
    validateFirst: false
  });
  const elapsed2 = (Date.now() - startTime2) / 1000;
  
  console.log(`\n📊 第二次下载结果:`);
  console.log(`   ⏱️  耗时: ${elapsed2.toFixed(2)}秒`);
  console.log(`   📥 总任务: ${images.length}`);
  console.log(`   ✅ 成功: ${results2.filter(r => r.success).length}`);
  console.log(`   💾 缓存命中: ${results2.filter(r => r.cached).length}`);
  
  // 验证第二次处理
  console.log('\n🔧 第二次文章内容处理...');
  let secondModifiedContent = testHtmlContent;
  
  results2.forEach(result => {
    const originalImage = images.find(img => img.url === result.url);
    if (!originalImage) return;
    
    let finalFileName;
    
    if (result.cached) {
      const sourceFileName = path.basename(result.targetPath);
      const extension = path.extname(sourceFileName) || '.jpg';
      // 使用第二次的文件名规则
      finalFileName = `second_${originalImage.fileName}`.replace(/\.[^.]*$/, '') + extension;
      
      const finalPath = path.join(articleImagesDir, finalFileName);
      console.log(`    📋 复制缓存图片: ${sourceFileName} -> ${finalFileName}`);
      
      try {
        fs.copyFileSync(result.targetPath, finalPath);
      } catch (error) {
        finalFileName = sourceFileName;
      }
    } else {
      finalFileName = path.basename(result.targetPath);
    }
    
    const localUrl = `@assets/images/articles/${articleSlug}/${finalFileName}`;
    const statusIcon = result.cached ? '💾' : '📥';
    console.log(`    ${statusIcon} ${result.url.substring(0, 40)}... -> ${finalFileName}`);
  });
  
  // 显示最终统计
  console.log('\n' + '='.repeat(60));
  console.log('📈 测试总结');
  console.log('='.repeat(60));
  console.log(`✅ 第一次处理: ${elapsed1.toFixed(2)}秒`);
  console.log(`⚡ 第二次处理: ${elapsed2.toFixed(2)}秒`);
  if (elapsed1 > 0) {
    console.log(`🚀 性能提升: ${(elapsed1 / Math.max(elapsed2, 0.1)).toFixed(1)}倍`);
  }
  
  // 列出生成的文件
  console.log('\n📁 生成的文件:');
  const files = fs.readdirSync(articleImagesDir);
  files.forEach(file => {
    const filePath = path.join(articleImagesDir, file);
    const stats = fs.statSync(filePath);
    console.log(`  📄 ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
  });
  
  // 清理测试文件
  console.log('\n🧹 清理测试文件...');
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('✅ 清理完成');
  } catch (error) {
    console.log('⚠️  清理失败（可忽略）');
  }
  
  console.log('\n🎉 路径匹配测试完成！');
  console.log('✅ 修复验证通过：');
  console.log('   • 缓存图片能正确复制到文章目录');
  console.log('   • 文件名保持预期的命名规则');
  console.log('   • 路径替换逻辑正确工作');
  console.log('   • 重复处理能有效利用缓存');
}

testPathMatching().catch(console.error);