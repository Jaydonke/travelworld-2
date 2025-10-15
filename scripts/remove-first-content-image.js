#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

function removeFirstContentImage(content, filename) {
  console.log(`\n检查文件: ${filename}`);
  
  // 找到frontmatter的结束位置
  const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.log('未找到frontmatter');
    return { content, removed: false };
  }
  
  const frontmatterEnd = frontmatterMatch.index + frontmatterMatch[0].length;
  const contentAfterFrontmatter = content.substring(frontmatterEnd);
  
  // 在frontmatter后查找第一张图片
  const firstImageMatch = contentAfterFrontmatter.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  
  if (!firstImageMatch) {
    console.log('正文中未找到图片');
    return { content, removed: false };
  }
  
  const firstImageFull = firstImageMatch[0];
  const firstImageAlt = firstImageMatch[1];
  const firstImageSrc = firstImageMatch[2];
  const firstImageFilename = firstImageSrc.split('/').pop();
  
  console.log(`找到正文第一张图片: ${firstImageFilename}`);
  console.log(`图片alt文本: "${firstImageAlt}"`);
  
  // 删除第一张图片及其可能的空行
  let modifiedContent = content;
  
  // 查找图片在原始内容中的位置
  const imageIndex = content.indexOf(firstImageFull);
  if (imageIndex !== -1) {
    // 检查图片前后是否有空行，一起删除
    let startIndex = imageIndex;
    let endIndex = imageIndex + firstImageFull.length;
    
    // 如果图片前面是空行，从空行开始删除
    while (startIndex > 0 && content[startIndex - 1] === '\n') {
      startIndex--;
    }
    
    // 如果图片后面是空行，删除一些空行但保留适当的间距
    let newlinesAfter = 0;
    while (endIndex < content.length && content[endIndex] === '\n') {
      newlinesAfter++;
      endIndex++;
    }
    
    // 保留最多一个换行符
    if (newlinesAfter > 1) {
      endIndex = imageIndex + firstImageFull.length + 1;
    }
    
    modifiedContent = content.substring(0, startIndex) + 
                     (startIndex > 0 ? '\n' : '') + 
                     content.substring(endIndex);
    
    console.log(`✅ 已删除正文第一张图片: ${firstImageFilename}`);
    return { content: modifiedContent, removed: true, imageName: firstImageFilename };
  }
  
  return { content, removed: false };
}

async function main() {
  console.log('🔧 删除正文第一张图片脚本');
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
  
  let processedCount = 0;
  let removedCount = 0;
  const removedImages = [];
  
  for (const slug of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    let content = fs.readFileSync(articlePath, 'utf8');
    
    const result = removeFirstContentImage(content, slug);
    
    if (result.removed) {
      fs.writeFileSync(articlePath, result.content, 'utf8');
      console.log(`✅ ${slug}: 删除了第一张图片 - ${result.imageName}`);
      removedCount++;
      removedImages.push(`${slug}: ${result.imageName}`);
    } else {
      console.log(`ℹ️  ${slug}: 无需处理`);
    }
    
    processedCount++;
  }
  
  console.log(`\n📊 处理统计:`);
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`✅ 删除图片的文章数: ${removedCount}`);
  console.log(`🖼️  删除的图片列表:`);
  removedImages.forEach(img => console.log(`   - ${img}`));
  console.log(`🎉 正文第一张图片删除完成！`);
}

main().catch(console.error);