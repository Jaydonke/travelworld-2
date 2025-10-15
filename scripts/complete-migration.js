#!/usr/bin/env node

/**
 * 完整内容迁移脚本
 * 将原网站的所有内容迁移到blogsmith模板结构
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  // 源路径（备份中的原始内容）
  backupDir: path.join(__dirname, '../backups/migration-backup'),
  
  // 目标路径（新结构）
  targetBlogDir: path.join(__dirname, '../src/content/blog/en'),
  targetAuthorsDir: path.join(__dirname, '../src/content/authors'),
  targetImagesDir: path.join(__dirname, '../src/assets/images/articles'),
  
  // 当前文章位置
  currentBlogDir: path.join(__dirname, '../src/content/blog'),
  
  // 配置文件
  configFile: path.join(__dirname, '../src/lib/config/index.ts')
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
 * 清理现有的示例内容
 */
async function cleanExampleContent() {
  log('\n🧹 清理示例内容...', 'cyan');
  
  // 删除blogsmith的示例文章
  const exampleDirs = ['en', 'fr'];
  for (const dir of exampleDirs) {
    const dirPath = path.join(CONFIG.currentBlogDir, dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      log(`  ✅ 删除示例目录: ${dir}`, 'green');
    }
  }
  
  // 删除示例作者
  const exampleAuthors = ['second-author', 'web-reaper'];
  for (const author of exampleAuthors) {
    const authorPath = path.join(CONFIG.targetAuthorsDir, author);
    if (fs.existsSync(authorPath)) {
      fs.rmSync(authorPath, { recursive: true, force: true });
      log(`  ✅ 删除示例作者: ${author}`, 'green');
    }
  }
}

/**
 * 迁移文章内容
 */
async function migrateArticles() {
  log('\n📚 迁移文章内容...', 'cyan');
  
  const sourceArticlesDir = path.join(CONFIG.backupDir, 'src/content/articles');
  
  if (!fs.existsSync(sourceArticlesDir)) {
    // 如果备份不存在，检查当前目录
    const currentArticles = path.join(__dirname, '../src/content/blog');
    const articles = fs.readdirSync(currentArticles).filter(item => {
      const itemPath = path.join(currentArticles, item);
      return fs.statSync(itemPath).isDirectory() && item !== 'en' && item !== 'fr';
    });
    
    if (articles.length > 0) {
      log(`  ℹ️ 发现 ${articles.length} 篇文章在当前目录`, 'blue');
      
      // 创建en目录
      if (!fs.existsSync(CONFIG.targetBlogDir)) {
        fs.mkdirSync(CONFIG.targetBlogDir, { recursive: true });
      }
      
      // 移动文章到en目录
      for (const article of articles) {
        const sourcePath = path.join(currentArticles, article);
        const targetPath = path.join(CONFIG.targetBlogDir, article);
        
        if (!fs.existsSync(targetPath)) {
          fs.renameSync(sourcePath, targetPath);
          log(`  ✅ 移动文章: ${article}`, 'green');
        }
      }
    }
  } else {
    // 从备份恢复文章
    const articles = fs.readdirSync(sourceArticlesDir).filter(item => {
      const itemPath = path.join(sourceArticlesDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    log(`  📄 发现 ${articles.length} 篇文章`, 'blue');
    
    // 创建目标目录
    if (!fs.existsSync(CONFIG.targetBlogDir)) {
      fs.mkdirSync(CONFIG.targetBlogDir, { recursive: true });
    }
    
    // 复制文章
    for (const article of articles) {
      const sourcePath = path.join(sourceArticlesDir, article);
      const targetPath = path.join(CONFIG.targetBlogDir, article);
      
      copyDirectory(sourcePath, targetPath);
      log(`  ✅ 迁移文章: ${article}`, 'green');
    }
  }
}

/**
 * 修复文章的frontmatter格式
 */
async function fixArticleFrontmatter() {
  log('\n🔧 修复文章格式...', 'cyan');
  
  const articlesDir = CONFIG.targetBlogDir;
  
  if (!fs.existsSync(articlesDir)) {
    log('  ⚠️ 文章目录不存在', 'yellow');
    return;
  }
  
  const articles = fs.readdirSync(articlesDir).filter(item => {
    const itemPath = path.join(articlesDir, item);
    return fs.statSync(itemPath).isDirectory();
  });
  
  for (const article of articles) {
    const mdxPath = path.join(articlesDir, article, 'index.mdx');
    
    if (fs.existsSync(mdxPath)) {
      let content = fs.readFileSync(mdxPath, 'utf8');
      
      // 检查是否需要修复authors字段
      if (content.includes('author:') && !content.includes('authors:')) {
        content = content.replace(/^author:\s*(.+)$/m, 'authors: ["$1"]');
      }
      
      // 确保有category字段
      if (!content.includes('category:')) {
        const frontmatterEnd = content.indexOf('---', 3);
        if (frontmatterEnd > 0) {
          const beforeEnd = content.substring(0, frontmatterEnd);
          const afterEnd = content.substring(frontmatterEnd);
          content = beforeEnd + 'category: "Blogging & Making Money Online"\n' + afterEnd;
        }
      }
      
      fs.writeFileSync(mdxPath, content);
      log(`  ✅ 修复: ${article}`, 'green');
    }
  }
}

/**
 * 迁移作者数据
 */
async function migrateAuthors() {
  log('\n👥 迁移作者数据...', 'cyan');
  
  // 创建默认作者
  const authors = [
    {
      id: 'blogtonic-team',
      name: 'BlogTonic Team',
      job: 'Content Creation Experts',
      bio: 'The BlogTonic team helps bloggers and content creators build profitable online businesses through smart strategies and proven tactics.',
      social: {
        twitter: 'blogtonic',
        email: 'hello@blogtonic.com'
      }
    },
    {
      id: 'sarah-chen',
      name: 'Sarah Chen',
      job: 'SEO & Content Strategist',
      bio: 'Sarah specializes in SEO optimization and content strategy for affiliate marketing blogs.',
      social: {
        twitter: 'sarahchen',
        linkedin: 'sarahchen'
      }
    },
    {
      id: 'mike-davidson',
      name: 'Mike Davidson',
      job: 'Affiliate Marketing Expert',
      bio: 'Mike has been in affiliate marketing for over 10 years and shares his insights on building sustainable income streams.',
      social: {
        twitter: 'mikedavidson',
        linkedin: 'mikedavidson'
      }
    }
  ];
  
  for (const author of authors) {
    const authorDir = path.join(CONFIG.targetAuthorsDir, author.id);
    
    if (!fs.existsSync(authorDir)) {
      fs.mkdirSync(authorDir, { recursive: true });
    }
    
    const mdxContent = `---
name: "${author.name}"
job: "${author.job}"
bio: "${author.bio}"
avatar: "./avatar.jpg"
social:
  twitter: "${author.social.twitter || ''}"
  linkedin: "${author.social.linkedin || ''}"
  email: "${author.social.email || ''}"
---

${author.bio}`;
    
    fs.writeFileSync(path.join(authorDir, 'index.mdx'), mdxContent);
    
    // 复制默认头像
    const defaultAvatar = path.join(CONFIG.targetAuthorsDir, 'second-author/avatar.jpg');
    if (fs.existsSync(defaultAvatar)) {
      fs.copyFileSync(defaultAvatar, path.join(authorDir, 'avatar.jpg'));
    }
    
    log(`  ✅ 创建作者: ${author.name}`, 'green');
  }
}

/**
 * 更新页面内容
 */
async function updatePageContent() {
  log('\n📄 更新页面内容...', 'cyan');
  
  // 页面映射
  const pageUpdates = [
    {
      file: 'src/pages/index.astro',
      updates: [
        { 
          old: 'Welcome to BlogSmith Pro',
          new: 'Welcome to BlogTonic'
        },
        {
          old: 'Your Ultimate Blogging Solution',
          new: 'Blog Smarter. Earn More.'
        }
      ]
    },
    {
      file: 'src/pages/about.astro',
      updates: [
        {
          old: 'About BlogSmith',
          new: 'About BlogTonic'
        }
      ]
    },
    {
      file: 'src/pages/contact.astro', 
      updates: [
        {
          old: 'Contact BlogSmith',
          new: 'Get in Touch'
        }
      ]
    }
  ];
  
  for (const page of pageUpdates) {
    const pagePath = path.join(__dirname, '..', page.file);
    
    if (fs.existsSync(pagePath)) {
      let content = fs.readFileSync(pagePath, 'utf8');
      
      for (const update of page.updates) {
        if (content.includes(update.old)) {
          content = content.replace(new RegExp(update.old, 'g'), update.new);
        }
      }
      
      fs.writeFileSync(pagePath, content);
      log(`  ✅ 更新页面: ${page.file}`, 'green');
    }
  }
}

/**
 * 创建路由兼容层
 */
async function createRouteCompatibility() {
  log('\n🔗 创建路由兼容...', 'cyan');
  
  // 创建articles -> blog的重定向
  const redirects = `
// 文章路由兼容
export function getArticleUrl(slug) {
  // 兼容旧路由 /articles/[id]
  // 新路由 /blog/[slug]
  return \`/blog/\${slug}\`;
}

export function getCategoryUrl(category) {
  return \`/categories/\${category}\`;
}

export function getAuthorUrl(author) {
  return \`/authors/\${author}\`;
}
`;
  
  const routeHelperPath = path.join(__dirname, '../src/lib/utils/routes.js');
  fs.writeFileSync(routeHelperPath, redirects);
  log(`  ✅ 创建路由助手`, 'green');
  
  // 更新astro.config.mjs添加重定向
  const astroConfigPath = path.join(__dirname, '../astro.config.mjs');
  if (fs.existsSync(astroConfigPath)) {
    let config = fs.readFileSync(astroConfigPath, 'utf8');
    
    if (!config.includes('redirects:')) {
      // 在site配置后添加redirects
      const siteMatch = config.match(/site:\s*"[^"]+",/);
      if (siteMatch) {
        const insertPos = siteMatch.index + siteMatch[0].length;
        const redirectConfig = `
  redirects: {
    '/articles/[...slug]': '/blog/[...slug]',
    '/admin': '/keystatic',
  },`;
        config = config.slice(0, insertPos) + redirectConfig + config.slice(insertPos);
        fs.writeFileSync(astroConfigPath, config);
        log(`  ✅ 添加路由重定向`, 'green');
      }
    }
  }
}

/**
 * 迁移图片资源
 */
async function migrateImages() {
  log('\n🖼️ 迁移图片资源...', 'cyan');
  
  const sourceImagesDir = path.join(CONFIG.backupDir, 'src/assets/images/articles');
  
  if (fs.existsSync(sourceImagesDir)) {
    if (!fs.existsSync(CONFIG.targetImagesDir)) {
      fs.mkdirSync(CONFIG.targetImagesDir, { recursive: true });
    }
    
    copyDirectory(sourceImagesDir, CONFIG.targetImagesDir);
    log(`  ✅ 图片资源迁移完成`, 'green');
  }
}

/**
 * 更新配置文件
 */
async function updateSiteConfig() {
  log('\n⚙️ 更新站点配置...', 'cyan');
  
  // 更新siteSettings.json.ts
  const siteSettingsPath = path.join(__dirname, '../src/config/en/siteData.json.ts');
  
  if (fs.existsSync(siteSettingsPath)) {
    const siteSettings = `import site_logo from "@assets/images/site-logo.png";

export default {
  title: "BlogTonic",
  description: "Actionable strategies and insights for blogging, affiliate marketing, and building online income streams.",
  defaultImage: { src: site_logo, alt: "BlogTonic" },
  language: "en",
  author: {
    name: "BlogTonic Team",
    email: "hello@blogtonic.com",
    twitter: "blogtonic",
  },
  defaultTheme: "light",
  dateFormat: "MMMM dd, yyyy",
  projectName: "BlogTonic",
  creditLink: "https://blogtonic.com",
  creditLinkText: "BlogTonic",
};`;
    
    fs.writeFileSync(siteSettingsPath, siteSettings);
    log(`  ✅ 更新站点配置`, 'green');
  }
  
  // 更新导航数据
  const navDataPath = path.join(__dirname, '../src/config/en/navData.json.ts');
  
  if (fs.existsSync(navDataPath)) {
    const navData = `export default [
  {
    text: "Home",
    link: "/",
  },
  {
    text: "Blog",
    link: "/blog",
  },
  {
    text: "Categories",
    link: "/categories",
  },
  {
    text: "About",
    link: "/about",
  },
  {
    text: "Contact",
    link: "/contact",
  },
];`;
    
    fs.writeFileSync(navDataPath, navData);
    log(`  ✅ 更新导航配置`, 'green');
  }
}

/**
 * 复制目录
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 验证迁移结果
 */
async function validateMigration() {
  log('\n✅ 验证迁移结果...', 'cyan');
  
  const checks = [
    {
      name: '文章',
      path: CONFIG.targetBlogDir,
      type: 'dir'
    },
    {
      name: '作者',
      path: CONFIG.targetAuthorsDir,
      type: 'dir'
    },
    {
      name: '图片',
      path: CONFIG.targetImagesDir,
      type: 'dir'
    },
    {
      name: '配置',
      path: CONFIG.configFile,
      type: 'file'
    }
  ];
  
  let allGood = true;
  
  for (const check of checks) {
    const exists = fs.existsSync(check.path);
    
    if (exists && check.type === 'dir') {
      const count = fs.readdirSync(check.path).length;
      log(`  ✅ ${check.name}: ${count} 项`, 'green');
    } else if (exists) {
      log(`  ✅ ${check.name}: 已就绪`, 'green');
    } else {
      log(`  ❌ ${check.name}: 缺失`, 'red');
      allGood = false;
    }
  }
  
  return allGood;
}

/**
 * 主函数
 */
async function main() {
  log('\n🚀 完整内容迁移工具', 'bright');
  log('=' .repeat(50), 'cyan');
  
  try {
    // 执行迁移步骤
    await cleanExampleContent();
    await migrateArticles();
    await fixArticleFrontmatter();
    await migrateAuthors();
    await migrateImages();
    await updatePageContent();
    await updateSiteConfig();
    await createRouteCompatibility();
    
    // 验证结果
    const success = await validateMigration();
    
    if (success) {
      log('\n' + '='.repeat(50), 'green');
      log('✅ 迁移完成！', 'bright');
      log('=' .repeat(50), 'green');
      
      log('\n📋 迁移结果：', 'cyan');
      
      // 统计文章数量
      if (fs.existsSync(CONFIG.targetBlogDir)) {
        const articles = fs.readdirSync(CONFIG.targetBlogDir).filter(item => {
          const itemPath = path.join(CONFIG.targetBlogDir, item);
          return fs.statSync(itemPath).isDirectory();
        });
        log(`  📄 文章: ${articles.length} 篇`, 'blue');
      }
      
      // 统计作者数量
      if (fs.existsSync(CONFIG.targetAuthorsDir)) {
        const authors = fs.readdirSync(CONFIG.targetAuthorsDir).filter(item => {
          const itemPath = path.join(CONFIG.targetAuthorsDir, item);
          return fs.statSync(itemPath).isDirectory();
        });
        log(`  👥 作者: ${authors.length} 位`, 'blue');
      }
      
      log('\n💡 下一步：', 'cyan');
      log('  1. 重启开发服务器：Ctrl+C 然后 npm run dev', 'yellow');
      log('  2. 访问网站：http://localhost:4321', 'yellow');
      log('  3. 测试脚本：npm run add-articles-improved', 'yellow');
      
    } else {
      log('\n⚠️ 迁移部分完成，请检查缺失的内容', 'yellow');
    }
    
  } catch (error) {
    log(`\n❌ 迁移失败: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行迁移
main().catch(error => {
  log(`\n❌ 致命错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});