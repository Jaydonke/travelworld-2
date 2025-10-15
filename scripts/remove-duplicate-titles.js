#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function removeDuplicateTitle(content, articleTitle) {
  // Remove the markdown title that duplicates the frontmatter title
  // Look for # title pattern that matches the article title
  const titlePattern = new RegExp(`^# ${articleTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'mi');
  
  // Also look for variations with escaped characters
  const escapedTitle = articleTitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  const escapedTitlePattern = new RegExp(`^# ${escapedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'mi');
  
  let modifiedContent = content;
  
  // Remove the duplicate title
  if (titlePattern.test(modifiedContent)) {
    modifiedContent = modifiedContent.replace(titlePattern, '');
    console.log('  ✅ 删除重复标题');
    return { content: modifiedContent, modified: true };
  } else if (escapedTitlePattern.test(modifiedContent)) {
    modifiedContent = modifiedContent.replace(escapedTitlePattern, '');
    console.log('  ✅ 删除转义的重复标题');
    return { content: modifiedContent, modified: true };
  }
  
  console.log('  ℹ️  没有找到重复标题');
  return { content: modifiedContent, modified: false };
}

function processArticle(articleSlug) {
  const mdxPath = path.join(articlesDir, articleSlug, 'index.mdx');
  
  if (!fs.existsSync(mdxPath)) {
    console.log(`⚠️  MDX文件不存在: ${articleSlug}`);
    return false;
  }
  
  console.log(`\n📄 处理: ${articleSlug}`);
  
  const content = fs.readFileSync(mdxPath, 'utf8');
  
  // Extract title from frontmatter
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.log('  ⚠️  无法找到frontmatter');
    return false;
  }
  
  const frontmatter = frontmatterMatch[1];
  const titleMatch = frontmatter.match(/^title:\s*["\']([^"']+)["\']$/m) || 
                     frontmatter.match(/^title:\s*(.+)$/m);
  
  if (!titleMatch) {
    console.log('  ⚠️  无法提取标题');
    return false;
  }
  
  const articleTitle = titleMatch[1].trim().replace(/^["\']|["\']$/g, '');
  console.log(`  📝 标题: ${articleTitle}`);
  
  const { content: modifiedContent, modified } = removeDuplicateTitle(content, articleTitle);
  
  if (modified) {
    // Clean up any extra empty lines that might have been left
    const cleanedContent = modifiedContent.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(mdxPath, cleanedContent);
    return true;
  }
  
  return false;
}

async function main() {
  console.log('🔧 删除重复标题脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);
  
  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }
  
  const articles = fs.readdirSync(articlesDir).filter(item => {
    const fullPath = path.join(articlesDir, item);
    return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'index.mdx'));
  });
  
  console.log(`📊 找到 ${articles.length} 篇文章`);
  
  let fixed = 0;
  
  for (const slug of articles) {
    if (processArticle(slug)) {
      fixed++;
    }
  }
  
  console.log('\n📊 处理统计:');
  console.log(`📄 总文章数: ${articles.length}`);
  console.log(`✅ 修复文章数: ${fixed}`);
  console.log(`🎉 完成！`);
}

main().catch(console.error);