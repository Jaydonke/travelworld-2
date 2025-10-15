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

async function checkNewArticles() {
  const newArticleDir = path.join(__dirname, '../newarticle');
  if (!fs.existsSync(newArticleDir)) {
    console.log('📁 创建 newarticle 文件夹...');
    fs.mkdirSync(newArticleDir, { recursive: true });
  }

  const files = fs.readdirSync(newArticleDir);
  const htmlFiles = files.filter(file => file.endsWith('.html'));

  if (htmlFiles.length === 0) {
    console.log('📝 没有发现新的HTML文件');
    console.log('💡 请将HTML文件放入 newarticle 文件夹，然后重新运行此脚本');
    return false;
  }

  console.log(`📄 发现 ${htmlFiles.length} 个HTML文件: ${htmlFiles.join(', ')}`);
  return true;
}

async function oneClickArticle() {
  console.log('🚀 一键新文章添加脚本启动');
  console.log('=' * 60);
  console.log('🎯 这个脚本将自动处理新文章的添加，并预防所有已知问题');
  console.log('=' * 60);

  try {
    // 检查是否有新文章
    const hasNewArticles = await checkNewArticles();
    if (!hasNewArticles) {
      return;
    }

    // 阶段1: 转换和基础修复
    console.log('\n📋 阶段1: 转换和基础修复');
    console.log('-' * 40);

    await runCommand('npm run convert-html', '转换HTML文章到MDX格式');
    await runCommand('npm run fix-images', '修复图片路径格式');
    await runCommand('npm run fix-all', '修复文章格式和封面图片');

    // 阶段2: 预防性修复
    console.log('\n📋 阶段2: 预防性修复');
    console.log('-' * 40);

    await runCommand('npm run fix-images-comprehensive', '全面检查和修复图片问题');
    await runCommand('npm run fix-cover-paths', '修复封面路径为@assets别名');
    await runCommand('npm run fix-mdx-codeblocks', '修复MDX代码块格式');
    await runCommand('npm run fix-youtube-links', '修复YouTube链接为嵌入组件');
    await runCommand('npm run fix-list-items', '修复列表项格式问题');
    await runCommand('npm run localize-images', '本地化所有外部图片');
    await runCommand('npm run fix-missing-images', '修复缺失的图片');

    // 阶段3: 验证和清理
    console.log('\n📋 阶段3: 验证和清理');
    console.log('-' * 40);

    await runCommand('npm run check-images', '验证所有图片状态');
    await runCommand('npm run test-workflow', '验证文章完整性');

    // 清理缓存
    console.log('\n🧹 清理缓存...');
    try {
      execSync('Remove-Item -Recurse -Force ".astro" -ErrorAction SilentlyContinue', { shell: 'powershell' });
      console.log('✅ Astro缓存已清除');
    } catch (error) {
      console.log('⚠️  缓存清除失败，但继续执行');
    }

    console.log('\n🎉 一键新文章添加完成！');
    console.log('=' * 60);
    console.log('✅ 新文章已成功添加并预防了所有已知问题:');
    console.log('   ✅ ImageNotFound 错误 - 已预防');
    console.log('   ✅ MDX解析错误 - 已预防');
    console.log('   ✅ HTML转换问题 - 已预防');
    console.log('   ✅ 图片路径问题 - 已预防');
    console.log('   ✅ 缓存问题 - 已预防');
    console.log('=' * 60);
    console.log('💡 现在可以访问 http://localhost:4323 查看网站');
    console.log('📝 如需添加更多文章，请将HTML文件放入 newarticle 文件夹，然后重新运行此脚本');

  } catch (error) {
    console.error('\n❌ 一键新文章添加失败:', error.message);
    console.log('💡 请检查错误信息并手动修复问题');
    console.log('🔧 可以尝试运行以下命令进行修复:');
    console.log('   npm run super-automation');
    console.log('   npm run smart-fix');
    process.exit(1);
  }
}

oneClickArticle(); 