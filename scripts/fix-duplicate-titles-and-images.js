#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

function fixDuplicateTitlesAndImages(content) {
  console.log('开始检查和修复重复标题及图片...');
  
  let changes = [];
  
  // 1. 找到frontmatter中的标题
  const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.log('未找到frontmatter');
    return { content, changes };
  }
  
  const frontmatter = frontmatterMatch[1];
  const titleMatch = frontmatter.match(/title:\s*["']([^"']+)["']/);
  if (!titleMatch) {
    console.log('未找到frontmatter中的标题');
    return { content, changes };
  }
  
  const frontmatterTitle = titleMatch[1];
  const contentAfterFrontmatter = content.substring(frontmatterMatch[0].length);
  
  // 2. 检查并删除重复的主标题 (# 标题)
  const duplicateTitleRegex = new RegExp(`^# ${frontmatterTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
  const duplicateTitleMatch = contentAfterFrontmatter.match(duplicateTitleRegex);
  
  if (duplicateTitleMatch) {
    console.log(`发现重复标题: "${frontmatterTitle}"`);
    const beforeTitle = contentAfterFrontmatter.substring(0, duplicateTitleMatch.index);
    const afterTitle = contentAfterFrontmatter.substring(duplicateTitleMatch.index + duplicateTitleMatch[0].length);
    
    // 删除标题及其后的空行
    const cleanAfterTitle = afterTitle.replace(/^\n+/, '\n');
    content = frontmatterMatch[0] + beforeTitle + cleanAfterTitle;
    changes.push('删除重复的主标题');
  }
  
  // 3. 检查并删除连续重复的图片
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    images.push({
      full: match[0],
      alt: match[1],
      src: match[2],
      index: match.index
    });
  }
  
  // 找到连续的重复图片
  let duplicateImages = [];
  for (let i = 1; i < images.length; i++) {
    const prevImg = images[i-1];
    const currImg = images[i];
    
    // 检查图片源是否相同
    if (prevImg.src === currImg.src) {
      // 检查两张图片之间是否只有很少的文本内容（可能只是空行或简短文本）
      const textBetween = content.substring(prevImg.index + prevImg.full.length, currImg.index);
      const nonWhitespaceText = textBetween.replace(/\s/g, '').length;
      
      // 如果两张图片之间的非空白字符少于100个，认为是连续重复
      if (nonWhitespaceText < 100) {
        duplicateImages.push(currImg);
        console.log(`发现连续重复图片: ${currImg.src.split('/').pop()}`);
      }
    }
  }
  
  // 删除重复图片（从后往前删，避免索引变化）
  duplicateImages.reverse();
  for (const dupImg of duplicateImages) {
    content = content.replace(dupImg.full, '');
    changes.push(`删除重复图片: ${dupImg.src.split('/').pop()}`);
  }
  
  // 清理多余的空行
  content = content.replace(/\n{3,}/g, '\n\n');
  
  return { content, changes };
}

async function main() {
  console.log('🔧 修复重复标题和图片脚本');
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
  
  let fixedTitles = 0;
  let fixedImages = 0;
  let totalChanges = 0;
  
  for (const slug of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    let content = fs.readFileSync(articlePath, 'utf8');
    
    const originalContent = content;
    const result = fixDuplicateTitlesAndImages(content);
    
    if (result.content !== originalContent) {
      fs.writeFileSync(articlePath, result.content, 'utf8');
      
      const titleChanges = result.changes.filter(c => c.includes('标题')).length;
      const imageChanges = result.changes.filter(c => c.includes('图片')).length;
      
      console.log(`✅ ${slug}: ${result.changes.join(', ')}`);
      
      if (titleChanges > 0) fixedTitles++;
      if (imageChanges > 0) fixedImages++;
      totalChanges += result.changes.length;
    } else {
      console.log(`ℹ️  ${slug}: 无重复问题`);
    }
  }
  
  console.log(`\n📊 修复统计:`);
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`✅ 修复重复标题的文章: ${fixedTitles}`);
  console.log(`✅ 修复重复图片的文章: ${fixedImages}`);
  console.log(`🔧 总修复次数: ${totalChanges}`);
  console.log(`🎉 重复内容修复完成！`);
}

main().catch(console.error);