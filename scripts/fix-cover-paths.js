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

function fixCoverPaths() {
  console.log('🔧 修复封面路径脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let fixedCount = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        let content = fs.readFileSync(mdxPath, 'utf8');
        const originalContent = content;

        // 修复 @assets 路径到相对路径
        content = content.replace(
          /cover:\s*'@assets\/images\/articles\/([^']+)'/g,
          (match, slug) => {
            return `cover: '../../assets/images/articles/${slug}'`;
          }
        );

        if (content !== originalContent) {
          fs.writeFileSync(mdxPath, content);
          console.log(`✅ 修复封面路径: ${item}`);
          fixedCount++;
        }
      }
    }
  }

  console.log(`\n📊 修复完成！`);
  console.log(`🔧 修复了 ${fixedCount} 个文件的封面路径`);
}

fixCoverPaths(); 