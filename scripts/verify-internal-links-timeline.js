#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function verifyInternalLinks() {
  console.log('\n🔍 验证内链时间线规则\n');
  console.log('=' .repeat(80));
  
  const articles = new Map();
  
  // 第一步：收集所有文章的发布时间
  const articleFolders = fs.readdirSync(articlesDir).sort();
  
  for (const folder of articleFolders) {
    const indexPath = path.join(articlesDir, folder, 'index.mdx');
    
    if (fs.existsSync(indexPath)) {
      try {
        const content = fs.readFileSync(indexPath, 'utf8');
        const publishTimeMatch = content.match(/publishedTime:\s*(.+)/);
        
        if (publishTimeMatch) {
          const publishTime = new Date(publishTimeMatch[1].trim());
          articles.set(folder, {
            slug: folder,
            publishTime,
            content
          });
        }
      } catch (error) {
        // 忽略
      }
    }
  }
  
  console.log(`检查 ${articles.size} 篇文章的内链...\n`);
  
  let violations = [];
  let totalLinks = 0;
  let futureToFuture = 0;
  let futureToPast = 0;
  let pastToFuture = 0;
  let pastToPast = 0;
  
  // 第二步：检查每篇文章的内链
  articles.forEach((article, slug) => {
    const linkPattern = /\[([^\]]+)\]\(\/articles\/([^\/\)]+)\/?\)/g;
    let match;
    
    while ((match = linkPattern.exec(article.content)) !== null) {
      totalLinks++;
      const linkText = match[1];
      const targetSlug = match[2];
      
      if (articles.has(targetSlug)) {
        const sourceTime = article.publishTime;
        const targetTime = articles.get(targetSlug).publishTime;
        const now = new Date();
        
        const sourceIsFuture = sourceTime > now;
        const targetIsFuture = targetTime > now;
        
        // 分类链接类型
        if (sourceIsFuture && targetIsFuture) {
          futureToFuture++;
        } else if (sourceIsFuture && !targetIsFuture) {
          futureToPast++;
        } else if (!sourceIsFuture && targetIsFuture) {
          pastToFuture++;
          // 这是违规的！已发布文章不应该链接到未来文章
          violations.push({
            source: slug,
            sourceTime,
            target: targetSlug,
            targetTime,
            linkText
          });
        } else {
          pastToPast++;
        }
      }
    }
  });
  
  // 输出统计
  console.log('📊 内链统计:');
  console.log('-' .repeat(80));
  console.log(`  总内链数: ${totalLinks}`);
  console.log(`  已发布 → 已发布: ${pastToPast} ✅`);
  console.log(`  未来 → 已发布: ${futureToPast} ✅`);
  console.log(`  未来 → 未来: ${futureToFuture} ⚠️ (需要注意)`);
  console.log(`  已发布 → 未来: ${pastToFuture} ❌ (违规)`);
  
  // 检查违规
  if (violations.length > 0) {
    console.log('\n❌ 发现时间线违规:');
    console.log('-' .repeat(80));
    violations.forEach(v => {
      console.log(`\n  源文章: ${v.source}`);
      console.log(`    发布时间: ${v.sourceTime.toLocaleDateString('zh-CN')}`);
      console.log(`    链接文本: "${v.linkText}"`);
      console.log(`    目标文章: ${v.target}`);
      console.log(`    目标发布时间: ${v.targetTime.toLocaleDateString('zh-CN')}`);
      console.log(`    问题: 已发布文章不应链接到未来文章！`);
    });
  } else {
    console.log('\n✅ 所有内链都符合时间线规则！');
    console.log('   • 已发布文章只链接到已发布文章');
    console.log('   • 未来文章只链接到已发布文章');
    console.log('   • 没有违反时间顺序的链接');
  }
  
  // 额外检查：未来文章之间的链接
  if (futureToFuture > 0) {
    console.log('\n⚠️  注意: 有 ' + futureToFuture + ' 个未来文章之间的链接');
    console.log('   虽然不违规，但建议未来文章主要链接到已发布内容');
  }
  
  console.log('\n' + '=' .repeat(80));
  
  // SEO建议
  console.log('\n💡 SEO内链最佳实践:');
  console.log('   • 使用描述性锚文本（2-6个词）');
  console.log('   • 每篇文章保持2-3个内链');
  console.log('   • 创建主题集群增强相关性');
  console.log('   • 链接到高价值的基石内容');
  console.log('   • 避免过度优化和关键词堆砌');
}

// 运行验证
verifyInternalLinks();