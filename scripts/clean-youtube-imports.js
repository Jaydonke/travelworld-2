#!/usr/bin/env node

/**
 * 清理未使用的YouTube导入
 * 如果文章没有实际使用YouTubeEmbed组件，则移除导入语句
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogDir = path.join(__dirname, '../src/content/blog');

console.log('🔍 检查并清理未使用的YouTube导入...\n');

let totalArticles = 0;
let articlesWithImport = 0;
let articlesWithUsage = 0;
let articlesCleaned = 0;

// 递归处理目录
function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 跳过en文件夹
      if (item === 'en') {
        console.log(`⏭️  跳过 en 文件夹`);
        return;
      }
      
      // 检查是否有index.mdx
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        processArticle(mdxPath, item);
      } else {
        // 递归处理子目录
        processDirectory(fullPath);
      }
    }
  });
}

function processArticle(mdxPath, articleName) {
  totalArticles++;
  
  let content = fs.readFileSync(mdxPath, 'utf8');
  
  // 检查是否有YouTube导入
  const hasImport = content.includes('import YouTubeEmbed from');
  
  if (!hasImport) {
    return;
  }
  
  articlesWithImport++;
  
  // 检查是否实际使用了YouTubeEmbed组件
  const hasUsage = content.includes('<YouTubeEmbed') && content.includes('videoId=');
  
  if (hasUsage) {
    articlesWithUsage++;
    console.log(`✅ ${articleName}: 有导入且正在使用`);
  } else {
    // 移除未使用的导入
    const cleanedContent = content.replace(/import YouTubeEmbed from "@\/components\/YouTubeEmbed\.astro";\n/g, '');
    
    if (cleanedContent !== content) {
      fs.writeFileSync(mdxPath, cleanedContent);
      articlesCleaned++;
      console.log(`🧹 ${articleName}: 移除未使用的YouTube导入`);
    }
  }
}

// 开始处理
processDirectory(blogDir);

// 显示统计
console.log('\n📊 清理统计:');
console.log('='.repeat(50));
console.log(`总文章数: ${totalArticles}`);
console.log(`有YouTube导入的文章: ${articlesWithImport}`);
console.log(`实际使用YouTube的文章: ${articlesWithUsage}`);
console.log(`清理的文章数: ${articlesCleaned}`);

if (articlesCleaned > 0) {
  console.log('\n✨ 清理完成！已移除未使用的YouTube导入。');
} else if (articlesWithUsage > 0) {
  console.log('\n✅ 所有YouTube导入都在使用中，无需清理。');
} else if (articlesWithImport === 0) {
  console.log('\n✅ 没有找到YouTube导入，无需清理。');
}

// 额外检查：查找可能的YouTube链接
console.log('\n🔍 检查可能需要YouTube组件的内容...');
let potentialYouTubeLinks = 0;

function checkForYouTubeLinks(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'en') {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        const content = fs.readFileSync(mdxPath, 'utf8');
        
        // 检查YouTube链接模式
        if (content.match(/youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\//i)) {
          potentialYouTubeLinks++;
          console.log(`🎥 ${item}: 包含YouTube链接但未转换为组件`);
        }
      } else {
        checkForYouTubeLinks(fullPath);
      }
    }
  });
}

checkForYouTubeLinks(blogDir);

if (potentialYouTubeLinks > 0) {
  console.log(`\n⚠️  发现 ${potentialYouTubeLinks} 篇文章包含YouTube链接但未使用组件`);
  console.log('💡 建议运行文章转换脚本来处理这些链接');
} else {
  console.log('\n✅ 没有发现需要转换的YouTube链接');
}