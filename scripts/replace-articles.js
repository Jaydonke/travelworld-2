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

async function replaceArticles() {
  console.log('🔄 文章替换脚本启动');
  console.log('=' * 60);
  console.log('🎯 这个脚本将删除指定的损坏文章并重新处理HTML文件');
  console.log('=' * 60);

  // 要替换的文章列表
  const articlesToReplace = [
    'low-cost-startups-proven-strategies-for-entrepreneurs',
    'boost-your-savings-proven-cashback-strategies-explained',
    'discover-top-ai-money-tools-for-financial-success',
    'beginner-investing-a-step-by-step-guide-to-investing',
    'profitable-microservices-a-guide-to-implementation'
  ];

  const articlesDir = path.join(__dirname, '../src/content/articles');
  const imagesDir = path.join(__dirname, '../src/assets/images/articles');

  try {
    // 阶段1: 删除损坏的文章
    console.log('\n📋 阶段1: 删除损坏的文章');
    console.log('-' * 40);

    for (const articleSlug of articlesToReplace) {
      const articlePath = path.join(articlesDir, articleSlug);
      const imagePath = path.join(imagesDir, articleSlug);

      if (fs.existsSync(articlePath)) {
        fs.rmSync(articlePath, { recursive: true, force: true });
        console.log(`🗑️  删除文章: ${articleSlug}`);
      }

      if (fs.existsSync(imagePath)) {
        fs.rmSync(imagePath, { recursive: true, force: true });
        console.log(`🗑️  删除图片: ${articleSlug}`);
      }
    }

    // 阶段2: 重新处理HTML文件
    console.log('\n📋 阶段2: 重新处理HTML文件');
    console.log('-' * 40);

    await runCommand('npm run convert-html', '转换HTML文章到MDX格式');
    await runCommand('npm run fix-images', '修复图片路径格式');
    await runCommand('npm run fix-all', '修复文章格式和封面图片');

    // 阶段3: 预防性修复
    console.log('\n📋 阶段3: 预防性修复');
    console.log('-' * 40);

    await runCommand('npm run fix-images-comprehensive', '全面检查和修复图片问题');
    await runCommand('npm run fix-cover-paths', '修复封面路径为@assets别名');
    await runCommand('npm run fix-mdx-codeblocks', '修复MDX代码块格式');

    // 阶段4: 验证和清理
    console.log('\n📋 阶段4: 验证和清理');
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

    console.log('\n🎉 文章替换完成！');
    console.log('=' * 60);
    console.log('✅ 已替换的文章:');
    articlesToReplace.forEach(article => {
      console.log(`   ✅ ${article}`);
    });
    console.log('=' * 60);
    console.log('💡 现在可以访问 http://localhost:4323 查看网站');
    console.log('📝 所有损坏的图片和封面已更新为正常版本');

  } catch (error) {
    console.error('\n❌ 文章替换失败:', error.message);
    console.log('💡 请检查错误信息并手动修复问题');
    console.log('🔧 可以尝试运行以下命令进行修复:');
    console.log('   npm run super-automation');
    console.log('   npm run smart-fix');
    process.exit(1);
  }
}

replaceArticles(); 