#!/usr/bin/env node

/**
 * 配置模板同步脚本
 * 
 * 功能：将 config.template.js 中的配置自动同步到网站的各个配置文件
 * 使用方法：npm run sync-config-template
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文件路径配置
const TEMPLATE_FILE = path.join(process.cwd(), 'config.template.js');
const CONFIG_FILE = path.join(process.cwd(), 'src/lib/config/index.ts');
const THEME_CONFIG_FILE = path.join(process.cwd(), 'config/theme-config.json');
const AUTHOR_CONFIG_FILE = path.join(process.cwd(), 'author/name.txt');

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

async function loadTemplateConfig() {
  console.log(colors.blue('📖 正在读取配置模板...'));
  
  try {
    // 检查模板文件是否存在
    await fs.access(TEMPLATE_FILE);
    
    // 读取模板文件内容
    const templateContent = await fs.readFile(TEMPLATE_FILE, 'utf-8');
    
    // 动态导入模板配置
    // 创建临时文件来加载配置
    const tempFile = path.join(process.cwd(), 'temp-config.js');
    await fs.writeFile(tempFile, templateContent);
    
    // 动态导入配置 - 添加时间戳避免缓存
    const tempFileUrl = `file:///${path.resolve(tempFile).replace(/\\/g, '/')}?t=${Date.now()}`;
    const configModule = await import(tempFileUrl);
    
    // 删除临时文件
    await fs.unlink(tempFile);
    
    console.log(colors.green('✅ 配置模板读取成功'));
    
    return configModule;
    
  } catch (error) {
    console.error(colors.red('❌ 读取配置模板失败:'), error.message);
    if (error.code === 'ENOENT') {
      console.error(colors.yellow('💡 请确保 config.template.js 文件存在'));
    }
    throw error;
  }
}

async function updateMainConfig(templateConfig) {
  console.log(colors.blue('🔄 正在更新主配置文件...'));
  
  try {
    const { 
      CURRENT_WEBSITE_CONTENT, 
      CURRENT_NAVIGATION_LINKS, 
      CURRENT_OTHER_LINKS, 
      CURRENT_SOCIAL_LINKS,
      FOOTER_NAVIGATION_LINKS,
      FOOTER_LEGAL_LINKS,
      NAV_BAR_LINKS,
      CATEGORY_INFO 
    } = templateConfig;
    
    // 提取主要配置（不包含扩展配置）
    const mainSiteConfig = {
      title: CURRENT_WEBSITE_CONTENT.title,
      description: CURRENT_WEBSITE_CONTENT.description,
      tagline: CURRENT_WEBSITE_CONTENT.tagline,
      author: CURRENT_WEBSITE_CONTENT.author,
      url: CURRENT_WEBSITE_CONTENT.url,
      locale: CURRENT_WEBSITE_CONTENT.locale,
      dir: CURRENT_WEBSITE_CONTENT.dir,
      charset: CURRENT_WEBSITE_CONTENT.charset,
      basePath: CURRENT_WEBSITE_CONTENT.basePath,
      postsPerPage: CURRENT_WEBSITE_CONTENT.postsPerPage,
      googleAnalyticsId: CURRENT_WEBSITE_CONTENT.googleAnalyticsId,
      theme: CURRENT_WEBSITE_CONTENT.theme,
      categories: CURRENT_WEBSITE_CONTENT.categories,
      robots: CURRENT_WEBSITE_CONTENT.robots,
      schema: CURRENT_WEBSITE_CONTENT.schema,
      pages: CURRENT_WEBSITE_CONTENT.pages
    };
    
    // 生成新的配置文件内容
    const newConfigContent = `import type { Link } from "../types";

export const SITE = ${JSON.stringify(mainSiteConfig, null, 2)};

export const NAVIGATION_LINKS: Link[] = ${JSON.stringify(CURRENT_NAVIGATION_LINKS, null, 2)};

export const NAV_BAR_LINKS = ${JSON.stringify(NAV_BAR_LINKS || [], null, 2)};

export const FOOTER_NAVIGATION_LINKS: Link[] = ${JSON.stringify(FOOTER_NAVIGATION_LINKS || [], null, 2)};

export const FOOTER_LEGAL_LINKS: Link[] = ${JSON.stringify(FOOTER_LEGAL_LINKS || [], null, 2)};

export const OTHER_LINKS: Link[] = ${JSON.stringify(CURRENT_OTHER_LINKS, null, 2)};

export const SOCIAL_LINKS: Link[] = ${JSON.stringify(CURRENT_SOCIAL_LINKS, null, 2).replace(/"icon":/g, 'icon:')};

// Category Information
export const CATEGORY_INFO = ${JSON.stringify(CATEGORY_INFO || {}, null, 2)};

// Site References
export const SITE_REFERENCES = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.siteReferences || {}, null, 2)};

// Hero Configuration
export const HERO_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.hero || {}, null, 2)};

// Overview Configuration
export const OVERVIEW_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.pages?.overview || {}, null, 2)};

// Newsletter Configuration
export const NEWSLETTER_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.newsletter || {}, null, 2)};

// Legal Links Configuration
export const LEGAL_LINKS_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.legalLinks || {}, null, 2)};

// SEO Configuration
export const SEO_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.seo || {}, null, 2)};

// Article Configuration
export const ARTICLE_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.articles || {}, null, 2)};

// Image Configuration  
export const IMAGE_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.images || {}, null, 2)};

// Preview Mode Configuration
export const PREVIEW_MODE_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.previewMode || {}, null, 2)};

// UI Text Configuration
export const UI_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.ui || {}, null, 2)};

// Advertising Configuration
export const ADVERTISING_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.advertising || {}, null, 2)};

// Branding Configuration
export const BRANDING_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.branding || {}, null, 2)};

// Pages Configuration (About, Overview, Support, Terms, Privacy, etc.)
export const PAGES_CONFIG = ${JSON.stringify(CURRENT_WEBSITE_CONTENT.pages || {}, null, 2)};
`;

    // 备份原配置文件
    const backupFile = CONFIG_FILE + '.backup.' + Date.now();
    try {
      await fs.copyFile(CONFIG_FILE, backupFile);
      console.log(colors.cyan(`💾 已创建主配置备份: ${path.basename(backupFile)}`));
    } catch (error) {
      console.log(colors.yellow('⚠️  无法创建备份文件，可能是首次运行'));
    }
    
    // 写入新配置
    await fs.writeFile(CONFIG_FILE, newConfigContent, 'utf-8');
    
    console.log(colors.green('✅ 主配置文件更新成功'));
    
    return true;
    
  } catch (error) {
    console.error(colors.red('❌ 更新主配置文件失败:'), error.message);
    throw error;
  }
}

async function updateThemeConfig(templateConfig) {
  console.log(colors.blue('🎨 正在更新主题配置...'));
  
  try {
    const { CURRENT_WEBSITE_CONTENT } = templateConfig;
    
    // 生成主题配置
    const themeConfig = {
      currentTheme: CURRENT_WEBSITE_CONTENT.theme?.name ? `${CURRENT_WEBSITE_CONTENT.theme.name.toLowerCase().replace(/\s+/g, '-')}-theme` : "default-theme",
      fallbackTheme: CURRENT_WEBSITE_CONTENT.categories ? CURRENT_WEBSITE_CONTENT.categories[0] : "general",
      themeSettings: {
        enableSmartCategorization: true,
        enableManualOverride: true,
        logCategoryDecisions: true
      }
    };
    
    // 确保目录存在
    const configDir = path.dirname(THEME_CONFIG_FILE);
    await fs.mkdir(configDir, { recursive: true });
    
    // 写入主题配置
    await fs.writeFile(THEME_CONFIG_FILE, JSON.stringify(themeConfig, null, 2), 'utf-8');
    
    console.log(colors.green('✅ 主题配置更新成功'));
    
    return true;
    
  } catch (error) {
    console.error(colors.red('❌ 更新主题配置失败:'), error.message);
    throw error;
  }
}

async function updateAuthorConfig(templateConfig) {
  console.log(colors.blue('👤 正在更新作者配置...'));
  
  try {
    const { CURRENT_WEBSITE_CONTENT } = templateConfig;
    
    // 获取作者配置
    const authorMode = CURRENT_WEBSITE_CONTENT.authors?.mode || 'random';
    
    // 确保目录存在
    const authorDir = path.dirname(AUTHOR_CONFIG_FILE);
    await fs.mkdir(authorDir, { recursive: true });
    
    // 写入作者配置
    await fs.writeFile(AUTHOR_CONFIG_FILE, authorMode, 'utf-8');
    
    console.log(colors.green(`✅ 作者配置更新成功: ${authorMode} 模式`));
    
    // 显示可用作者
    if (CURRENT_WEBSITE_CONTENT.authors?.availableAuthors) {
      console.log(colors.cyan('   可用作者:'));
      CURRENT_WEBSITE_CONTENT.authors.availableAuthors.forEach(author => {
        console.log(`   - ${author}`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error(colors.red('❌ 更新作者配置失败:'), error.message);
    throw error;
  }
}

async function updateSiteDataConfig(templateConfig) {
  console.log(colors.blue('🌐 正在更新站点数据配置...'));
  
  try {
    const { CURRENT_WEBSITE_CONTENT } = templateConfig;
    
    // 生成siteData配置
    const siteDataContent = `import { type SiteDataProps } from "../types/configDataTypes";

// Update this file with your site specific information
const siteData: SiteDataProps = {
	name: "${CURRENT_WEBSITE_CONTENT.title}",
	// Your website's title and description (meta fields)
	title: "${CURRENT_WEBSITE_CONTENT.seo?.defaultTitle || CURRENT_WEBSITE_CONTENT.title}",
	description:
		"${CURRENT_WEBSITE_CONTENT.description}",
	// Your information!
	author: {
		name: "${CURRENT_WEBSITE_CONTENT.author}",
		email: "${CURRENT_WEBSITE_CONTENT.siteReferences?.generalEmail || 'hello@example.com'}",
		twitter: "${CURRENT_WEBSITE_CONTENT.seo?.twitterHandle?.replace('@', '') || 'example'}",
	},

	// default image for meta tags if the page doesn't have an image already
	defaultImage: {
		src: "${CURRENT_WEBSITE_CONTENT.seo?.defaultImage || '/images/default-og.jpg'}",
		alt: "${CURRENT_WEBSITE_CONTENT.title} logo",
	},
};

export default siteData;`;
    
    // 更新英文版siteData
    const enSiteDataPath = path.join(process.cwd(), 'src/config/en/siteData.json.ts');
    
    try {
      // 尝试删除原文件
      await fs.unlink(enSiteDataPath);
    } catch (err) {
      // 忽略删除错误
    }
    
    // 写入新文件
    await fs.writeFile(enSiteDataPath, siteDataContent, 'utf-8');
    console.log(colors.green('✅ 站点数据配置更新成功'));
    
    // 如果存在法语版，也更新
    const frSiteDataPath = path.join(process.cwd(), 'src/config/fr/siteData.json.ts');
    try {
      await fs.access(frSiteDataPath);
      await fs.unlink(frSiteDataPath);
      await fs.writeFile(frSiteDataPath, siteDataContent, 'utf-8');
      console.log(colors.cyan('   ✅ 法语版站点数据也已更新'));
    } catch (err) {
      // 法语版不存在，忽略
    }
    
    return true;
    
  } catch (error) {
    console.error(colors.red('❌ 更新站点数据配置失败:'), error.message);
    throw error;
  }
}

async function createCategoryFolders(templateConfig) {
  console.log(colors.blue('📁 正在同步分类文件夹...'));
  
  try {
    const { CURRENT_WEBSITE_CONTENT, CATEGORY_INFO } = templateConfig;
    const categories = CURRENT_WEBSITE_CONTENT.categories || [];
    
    const categoriesDir = path.join(process.cwd(), 'src/content/categories');
    
    // 确保分类目录存在
    await fs.mkdir(categoriesDir, { recursive: true });
    
    // 1. 首先删除所有不在template中的旧分类
    console.log(colors.yellow('🗑️  清理旧分类...'));
    try {
      const existingCategories = await fs.readdir(categoriesDir);
      let deletedCount = 0;
      
      for (const existingCategory of existingCategories) {
        if (!categories.includes(existingCategory)) {
          const categoryPath = path.join(categoriesDir, existingCategory);
          const stat = await fs.stat(categoryPath);
          
          if (stat.isDirectory()) {
            // 递归删除文件夹及其内容
            await fs.rm(categoryPath, { recursive: true, force: true });
            console.log(colors.red(`   🗑️  删除旧分类: ${existingCategory}`));
            deletedCount++;
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(colors.yellow(`   ✅ 已删除 ${deletedCount} 个旧分类`));
      } else {
        console.log(colors.cyan('   ℹ️  没有需要删除的旧分类'));
      }
    } catch (error) {
      console.log(colors.yellow('   ⚠️  无法读取现有分类目录，可能是首次运行'));
    }
    
    // 2. 创建或更新template中定义的分类
    console.log(colors.blue('✨ 创建新分类...'));
    
    // 验证分类一致性
    const definedCategoryKeys = Object.keys(CATEGORY_INFO || {});
    if (definedCategoryKeys.length > 0) {
      if (categories.length !== definedCategoryKeys.length) {
        console.log(colors.yellow(`⚠️  警告: CATEGORY_INFO 中有 ${definedCategoryKeys.length} 个分类，但 categories 数组有 ${categories.length} 个`));
      }
      
      // 检查是否所有 categories 数组中的分类都在 CATEGORY_INFO 中定义
      const undefinedCategories = categories.filter(cat => !definedCategoryKeys.includes(cat));
      if (undefinedCategories.length > 0) {
        console.log(colors.yellow(`⚠️  警告: 以下分类在 CATEGORY_INFO 中未定义: ${undefinedCategories.join(', ')}`));
        console.log(colors.yellow(`   建议运行 generate-new-config.js 重新生成配置以保持一致性`));
      }
      
      // 检查是否有 CATEGORY_INFO 中定义但不在 categories 数组中的分类
      const unusedCategories = definedCategoryKeys.filter(key => !categories.includes(key));
      if (unusedCategories.length > 0) {
        console.log(colors.yellow(`⚠️  警告: CATEGORY_INFO 中的以下分类未在 categories 数组中使用: ${unusedCategories.join(', ')}`));
      }
    }
    
    for (const categoryId of categories) {
      const categoryDir = path.join(categoriesDir, categoryId);
      await fs.mkdir(categoryDir, { recursive: true });
      
      // 创建分类配置文件
      const categoryInfo = CATEGORY_INFO?.[categoryId];
      
      if (!categoryInfo) {
        console.log(colors.yellow(`   ⚠️  分类 "${categoryId}" 在 CATEGORY_INFO 中未定义，使用默认值`));
      }
      
      const categoryData = categoryInfo || {
        name: categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Articles about ${categoryId.replace(/-/g, ' ')}`
      };
      
      const categoryConfig = {
        id: categoryId,
        name: categoryData.name,
        description: categoryData.description,
        shortDescription: categoryData.shortDescription,
        icon: categoryData.icon || '📌',
        color: categoryData.color || '#3B82F6',
        aboutTitle: categoryData.aboutTitle,
        aboutContent: categoryData.aboutContent,
        detailedDescription: categoryData.detailedDescription,
        popularTopics: categoryData.popularTopics || [],
        seoKeywords: categoryData.seoKeywords,
        keywords: categoryData.keywords || []
      };
      
      const categoryFile = path.join(categoryDir, 'index.json');
      await fs.writeFile(categoryFile, JSON.stringify(categoryConfig, null, 2), 'utf-8');
      
      console.log(colors.cyan(`   ✅ 创建分类: ${categoryData.name}`));
    }
    
    console.log(colors.green(`✅ 分类同步完成: ${categories.length} 个分类`));
    
    return true;
    
  } catch (error) {
    console.error(colors.red('❌ 同步分类文件夹失败:'), error.message);
    throw error;
  }
}

async function validateSync(templateConfig) {
  console.log(colors.blue('🔍 验证同步结果...'));
  
  try {
    const errors = [];
    
    // 检查主配置文件
    try {
      await fs.access(CONFIG_FILE);
      const configContent = await fs.readFile(CONFIG_FILE, 'utf-8');
      
      // 基本验证
      const requiredExports = ['SITE', 'NAVIGATION_LINKS', 'FOOTER_NAVIGATION_LINKS', 'FOOTER_LEGAL_LINKS', 'OTHER_LINKS', 'SOCIAL_LINKS'];
      const missingExports = requiredExports.filter(exportName => !configContent.includes(`export const ${exportName}`));
      
      if (missingExports.length > 0) {
        errors.push(`主配置缺少必要的导出: ${missingExports.join(', ')}`);
      }
    } catch (error) {
      errors.push('主配置文件验证失败');
    }
    
    // 检查主题配置
    try {
      await fs.access(THEME_CONFIG_FILE);
      const themeContent = await fs.readFile(THEME_CONFIG_FILE, 'utf-8');
      JSON.parse(themeContent); // 验证JSON格式
    } catch (error) {
      errors.push('主题配置文件验证失败');
    }
    
    // 检查作者配置
    try {
      await fs.access(AUTHOR_CONFIG_FILE);
    } catch (error) {
      errors.push('作者配置文件验证失败');
    }
    
    if (errors.length > 0) {
      errors.forEach(error => console.error(colors.red(`   ❌ ${error}`)));
      return false;
    }
    
    console.log(colors.green('✅ 所有配置验证成功'));
    return true;
    
  } catch (error) {
    console.error(colors.red('❌ 同步验证失败:'), error.message);
    return false;
  }
}

async function syncLegalPages(templateConfig) {
  console.log(colors.blue('📄 正在同步法律页面配置...'));
  
  try {
    const { CURRENT_WEBSITE_CONTENT, PAGE_CONTENT, PAGE_CONTENT_CONFIG } = templateConfig;
    const siteName = CURRENT_WEBSITE_CONTENT.title;
    const siteUrl = CURRENT_WEBSITE_CONTENT.url || 'example.com';
    const domain = siteUrl.replace('https://', '').replace('http://', '');
    
    // Get page content from either PAGE_CONTENT or PAGE_CONTENT_CONFIG
    const pageContent = PAGE_CONTENT || PAGE_CONTENT_CONFIG || {};
    
    // 获取所有邮箱配置
    const emails = {
      general: CURRENT_WEBSITE_CONTENT.siteReferences?.generalEmail || `hello@${domain}`,
      privacy: CURRENT_WEBSITE_CONTENT.siteReferences?.privacyEmail || `privacy@${domain}`,
      legal: CURRENT_WEBSITE_CONTENT.siteReferences?.legalEmail || `legal@${domain}`,
      support: CURRENT_WEBSITE_CONTENT.siteReferences?.supportEmail || `support@${domain}`,
      tech: CURRENT_WEBSITE_CONTENT.siteReferences?.techEmail || `tech@${domain}`,
      business: CURRENT_WEBSITE_CONTENT.siteReferences?.businessEmail || `business@${domain}`,
      content: CURRENT_WEBSITE_CONTENT.siteReferences?.contentEmail || `content@${domain}`
    };
    
    // 需要更新的页面文件列表
    const pagesToUpdate = [
      'src/pages/terms.astro',
      'src/pages/privacy.astro',
      'src/pages/support.astro',
      'src/pages/contact.astro',
      'src/pages/legal/terms.astro',
      'src/pages/legal/privacy.astro',
      'src/pages/legal/support.astro',
      'src/pages/legal/index.astro'
    ];
    
    // 动态获取当前文件中可能存在的站点名称模式
    // 这些是常见的站点名称，会被动态替换
    const commonSiteNames = ['okoge', 'OptiNook', 'AICraftDeck', 'NestForgey', 'BlogSmith', 'Wellness Harbor', 'WellnessHarbor'];
    
    // 替换规则 - 动态处理各种站点名称
    const replacements = [
      // 邮箱地址替换（先处理邮箱，避免域名部分被误替换）
      { from: /legal@[a-zA-Z0-9.-]+\.(com|site|org|net)/gi, to: emails.legal },
      { from: /privacy@[a-zA-Z0-9.-]+\.(com|site|org|net)/gi, to: emails.privacy },
      { from: /support@[a-zA-Z0-9.-]+\.(com|site|org|net)/gi, to: emails.support },
      { from: /tech@[a-zA-Z0-9.-]+\.(com|site|org|net)/gi, to: emails.tech },
      { from: /business@[a-zA-Z0-9.-]+\.(com|site|org|net)/gi, to: emails.business },
      { from: /content@[a-zA-Z0-9.-]+\.(com|site|org|net)/gi, to: emails.content },
      { from: /hello@[a-zA-Z0-9.-]+\.(com|site|org|net)/gi, to: emails.general },
      
      // 更新时间替换
      { from: /Last Updated: [A-Za-z]+ \d{4}/gi, to: `Last Updated: ${CURRENT_WEBSITE_CONTENT.pages?.privacy?.lastUpdated || 'December 2024'}` },
      { from: /Effective: [A-Za-z]+ \d{4}/gi, to: `Effective: ${CURRENT_WEBSITE_CONTENT.pages?.terms?.lastUpdated || 'December 2024'}` },
      
      // 内容主题替换
      { from: /Japanese street food, rice culture, traditional recipes, and food stories/gi, 
        to: CURRENT_WEBSITE_CONTENT.theme?.focus || CURRENT_WEBSITE_CONTENT.description || "Entertainment and pop culture" },
      
      // Add page content replacements if available
      { from: /Terms and conditions for using.*?services and content\./gi, 
        to: pageContent.pages?.terms?.content || `Terms and conditions for using ${siteName}'s services and content.` },
      { from: /Privacy policy for.*?\./gi,
        to: pageContent.pages?.privacy?.content || `Privacy policy for ${siteName}.` },
      { from: /Support and FAQ for.*?\./gi,
        to: pageContent.pages?.support?.content || `Support and FAQ for ${siteName}.` }
    ];
    
    // 动态添加站点名称替换规则
    commonSiteNames.forEach(oldName => {
      // 域名替换（包括各种常见顶级域名）
      replacements.push({ from: new RegExp(`${oldName}\\.(com|site|org|net|io)`, 'gi'), to: domain });
      // 所有格形式替换
      replacements.push({ from: new RegExp(`${oldName}'s`, 'gi'), to: `${siteName}'s` });
      // 普通名称替换（最后处理，避免过早替换）
      replacements.push({ from: new RegExp(`\\b${oldName}\\b`, 'gi'), to: siteName });
    });
    
    // 更新每个页面文件
    for (const pageFile of pagesToUpdate) {
      const filePath = path.join(process.cwd(), pageFile);
      
      try {
        // 检查文件是否存在
        await fs.access(filePath);
        
        // 读取文件内容
        let content = await fs.readFile(filePath, 'utf-8');
        
        // 应用所有替换规则
        for (const { from, to } of replacements) {
          content = content.replace(from, to);
        }
        
        // 写回文件
        await fs.writeFile(filePath, content, 'utf-8');
        
        console.log(colors.cyan(`   ✅ 更新 ${path.basename(pageFile)}`));
      } catch (error) {
        // 文件不存在，跳过
        if (error.code !== 'ENOENT') {
          console.log(colors.yellow(`   ⚠️  无法更新 ${path.basename(pageFile)}: ${error.message}`));
        }
      }
    }
    
    console.log(colors.green('✅ 法律页面配置同步成功'));
    return true;
  } catch (error) {
    console.error(colors.red('❌ 法律页面同步失败:'), error.message);
    return false;
  }
}

async function updateNavData(templateConfig) {
  console.log(colors.blue('🧭 正在更新导航数据...'));
  
  try {
    const { NAV_BAR_LINKS } = templateConfig;
    
    if (!NAV_BAR_LINKS) {
      console.log(colors.yellow('   ⚠️  未找到 NAV_BAR_LINKS 配置，跳过导航更新'));
      return true;
    }
    
    const navDataPath = path.join(process.cwd(), 'src/config/en/navData.json.ts');
    
    // 生成新的 navData 内容
    const navDataContent = `import { countItems, getAllPosts, sortByValue } from "@js/blogUtils";
import { humanize } from "@js/textUtils";

// get the categories used in blog posts, to put into navbar
const posts = await getAllPosts("en");
const allCategories = posts.map((post) => post.data.categories).flat();
const countedCategories = countItems(allCategories);
const processedCategories = sortByValue(countedCategories);

// types
import { type navItem } from "../types/configDataTypes";

// note: 1 level of dropdown is supported
const navConfig: navItem[] = ${JSON.stringify(NAV_BAR_LINKS.map(item => {
  if (item.dropdown === 'dynamic') {
    // 为动态类别下拉菜单生成代码
    return {
      text: item.text,
      dropdown: 'DYNAMIC_CATEGORIES'
    };
  }
  return item;
}), null, 2).replace('"DYNAMIC_CATEGORIES"', `processedCategories.map(([category, count]) => {
\t\t\treturn {
\t\t\t\ttext: humanize(category),
\t\t\t\tlink: \`/categories/\${category}/\`,
\t\t\t};
\t\t})`).replace(/"/g, '"')};

export default navConfig;`;
    
    // 备份原文件
    try {
      const backupPath = navDataPath + '.bak';
      const originalContent = await fs.readFile(navDataPath, 'utf-8').catch(() => '');
      if (originalContent) {
        await fs.writeFile(backupPath, originalContent);
      }
    } catch (backupError) {
      // 忽略备份错误，继续执行
      console.log(colors.yellow('   ⚠️  无法创建备份文件，继续执行'));
    }
    
    // 写入新文件
    await fs.writeFile(navDataPath, navDataContent);
    
    console.log(colors.green('✅ 导航数据更新成功'));
    return true;
    
  } catch (error) {
    console.error(colors.red('❌ 导航数据更新失败:'), error.message);
    return false;
  }
}

async function updateTranslationData(templateConfig) {
  console.log(colors.blue('🌍 正在更新翻译数据...'));
  
  try {
    const { CURRENT_WEBSITE_CONTENT } = templateConfig;
    const translations = CURRENT_WEBSITE_CONTENT.translations || {};
    
    // 更新翻译数据文件
    const translationFilePath = path.join(process.cwd(), 'src/config/translationData.json.ts');
    
    // 读取现有文件内容
    let translationContent = await fs.readFile(translationFilePath, 'utf-8');
    
    // 更新所有翻译内容 - 更简单的方法：查找 textTranslations 并替换整个对象
    if (translations.en || translations.fr) {
      // 找到 textTranslations 的位置
      const textTranslationsStart = translationContent.indexOf('export const textTranslations = {');
      
      if (textTranslationsStart !== -1) {
        // 找到结尾位置（找到下一个 export 或文件结尾）
        let textTranslationsEnd = translationContent.indexOf('\nexport ', textTranslationsStart);
        if (textTranslationsEnd === -1) {
          textTranslationsEnd = translationContent.length;
        } else {
          // 回退到上一个 };
          const lastBrace = translationContent.lastIndexOf('};', textTranslationsEnd);
          if (lastBrace !== -1) {
            textTranslationsEnd = lastBrace + 2;
          }
        }
        
        // 构建新的 textTranslations 对象
        const newTextTranslations = `export const textTranslations = {
\ten: ${JSON.stringify(translations.en || {
  hero_description: "Your trusted source for health, fitness, nutrition, and mindful living.",
  back_to_all_posts: "Back to all posts",
  updated_on: "Updated on",
  read_more: "Read more",
  categories: "Categories",
  table_of_contents: "Table of Contents",
  share_this_post: "Share this post",
  search_placeholder: "Search articles...",
  no_posts_found: "No posts found",
  showing_results_for: "Showing results for",
  newsletter_title: "Stay Updated",
  newsletter_description: "Get the latest wellness tips and insights delivered to your inbox.",
  newsletter_placeholder: "Enter your email",
  newsletter_button: "Subscribe",
  footer_rights: "All rights reserved"
}, null, '\t').replace(/\n/g, '\n\t')},
\tfr: ${JSON.stringify(translations.fr || {
  hero_description: "Votre source de confiance pour la santé, le fitness, la nutrition et la vie consciente.",
  back_to_all_posts: "Retour à tous les articles",
  updated_on: "Mis à jour le",
  read_more: "Lire la suite",
  categories: "Catégories",
  table_of_contents: "Table des matières",
  share_this_post: "Partager cet article",
  search_placeholder: "Rechercher des articles...",
  no_posts_found: "Aucun article trouvé",
  showing_results_for: "Résultats pour",
  newsletter_title: "Restez informé",
  newsletter_description: "Recevez les derniers conseils bien-être dans votre boîte mail.",
  newsletter_placeholder: "Entrez votre email",
  newsletter_button: "S'abonner",
  footer_rights: "Tous droits réservés"
}, null, '\t').replace(/\n/g, '\n\t')},
};`;
        
        // 替换内容
        translationContent = translationContent.substring(0, textTranslationsStart) + 
                           newTextTranslations + 
                           translationContent.substring(textTranslationsEnd);
      }
    }
    
    // 写回文件
    await fs.writeFile(translationFilePath, translationContent, 'utf-8');
    
    console.log(colors.green('✅ 翻译数据更新成功'));
    return true;
    
  } catch (error) {
    console.error(colors.red('❌ 更新翻译数据失败:'), error.message);
    return false;
  }
}

async function updateAllHardcodedContent(templateConfig) {
  console.log(colors.blue('🔄 正在更新所有硬编码内容...'));
  
  try {
    const { CURRENT_WEBSITE_CONTENT } = templateConfig;
    const siteName = CURRENT_WEBSITE_CONTENT.title;
    
    // 需要更新的组件文件列表
    const componentsToUpdate = [
      'src/components/Hero/Hero.astro',
      'src/components/Hero/HeroWave.astro',
      'src/components/Nav/Nav.astro',
      'src/components/Nav/MobileNav/MobileNav.astro'
    ];
    
    // 常见的站点名称，会被动态替换
    const commonSiteNames = ['okoge', 'Okoge', 'OptiNook', 'AICraftDeck', 'NestForgey', 'BlogSmith'];
    
    // 基础替换规则
    const replacements = [
      { from: /Master digital marketing with proven SEO strategies[^"']*/g, to: CURRENT_WEBSITE_CONTENT.hero?.description || CURRENT_WEBSITE_CONTENT.description }
    ];
    
    // 动态添加站点名称替换规则
    commonSiteNames.forEach(oldName => {
      // Pro 版本名称替换
      replacements.push({ from: new RegExp(`${oldName} Pro`, 'g'), to: `${siteName} Pro` });
      // 普通名称替换
      replacements.push({ from: new RegExp(`\\b${oldName}\\b`, 'g'), to: siteName });
    });
    
    // 更新每个组件文件
    for (const componentFile of componentsToUpdate) {
      const filePath = path.join(process.cwd(), componentFile);
      
      try {
        // 检查文件是否存在
        await fs.access(filePath);
        
        // 读取文件内容
        let content = await fs.readFile(filePath, 'utf-8');
        
        // 应用所有替换规则
        for (const { from, to } of replacements) {
          content = content.replace(from, to);
        }
        
        // 写回文件
        await fs.writeFile(filePath, content, 'utf-8');
        
        console.log(colors.cyan(`   ✅ 更新 ${path.basename(componentFile)}`));
      } catch (error) {
        // 文件不存在，跳过
        if (error.code !== 'ENOENT') {
          console.log(colors.yellow(`   ⚠️  无法更新 ${path.basename(componentFile)}: ${error.message}`));
        }
      }
    }
    
    console.log(colors.green('✅ 所有硬编码内容更新成功'));
    return true;
  } catch (error) {
    console.error(colors.red('❌ 更新硬编码内容失败:'), error.message);
    return false;
  }
}

async function updateColorTheme(templateConfig) {
  console.log(colors.blue('🎨 正在更新颜色主题...'));
  
  const { colorTheme, ui } = templateConfig.CURRENT_WEBSITE_CONTENT;
  if (!colorTheme) {
    console.log(colors.yellow('   ⚠️  未配置颜色主题，跳过'));
    return;
  }

  const themeCssPath = path.join(process.cwd(), 'src', 'styles', 'tailwind-theme.css');
  const globalCssPath = path.join(process.cwd(), 'src', 'styles', 'global.css');
  const buttonsCssPath = path.join(process.cwd(), 'src', 'styles', 'buttons.css');
  
  try {
    // 1. 更新 tailwind-theme.css
    let content = await fs.readFile(themeCssPath, 'utf-8');
    
    // Update primary color variables
    if (colorTheme.primary) {
      const primaryColor = colorTheme.primary;
      const shades = colorTheme.primaryShades || {
        50: `${primaryColor}-50`,
        100: `${primaryColor}-100`,
        200: `${primaryColor}-200`,
        300: `${primaryColor}-300`,
        400: `${primaryColor}-400`,
        500: `${primaryColor}-500`,
        600: `${primaryColor}-600`,
        700: `${primaryColor}-700`,
        800: `${primaryColor}-800`,
        900: `${primaryColor}-900`,
        950: `${primaryColor}-950`
      };
      
      // Replace primary color definitions
      Object.entries(shades).forEach(([shade, value]) => {
        const regex = new RegExp(`--color-primary-${shade}:\\s*var\\(--color-[a-z]+-${shade}\\)`, 'g');
        content = content.replace(regex, `--color-primary-${shade}: var(--color-${value})`);
      });
    }
    
    // Update base color if specified
    if (colorTheme.base) {
      const baseColor = colorTheme.base;
      for (let shade of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']) {
        const regex = new RegExp(`--color-base-${shade}:\\s*var\\(--color-[a-z]+-${shade}\\)`, 'g');
        content = content.replace(regex, `--color-base-${shade}: var(--color-${baseColor}-${shade})`);
      }
    }
    
    await fs.writeFile(themeCssPath, content);
    
    // 2. 更新 global.css 中的 main-text-gradient 类
    if (colorTheme.primary) {
      const primaryColor = colorTheme.primary;
      try {
        let globalContent = await fs.readFile(globalCssPath, 'utf-8');
        
        // 替换 main-text-gradient 中的颜色
        globalContent = globalContent.replace(
          /\.main-text-gradient\s*{\s*@apply\s+bg-gradient-to-r\s+from-[\w-]+\s+to-[\w-]+\s+bg-clip-text\s+text-transparent;\s*}/,
          `.main-text-gradient {\n\t\t@apply bg-gradient-to-r from-${primaryColor}-500 to-${primaryColor}-600 bg-clip-text text-transparent;\n\t}`
        );
        
        await fs.writeFile(globalCssPath, globalContent);
        console.log(colors.green('   ✅ global.css 更新成功'));
      } catch (error) {
        console.log(colors.yellow(`   ⚠️  无法更新 global.css: ${error.message}`));
      }
    }
    
    // 3. 更新 buttons.css 中的 button--primary 类
    if (colorTheme.primary) {
      const primaryColor = colorTheme.primary;
      try {
        let buttonsContent = await fs.readFile(buttonsCssPath, 'utf-8');
        
        // 替换 button--primary 中的颜色
        buttonsContent = buttonsContent.replace(
          /\.button--primary\s*{\s*@apply\s+text-base-100\s+bg-gradient-to-r\s+from-[\w-]+\s+to-[\w-]+\s+transition-opacity;/,
          `.button--primary {\n\t@apply text-base-100 bg-gradient-to-r from-${primaryColor}-500 to-${primaryColor}-600 transition-opacity;`
        );
        
        await fs.writeFile(buttonsCssPath, buttonsContent);
        console.log(colors.green('   ✅ buttons.css 更新成功'));
      } catch (error) {
        console.log(colors.yellow(`   ⚠️  无法更新 buttons.css: ${error.message}`));
      }
    }
    
    // 4. 更新组件中的颜色（如果配置了componentColors）
    if (ui?.componentColors) {
      console.log(colors.blue('   🔄 正在更新组件颜色...'));
      
      // 更新 Pagination 组件
      if (ui.componentColors.pagination?.activeBackground) {
        const paginationPath = path.join(process.cwd(), 'src', 'components', 'Pagination', 'Pagination.astro');
        try {
          let paginationContent = await fs.readFile(paginationPath, 'utf-8');
          // 替换硬编码的颜色类
          paginationContent = paginationContent.replace(
            /bg-gradient-to-r\s+from-\w+-\d+\s+to-\w+-\d+/g,
            `bg-gradient-to-r ${ui.componentColors.pagination.activeBackground}`
          );
          await fs.writeFile(paginationPath, paginationContent);
          console.log(colors.green('      ✅ Pagination组件颜色已更新'));
        } catch (error) {
          console.log(colors.yellow(`      ⚠️  无法更新Pagination组件: ${error.message}`));
        }
      }
      
      // 更新 Newsletter 组件
      if (ui.componentColors.newsletter?.glowEffect) {
        const newsletterPath = path.join(process.cwd(), 'src', 'components', 'Newsletter', 'Newsletter.astro');
        try {
          let newsletterContent = await fs.readFile(newsletterPath, 'utf-8');
          // 替换光效渐变颜色
          newsletterContent = newsletterContent.replace(
            /class="group absolute -inset-1 transform-gpu rounded-lg bg-gradient-to-r\s+from-\w+-\d+\s+to-\w+-\d+/g,
            `class="group absolute -inset-1 transform-gpu rounded-lg bg-gradient-to-r ${ui.componentColors.newsletter.glowEffect}`
          );
          await fs.writeFile(newsletterPath, newsletterContent);
          console.log(colors.green('      ✅ Newsletter组件颜色已更新'));
        } catch (error) {
          console.log(colors.yellow(`      ⚠️  无法更新Newsletter组件: ${error.message}`));
        }
      }
    }
    
    console.log(colors.green('✅ 颜色主题更新完成'));
    console.log(colors.cyan(`   主色调: ${colorTheme.primary || '默认'}`));
    console.log(colors.cyan(`   基础色: ${colorTheme.base || 'gray'}`));
  } catch (error) {
    console.log(colors.yellow(`   ⚠️  无法更新颜色主题: ${error.message}`));
  }
}

async function showSummary(templateConfig) {
  const { CURRENT_WEBSITE_CONTENT, CURRENT_NAVIGATION_LINKS, CURRENT_OTHER_LINKS, CURRENT_SOCIAL_LINKS, FOOTER_NAVIGATION_LINKS, FOOTER_LEGAL_LINKS, NAV_BAR_LINKS } = templateConfig;
  
  console.log(colors.bold('\n📊 同步统计:'));
  
  const stats = {
    '网站标题': CURRENT_WEBSITE_CONTENT.title,
    '网站主题': CURRENT_WEBSITE_CONTENT.theme?.name || 'Default Theme',
    '分类数量': (CURRENT_WEBSITE_CONTENT.categories || []).length,
    '页面配置': Object.keys(CURRENT_WEBSITE_CONTENT.pages || {}).length,
    '法律页面': ['privacy', 'terms', 'support'].filter(p => CURRENT_WEBSITE_CONTENT.pages?.[p]).length,
    '导航链接': CURRENT_NAVIGATION_LINKS?.length || 0,
    '导航栏配置': NAV_BAR_LINKS?.length || 0,
    '页脚导航': FOOTER_NAVIGATION_LINKS?.length || 0,
    '页脚法律': FOOTER_LEGAL_LINKS?.length || 0,
    '其他链接': CURRENT_OTHER_LINKS?.length || 0,
    '社交链接': CURRENT_SOCIAL_LINKS?.length || 0,
    '作者模式': CURRENT_WEBSITE_CONTENT.authors?.mode || 'random',
    '可用作者': (CURRENT_WEBSITE_CONTENT.authors?.availableAuthors || []).length,
    'UI组件配置': Object.keys(CURRENT_WEBSITE_CONTENT.ui || {}).length,
    '广告状态': CURRENT_WEBSITE_CONTENT.advertising?.enableAds ? '启用' : '禁用'
  };
  
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`   ${key}: ${colors.cyan(value)}`);
  });
}

async function main() {
  console.log(colors.bold(colors.cyan('\n🚀 网站配置同步工具\n')));
  console.log('此工具将自动同步 config.template.js 到网站的各个配置文件');
  console.log(colors.yellow('⚠️  原配置文件将被覆盖（会创建备份）\n'));
  
  try {
    // 1. 加载模板配置
    const templateConfig = await loadTemplateConfig();
    
    // 2. 更新主配置文件
    await updateMainConfig(templateConfig);
    
    // 3. 更新主题配置
    await updateThemeConfig(templateConfig);
    
    // 4. 更新作者配置
    await updateAuthorConfig(templateConfig);
    
    // 5. 更新站点数据配置
    await updateSiteDataConfig(templateConfig);
    
    // 6. 创建分类文件夹
    await createCategoryFolders(templateConfig);
    
    // 7. 同步法律页面配置
    await syncLegalPages(templateConfig);
    
    // 8. 更新导航数据
    await updateNavData(templateConfig);
    
    // 9. 更新翻译数据
    await updateTranslationData(templateConfig);
    
    // 10. 更新所有硬编码内容
    await updateAllHardcodedContent(templateConfig);
    
    // 11. 更新颜色主题
    await updateColorTheme(templateConfig);
    
    // 12. 验证同步结果
    const isValid = await validateSync(templateConfig);
    
    // 12. 显示统计信息
    await showSummary(templateConfig);
    
    if (isValid) {
      console.log(colors.green(colors.bold('\n🎉 配置同步完成！')));
      console.log(`网站配置已更新为 ${templateConfig.CURRENT_WEBSITE_CONTENT.title} 主题`);
      console.log(colors.yellow('\n📌 下一步操作:'));
      console.log('1. 运行 npm run dev 重启开发服务器');
      console.log('2. 检查网站是否正常显示');
      console.log('3. 如需回滚，可使用生成的备份文件\n');
    } else {
      console.log(colors.red(colors.bold('\n❌ 配置同步失败！')));
      console.log('请检查错误信息并手动修复。\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error(colors.red(colors.bold('\n💥 同步过程中发生错误:')), error.message);
    console.log(colors.yellow('\n🔧 故障排除建议:'));
    console.log('1. 检查 config.template.js 文件是否存在');
    console.log('2. 检查 config.template.js 文件语法是否正确');
    console.log('3. 确保有足够的文件系统权限');
    console.log('4. 检查 src/lib/config/ 目录是否存在');
    console.log('5. 如有问题，可查看生成的备份文件\n');
    process.exit(1);
  }
}

// 运行脚本
main();

export { main };