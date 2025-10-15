#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

async function checkDuplicateLinks() {
  console.log('🔍 检查所有文章中的重复内链...\n');
  
  // 获取所有文章目录
  const articleDirs = fs.readdirSync(CONFIG.articlesDir).filter(item => {
    const fullPath = path.join(CONFIG.articlesDir, item);
    return fs.statSync(fullPath).isDirectory() && 
           fs.existsSync(path.join(fullPath, 'index.mdx'));
  });
  
  let totalDuplicates = 0;
  const articlesWithDuplicates = [];
  
  for (const slug of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    const content = fs.readFileSync(articlePath, 'utf8');
    
    // 提取frontmatter后的内容
    const frontmatterEndMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    const contentAfterFrontmatter = frontmatterEndMatch ? frontmatterEndMatch[1] : content;
    
    // 查找所有内部链接
    const linkRegex = /\[([^\]]+)\]\((https:\/\/entryearns\.com\/articles\/[^)]+)\)/g;
    const links = {};
    let match;
    
    while ((match = linkRegex.exec(contentAfterFrontmatter)) !== null) {
      const linkText = match[1].toLowerCase();
      const url = match[2];
      
      if (!links[url]) {
        links[url] = [];
      }
      links[url].push({
        text: match[1],
        position: match.index,
        fullMatch: match[0]
      });
    }
    
    // 检查重复链接
    const duplicateLinks = {};
    for (const [url, occurrences] of Object.entries(links)) {
      if (occurrences.length > 1) {
        duplicateLinks[url] = occurrences;
        totalDuplicates += occurrences.length - 1;
      }
    }
    
    if (Object.keys(duplicateLinks).length > 0) {
      articlesWithDuplicates.push({
        slug,
        duplicates: duplicateLinks
      });
      
      console.log(`📄 ${slug}:`);
      for (const [url, occurrences] of Object.entries(duplicateLinks)) {
        console.log(`   ❌ 链接出现 ${occurrences.length} 次: ${url}`);
        occurrences.forEach((occ, index) => {
          console.log(`      ${index + 1}. "${occ.text}"`);
        });
      }
      console.log('');
    }
  }
  
  console.log(`\n📊 检查结果:`);
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`🔗 有重复链接的文章: ${articlesWithDuplicates.length}`);
  console.log(`❌ 需要删除的重复链接: ${totalDuplicates}`);
  
  if (articlesWithDuplicates.length > 0) {
    console.log(`\n💡 建议：每个URL在文章中应该只链接一次，通常保留第一次出现的链接。`);
  } else {
    console.log(`\n✅ 太好了！所有文章中都没有重复的内部链接。`);
  }
  
  return articlesWithDuplicates;
}

checkDuplicateLinks().catch(console.error);