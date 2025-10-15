#!/usr/bin/env node

/**
 * 多网站自动化生成和部署脚本
 * 从Excel/CSV配置文件读取多个网站配置，依次生成并部署
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readWebsitesConfig, validateWebsiteConfig } from './utils/excel-reader.js';
import { writeConfig, updateAstroConfig, writeAdsenseConfig, backupConfig } from './utils/config-writer.js';
import { autoDeployToGitHub } from './github-auto-deploy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 执行shell命令
 */
function exec(command, silent = false) {
  try {
    return execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '..')
    });
  } catch (error) {
    throw new Error(`命令执行失败: ${command}\n${error.message}`);
  }
}

/**
 * 运行reset-site的13个步骤
 */
async function runResetSite() {
  log('\n🔄 开始执行 reset-site 流程...', 'cyan');

  const tasks = [
    {
      name: '清空HTML文章',
      command: 'node scripts/clear-html-articles.js'
    },
    {
      name: '删除所有现有文章',
      command: 'npm run delete-all-articles'
    },
    {
      name: '更新主题配置',
      command: 'npm run update-theme-fixed'
    },
    {
      name: '更新文章配置并重置追踪',
      command: 'npm run update-articles-full'
    },
    {
      name: '生成文章',
      command: 'npm run generate-articles'
    },
    {
      name: '同步配置到模板',
      command: 'npm run sync-config'
    },
    {
      name: '添加新文章到网站',
      command: 'npm run add-articles-improved'
    },
    {
      name: '生成新主题方向',
      command: 'npm run generate-new-topics'
    },
    {
      name: '生成15篇定时发布文章',
      command: 'npm run generate-articles -- -s -k 25 -c 15'
    },
    {
      name: '设置文章定时发布',
      command: 'npm run schedule-articles'
    },
    {
      name: '生成AI图标',
      command: 'npm run generate-ai-favicon'
    },
    {
      name: '生成图标文件',
      command: 'npm run generate-favicon'
    },
    {
      name: '更新网站图标',
      command: 'npm run update-favicon'
    }
  ];

  let successCount = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    log(`\n[${i + 1}/${tasks.length}] ${task.name}`, 'cyan');

    try {
      exec(task.command);
      log(`   ✅ ${task.name} 完成`, 'green');
      successCount++;
    } catch (error) {
      log(`   ❌ ${task.name} 失败`, 'red');
      log(`   错误: ${error.message}`, 'red');

      // 关键任务失败则停止
      if (i < 5) {
        throw new Error(`关键任务失败: ${task.name}`);
      }
    }
  }

  log(`\n✅ reset-site 完成 (${successCount}/${tasks.length} 个任务成功)`, 'green');
  return successCount === tasks.length;
}

/**
 * 处理单个网站
 */
async function processSingleWebsite(config, index, total) {
  log('\n\n', 'reset');
  log('═══════════════════════════════════════════════════════════', 'bright');
  log(`   网站 ${index}/${total}: ${config.siteName}`, 'bright');
  log('═══════════════════════════════════════════════════════════', 'bright');

  const startTime = Date.now();

  try {
    // 1. 验证配置
    log('\n📋 验证网站配置...', 'cyan');
    if (!validateWebsiteConfig(config)) {
      throw new Error('网站配置验证失败');
    }
    log(`   主题: ${config.theme}`, 'blue');
    log(`   域名: ${config.domain}`, 'blue');
    log(`   网站名: ${config.siteName}`, 'blue');
    if (config.adsenseCode) {
      log(`   AdSense: ${config.adsenseCode}`, 'blue');
    }

    // 2. 备份当前配置
    log('\n💾 备份当前配置...', 'cyan');
    backupConfig();

    // 3. 写入新配置
    log('\n✍️  写入网站配置...', 'cyan');
    writeConfig(config);
    updateAstroConfig(config.domain);
    if (config.adsenseCode) {
      writeAdsenseConfig(config.adsenseCode);
    }

    // 4. 执行reset-site流程
    log('\n🚀 执行网站生成流程...', 'cyan');
    const resetSuccess = await runResetSite();

    if (!resetSuccess) {
      log('\n⚠️  部分任务失败，但将继续部署', 'yellow');
    }

    // 5. 自动部署到GitHub
    log('\n📦 自动部署到GitHub...', 'cyan');
    const deployResult = await autoDeployToGitHub(config.siteName, index);

    if (!deployResult.success) {
      throw new Error(`GitHub部署失败: ${deployResult.error}`);
    }

    // 保存部署信息
    log('\n📊 部署信息:', 'cyan');
    log(`   仓库: ${deployResult.repoUrl}`, 'blue');
    log(`   网站: ${deployResult.siteUrl}`, 'blue');

    const elapsedTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    log(`\n🎉 网站 "${config.siteName}" 生成并部署成功！`, 'green');
    log(`   用时: ${elapsedTime} 分钟`, 'blue');

    return true;

  } catch (error) {
    const elapsedTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    log(`\n❌ 网站 "${config.siteName}" 处理失败`, 'red');
    log(`   错误: ${error.message}`, 'red');
    log(`   用时: ${elapsedTime} 分钟`, 'blue');
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n', 'reset');
  log('███████████████████████████████████████████████████████████', 'bright');
  log('█                                                         █', 'bright');
  log('█      多网站自动化生成和部署系统                         █', 'bright');
  log('█      Multi-Website Automation System                    █', 'bright');
  log('█                                                         █', 'bright');
  log('███████████████████████████████████████████████████████████', 'bright');

  const totalStartTime = Date.now();

  try {
    // 解析命令行参数
    const args = process.argv.slice(2);
    const configFile = args.find(arg => arg.startsWith('--config='))?.split('=')[1];
    const startFromIndex = parseInt(args.find(arg => arg.startsWith('--start='))?.split('=')[1] || '1', 10);
    const limitCount = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0', 10);

    // 1. 读取网站配置列表
    log('\n📖 读取网站配置列表...', 'cyan');
    const websites = readWebsitesConfig(configFile);

    log(`\n✅ 共读取到 ${websites.length} 个网站配置`, 'green');

    // 应用起始位置和限制
    const startIndex = Math.max(0, startFromIndex - 1);
    const endIndex = limitCount > 0 ? Math.min(startIndex + limitCount, websites.length) : websites.length;
    const websitesToProcess = websites.slice(startIndex, endIndex);

    if (websitesToProcess.length === 0) {
      log('❌ 没有需要处理的网站', 'red');
      process.exit(1);
    }

    log(`📊 将处理第 ${startIndex + 1} 到第 ${endIndex} 个网站 (共 ${websitesToProcess.length} 个)`, 'cyan');

    // 显示配置列表
    log('\n📋 待处理网站列表:', 'cyan');
    websitesToProcess.forEach((site, i) => {
      log(`   ${startIndex + i + 1}. ${site.siteName} (${site.domain}) - ${site.theme}`, 'blue');
    });

    // 确认继续
    log('\n⚠️  即将开始批量生成网站，每个网站完成后会自动部署到GitHub', 'yellow');
    log('   按 Ctrl+C 取消，或等待 5 秒自动继续...', 'yellow');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. 依次处理每个网站
    const results = [];

    for (let i = 0; i < websitesToProcess.length; i++) {
      const website = websitesToProcess[i];
      const globalIndex = startIndex + i + 1;

      const success = await processSingleWebsite(website, globalIndex, websites.length);
      results.push({
        config: website,
        success
      });

      // 在网站之间暂停一下，避免API限流
      if (i < websitesToProcess.length - 1) {
        log('\n⏳ 等待 10 秒后处理下一个网站...', 'yellow');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // 3. 显示总结报告
    const totalElapsedTime = ((Date.now() - totalStartTime) / 1000 / 60).toFixed(1);

    log('\n\n', 'reset');
    log('═══════════════════════════════════════════════════════════', 'bright');
    log('                    执行完成总结', 'bright');
    log('═══════════════════════════════════════════════════════════', 'bright');

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    log(`\n📊 执行统计:`, 'cyan');
    log(`   ✅ 成功: ${successCount}/${results.length}`, 'green');
    log(`   ❌ 失败: ${failCount}/${results.length}`, failCount > 0 ? 'red' : 'green');
    log(`   ⏱️  总用时: ${totalElapsedTime} 分钟`, 'blue');

    // 显示详细结果
    log(`\n📋 详细结果:`, 'cyan');
    results.forEach((result, i) => {
      const status = result.success ? '✅' : '❌';
      const color = result.success ? 'green' : 'red';
      log(`   ${status} ${result.config.siteName} (${result.config.domain})`, color);
    });

    if (failCount > 0) {
      log(`\n⚠️  ${failCount} 个网站处理失败，请检查错误日志`, 'yellow');
      process.exit(1);
    } else {
      log(`\n🎉 所有网站生成并部署成功！`, 'green');
      process.exit(0);
    }

  } catch (error) {
    log(`\n❌ 致命错误: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行脚本
main().catch(error => {
  log(`\n❌ 未捕获的错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
