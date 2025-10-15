#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function showAllPublishTimes() {
  console.log('\n📅 所有文章发布时间\n');
  console.log('=' .repeat(80));
  
  const articles = [];
  const now = new Date();
  
  // 读取所有文章
  const articleFolders = fs.readdirSync(articlesDir).sort();
  
  for (const folder of articleFolders) {
    const indexPath = path.join(articlesDir, folder, 'index.mdx');
    
    if (fs.existsSync(indexPath)) {
      try {
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // 提取发布时间
        const publishTimeMatch = content.match(/publishedTime:\s*(.+)/);
        
        if (publishTimeMatch) {
          const publishTime = new Date(publishTimeMatch[1].trim());
          
          articles.push({
            slug: folder.substring(0, 50) + (folder.length > 50 ? '...' : ''),
            publishTime,
            isFuture: publishTime > now
          });
        }
      } catch (error) {
        // 忽略
      }
    }
  }
  
  // 按发布时间排序
  articles.sort((a, b) => a.publishTime - b.publishTime);
  
  // 显示所有文章
  let prevTime = null;
  articles.forEach((article, index) => {
    const dateStr = article.publishTime.toLocaleDateString('zh-CN');
    const timeStr = article.publishTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    // 计算与上一篇文章的间隔
    let interval = '';
    if (prevTime) {
      const days = Math.round((article.publishTime - prevTime) / (1000 * 60 * 60 * 24));
      interval = ` (间隔 ${days} 天)`;
    }
    prevTime = article.publishTime;
    
    const status = article.isFuture ? '🔮 未来' : '✅ 已发布';
    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${status} ${dateStr} ${timeStr}${interval}`);
    console.log(`    ${article.slug}`);
  });
  
  // 统计
  const futureCount = articles.filter(a => a.isFuture).length;
  const pastCount = articles.filter(a => !a.isFuture).length;
  
  console.log('\n' + '=' .repeat(80));
  console.log(`📊 统计: 总计 ${articles.length} 篇，已发布 ${pastCount} 篇，待发布 ${futureCount} 篇`);
  console.log(`📅 当前时间: ${now.toLocaleString('zh-CN')}`);
}

showAllPublishTimes();