#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles')
};

function fixNestedLinks(content) {
  console.log('开始修复嵌套链接...');
  
  // 修复各种嵌套链接模式
  
  // 1. 修复 [content marketing](url-[business](url)) 模式
  content = content.replace(
    /\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]*)-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)([^)]*)\)/g,
    '[$1](https://entryearns.com/articles/$2-$5)'
  );
  
  // 2. 修复 [AI tools](url-[money](url)-tools-for-[financial](url)-success) 模式
  content = content.replace(
    /\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]*)-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)-([^)]*)-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)-([^)]*)\)/g,
    '[$1](https://entryearns.com/articles/$2-$5-$8)'
  );
  
  // 3. 修复 [cashback](url-[savings](url)-url) 模式
  content = content.replace(
    /\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]*)-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)([^)]*)\)/g,
    '[$1](https://entryearns.com/articles/$4)'
  );
  
  // 4. 修复多层嵌套 [text](url-[text](url)-text-[text](url)-text) 模式
  content = content.replace(
    /\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]*)-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)([^)]*)-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)([^)]*)\)/g,
    '[$1](https://entryearns.com/articles/$4)'
  );
  
  // 5. 修复 [mobile-friendly](url-[website](url)-url) 模式
  content = content.replace(
    /\[mobile-friendly\]\(https:\/\/entryearns\.com\/articles\/mobile-friendly-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)([^)]*)\)/g,
    '[mobile-friendly](https://entryearns.com/articles/mobile-friendly-website-design-enhance-user-experience-on-any-device)'
  );
  
  // 6. 修复 [responsive design](url-[website](url)-url) 模式
  content = content.replace(
    /\[responsive design\]\(https:\/\/entryearns\.com\/articles\/responsive-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)([^)]*)\)/g,
    '[responsive design](https://entryearns.com/articles/responsive-website-development-unlock-the-power-of-adaptability)'
  );
  
  // 7. 修复 [pay-per-click](url-[business](url)-url) 模式
  content = content.replace(
    /\[pay-per-click\]\(https:\/\/entryearns\.com\/articles\/mastering-pay-per-click-advertising-for-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)([^)]*)\)/g,
    '[pay-per-click](https://entryearns.com/articles/mastering-pay-per-click-advertising-for-business-growth)'
  );
  
  // 8. 修复 [home office](url-[workspace](url)) 模式
  content = content.replace(
    /\[home office\]\(https:\/\/entryearns\.com\/articles\/7-biophilic-design-tweaks-to-instantly-upgrade-home-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)([^)]*)\)/g,
    '[home office](https://entryearns.com/articles/7-biophilic-design-tweaks-to-instantly-upgrade-home-workspace)'
  );
  
  // 9. 修复 [investment](url-[investing](url)-url-[investing](url)) 模式 - 多重嵌套
  content = content.replace(
    /\[investment\]\(https:\/\/entryearns\.com\/articles\/beginner-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)([^)]*)-\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/([^)]+)\)\)/g,
    '[investment](https://entryearns.com/articles/beginner-investing-a-step-by-step-guide-to-investing)'
  );
  
  // 10. 通用清理：移除任何剩余的嵌套链接模式
  content = content.replace(
    /\[([^\]]+)\]\(https:\/\/entryearns\.com\/articles\/[^)]*\[[^\]]+\]\([^)]+\)[^)]*\)/g,
    '$1'
  );
  
  console.log('嵌套链接修复完成');
  return content;
}

async function main() {
  console.log('🔧 全面修复嵌套链接脚本');
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
  let totalNestedLinks = 0;
  
  for (const slug of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    let content = fs.readFileSync(articlePath, 'utf8');
    
    const originalContent = content;
    
    // 计算修复前的嵌套链接数量
    const nestedLinksBefore = (content.match(/\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/[^)]*\[[^\]]*\]\([^)]+\)[^)]*\)/g) || []).length;
    
    content = fixNestedLinks(content);
    
    // 计算修复后的嵌套链接数量
    const nestedLinksAfter = (content.match(/\[([^\]]*)\]\(https:\/\/entryearns\.com\/articles\/[^)]*\[[^\]]*\]\([^)]+\)[^)]*\)/g) || []).length;
    
    const fixedNestedLinks = nestedLinksBefore - nestedLinksAfter;
    
    if (content !== originalContent) {
      fs.writeFileSync(articlePath, content, 'utf8');
      console.log(`✅ ${slug}: 修复了 ${fixedNestedLinks} 个嵌套链接`);
      fixedCount++;
      totalNestedLinks += fixedNestedLinks;
    } else if (nestedLinksBefore > 0) {
      console.log(`⚠️  ${slug}: 发现 ${nestedLinksBefore} 个嵌套链接但未能修复`);
    } else {
      console.log(`ℹ️  ${slug}: 链接结构正常`);
    }
  }
  
  console.log(`\n📊 修复统计:`);
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`✅ 修复文章数: ${fixedCount}`);
  console.log(`🔧 修复嵌套链接总数: ${totalNestedLinks}`);
  console.log(`🎉 嵌套链接修复完成！`);
}

main().catch(console.error);