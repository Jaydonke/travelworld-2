#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');
const imagesDir = path.join(__dirname, '../src/assets/images/articles');

// 创建一个有效的PNG占位图片
function createDefaultPlaceholderImage(targetPath) {
  // 这是一个1x1像素的透明PNG图片的base64编码
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(targetPath, pngBuffer);
}

// 处理单个MDX文件
function processMdxFile(mdxPath) {
  try {
    console.log(`🔧 处理文件: ${path.basename(mdxPath)}`);

    const content = fs.readFileSync(mdxPath, 'utf8');
    const articleDir = path.dirname(mdxPath);
    const articleName = path.basename(articleDir);

    // 创建文章图片目录
    const articleImagesDir = path.join(imagesDir, articleName);
    if (!fs.existsSync(articleImagesDir)) {
      fs.mkdirSync(articleImagesDir, { recursive: true });
    }

    let modifiedContent = content;
    let fixedCount = 0;

    // 匹配外部图片链接
    const imageRegex = /!\[([^\]]*)\]\((https:\/\/[^)]+)\)/g;
    const matches = [...content.matchAll(imageRegex)];

    for (const match of matches) {
      const [fullMatch, altText, imageUrl] = match;

      // 提取文件名
      const urlParts = imageUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      let fileName;

      if (lastPart.includes('.jpg') || lastPart.includes('.jpeg') || lastPart.includes('.png')) {
        fileName = lastPart;
      } else {
        const urlHash = imageUrl.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
        fileName = `${urlHash}.jpg`;
      }

      const localImagePath = path.join(articleImagesDir, fileName);
      const localImageUrl = `@assets/images/articles/${articleName}/${fileName}`;

      // 如果本地图片不存在，创建占位图片
      if (!fs.existsSync(localImagePath)) {
        createDefaultPlaceholderImage(localImagePath);
        console.log(`📄 创建占位图片: ${fileName}`);
      }

      // 替换文章中的图片链接
      modifiedContent = modifiedContent.replace(fullMatch, `![${altText}](${localImageUrl})`);
      fixedCount++;
    }

    // 保存修改后的内容
    if (fixedCount > 0) {
      fs.writeFileSync(mdxPath, modifiedContent);
      console.log(`✅ 已修复文章: ${path.basename(mdxPath)} (${fixedCount} 张图片)`);
      return fixedCount;
    } else {
      console.log(`📋 无需修复: ${path.basename(mdxPath)}`);
      return 0;
    }

  } catch (error) {
    console.error(`❌ 处理失败: ${path.basename(mdxPath)} - ${error.message}`);
    return 0;
  }
}

// 主函数
function fixMissingImages() {
  console.log('🚀 修复缺失图片脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);
  console.log(`🖼️ 图片目录: ${imagesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  // 确保图片目录存在
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const items = fs.readdirSync(articlesDir);
  let totalFixed = 0;
  let processedFiles = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        const fixedCount = processMdxFile(mdxPath);
        totalFixed += fixedCount;
        if (fixedCount > 0) {
          processedFiles++;
        }
      }
    }
  }

  console.log('\n📊 修复结果摘要:');
  console.log(`📁 处理文件数: ${processedFiles}`);
  console.log(`🖼️ 总修复图片数: ${totalFixed}`);

  if (totalFixed > 0) {
    console.log('\n🎉 缺失图片修复完成！');
    console.log('💡 所有外部图片链接已替换为本地占位图片');
    console.log('📝 现在所有图片都使用 @assets 别名路径');
  } else {
    console.log('\n📝 没有发现需要修复的图片');
  }
}

fixMissingImages(); 