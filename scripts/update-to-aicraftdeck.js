#!/usr/bin/env node

/**
 * 更新域名到 aicraftdeck.com 脚本
 * 
 * 功能：
 * 1. 更新所有配置文件中的域名引用
 * 2. 更新config.template.js
 * 3. 更新README和其他文档
 * 4. 生成新的sitemap配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEW_DOMAIN = 'https://aicraftdeck.com';
const OLD_DOMAINS = [
  'aicrafterhub.com',
  'https://aicrafterhub.com',
  'aicrafthub.com', 
  'https://aicrafthub.com',
  'your-domain.com',
  'https://your-domain.com',
  'yourdomain.com',
  'https://yourdomain.com'
];

// 需要更新的文件列表
const FILES_TO_UPDATE = [
  '../config.template.js',
  '../src/lib/config/index.ts',
  '../src/lib/config/internal-links.ts',
  '../astro.config.mjs',
  '../public/robots.txt',
  '../README.md',
  '../package.json',
  '../INTERNAL_LINKS_GUIDE.md'
];

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 更新单个文件中的域名
 */
function updateDomainInFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    log(`  ⚠️  文件不存在: ${filePath}`, 'yellow');
    return { success: false, error: 'File not found' };
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changeCount = 0;
    
    // 替换所有旧域名
    OLD_DOMAINS.forEach(oldDomain => {
      const beforeLength = content.length;
      content = content.replace(new RegExp(oldDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'aicraftdeck.com');
      if (content.length !== beforeLength) {
        changeCount++;
      }
    });
    
    // 特殊处理一些情况
    // 更新网站名称
    content = content.replace(/aicrafterhub/gi, 'aicraftdeck');
    content = content.replace(/aicrafthub/gi, 'aicraftdeck');
    
    // 更新完整URL
    content = content.replace(/https?:\/\/[^\/\s]+/g, (match) => {
      if (OLD_DOMAINS.some(domain => match.includes(domain.replace('https://', '').replace('http://', '')))) {
        return NEW_DOMAIN;
      }
      return match;
    });

    if (changeCount > 0) {
      // 创建备份
      const backupPath = fullPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, fs.readFileSync(fullPath, 'utf8'));
      
      // 写入更新后的内容
      fs.writeFileSync(fullPath, content);
      
      log(`  ✅ 更新成功 - 替换了 ${changeCount} 处`, 'green');
      return { success: true, changes: changeCount };
    } else {
      log(`  ➡️  无需更新`, 'cyan');
      return { success: true, changes: 0 };
    }
    
  } catch (error) {
    log(`  ❌ 更新失败: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * 生成新的robots.txt
 */
function generateRobotsTxt() {
  const robotsPath = path.join(__dirname, '../public/robots.txt');
  
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${NEW_DOMAIN}/sitemap.xml`;

  try {
    if (fs.existsSync(robotsPath)) {
      const backupPath = robotsPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, fs.readFileSync(robotsPath, 'utf8'));
    }
    
    fs.writeFileSync(robotsPath, robotsContent);
    log(`  ✅ 生成新的 robots.txt`, 'green');
    return { success: true };
  } catch (error) {
    log(`  ❌ robots.txt 生成失败: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * 生成sitemap配置
 */
function generateSitemapConfig() {
  const sitemapPath = path.join(__dirname, '../src/lib/config/sitemap.ts');
  
  const sitemapContent = `// 网站地图配置
export const SITEMAP_CONFIG = {
  site: '${NEW_DOMAIN}',
  changefreq: 'weekly',
  priority: 0.7,
  lastmod: new Date().toISOString(),
  
  // 页面优先级
  pagePriorities: {
    '/': 1.0,
    '/articles': 0.9,
    '/articles/*': 0.8,
    '/about': 0.6,
    '/contact': 0.5
  }
};

export default SITEMAP_CONFIG;`;

  try {
    // 确保目录存在
    const configDir = path.dirname(sitemapPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    if (fs.existsSync(sitemapPath)) {
      const backupPath = sitemapPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, fs.readFileSync(sitemapPath, 'utf8'));
    }
    
    fs.writeFileSync(sitemapPath, sitemapContent);
    log(`  ✅ 生成新的 sitemap 配置`, 'green');
    return { success: true };
  } catch (error) {
    log(`  ❌ sitemap 配置生成失败: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n🌐 更新域名到 aicraftdeck.com', 'bright');
  log('=' .repeat(60), 'blue');
  log(`🎯 新域名: ${NEW_DOMAIN}`, 'cyan');
  log('=' .repeat(60), 'blue');

  try {
    const results = [];
    let totalChanges = 0;
    let filesUpdated = 0;

    // 更新所有配置文件
    log('\n📝 更新配置文件...', 'cyan');
    
    for (const filePath of FILES_TO_UPDATE) {
      log(`\n📄 处理文件: ${path.basename(filePath)}`, 'magenta');
      const result = updateDomainInFile(filePath);
      result.filePath = filePath;
      results.push(result);
      
      if (result.success && result.changes > 0) {
        totalChanges += result.changes;
        filesUpdated++;
      }
    }

    // 生成新的配置文件
    log('\n🔧 生成新配置文件...', 'cyan');
    
    log('\n📄 生成 robots.txt', 'magenta');
    const robotsResult = generateRobotsTxt();
    results.push({ ...robotsResult, filePath: 'robots.txt' });
    
    log('\n📄 生成 sitemap 配置', 'magenta');
    const sitemapResult = generateSitemapConfig();
    results.push({ ...sitemapResult, filePath: 'sitemap.ts' });

    // 显示结果统计
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    log('\n' + '='.repeat(60), 'green');
    log('📊 域名更新完成', 'bright');
    log(`   🌐 新域名: ${NEW_DOMAIN}`, 'cyan');
    log(`   📝 处理文件: ${results.length}`, 'blue');
    log(`   ✅ 更新成功: ${successCount}`, 'green');
    log(`   📂 修改文件: ${filesUpdated}`, 'yellow');
    log(`   🔄 总替换数: ${totalChanges}`, 'cyan');
    log(`   ❌ 处理失败: ${errorCount}`, errorCount > 0 ? 'red' : 'green');

    if (errorCount > 0) {
      log('\n⚠️  处理失败的文件:', 'yellow');
      results.filter(r => !r.success).forEach(result => {
        log(`   • ${result.filePath}: ${result.error}`, 'red');
      });
    }

    if (successCount > 0) {
      log('\n🎉 域名更新完成！', 'green');
      log('\n💡 后续步骤:', 'cyan');
      log('   • 检查更新后的配置文件', 'blue');
      log('   • 运行 npm run dev 测试本地效果', 'blue');
      log('   • 部署到新域名服务器', 'blue');
      log('   • 更新DNS解析到新域名', 'blue');
    }

  } catch (error) {
    log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行脚本
main().catch(error => {
  log(`\n❌ 致命错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

export { main };