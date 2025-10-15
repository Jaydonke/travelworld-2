#!/usr/bin/env node

/**
 * 完整配置同步脚本
 * 
 * 功能：一键同步所有配置并应用到组件
 * 使用方法：npm run full-config-sync
 */

import { spawn } from 'child_process';
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

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..')
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log(colors.bold(colors.cyan('\n🚀 完整配置同步工具\n')));
  console.log('此工具将执行以下操作:');
  console.log('1. 同步 config.template.js 到配置文件（包含颜色主题）');
  console.log('2. 应用UI配置到组件文件');
  console.log(colors.yellow('\n⚠️  此操作将修改多个文件（会创建备份）\n'));

  try {
    // 步骤1: 同步配置模板（已包含颜色主题更新）
    console.log(colors.blue('\n📋 步骤 1/2: 同步配置模板...\n'));
    await runCommand('npm', ['run', 'sync-config-template']);
    
    // 步骤2: 应用UI配置（可选）
    console.log(colors.blue('\n📋 步骤 2/2: 应用UI配置到组件...\n'));
    try {
      await runCommand('npm', ['run', 'apply-ui-config']);
    } catch (err) {
      console.log(colors.yellow('⚠️  UI配置应用失败，可能需要手动更新某些组件'));
    }
    
    // 完成
    console.log(colors.green(colors.bold('\n🎉 完整配置同步完成！\n')));
    console.log('所有配置已成功同步到网站');
    
    console.log(colors.yellow('\n📌 下一步操作:'));
    console.log('1. 运行 npm run dev 查看更改');
    console.log('2. 检查网站所有页面是否正常');
    console.log('3. 如需修改配置，编辑 config.template.js 然后重新运行此命令\n');
    
    console.log(colors.cyan('💡 提示:'));
    console.log('- 所有文本内容现在都可以在 config.template.js 中集中管理');
    console.log('- 修改配置后运行: npm run full-config-sync');
    console.log('- 备份文件保存在原文件同目录下\n');
    
  } catch (error) {
    console.error(colors.red(colors.bold('\n💥 同步过程中发生错误:')), error.message);
    console.log(colors.yellow('\n🔧 故障排除建议:'));
    console.log('1. 检查 config.template.js 语法是否正确');
    console.log('2. 确保所有必要的文件都存在');
    console.log('3. 检查是否有足够的文件权限');
    console.log('4. 尝试单独运行失败的步骤进行调试\n');
    process.exit(1);
  }
}

// 运行脚本
main();

export { main };