#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

function similarity(str1, str2) {
  // Simple similarity check based on common words
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word) && word.length > 2);
  return commonWords.length / Math.max(words1.length, words2.length);
}

function fixDuplicateContent(content, filename) {
  console.log(`\n检查文件: ${filename}`);
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
  let workingContent = content;
  
  // 2. 查找并删除类似的主标题
  const contentAfterFrontmatter = content.substring(frontmatterMatch[0].length);
  const h1Matches = contentAfterFrontmatter.match(/^# .+$/gm);
  
  if (h1Matches) {
    for (const h1Match of h1Matches) {
      const h1Title = h1Match.substring(2).trim(); // 去掉 "# "
      const similarityScore = similarity(frontmatterTitle, h1Title);
      
      if (similarityScore > 0.5) { // 如果相似度超过50%
        console.log(`发现相似标题 (相似度: ${Math.round(similarityScore * 100)}%): "${h1Title}"`);
        workingContent = workingContent.replace(h1Match + '\n', '');
        changes.push(`删除重复标题: "${h1Title}"`);
      }
    }
  }
  
  // 3. 检查并删除连续重复的图片
  const imageRegex = /!\[[^\]]*\]\([^)]+\)/g;
  const images = [];
  let match;
  
  // 重新搜索图片（因为内容可能已被修改）
  const imageRegexForSearch = new RegExp(imageRegex.source, 'g');
  while ((match = imageRegexForSearch.exec(workingContent)) !== null) {
    const imageSrc = match[0].match(/\(([^)]+)\)/)[1];
    images.push({
      full: match[0],
      src: imageSrc,
      index: match.index
    });
  }
  
  // 找到连续的重复图片
  let imagesToRemove = [];
  for (let i = 1; i < images.length; i++) {
    const prevImg = images[i-1];
    const currImg = images[i];
    
    // 检查图片源是否相同（提取文件名比较）
    const prevImgName = prevImg.src.split('/').pop();
    const currImgName = currImg.src.split('/').pop();
    
    if (prevImgName === currImgName) {
      // 检查两张图片之间的文本内容
      const textBetween = workingContent.substring(
        prevImg.index + prevImg.full.length, 
        currImg.index
      );
      
      // 计算非空白字符数
      const nonWhitespaceChars = textBetween.replace(/\s/g, '').length;
      
      // 如果两张图片之间的非空白字符少于50个，认为是连续重复
      if (nonWhitespaceChars < 50) {
        console.log(`发现连续重复图片: ${currImgName}`);
        console.log(`两图间距: ${nonWhitespaceChars}个非空白字符`);
        imagesToRemove.push(currImg);
        changes.push(`删除重复图片: ${currImgName}`);
      }
    }
  }
  
  // 删除重复图片（从后往前删，避免索引变化）
  imagesToRemove.reverse();
  for (const imgToRemove of imagesToRemove) {
    // 查找并删除图片及其可能的空行
    const imgPattern = imgToRemove.full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    workingContent = workingContent.replace(new RegExp(imgPattern + '\\s*'), '');
  }
  
  // 4. 清理多余的空行
  workingContent = workingContent.replace(/\n{3,}/g, '\n\n');
  
  return { content: workingContent, changes };
}

async function main() {
  console.log('🔧 全面修复重复标题和图片脚本');
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
  
  let fixedArticles = 0;
  let totalTitlesFix = 0;
  let totalImagesFix = 0;
  
  for (const slug of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    let content = fs.readFileSync(articlePath, 'utf8');
    
    const originalContent = content;
    const result = fixDuplicateContent(content, slug);
    
    if (result.content !== originalContent) {
      fs.writeFileSync(articlePath, result.content, 'utf8');
      
      const titleChanges = result.changes.filter(c => c.includes('标题')).length;
      const imageChanges = result.changes.filter(c => c.includes('图片')).length;
      
      console.log(`✅ ${slug}: ${result.changes.join(', ')}`);
      fixedArticles++;
      totalTitlesFix += titleChanges;
      totalImagesFix += imageChanges;
    } else {
      console.log(`ℹ️  ${slug}: 无重复问题`);
    }
  }
  
  console.log(`\n📊 修复统计:`);
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`✅ 修复的文章数: ${fixedArticles}`);
  console.log(`🏷️  删除重复标题数: ${totalTitlesFix}`);
  console.log(`🖼️  删除重复图片数: ${totalImagesFix}`);
  console.log(`🎉 重复内容修复完成！`);
}

main().catch(console.error);