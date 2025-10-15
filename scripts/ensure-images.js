#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');
const imagesDir = path.join(__dirname, '../src/assets/images/articles');

function createDefaultCoverImage(targetPath) {
  // 使用一个简单的1x1像素的PNG图片（base64编码）
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(targetPath, pngBuffer);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function ensureImages() {
  console.log('🖼️  确保图片文件存在脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);
  console.log(`📂 图片目录: ${imagesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let createdCount = 0;
  let existingCount = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        const content = fs.readFileSync(mdxPath, 'utf8');
        const titleMatch = content.match(/title:\s*"([^"]+)"/);
        
        if (titleMatch) {
          const title = titleMatch[1];
          const slug = slugify(title);
          const articleImagesDir = path.join(imagesDir, slug);
          const coverImagePath = path.join(articleImagesDir, 'cover.png');

          // 创建图片目录
          if (!fs.existsSync(articleImagesDir)) {
            fs.mkdirSync(articleImagesDir, { recursive: true });
          }

          // 检查并创建封面图片
          if (!fs.existsSync(coverImagePath)) {
            createDefaultCoverImage(coverImagePath);
            console.log(`✅ 创建封面图片: ${slug}`);
            createdCount++;
          } else {
            console.log(`📋 封面图片已存在: ${slug}`);
            existingCount++;
          }
        }
      }
    }
  }

  console.log(`\n📊 图片检查完成！`);
  console.log(`🆕 新创建: ${createdCount} 个封面图片`);
  console.log(`📋 已存在: ${existingCount} 个封面图片`);
}

ensureImages(); 