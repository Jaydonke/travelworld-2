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
  // 这是一个完全有效的PNG文件，包含正确的压缩数据
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  const pngBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(targetPath, pngBuffer);
}

function processArticle(articleDir) {
  try {
    const mdxPath = path.join(articleDir, 'index.mdx');
    if (!fs.existsSync(mdxPath)) {
      return false;
    }

    const content = fs.readFileSync(mdxPath, 'utf8');
    const titleMatch = content.match(/title:\s*"([^"]+)"/);
    if (!titleMatch) {
      return false;
    }

    const title = titleMatch[1];
    const articleSlug = slugify(title);
    const articleImagesDir = path.join(imagesDir, articleSlug);
    const coverImagePath = path.join(articleImagesDir, 'cover.png');

    // 创建图片目录
    if (!fs.existsSync(articleImagesDir)) {
      fs.mkdirSync(articleImagesDir, { recursive: true });
    }

    // 如果封面图片不存在，创建默认图片
    if (!fs.existsSync(coverImagePath)) {
      createDefaultCoverImage(coverImagePath);
      console.log(`✅ 创建默认封面图片: ${articleSlug}`);
      return true;
    } else {
      console.log(`📋 封面图片已存在: ${articleSlug}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 处理失败: ${path.basename(articleDir)} - ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🖼️  默认封面图片创建脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);
  console.log(`📂 图片目录: ${imagesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let createdCount = 0;
  let totalCount = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      totalCount++;
      const wasCreated = processArticle(fullPath);
      if (wasCreated) {
        createdCount++;
      }
    }
  }

  console.log('\n📊 创建结果摘要:');
  console.log(`📁 总文章数: ${totalCount}`);
  console.log(`🖼️  已创建: ${createdCount}`);
  console.log(`📋 已存在: ${totalCount - createdCount}`);

  console.log('\n🎉 创建完成！');
  console.log('💡 提示: 现在可以正常运行 "npm run dev"');
}

main().catch(console.error); 