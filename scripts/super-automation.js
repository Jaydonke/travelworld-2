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

async function clearAstroCache() {
  console.log('\n🧹 清除Astro缓存...');
  try {
    execSync('Remove-Item -Recurse -Force ".astro" -ErrorAction SilentlyContinue', { shell: 'powershell' });
    execSync('Remove-Item -Recurse -Force "node_modules/.vite" -ErrorAction SilentlyContinue', { shell: 'powershell' });
    console.log('✅ Astro缓存已清除');
  } catch (error) {
    console.log('⚠️  缓存清除失败，但继续执行');
  }
}

async function superAutomation() {
  console.log('🚀 超级自动化脚本启动 - 一键解决所有问题！');
  console.log('=' * 70);
  console.log('🎯 这个脚本将自动处理以下所有问题:');
  console.log('   • ImageNotFound 错误');
  console.log('   • MDX解析错误');
  console.log('   • HTML到MDX转换问题');
  console.log('   • YAML格式问题');
  console.log('   • 图片路径和缓存问题');
  console.log('=' * 70);

  try {
    // 阶段1: 基础转换和修复
    console.log('\n📋 阶段1: 基础转换和修复');
    console.log('-' * 40);

    await runCommand('npm run convert-html', '转换HTML文章到MDX格式');
    await runCommand('npm run fix-images', '修复图片路径格式');
    await runCommand('npm run fix-all', '修复文章格式和封面图片');

    // 阶段2: 图片问题全面修复
    console.log('\n📋 阶段2: 图片问题全面修复');
    console.log('-' * 40);

    await runCommand('npm run fix-images-comprehensive', '全面检查和修复图片问题');
    await runCommand('npm run fix-cover-paths', '修复封面路径为@assets别名');
    await runCommand('npm run check-images', '验证所有图片状态');

    // 阶段3: MDX格式修复
    console.log('\n📋 阶段3: MDX格式修复');
    console.log('-' * 40);

    await runCommand('npm run fix-mdx-codeblocks', '修复MDX代码块格式');
    await runCommand('npm run fix-youtube-links', '修复YouTube链接为嵌入组件');
    await runCommand('npm run fix-list-items', '修复列表项格式问题');
    await runCommand('npm run localize-images', '本地化所有外部图片');
    await runCommand('npm run fix-missing-images', '修复缺失的图片');

    // 阶段4: 缓存清理和验证
    console.log('\n📋 阶段4: 缓存清理和验证');
    console.log('-' * 40);

    await clearAstroCache();
    await runCommand('npm run test-workflow', '验证文章完整性');

    // 阶段5: 最终检查
    console.log('\n📋 阶段5: 最终检查');
    console.log('-' * 40);

    await runCommand('npm run check-images', '最终图片状态检查');

    console.log('\n🎉 超级自动化流程完成！');
    console.log('=' * 70);
    console.log('✅ 所有已知问题已自动修复:');
    console.log('   ✅ ImageNotFound 错误 - 已解决');
    console.log('   ✅ MDX解析错误 - 已解决');
    console.log('   ✅ HTML转换问题 - 已解决');
    console.log('   ✅ 图片路径问题 - 已解决');
    console.log('   ✅ 缓存问题 - 已解决');
    console.log('=' * 70);
    console.log('💡 现在可以访问 http://localhost:4323 查看网站');
    console.log('📝 如需添加更多文章，请将HTML文件放入 newarticle 文件夹，然后重新运行此脚本');
    console.log('\n🔧 可用的维护命令:');
    console.log('   npm run super-automation        - 运行此超级自动化脚本');
    console.log('   npm run check-images            - 检查图片状态');
    console.log('   npm run fix-images-comprehensive - 全面修复图片问题');
    console.log('   npm run fix-mdx-codeblocks      - 修复MDX代码块格式');

  } catch (error) {
    console.error('\n❌ 超级自动化流程失败:', error.message);
    console.log('💡 请检查错误信息并手动修复问题');
    console.log('🔧 可以尝试运行以下命令进行修复:');
    console.log('   npm run fix-images-comprehensive');
    console.log('   npm run fix-mdx-codeblocks');
    console.log('   npm run check-images');
    process.exit(1);
  }
}

superAutomation(); 