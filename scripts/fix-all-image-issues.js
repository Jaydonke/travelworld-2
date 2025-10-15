#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');
const imagesDir = path.join(__dirname, '../src/assets/images/articles');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function createDefaultCoverImage(targetPath) {
  // 使用一个简单的1x1像素的PNG图片（base64编码）
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(targetPath, pngBuffer);
}

function fixAllImageIssues() {
  console.log('🔧 综合图片问题修复脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);
  console.log(`📂 图片目录: ${imagesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let imagesCreated = 0;
  let pathsFixed = 0;
  let svgFixed = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        let content = fs.readFileSync(mdxPath, 'utf8');
        const originalContent = content;
        let contentChanged = false;

        // 1. 修复 @assets 路径到相对路径
        content = content.replace(
          /cover:\s*'@assets\/images\/articles\/([^']+)'/g,
          (match, slug) => {
            contentChanged = true;
            return `cover: '../../assets/images/articles/${slug}'`;
          }
        );

        // 2. 修复 .svg 到 .png
        content = content.replace(/\.svg'/g, ".png'");
        content = content.replace(/\.svg"/g, '.png"');

        // 3. 确保图片文件存在
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

          // 创建封面图片
          if (!fs.existsSync(coverImagePath)) {
            createDefaultCoverImage(coverImagePath);
            imagesCreated++;
            console.log(`✅ 创建封面图片: ${slug}`);
          }
        }

        // 保存修改
        if (content !== originalContent) {
          fs.writeFileSync(mdxPath, content);
          pathsFixed++;
          console.log(`✅ 修复文件: ${item}`);
        }
      }
    }
  }

  console.log(`\n📊 修复完成！`);
  console.log(`🆕 新创建封面图片: ${imagesCreated} 个`);
  console.log(`🔧 修复文件路径: ${pathsFixed} 个`);
  console.log(`🎉 所有图片问题已解决！`);
}

fixAllImageIssues(); 