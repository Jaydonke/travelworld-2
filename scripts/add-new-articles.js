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

async function main() {
  console.log('🚀 新文章自动化添加脚本启动');
  console.log('=' * 50);

  try {
    // 1. 转换HTML到MDX
    await runCommand('npm run convert-html', '转换HTML文章到MDX格式');

    // 2. 修复图片路径
    await runCommand('npm run fix-images', '修复图片路径格式');

    // 3. 修复所有格式问题
    await runCommand('npm run fix-all', '修复文章格式和封面图片');

    // 4. 测试工作流程
    await runCommand('npm run test-workflow', '验证文章完整性');

    console.log('\n🎉 新文章添加流程完成！');
    console.log('💡 现在可以访问 http://localhost:4321 查看网站');
    console.log('📝 如需添加更多文章，请将HTML文件放入 newarticle 文件夹，然后重新运行此脚本');

  } catch (error) {
    console.error('\n❌ 自动化流程失败:', error.message);
    console.log('💡 请检查错误信息并手动修复问题');
    process.exit(1);
  }
}

main(); 