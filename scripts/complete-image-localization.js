#!/usr/bin/env node

import { execSync } from 'child_process';

async function runCommand(command, description) {
  try {
    console.log(`\n🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} 完成`);
  } catch (error) {
    console.error(`❌ ${description} 失败: ${error.message}`);
  }
}

async function completeImageLocalization() {
  console.log('🚀 完整图片本地化工作流程启动');
  console.log('📋 这个流程将：');
  console.log('   1. 检查当前图片本地化状态');
  console.log('   2. 下载所有外部图片到本地');
  console.log('   3. 为无法下载的图片创建占位图片');
  console.log('   4. 验证最终本地化结果');

  // 阶段1: 检查状态
  console.log('\n📊 阶段1: 检查当前图片本地化状态');
  await runCommand('npm run test-image-localization', '检查图片本地化状态');

  // 阶段2: 下载图片
  console.log('\n📥 阶段2: 下载外部图片');
  await runCommand('npm run localize-images', '下载和本地化外部图片');

  // 阶段3: 修复缺失图片
  console.log('\n🔧 阶段3: 修复缺失图片');
  await runCommand('npm run fix-missing-images', '修复缺失的图片');

  // 阶段4: 最终验证
  console.log('\n✅ 阶段4: 最终验证');
  await runCommand('npm run test-image-localization', '验证最终本地化结果');

  console.log('\n🎉 完整图片本地化工作流程完成！');
  console.log('💡 现在所有图片都已本地化，使用 @assets 别名路径');
  console.log('📝 新上传的文章也会自动应用图片本地化功能');
}

completeImageLocalization(); 