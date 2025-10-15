#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

async function fixDuplicateLinks() {
  console.log('🔧 修复所有文章中的重复内链...\n');
  
  // 获取所有文章目录
  const articleDirs = fs.readdirSync(CONFIG.articlesDir).filter(item => {
    const fullPath = path.join(CONFIG.articlesDir, item);
    return fs.statSync(fullPath).isDirectory() && 
           fs.existsSync(path.join(fullPath, 'index.mdx'));
  });
  
  let totalFixed = 0;
  let articlesFixed = 0;
  
  for (const slug of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    let content = fs.readFileSync(articlePath, 'utf8');
    const originalContent = content;
    
    // 分离frontmatter和内容
    const frontmatterEndMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!frontmatterEndMatch) continue;
    
    const frontmatter = frontmatterEndMatch[1];
    let bodyContent = frontmatterEndMatch[2];
    
    // 查找所有内部链接并记录已出现的URL
    const linkRegex = /\[([^\]]+)\]\((https:\/\/entryearns\.com\/articles\/[^)]+)\)/g;
    const seenUrls = new Set();
    let fixedInArticle = 0;
    
    // 替换重复的链接为纯文本
    bodyContent = bodyContent.replace(linkRegex, (match, linkText, url) => {
      if (seenUrls.has(url)) {
        // 这是重复的链接，只保留文本
        fixedInArticle++;
        return linkText;
      } else {
        // 第一次出现，保留链接
        seenUrls.add(url);
        return match;
      }
    });
    
    if (fixedInArticle > 0) {
      // 重新组合内容
      content = frontmatter + bodyContent;
      
      // 写回文件
      fs.writeFileSync(articlePath, content, 'utf8');
      console.log(`✅ ${slug}: 删除了 ${fixedInArticle} 个重复链接`);
      totalFixed += fixedInArticle;
      articlesFixed++;
    }
  }
  
  console.log(`\n📊 修复结果:`);
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`🔧 修复的文章: ${articlesFixed}`);
  console.log(`✅ 删除的重复链接: ${totalFixed}`);
  
  if (totalFixed > 0) {
    console.log(`\n🎉 成功！所有重复的内部链接已被修复。`);
  } else {
    console.log(`\n✅ 太好了！没有需要修复的重复链接。`);
  }
}

fixDuplicateLinks().catch(console.error);