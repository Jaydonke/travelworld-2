#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function processMdxFile(filePath) {
  try {
    console.log(`🔧 更新文件: ${path.basename(filePath)}`);

    const content = fs.readFileSync(filePath, 'utf8');

    // 检查是否包含.avif路径
    if (!content.includes('.avif')) {
      console.log(`📋 无需更新: ${path.basename(filePath)}`);
      return false;
    }

    // 将.avif替换为.png
    const updatedContent = content.replace(/\.avif'/g, ".png'");

    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ 已更新路径: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`📋 无需更新: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 处理失败: ${path.basename(filePath)} - ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔧 封面图片路径更新脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let updatedCount = 0;
  let totalCount = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        totalCount++;
        const wasUpdated = processMdxFile(mdxPath);
        if (wasUpdated) {
          updatedCount++;
        }
      }
    }
  }

  console.log('\n📊 更新结果摘要:');
  console.log(`📁 总文件数: ${totalCount}`);
  console.log(`🔧 已更新: ${updatedCount}`);
  console.log(`📋 无需更新: ${totalCount - updatedCount}`);

  console.log('\n🎉 更新完成！');
  console.log('💡 提示: 现在可以正常运行 "npm run dev"');
}

main().catch(console.error); 