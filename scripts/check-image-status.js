#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');
const imagesDir = path.join(__dirname, '../src/assets/images/articles');

function checkImageStatus() {
  console.log('🔍 图片状态检查脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);
  console.log(`📂 图片目录: ${imagesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let totalArticles = 0;
  let validImages = 0;
  let missingImages = 0;
  let corruptedImages = 0;
  let missingDirectories = 0;

  console.log('\n📊 详细检查结果:');
  console.log('=' * 50);

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      totalArticles++;
      const mdxPath = path.join(fullPath, 'index.mdx');

      if (fs.existsSync(mdxPath)) {
        const content = fs.readFileSync(mdxPath, 'utf8');
        const titleMatch = content.match(/title:\s*"([^"]+)"/);

        if (titleMatch) {
          const title = titleMatch[1];
          const slug = item; // 使用目录名作为slug
          const articleImagesDir = path.join(imagesDir, slug);
          const coverImagePath = path.join(articleImagesDir, 'cover.png');

          // 检查图片目录
          if (!fs.existsSync(articleImagesDir)) {
            console.log(`❌ 缺失目录: ${slug}`);
            missingDirectories++;
            continue;
          }

          // 检查图片文件
          if (!fs.existsSync(coverImagePath)) {
            console.log(`❌ 缺失图片: ${slug}`);
            missingImages++;
          } else {
            const stats = fs.statSync(coverImagePath);
            if (stats.size < 100) {
              console.log(`⚠️  损坏图片: ${slug} (${stats.size} bytes)`);
              corruptedImages++;
            } else {
              console.log(`✅ 正常图片: ${slug} (${stats.size} bytes)`);
              validImages++;
            }
          }
        }
      }
    }
  }

  console.log('\n' + '=' * 50);
  console.log('📊 检查结果摘要:');
  console.log(`📁 总文章数: ${totalArticles}`);
  console.log(`✅ 正常图片: ${validImages}`);
  console.log(`❌ 缺失图片: ${missingImages}`);
  console.log(`⚠️  损坏图片: ${corruptedImages}`);
  console.log(`📁 缺失目录: ${missingDirectories}`);

  const totalIssues = missingImages + corruptedImages + missingDirectories;
  if (totalIssues === 0) {
    console.log('\n🎉 所有图片状态正常！');
  } else {
    console.log(`\n⚠️  发现 ${totalIssues} 个问题，建议运行修复脚本:`);
    console.log('   npm run fix-all-images');
    console.log('   或者');
    console.log('   node scripts/fix-all-image-issues-comprehensive.js');
  }
}

checkImageStatus(); 