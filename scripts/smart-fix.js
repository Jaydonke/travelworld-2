#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} 完成`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} 失败: ${error.message}`);
    throw error;
  }
}

async function checkForIssues() {
  console.log('🔍 智能检测问题...');

  const issues = {
    imageProblems: false,
    mdxProblems: false,
    cacheProblems: false
  };

  try {
    // 检查图片状态
    const imageCheck = execSync('npm run check-images', { encoding: 'utf8', stdio: 'pipe' });
    if (imageCheck.includes('❌ 缺失图片') || imageCheck.includes('⚠️  损坏图片')) {
      issues.imageProblems = true;
      console.log('⚠️  检测到图片问题');
    }
  } catch (error) {
    issues.imageProblems = true;
    console.log('⚠️  检测到图片问题');
  }

  // 检查MDX文件是否有格式问题
  const articlesDir = path.join(__dirname, '../src/content/articles');
  if (fs.existsSync(articlesDir)) {
    const items = fs.readdirSync(articlesDir);
    for (const item of items) {
      const mdxPath = path.join(articlesDir, item, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        const content = fs.readFileSync(mdxPath, 'utf8');
        if (content.includes('@media') && !content.includes('```css')) {
          issues.mdxProblems = true;
          console.log('⚠️  检测到MDX代码块格式问题');
          break;
        }
      }
    }
  }

  // 检查缓存问题
  if (fs.existsSync(path.join(__dirname, '../.astro'))) {
    issues.cacheProblems = true;
    console.log('⚠️  检测到缓存问题');
  }

  return issues;
}

async function smartFix() {
  console.log('🧠 智能修复脚本启动');
  console.log('=' * 50);
  console.log('🎯 这个脚本会智能检测问题并只修复发现的问题');
  console.log('=' * 50);

  try {
    // 检测问题
    const issues = await checkForIssues();

    let fixesApplied = 0;

    // 根据检测结果修复问题
    if (issues.imageProblems) {
      console.log('\n📋 修复图片问题...');
      console.log('-' * 30);
      await runCommand('npm run fix-images-comprehensive', '全面修复图片问题');
      await runCommand('npm run fix-cover-paths', '修复封面路径');
      fixesApplied++;
    }

    if (issues.mdxProblems) {
      console.log('\n📋 修复MDX格式问题...');
      console.log('-' * 30);
      await runCommand('npm run fix-mdx-codeblocks', '修复MDX代码块格式');
      fixesApplied++;
    }

    // 检查YouTube链接问题
    const articlesDir = path.join(__dirname, '../src/content/articles');
    if (fs.existsSync(articlesDir)) {
      const items = fs.readdirSync(articlesDir);
      let hasYouTubeLinks = false;
      
      for (const item of items) {
        const mdxPath = path.join(articlesDir, item, 'index.mdx');
        if (fs.existsSync(mdxPath)) {
          const content = fs.readFileSync(mdxPath, 'utf8');
          if (content.includes('youtube.com/watch') && !content.includes('<YouTubeEmbed')) {
            hasYouTubeLinks = true;
            break;
          }
        }
      }
      
      if (hasYouTubeLinks) {
        console.log('\n📋 修复YouTube链接问题...');
        console.log('-' * 30);
        await runCommand('npm run fix-youtube-links', '修复YouTube链接为嵌入组件');
        fixesApplied++;
      }
    }

    if (issues.cacheProblems) {
      console.log('\n📋 清理缓存...');
      console.log('-' * 30);
      try {
        execSync('Remove-Item -Recurse -Force ".astro" -ErrorAction SilentlyContinue', { shell: 'powershell' });
        console.log('✅ Astro缓存已清除');
        fixesApplied++;
      } catch (error) {
        console.log('⚠️  缓存清除失败');
      }
    }

    if (fixesApplied === 0) {
      console.log('\n🎉 没有发现需要修复的问题！');
      console.log('✅ 网站状态良好，无需修复');
    } else {
      console.log('\n🎉 智能修复完成！');
      console.log(`🔧 应用了 ${fixesApplied} 个修复`);

      // 最终验证
      console.log('\n📋 最终验证...');
      console.log('-' * 30);
      await runCommand('npm run check-images', '验证图片状态');
    }

    console.log('\n💡 现在可以访问 http://localhost:4323 查看网站');

  } catch (error) {
    console.error('\n❌ 智能修复失败:', error.message);
    console.log('💡 建议运行完整修复脚本: npm run super-automation');
    process.exit(1);
  }
}

smartFix(); 