#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function analyzeArticlesTimeline() {
  const articles = [];
  const now = new Date();
  
  // 读取所有文章
  const articleFolders = fs.readdirSync(articlesDir).sort();
  
  for (const folder of articleFolders) {
    const indexPath = path.join(articlesDir, folder, 'index.mdx');
    
    if (fs.existsSync(indexPath)) {
      try {
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // 提取标题和发布时间
        const titleMatch = content.match(/title:\s*"([^"]+)"/);
        const publishTimeMatch = content.match(/publishedTime:\s*(.+)/);
        const categoryMatch = content.match(/category:\s*(.+)/);
        
        if (titleMatch && publishTimeMatch) {
          const publishTime = new Date(publishTimeMatch[1].trim());
          
          articles.push({
            slug: folder,
            title: titleMatch[1],
            category: categoryMatch ? categoryMatch[1].trim() : 'unknown',
            publishTime,
            isFuture: publishTime > now,
            content: content
          });
        }
      } catch (error) {
        // 忽略
      }
    }
  }
  
  // 按发布时间排序
  articles.sort((a, b) => a.publishTime - b.publishTime);
  
  // 分组
  const pastArticles = articles.filter(a => !a.isFuture);
  const futureArticles = articles.filter(a => a.isFuture);
  
  console.log('\n📊 文章时间线分析\n');
  console.log('=' .repeat(80));
  
  console.log('\n✅ 已发布文章（可作为内链目标）: ' + pastArticles.length + ' 篇');
  console.log('-' .repeat(80));
  pastArticles.slice(-10).forEach(article => {
    console.log(`  ${article.publishTime.toLocaleDateString('zh-CN')} - ${article.slug}`);
    console.log(`    标题: ${article.title}`);
    console.log(`    分类: ${article.category}`);
  });
  
  console.log('\n🔮 未来发布文章（需要添加内链）: ' + futureArticles.length + ' 篇');
  console.log('-' .repeat(80));
  futureArticles.forEach(article => {
    console.log(`  ${article.publishTime.toLocaleDateString('zh-CN')} - ${article.slug}`);
    console.log(`    标题: ${article.title}`);
    console.log(`    分类: ${article.category}`);
  });
  
  // 导出数据
  const data = {
    pastArticles: pastArticles.map(a => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      publishTime: a.publishTime.toISOString()
    })),
    futureArticles: futureArticles.map(a => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      publishTime: a.publishTime.toISOString()
    }))
  };
  
  // 保存到文件供其他脚本使用
  fs.writeFileSync(
    path.join(__dirname, 'articles-timeline.json'),
    JSON.stringify(data, null, 2)
  );
  
  console.log('\n✅ 时间线数据已保存到 articles-timeline.json');
  
  return data;
}

analyzeArticlesTimeline();