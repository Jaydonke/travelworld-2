#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');
const imagesDir = path.join(__dirname, '../src/assets/images/articles');

function checkImageLocalization() {
  console.log('🔍 图片本地化状态检查');
  console.log(`📂 文章目录: ${articlesDir}`);
  console.log(`🖼️ 图片目录: ${imagesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let totalArticles = 0;
  let articlesWithExternalImages = 0;
  let articlesWithLocalImages = 0;
  let totalExternalImages = 0;
  let totalLocalImages = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        totalArticles++;
        const content = fs.readFileSync(mdxPath, 'utf8');

        // 检查外部图片
        const externalImageRegex = /!\[([^\]]*)\]\((https:\/\/[^)]+)\)/g;
        const externalMatches = [...content.matchAll(externalImageRegex)];

        // 检查本地图片
        const localImageRegex = /!\[([^\]]*)\]\(@assets\/images\/articles\/[^)]+\)/g;
        const localMatches = [...content.matchAll(localImageRegex)];

        if (externalMatches.length > 0) {
          articlesWithExternalImages++;
          totalExternalImages += externalMatches.length;
          console.log(`⚠️  ${item}: ${externalMatches.length} 张外部图片`);
        }

        if (localMatches.length > 0) {
          articlesWithLocalImages++;
          totalLocalImages += localMatches.length;
          console.log(`✅ ${item}: ${localMatches.length} 张本地图片`);
        }

        if (externalMatches.length === 0 && localMatches.length === 0) {
          console.log(`📋 ${item}: 无图片`);
        }
      }
    }
  }

  console.log('\n📊 图片本地化状态摘要:');
  console.log(`📁 总文章数: ${totalArticles}`);
  console.log(`⚠️  包含外部图片的文章: ${articlesWithExternalImages}`);
  console.log(`✅ 包含本地图片的文章: ${articlesWithLocalImages}`);
  console.log(`🔗 总外部图片数: ${totalExternalImages}`);
  console.log(`🏠 总本地图片数: ${totalLocalImages}`);

  if (totalExternalImages > 0) {
    console.log('\n💡 建议运行图片本地化脚本:');
    console.log('   npm run localize-images');
  } else {
    console.log('\n🎉 所有图片都已本地化！');
  }

  // 检查图片文件是否存在
  console.log('\n🔍 检查本地图片文件...');
  let missingImages = 0;
  let existingImages = 0;

  if (fs.existsSync(imagesDir)) {
    const imageItems = fs.readdirSync(imagesDir);
    for (const imageItem of imageItems) {
      const imagePath = path.join(imagesDir, imageItem);
      const stat = fs.statSync(imagePath);

      if (stat.isDirectory()) {
        const imageFiles = fs.readdirSync(imagePath);
        existingImages += imageFiles.length;
        console.log(`📁 ${imageItem}: ${imageFiles.length} 张图片`);
      }
    }
  }

  console.log(`\n📊 本地图片文件统计:`);
  console.log(`✅ 存在的图片文件: ${existingImages}`);
  console.log(`❌ 缺失的图片文件: ${missingImages}`);
}

checkImageLocalization(); 