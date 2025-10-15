#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

function fixDoubleDashLinks(content) {
  console.log('开始修复双破折号链接...');
  
  // 修复各种双破折号链接
  
  // 1. mobile-friendly--design-enhance-user-experience-on-any-device
  content = content.replace(
    /https:\/\/entryearns\.com\/articles\/mobile-friendly--design-enhance-user-experience-on-any-device/g,
    'https://entryearns.com/articles/mobile-friendly-website-design-enhance-user-experience-on-any-device'
  );
  
  // 2. responsive--development-unlock-the-power-of-adaptability
  content = content.replace(
    /https:\/\/entryearns\.com\/articles\/responsive--development-unlock-the-power-of-adaptability/g,
    'https://entryearns.com/articles/responsive-website-development-unlock-the-power-of-adaptability'
  );
  
  // 3. mastering-pay-per-click-advertising-for--growth
  content = content.replace(
    /https:\/\/entryearns\.com\/articles\/mastering-pay-per-click-advertising-for--growth/g,
    'https://entryearns.com/articles/mastering-pay-per-click-advertising-for-business-growth'
  );
  
  // 4. boost-your--proven-cashback-strategies-explained
  content = content.replace(
    /https:\/\/entryearns\.com\/articles\/boost-your--proven-cashback-strategies-explained/g,
    'https://entryearns.com/articles/boost-your-savings-proven-cashback-strategies-explained'
  );
  
  // 5. discover-top-ai--tools-for-financial-success
  content = content.replace(
    /https:\/\/entryearns\.com\/articles\/discover-top-ai--tools-for-financial-success/g,
    'https://entryearns.com/articles/discover-top-ai-money-tools-for-financial-success'
  );
  
  // 6. online-marketing-solutions-grow-your--today
  content = content.replace(
    /https:\/\/entryearns\.com\/articles\/online-marketing-solutions-grow-your--today/g,
    'https://entryearns.com/articles/online-marketing-solutions-grow-your-business-today'
  );
  
  // 7. 修复 content marketing 链接末尾缺失
  content = content.replace(
    /https:\/\/entryearns\.com\/articles\/effective-content-marketing-solutions-for-your-\)/g,
    'https://entryearns.com/articles/effective-content-marketing-solutions-for-your-business)'
  );
  
  console.log('双破折号链接修复完成');
  return content;
}

async function main() {
  console.log('🔧 修复双破折号链接脚本');
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
  
  let fixedCount = 0;
  let totalFixedLinks = 0;
  
  for (const slug of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    let content = fs.readFileSync(articlePath, 'utf8');
    
    const originalContent = content;
    
    // 计算修复前的双破折号链接数量
    const doubleDashBefore = (content.match(/https:\/\/entryearns\.com\/articles\/[^)]*--[^)]*\)/g) || []).length;
    const truncatedBefore = (content.match(/https:\/\/entryearns\.com\/articles\/effective-content-marketing-solutions-for-your-\)/g) || []).length;
    
    content = fixDoubleDashLinks(content);
    
    // 计算修复后的双破折号链接数量
    const doubleDashAfter = (content.match(/https:\/\/entryearns\.com\/articles\/[^)]*--[^)]*\)/g) || []).length;
    const truncatedAfter = (content.match(/https:\/\/entryearns\.com\/articles\/effective-content-marketing-solutions-for-your-\)/g) || []).length;
    
    const fixedLinks = (doubleDashBefore - doubleDashAfter) + (truncatedBefore - truncatedAfter);
    
    if (content !== originalContent) {
      fs.writeFileSync(articlePath, content, 'utf8');
      console.log(`✅ ${slug}: 修复了 ${fixedLinks} 个损坏的链接`);
      fixedCount++;
      totalFixedLinks += fixedLinks;
    } else {
      console.log(`ℹ️  ${slug}: 链接结构正常`);
    }
  }
  
  console.log(`\n📊 修复统计:`);
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`✅ 修复文章数: ${fixedCount}`);
  console.log(`🔧 修复链接总数: ${totalFixedLinks}`);
  console.log(`🎉 双破折号链接修复完成！`);
}

main().catch(console.error);