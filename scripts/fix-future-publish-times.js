#!/usr/bin/env node

/**
 * 修复未来文章的发布时间，确保每篇文章间隔3天
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function fixFuturePublishTimes() {
  console.log('\n🔧 修复未来文章发布时间\n');
  console.log('=' .repeat(60));
  
  if (!fs.existsSync(articlesDir)) {
    console.log('❌ 文章目录不存在');
    return;
  }
  
  const now = new Date();
  const futureArticles = [];
  
  // 读取所有文章
  const articleFolders = fs.readdirSync(articlesDir);
  
  for (const folder of articleFolders) {
    const indexPath = path.join(articlesDir, folder, 'index.mdx');
    
    if (fs.existsSync(indexPath)) {
      try {
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // 提取发布时间
        const publishTimeMatch = content.match(/publishedTime:\s*(.+)/);
        
        if (publishTimeMatch) {
          const publishTime = new Date(publishTimeMatch[1].trim());
          
          // 只处理未来的文章
          if (publishTime > now) {
            futureArticles.push({
              slug: folder,
              indexPath,
              content,
              originalTime: publishTime
            });
          }
        }
      } catch (error) {
        console.log(`⚠️  读取失败: ${folder}`);
      }
    }
  }
  
  // 按原始发布时间排序
  futureArticles.sort((a, b) => a.originalTime - b.originalTime);
  
  console.log(`找到 ${futureArticles.length} 篇未来发布的文章\n`);
  
  if (futureArticles.length === 0) {
    console.log('没有需要修复的文章');
    return;
  }
  
  // 重新计算发布时间
  const baseDate = new Date(now);
  baseDate.setDate(baseDate.getDate() + 1); // 从明天开始
  baseDate.setHours(9, 0, 0, 0); // 设置为早上9点
  
  const intervalDays = 3; // 固定3天间隔
  
  console.log(`基准时间: ${baseDate.toLocaleString('zh-CN')}`);
  console.log(`发布间隔: ${intervalDays} 天\n`);
  console.log('-' .repeat(60));
  
  let fixedCount = 0;
  
  futureArticles.forEach((article, index) => {
    // 计算新的发布时间
    const newPublishTime = new Date(baseDate);
    newPublishTime.setDate(newPublishTime.getDate() + intervalDays * index);
    
    // 替换文件中的发布时间
    const newContent = article.content.replace(
      /publishedTime:\s*.+/,
      `publishedTime: ${newPublishTime.toISOString()}`
    );
    
    // 写回文件
    fs.writeFileSync(article.indexPath, newContent);
    
    console.log(`✅ ${article.slug}`);
    console.log(`   原时间: ${article.originalTime.toLocaleString('zh-CN')}`);
    console.log(`   新时间: ${newPublishTime.toLocaleString('zh-CN')}`);
    console.log(`   间隔: 第 ${index + 1} 篇，基准 + ${intervalDays * index} 天\n`);
    
    fixedCount++;
  });
  
  console.log('=' .repeat(60));
  console.log(`\n✅ 成功修复 ${fixedCount} 篇文章的发布时间`);
  console.log('   每篇文章现在固定间隔3天发布');
  console.log(`   第一篇将在 ${baseDate.toLocaleDateString('zh-CN')} 发布`);
  
  // 计算最后一篇的发布时间
  if (futureArticles.length > 0) {
    const lastPublishTime = new Date(baseDate);
    lastPublishTime.setDate(lastPublishTime.getDate() + intervalDays * (futureArticles.length - 1));
    console.log(`   最后一篇将在 ${lastPublishTime.toLocaleDateString('zh-CN')} 发布`);
    console.log(`   总跨度: ${intervalDays * (futureArticles.length - 1)} 天`);
  }
}

// 运行修复
fixFuturePublishTimes();