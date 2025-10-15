#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

function fixBrokenLinks(slug) {
  const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    console.log(`⚠️  文章不存在: ${slug}`);
    return false;
  }
  
  console.log(`🔧 修复: ${slug}`);
  
  let content = fs.readFileSync(articlePath, 'utf8');
  const originalContent = content;
  
  // 修复嵌套URL问题 - 例如: cashback的https://entryearns.com/articles/boost-your-%5Bsavings%5D(https://entryearns.com/articles/boost-your-savings-proven-cashback-strategies-explained)-proven-cashback-strategies-explained
  
  // 1. 修复嵌套链接 [text](url-[text](url)-url)
  content = content.replace(
    /\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/[^)]*\[[^\]]*\]\([^)]+\)[^)]*\)/g,
    '$1'
  );
  
  // 2. 修复URL编码问题 %5B %5D
  content = content.replace(
    /\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/[^)]*%5B[^)]*%5D[^)]*\)/g,
    '$1'
  );
  
  // 3. 移除所有破损的内链，保留纯文本
  content = content.replace(
    /\[([^\]]+)\]\(https:\/\/entryearns\.com\/articles\/[^)]*\[[^\]]*\][^)]*\)/g,
    '$1'
  );
  
  // 4. 移除所有现有的内链，准备重新添加
  content = content.replace(
    /\[([^\]]+)\]\(https:\/\/entryearns\.com\/articles\/[^)]+\)/g,
    '$1'
  );
  
  // 检查是否有修改
  if (content !== originalContent) {
    fs.writeFileSync(articlePath, content);
    console.log(`  ✅ 已修复破损链接`);
    return true;
  }
  
  console.log(`  ℹ️  无需修复`);
  return false;
}

async function main() {
  console.log('🔧 修复破损内链脚本');
  console.log(`📂 文章目录: ${CONFIG.articlesDir}`);
  
  if (!fs.existsSync(CONFIG.articlesDir)) {
    console.error(`❌ 文章目录不存在: ${CONFIG.articlesDir}`);
    return;
  }
  
  // 获取所有文章
  const articleDirs = fs.readdirSync(CONFIG.articlesDir).filter(item => {
    const fullPath = path.join(CONFIG.articlesDir, item);
    return fs.statSync(fullPath).isDirectory() && 
           fs.existsSync(path.join(fullPath, 'index.mdx'));
  });
  
  console.log(`📊 找到 ${articleDirs.length} 篇文章`);
  
  let fixed = 0;
  
  for (const slug of articleDirs) {
    if (fixBrokenLinks(slug)) {
      fixed++;
    }
  }
  
  console.log('\n📊 修复统计:');
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`✅ 已修复: ${fixed}`);
  console.log(`🎉 完成！`);
}

main().catch(console.error);