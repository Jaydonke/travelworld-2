#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function fixCoverPathsToAssets() {
  console.log('🔧 修复封面路径为@assets别名脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let pathsFixed = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        let content = fs.readFileSync(mdxPath, 'utf8');
        const originalContent = content;
        let contentChanged = false;

        // 修复cover路径为@assets别名
        const coverPathRegex = /cover:\s*['"]([^'"]+)['"]/;
        const coverMatch = content.match(coverPathRegex);

        if (coverMatch) {
          const currentPath = coverMatch[1];
          // 检查是否是相对路径格式
          if (currentPath.startsWith('../../assets/')) {
            const newPath = currentPath.replace('../../assets/', '@assets/');
            content = content.replace(coverPathRegex, `cover: '${newPath}'`);
            contentChanged = true;
            console.log(`🔧 修复封面路径: ${item} -> ${newPath}`);
            pathsFixed++;
          }
        }

        // 保存修改后的内容
        if (content !== originalContent) {
          fs.writeFileSync(mdxPath, content);
        }
      }
    }
  }

  console.log(`\n📊 修复完成！`);
  console.log(`🔧 修复封面路径: ${pathsFixed} 个`);
  console.log(`🎉 所有封面路径已更新为@assets别名！`);
}

fixCoverPathsToAssets(); 