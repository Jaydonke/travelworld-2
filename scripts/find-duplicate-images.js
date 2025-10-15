#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

function findDuplicateImages(content, filename) {
  console.log(`\n检查文件: ${filename}`);
  
  // 找到所有图片
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    const imageSrc = match[2];
    const imageFilename = imageSrc.split('/').pop();
    
    images.push({
      full: match[0],
      alt: match[1],
      src: imageSrc,
      filename: imageFilename,
      index: match.index,
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  console.log(`找到 ${images.length} 张图片`);
  
  // 检查重复图片
  let duplicatesFound = [];
  
  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      const img1 = images[i];
      const img2 = images[j];
      
      if (img1.filename === img2.filename) {
        const lineDistance = img2.line - img1.line;
        const textBetween = content.substring(img1.index + img1.full.length, img2.index);
        const nonWhitespaceChars = textBetween.replace(/\s/g, '').length;
        
        console.log(`重复图片: ${img1.filename}`);
        console.log(`  位置1: 第${img1.line}行`);
        console.log(`  位置2: 第${img2.line}行 (相距${lineDistance}行)`);
        console.log(`  之间字符数: ${nonWhitespaceChars}个非空白字符`);
        console.log(`  之间内容预览: "${textBetween.substring(0, 100).replace(/\n/g, '\\n')}..."`);
        
        duplicatesFound.push({
          filename: img1.filename,
          img1, img2, lineDistance, nonWhitespaceChars, textBetween
        });
      }
    }
  }
  
  return duplicatesFound;
}

async function main() {
  console.log('🔍 查找重复图片脚本');
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
  
  let totalDuplicates = 0;
  
  for (const slug of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    let content = fs.readFileSync(articlePath, 'utf8');
    
    const duplicates = findDuplicateImages(content, slug);
    totalDuplicates += duplicates.length;
    
    if (duplicates.length === 0) {
      console.log(`ℹ️  ${slug}: 无重复图片`);
    }
  }
  
  console.log(`\n📊 统计:`);
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`🖼️  总重复图片组数: ${totalDuplicates}`);
}

main().catch(console.error);