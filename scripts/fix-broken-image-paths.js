#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

function fixBrokenImagePaths(content) {
  // 修复图片路径中包含markdown链接的问题
  // 匹配模式: @assets/images/articles/article-name-[link](url)-more-text/image.jpg
  // 或者: @assets/images/articles/article-name-[link](url)/image.jpg
  
  const brokenPathPattern = /@assets\/images\/articles\/([^\/]+)-\[([^\]]+)\]\([^)]+\)([^\/]*)\//g;
  
  return content.replace(brokenPathPattern, (match, prefix, linkText, suffix) => {
    // 重构正确的路径
    const correctedPath = `@assets/images/articles/${prefix}${suffix ? suffix : ''}/`;
    return correctedPath;
  });
}

async function main() {
  console.log('🔧 修复损坏图片路径脚本');
  console.log(`📂 文章目录: ${CONFIG.articlesDir}`);
  
  if (!fs.existsSync(CONFIG.articlesDir)) {
    console.error(`❌ 文章目录不存在: ${CONFIG.articlesDir}`);
    return;
  }
  
  // 获取所有文章目录
  const articleDirs = fs.readdirSync(CONFIG.articlesDir).filter(item => {
    const fullPath = path.join(CONFIG.articlesDir, item);
    return fs.statSync(fullPath).isDirectory() && 
           fs.existsSync(path.join(fullPath, 'index.mdx'));
  });
  
  console.log(`📄 找到 ${articleDirs.length} 篇文章`);
  
  let fixedCount = 0;
  let totalFixedPaths = 0;
  
  for (const slug of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    let content = fs.readFileSync(articlePath, 'utf8');
    
    const originalContent = content;
    
    // 计算修复前的损坏路径数量
    const brokenPathsBefore = (content.match(/@assets\/images\/articles\/[^\/]+-\[[^\]]+\]\([^)]+\)[^\/]*\//g) || []).length;
    
    content = fixBrokenImagePaths(content);
    
    // 计算修复后的损坏路径数量
    const brokenPathsAfter = (content.match(/@assets\/images\/articles\/[^\/]+-\[[^\]]+\]\([^)]+\)[^\/]*\//g) || []).length;
    
    const fixedPaths = brokenPathsBefore - brokenPathsAfter;
    
    if (content !== originalContent) {
      fs.writeFileSync(articlePath, content, 'utf8');
      console.log(`✅ ${slug}: 修复了 ${fixedPaths} 个损坏的图片路径`);
      fixedCount++;
      totalFixedPaths += fixedPaths;
    } else {
      console.log(`ℹ️  ${slug}: 图片路径正常`);
    }
  }
  
  console.log(`\n📊 修复统计:`);
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`✅ 修复文章数: ${fixedCount}`);
  console.log(`🔧 修复路径总数: ${totalFixedPaths}`);
  console.log(`🎉 图片路径修复完成！`);
}

main().catch(console.error);