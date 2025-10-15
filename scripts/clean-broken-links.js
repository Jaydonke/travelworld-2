#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

function cleanArticle(slug) {
  const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    console.log(`⚠️  文章不存在: ${slug}`);
    return false;
  }
  
  console.log(`🧹 清理: ${slug}`);
  
  let content = fs.readFileSync(articlePath, 'utf8');
  const originalContent = content;
  
  // 修复 frontmatter 中被错误链接化的category字段
  content = content.replace(
    /category: \[([^\]]+)\]\(https:\/\/entryearns\.com\/articles\/[^)]+\)/g,
    'category: $1'
  );
  
  // 修复嵌套链接问题 - 例如 [savings](url-[keyword](url)-url)
  content = content.replace(
    /\[([^\]]+)\]\(https:\/\/entryearns\.com\/articles\/[^)]*\[([^\]]+)\]\(https:\/\/entryearns\.com\/articles\/[^)]+\)[^)]*\)/g,
    '[$2](https://entryearns.com/articles/boost-your-savings-proven-cashback-strategies-explained)'
  );
  
  // 移除所有现有的内链和外链，重新开始
  content = content.replace(
    /\[([^\]]+)\]\(https:\/\/entryearns\.com\/articles\/[^)]+\)/g,
    '$1'
  );
  
  // 移除重复的 "## Useful Resources" 部分
  let resourcesSections = [];
  let resourcesMatches = content.match(/## Useful Resources[\s\S]*?(?=## |$)/g);
  if (resourcesMatches && resourcesMatches.length > 1) {
    // 移除所有外链部分
    content = content.replace(/## Useful Resources[\s\S]*?(?=## |$)/g, '');
  }
  
  // 移除转义字符形式的外链
  content = content.replace(/\\n## Useful Resources\\n\\n[\s\S]*?\\n\s*/g, '');
  
  // 清理多余的空行
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // 检查是否有修改
  if (content !== originalContent) {
    fs.writeFileSync(articlePath, content);
    console.log(`  ✅ 已清理`);
    return true;
  }
  
  console.log(`  ℹ️  无需清理`);
  return false;
}

async function main() {
  console.log('🧹 清理错误链接脚本');
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
  
  let cleaned = 0;
  
  for (const slug of articleDirs) {
    if (cleanArticle(slug)) {
      cleaned++;
    }
  }
  
  console.log('\n📊 清理统计:');
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`✅ 已清理: ${cleaned}`);
  console.log(`🎉 完成！`);
}

main().catch(console.error);