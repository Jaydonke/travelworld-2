#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function processMdxFile(filePath) {
  try {
    console.log(`🔧 修复文件: ${path.basename(filePath)}`);

    const content = fs.readFileSync(filePath, 'utf8');

    // 检查是否已经有cover字段
    if (content.includes('cover:')) {
      console.log(`📋 已有封面图片: ${path.basename(filePath)}`);
      return false;
    }

    // 提取标题
    const titleMatch = content.match(/title:\s*"([^"]+)"/);
    if (!titleMatch) {
      console.log(`⚠️  无法找到标题: ${path.basename(filePath)}`);
      return false;
    }

    const title = titleMatch[1];
    const articleSlug = slugify(title);

    // 在frontmatter中添加cover字段
    const updatedContent = content.replace(
      /(description:\s*"[^"]+"\n)/,
      `$1cover: '@assets/images/articles/${articleSlug}/cover.png'\n`
    );

    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ 已添加封面图片路径: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`📋 无需修复: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 处理失败: ${path.basename(filePath)} - ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔧 封面图片路径修复脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let fixedCount = 0;
  let totalCount = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        totalCount++;
        const wasFixed = processMdxFile(mdxPath);
        if (wasFixed) {
          fixedCount++;
        }
      }
    }
  }

  console.log('\n📊 修复结果摘要:');
  console.log(`📁 总文件数: ${totalCount}`);
  console.log(`🔧 已修复: ${fixedCount}`);
  console.log(`📋 无需修复: ${totalCount - fixedCount}`);

  console.log('\n🎉 修复完成！');
  console.log('💡 提示: 现在可以正常运行 "npm run dev"');
}

main().catch(console.error); 