#!/usr/bin/env node

/**
 * UI配置应用脚本
 * 
 * 功能：将config中的UI配置应用到各个组件文件
 * 使用方法：npm run apply-ui-config
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文件路径配置
const CONFIG_FILE = path.join(process.cwd(), 'src/lib/config/index.ts');

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// 组件文件映射
const COMPONENT_MAPPINGS = [
  {
    name: 'Hero Component',
    files: [
      'src/components/Hero/Hero.astro',
      'src/components/Hero/HeroImage.astro'
    ],
    updates: [
      // Note: These hero config items don't exist in the current config structure
      // Commenting them out to prevent errors
      // {
      //   old: '"Welcome to BlogTonic"',
      //   configPath: 'UI_CONFIG.hero.welcomeText + " " + UI_CONFIG.hero.siteName',
      //   description: 'Welcome text'
      // },
      // {
      //   old: '"Subscribe"',
      //   configPath: 'UI_CONFIG.hero.subscribeButton',
      //   description: 'Subscribe button text'
      // },
      {
        old: '"Email"',
        configPath: 'NEWSLETTER_CONFIG.emailPlaceholder',
        description: 'Email placeholder'
      }
    ]
  },
  {
    name: 'Newsletter Component',
    files: ['src/components/Newsletter/Newsletter.astro'],
    updates: [
      {
        old: '"In the know"',
        configPath: 'UI_CONFIG.newsletter.title',
        description: 'Newsletter title'
      },
      {
        old: '"Subscribe to get my newest posts straight to your inbox."',
        configPath: 'UI_CONFIG.newsletter.description',
        description: 'Newsletter description'
      },
      {
        old: '"I won\'t send you spam. Unsubscribe at any time."',
        configPath: 'UI_CONFIG.newsletter.disclaimer',
        description: 'Newsletter disclaimer'
      }
    ]
  },
  {
    name: 'Navigation Component',
    files: ['src/components/Nav/Nav.astro'],
    updates: [
      {
        old: '"Get BlogTonic Pro!"',
        configPath: 'UI_CONFIG.navigation.ctaButton.text',
        description: 'CTA button text'
      },
      {
        old: 'href="https://cosmicthemes.com/themes/blogsmith-pro/"',
        configPath: 'href={UI_CONFIG.navigation.ctaButton.url}',
        description: 'CTA button URL'
      }
    ]
  },
  {
    name: 'Home Page',
    files: ['src/pages/index.astro'],
    updates: [
      {
        old: '"Recent Blog Posts"',
        configPath: 'UI_CONFIG.homePage.recentPostsTitle',
        description: 'Recent posts title'
      },
      {
        old: '"All Posts"',
        configPath: 'UI_CONFIG.homePage.allPostsButton',
        description: 'All posts button'
      }
    ]
  },
  {
    name: '404 Page',
    files: ['src/pages/404.astro'],
    updates: [
      {
        old: '"Page not found!"',
        configPath: 'UI_CONFIG.errorPages.notFound.title',
        description: '404 title'
      },
      {
        old: '"Apologies, one of our links must have broken. Please try again or go back to the homepage."',
        configPath: 'UI_CONFIG.errorPages.notFound.message',
        description: '404 message'
      },
      {
        old: '"Go to homepage"',
        configPath: 'UI_CONFIG.errorPages.notFound.homeButton',
        description: 'Home button text'
      }
    ]
  },
  {
    name: 'Categories Page',
    files: ['src/pages/categories/index.astro'],
    updates: [
      {
        old: '"All Categories"',
        configPath: 'UI_CONFIG.categoriesPage.title',
        description: 'Categories page title'
      },
      {
        old: '"Browse articles by category"',
        configPath: 'UI_CONFIG.categoriesPage.description',
        description: 'Categories description'
      },
      {
        old: '"No categories found."',
        configPath: 'UI_CONFIG.categoriesPage.emptyMessage',
        description: 'Empty categories message'
      }
    ]
  },
  {
    name: 'Contact Form',
    files: ['src/components/ContactForm/ContactForm.astro'],
    updates: [
      {
        old: '"Inputs marked with * are required."',
        configPath: 'UI_CONFIG.contactForm.requiredNote',
        description: 'Required fields note'
      },
      {
        old: '"Send"',
        configPath: 'UI_CONFIG.contactForm.submitButton',
        description: 'Submit button text'
      }
    ]
  },
  {
    name: 'Search Component',
    files: ['src/components/Search/Search.astro'],
    updates: [
      {
        old: '"Cancel"',
        configPath: 'UI_CONFIG.search.cancelButton',
        description: 'Cancel button'
      }
    ]
  }
];

async function loadConfig() {
  console.log(colors.blue('📖 正在读取配置文件...'));
  
  try {
    const configContent = await fs.readFile(CONFIG_FILE, 'utf-8');
    
    // 检查是否包含新的UI配置
    if (!configContent.includes('UI_CONFIG')) {
      console.error(colors.red('❌ 配置文件中未找到UI_CONFIG'));
      console.log(colors.yellow('💡 请先运行: npm run sync-config-template'));
      return null;
    }
    
    console.log(colors.green('✅ 配置文件读取成功'));
    return true;
    
  } catch (error) {
    console.error(colors.red('❌ 读取配置文件失败:'), error.message);
    return null;
  }
}

async function updateComponent(componentConfig) {
  const { name, files, updates } = componentConfig;
  console.log(colors.blue(`\n🔄 正在更新: ${name}`));
  
  let updatedCount = 0;
  
  for (const filePath of files) {
    const fullPath = path.join(process.cwd(), filePath);
    
    try {
      // 检查文件是否存在
      await fs.access(fullPath);
      
      // 读取文件内容
      let content = await fs.readFile(fullPath, 'utf-8');
      const originalContent = content;
      
      // 检查是否需要添加配置导入
      if (!content.includes('import { UI_CONFIG }') && !content.includes('from "@/lib/config"')) {
        // 在文件开头添加导入语句
        const importStatement = 'import { UI_CONFIG } from "@/lib/config";\n';
        
        // 查找合适的位置插入导入语句
        const astroFrontmatterStart = content.indexOf('---');
        if (astroFrontmatterStart !== -1) {
          const astroFrontmatterEnd = content.indexOf('---', astroFrontmatterStart + 3);
          if (astroFrontmatterEnd !== -1) {
            // 在frontmatter中添加导入
            const beforeFrontmatter = content.substring(0, astroFrontmatterStart + 3);
            const frontmatter = content.substring(astroFrontmatterStart + 3, astroFrontmatterEnd);
            const afterFrontmatter = content.substring(astroFrontmatterEnd);
            
            // 检查是否已有其他导入语句
            if (frontmatter.includes('import')) {
              // 在现有导入语句后添加
              const lastImportIndex = frontmatter.lastIndexOf('import');
              const nextLineIndex = frontmatter.indexOf('\n', lastImportIndex);
              const beforeImports = frontmatter.substring(0, nextLineIndex + 1);
              const afterImports = frontmatter.substring(nextLineIndex + 1);
              content = beforeFrontmatter + beforeImports + importStatement + afterImports + afterFrontmatter;
            } else {
              // 在frontmatter开头添加
              content = beforeFrontmatter + '\n' + importStatement + frontmatter + afterFrontmatter;
            }
          }
        }
      }
      
      // 应用更新
      for (const update of updates) {
        if (content.includes(update.old)) {
          // 替换为配置引用
          const replacement = `{${update.configPath}}`;
          content = content.replace(new RegExp(update.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
          console.log(colors.cyan(`   ✅ 更新: ${update.description}`));
          updatedCount++;
        }
      }
      
      // 如果有更改，写入文件
      if (content !== originalContent) {
        // 创建备份
        const backupPath = fullPath + '.backup.' + Date.now();
        await fs.writeFile(backupPath, originalContent, 'utf-8');
        console.log(colors.cyan(`   💾 创建备份: ${path.basename(backupPath)}`));
        
        // 写入更新后的内容
        await fs.writeFile(fullPath, content, 'utf-8');
        console.log(colors.green(`   ✅ 文件更新成功: ${path.basename(filePath)}`));
      } else {
        console.log(colors.yellow(`   ℹ️  文件无需更新: ${path.basename(filePath)}`));
      }
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(colors.yellow(`   ⚠️  文件不存在: ${filePath}`));
      } else {
        console.error(colors.red(`   ❌ 更新失败: ${error.message}`));
      }
    }
  }
  
  return updatedCount;
}

async function main() {
  console.log(colors.bold(colors.cyan('\n🚀 OptiNook UI配置应用工具\n')));
  console.log('此工具将UI配置应用到各个组件文件');
  console.log(colors.yellow('⚠️  原文件将被修改（会创建备份）\n'));
  
  try {
    // 1. 加载配置
    const config = await loadConfig();
    if (!config) {
      process.exit(1);
    }
    
    // 2. 更新各个组件
    let totalUpdates = 0;
    for (const component of COMPONENT_MAPPINGS) {
      const updates = await updateComponent(component);
      totalUpdates += updates;
    }
    
    // 3. 显示统计
    console.log(colors.bold('\n📊 更新统计:'));
    console.log(`   组件数量: ${colors.cyan(COMPONENT_MAPPINGS.length)}`);
    console.log(`   更新项数: ${colors.cyan(totalUpdates)}`);
    
    if (totalUpdates > 0) {
      console.log(colors.green(colors.bold('\n🎉 UI配置应用完成！')));
      console.log(colors.yellow('\n📌 下一步操作:'));
      console.log('1. 运行 npm run dev 查看更改效果');
      console.log('2. 检查各个页面是否正常显示');
      console.log('3. 如需回滚，可使用生成的备份文件\n');
    } else {
      console.log(colors.yellow(colors.bold('\n📌 所有组件已是最新状态！\n')));
    }
    
  } catch (error) {
    console.error(colors.red(colors.bold('\n💥 应用过程中发生错误:')), error.message);
    console.log(colors.yellow('\n🔧 故障排除建议:'));
    console.log('1. 确保已运行 npm run sync-config-template');
    console.log('2. 检查组件文件是否存在');
    console.log('3. 检查文件权限\n');
    process.exit(1);
  }
}

// 运行脚本
main();

export { main };