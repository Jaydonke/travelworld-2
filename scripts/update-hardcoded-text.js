#!/usr/bin/env node

/**
 * 更新硬编码文本脚本
 * 
 * 功能：将所有硬编码的BlogTonic/Blogsmith文本替换为OptiNook
 * 使用方法：npm run update-hardcoded-text
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// 需要更新的文件和替换规则
const REPLACEMENTS = [
  {
    files: [
      'src/components/Hero/Hero.astro',
      'src/components/Hero/HeroImage.astro',
      'src/components/Hero/HeroWave.astro'
    ],
    replacements: [
      { from: 'BlogTonic', to: 'OptiNook' },
      { from: 'Blogtonic', to: 'OptiNook' },
      { from: 'blogtonic', to: 'optinook' }
    ]
  },
  {
    files: [
      'src/components/Nav/Nav.astro',
      'src/components/Nav/MobileNav/MobileNav.astro'
    ],
    replacements: [
      { from: 'Get BlogTonic Pro!', to: 'Get OptiNook Pro!' },
      { from: 'https://cosmicthemes.com/themes/blogsmith-pro/', to: 'https://optinook.com/pro' }
    ]
  },
  {
    files: [
      'src/pages/contact.astro',
      'src/pages/overview.astro'
    ],
    replacements: [
      { from: 'BlogTonic', to: 'OptiNook' },
      { from: 'Blogsmith', to: 'OptiNook' }
    ]
  }
];

async function updateFile(filePath, replacements) {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    // 读取文件
    let content = await fs.readFile(fullPath, 'utf-8');
    const originalContent = content;
    
    // 应用所有替换
    let changeCount = 0;
    for (const { from, to } of replacements) {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from, 'g'), to);
        changeCount++;
        console.log(colors.cyan(`   ✅ 替换: "${from}" → "${to}"`));
      }
    }
    
    // 如果有更改，写入文件
    if (content !== originalContent) {
      // 先尝试删除原文件
      try {
        await fs.unlink(fullPath);
      } catch (err) {
        // 忽略删除错误
      }
      
      // 创建新文件
      await fs.writeFile(fullPath, content, 'utf-8');
      console.log(colors.green(`   ✅ 文件更新成功: ${path.basename(filePath)} (${changeCount} 处替换)`));
      return changeCount;
    } else {
      console.log(colors.yellow(`   ℹ️  文件无需更新: ${path.basename(filePath)}`));
      return 0;
    }
    
  } catch (error) {
    console.error(colors.red(`   ❌ 更新失败: ${error.message}`));
    return 0;
  }
}

async function main() {
  console.log(colors.bold(colors.cyan('\n🚀 OptiNook 硬编码文本更新工具\n')));
  console.log('此工具将更新所有硬编码的BlogTonic/Blogsmith文本');
  console.log(colors.yellow('⚠️  请确保已关闭开发服务器\n'));
  
  try {
    let totalUpdates = 0;
    
    // 处理每组文件
    for (const group of REPLACEMENTS) {
      for (const file of group.files) {
        console.log(colors.blue(`\n🔄 正在更新: ${file}`));
        const updates = await updateFile(file, group.replacements);
        totalUpdates += updates;
      }
    }
    
    // 显示统计
    console.log(colors.bold('\n📊 更新统计:'));
    console.log(`   文件数量: ${colors.cyan(REPLACEMENTS.reduce((acc, g) => acc + g.files.length, 0))}`);
    console.log(`   更新项数: ${colors.cyan(totalUpdates)}`);
    
    if (totalUpdates > 0) {
      console.log(colors.green(colors.bold('\n🎉 文本更新完成！')));
      console.log(colors.yellow('\n📌 下一步操作:'));
      console.log('1. 运行 npm run dev 查看更改效果');
      console.log('2. 检查网站是否正常显示OptiNook品牌\n');
    } else {
      console.log(colors.yellow(colors.bold('\n📌 所有文件已是最新状态！\n')));
    }
    
  } catch (error) {
    console.error(colors.red(colors.bold('\n💥 更新过程中发生错误:')), error.message);
    console.log(colors.yellow('\n🔧 故障排除建议:'));
    console.log('1. 确保已关闭开发服务器 (Ctrl+C)');
    console.log('2. 检查文件权限');
    console.log('3. 尝试重启命令行工具\n');
    process.exit(1);
  }
}

// 运行脚本
main();

export { main };