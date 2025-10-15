#!/usr/bin/env node

/**
 * 域名链接更新脚本
 * 
 * 功能：
 * 1. 将所有相对路径内链转换为绝对路径
 * 2. 批量替换域名配置
 * 3. 更新sitemap和robots.txt
 * 4. 更新配置文件中的域名引用
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles'),
  configDir: path.join(__dirname, '../src/lib/config'),
  publicDir: path.join(__dirname, '../public'),
  
  // 需要更新域名的文件
  configFiles: [
    path.join(__dirname, '../src/lib/config/index.ts'),
    path.join(__dirname, '../src/lib/config/internal-links.ts'),
    path.join(__dirname, '../astro.config.mjs'),
    path.join(__dirname, '../public/robots.txt')
  ]
};

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
 * 创建readline接口
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * 验证域名格式
 */
function validateDomain(domain) {
  const domainRegex = /^(?:https?:\/\/)?((?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(?:\/.*)?$/;
  return domainRegex.test(domain);
}

/**
 * 标准化域名格式
 */
function normalizeDomain(domain) {
  // 移除结尾的斜杠
  domain = domain.replace(/\/$/, '');
  
  // 如果没有协议，添加https
  if (!domain.startsWith('http')) {
    domain = 'https://' + domain;
  }
  
  return domain;
}

/**
 * 获取用户输入的域名
 */
async function getDomainFromUser() {
  const rl = createReadlineInterface();
  
  log('\n🌐 请输入您的网站域名:', 'cyan');
  log('   例如: https://yourdomain.com 或 yourdomain.com', 'blue');
  
  return new Promise((resolve, reject) => {
    rl.question('🔗 域名: ', (answer) => {
      rl.close();
      
      const domain = answer.trim();
      
      if (!domain) {
        reject(new Error('域名不能为空'));
        return;
      }
      
      if (!validateDomain(domain)) {
        reject(new Error('域名格式不正确'));
        return;
      }
      
      resolve(normalizeDomain(domain));
    });
  });
}

/**
 * 更新文章中的内链
 */
async function updateArticleLinks(domain, convertToAbsolute = false) {
  const results = {
    processed: 0,
    updated: 0,
    errors: []
  };

  if (!fs.existsSync(CONFIG.articlesDir)) {
    return results;
  }

  const articleDirs = fs.readdirSync(CONFIG.articlesDir)
    .filter(item => {
      const fullPath = path.join(CONFIG.articlesDir, item);
      return fs.statSync(fullPath).isDirectory();
    });

  for (const articleDir of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, articleDir, 'index.mdx');
    
    if (fs.existsSync(articlePath)) {
      try {
        let content = fs.readFileSync(articlePath, 'utf8');
        const originalContent = content;

        if (convertToAbsolute) {
          // 将相对路径转换为绝对路径
          content = content.replace(
            /\[([^\]]+)\]\(\/([^)]+)\)/g,
            `[$1](${domain}/$2)`
          );
        } else {
          // 将绝对路径转换为相对路径（域名更换时使用）
          const domainPattern = /https?:\/\/[^\/]+/g;
          content = content.replace(
            new RegExp(`\\[([^\\]]+)\\]\\(https?:\\/\\/[^\\/]+\\/([^)]+)\\)`, 'g'),
            '[$1](/$2)'
          );
        }

        if (content !== originalContent) {
          // 创建备份
          const backupPath = articlePath + '.backup.' + Date.now();
          fs.writeFileSync(backupPath, originalContent);
          
          // 写入更新后的内容
          fs.writeFileSync(articlePath, content);
          
          results.updated++;
          log(`  ✅ 更新: ${articleDir}`, 'green');
        }
        
        results.processed++;

      } catch (error) {
        results.errors.push({ article: articleDir, error: error.message });
        log(`  ❌ 失败: ${articleDir} - ${error.message}`, 'red');
      }
    }
  }

  return results;
}

/**
 * 更新配置文件
 */
async function updateConfigFiles(domain) {
  const results = {
    processed: 0,
    updated: 0,
    errors: []
  };

  for (const configFile of CONFIG.configFiles) {
    if (!fs.existsSync(configFile)) {
      continue;
    }

    try {
      let content = fs.readFileSync(configFile, 'utf8');
      const originalContent = content;

      // 更新URL配置
      content = content.replace(
        /url:\s*["'][^"']*["']/g,
        `url: "${domain}"`
      );

      // 更新baseUrl配置
      content = content.replace(
        /baseUrl:\s*["'][^"']*["']/g,
        `baseUrl: "${domain}"`
      );

      // 更新site配置
      content = content.replace(
        /site:\s*["'][^"']*["']/g,
        `site: "${domain}"`
      );

      // 更新robots.txt中的Sitemap
      if (configFile.includes('robots.txt')) {
        content = content.replace(
          /Sitemap:\s*https?:\/\/[^\s]+/g,
          `Sitemap: ${domain}/sitemap-index.xml`
        );
      }

      // 更新占位符
      content = content.replace(
        /DOMAIN_PLACEHOLDER/g,
        domain
      );

      if (content !== originalContent) {
        // 创建备份
        const backupPath = configFile + '.backup.' + Date.now();
        fs.writeFileSync(backupPath, originalContent);
        
        // 写入更新后的内容
        fs.writeFileSync(configFile, content);
        
        results.updated++;
        log(`  ✅ 更新: ${path.basename(configFile)}`, 'green');
      }
      
      results.processed++;

    } catch (error) {
      results.errors.push({ file: configFile, error: error.message });
      log(`  ❌ 失败: ${path.basename(configFile)} - ${error.message}`, 'red');
    }
  }

  return results;
}

/**
 * 生成或更新sitemap配置
 */
async function updateSitemapConfig(domain) {
  const sitemapConfigPath = path.join(__dirname, '../src/lib/config/sitemap.ts');
  
  const sitemapConfig = `// Sitemap配置文件
// 自动生成于: ${new Date().toISOString()}

export const SITEMAP_CONFIG = {
  site: '${domain}',
  
  // 页面优先级配置
  priorities: {
    home: 1.0,
    articles: 0.8,
    about: 0.6,
    contact: 0.5,
    legal: 0.3
  },

  // 更新频率配置
  changeFreq: {
    home: 'weekly',
    articles: 'monthly',
    about: 'yearly',
    contact: 'yearly',
    legal: 'yearly'
  },

  // 排除的页面
  exclude: [
    '/404',
    '/admin/*',
    '/temp/*'
  ]
};

export default SITEMAP_CONFIG;`;

  try {
    fs.writeFileSync(sitemapConfigPath, sitemapConfig);
    log(`📄 Sitemap配置已生成: ${sitemapConfigPath}`, 'cyan');
  } catch (error) {
    log(`❌ Sitemap配置生成失败: ${error.message}`, 'red');
  }
}

/**
 * 生成robots.txt
 */
async function generateRobotsTxt(domain) {
  const robotsPath = path.join(CONFIG.publicDir, 'robots.txt');
  
  const robotsContent = `# Robots.txt for ${domain}
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /

# Sitemap
Sitemap: ${domain}/sitemap-index.xml

# Crawl-delay (optional)
# Crawl-delay: 1

# Disallow admin areas
Disallow: /admin/
Disallow: /temp/
Disallow: /*.backup.*

# Allow important assets
Allow: /assets/
Allow: /_astro/
`;

  try {
    // 确保public目录存在
    if (!fs.existsSync(CONFIG.publicDir)) {
      fs.mkdirSync(CONFIG.publicDir, { recursive: true });
    }

    fs.writeFileSync(robotsPath, robotsContent);
    log(`🤖 Robots.txt已生成: ${robotsPath}`, 'cyan');
  } catch (error) {
    log(`❌ Robots.txt生成失败: ${error.message}`, 'red');
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n🔗 域名链接更新脚本', 'bright');
  log('=' .repeat(50), 'blue');
  log('🎯 功能: 域名配置 | 链接更新 | SEO优化', 'cyan');
  log('=' .repeat(50), 'blue');

  try {
    // 获取用户输入的域名
    const domain = await getDomainFromUser();
    
    log(`\n✅ 域名确认: ${domain}`, 'green');

    // 询问操作类型
    const rl = createReadlineInterface();
    const operationType = await new Promise(resolve => {
      log('\n📋 请选择操作类型:', 'cyan');
      log('   1. 更新配置文件（保持相对链接）', 'blue');
      log('   2. 转换为绝对链接', 'blue');
      log('   3. 完整更新（推荐）', 'blue');
      
      rl.question('选择 (1/2/3): ', answer => {
        rl.close();
        resolve(parseInt(answer) || 3);
      });
    });

    const results = {
      config: { processed: 0, updated: 0, errors: [] },
      articles: { processed: 0, updated: 0, errors: [] }
    };

    // 执行相应操作
    if (operationType === 1 || operationType === 3) {
      log('\n🔧 更新配置文件...', 'cyan');
      results.config = await updateConfigFiles(domain);
    }

    if (operationType === 2 || operationType === 3) {
      log('\n📝 更新文章链接...', 'cyan');
      results.articles = await updateArticleLinks(domain, operationType === 2);
    }

    if (operationType === 3) {
      log('\n🗺️  生成SEO文件...', 'cyan');
      await updateSitemapConfig(domain);
      await generateRobotsTxt(domain);
    }

    // 显示结果统计
    log('\n' + '='.repeat(50), 'green');
    log('📊 域名更新完成', 'bright');
    
    if (results.config.processed > 0) {
      log(`   📄 配置文件: ${results.config.updated}/${results.config.processed} 已更新`, 'blue');
    }
    
    if (results.articles.processed > 0) {
      log(`   📚 文章链接: ${results.articles.updated}/${results.articles.processed} 已更新`, 'blue');
    }

    const totalErrors = results.config.errors.length + results.articles.errors.length;
    log(`   ❌ 错误数量: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green');

    if (totalErrors > 0) {
      log('\n⚠️  处理错误详情:', 'yellow');
      [...results.config.errors, ...results.articles.errors].forEach(error => {
        log(`   • ${error.file || error.article}: ${error.error}`, 'red');
      });
    }

    log('\n🎉 域名更新完成！', 'green');
    log('💡 建议:', 'cyan');
    log('   • 运行 npm run dev 测试更新效果', 'blue');
    log('   • 检查生成的sitemap配置', 'blue');
    log('   • 验证robots.txt内容', 'blue');
    log('   • 在搜索引擎中提交新的sitemap', 'blue');

  } catch (error) {
    if (error.message.includes('域名')) {
      log(`\n❌ ${error.message}`, 'red');
      log('💡 请确保域名格式正确，例如: https://example.com', 'yellow');
    } else {
      log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
      console.error(error);
    }
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