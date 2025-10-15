#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

function checkLinksCoverage(slug) {
  const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    return { slug, exists: false };
  }
  
  let content = fs.readFileSync(articlePath, 'utf8');
  
  // 检查内链
  const internalLinks = content.match(/\[([^\]]+)\]\(https:\/\/entryearns\.com\/articles\/[^)]+\)/g) || [];
  
  // 检查外链
  const hasExternalLinks = content.includes('## Useful Resources');
  const externalLinks = content.match(/\d+\. \[([^\]]+)\]\(https?:\/\/[^)]+\) - /g) || [];
  
  return {
    slug,
    exists: true,
    internalLinks: internalLinks.length,
    hasExternalLinks,
    externalLinks: externalLinks.length,
    totalLinks: internalLinks.length + (hasExternalLinks ? externalLinks.length : 0)
  };
}

async function main() {
  console.log('📊 检查链接覆盖情况');
  console.log(`📂 文章目录: ${CONFIG.articlesDir}`);
  
  if (!fs.existsSync(CONFIG.articlesDir)) {
    console.error(`❌ 文章目录不存在: ${CONFIG.articlesDir}`);
    return;
  }
  
  // 获取所有文章
  const articleDirs = fs.readdirSync(CONFIG.articlesDir).filter(item => {
    const fullPath = path.join(CONFIG.articlesDir, item);
    return fs.statSync(fullPath).isDirectory() && 
           fs.existsSync(path.join(fullPath, 'index.mdx'));
  });
  
  console.log(`📄 找到 ${articleDirs.length} 篇文章\n`);
  
  let articlesWithNoLinks = [];
  let articlesWithFewLinks = [];
  let totalInternalLinks = 0;
  let totalExternalLinks = 0;
  
  for (const slug of articleDirs) {
    const result = checkLinksCoverage(slug);
    
    if (!result.exists) continue;
    
    totalInternalLinks += result.internalLinks;
    totalExternalLinks += result.externalLinks;
    
    if (result.totalLinks === 0) {
      articlesWithNoLinks.push(slug);
      console.log(`❌ ${slug}: 无链接`);
    } else if (result.totalLinks < 2) {
      articlesWithFewLinks.push(slug);
      console.log(`⚠️  ${slug}: ${result.internalLinks} 内链, ${result.externalLinks} 外链 (共 ${result.totalLinks})`)
    } else {
      console.log(`✅ ${slug}: ${result.internalLinks} 内链, ${result.externalLinks} 外链 (共 ${result.totalLinks})`);
    }
  }
  
  console.log('\n📊 统计结果:');
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`🔗 总内链数: ${totalInternalLinks}`);
  console.log(`🌐 总外链数: ${totalExternalLinks}`);
  console.log(`❌ 无链接文章: ${articlesWithNoLinks.length}`);
  console.log(`⚠️  链接较少文章: ${articlesWithFewLinks.length}`);
  
  if (articlesWithNoLinks.length > 0) {
    console.log('\n📝 需要添加链接的文章:');
    articlesWithNoLinks.forEach(slug => console.log(`  - ${slug}`));
  }
  
  if (articlesWithFewLinks.length > 0) {
    console.log('\n📝 可以增加更多链接的文章:');
    articlesWithFewLinks.forEach(slug => console.log(`  - ${slug}`));
  }
}

main().catch(console.error);