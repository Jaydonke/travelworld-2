#!/usr/bin/env node

/**
 * 网站内容重置脚本
 * 依次执行所有必要的步骤来重置网站内容
 */

import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const tasks = [
  {
    name: '清空HTML文章',
    command: 'node scripts/clear-html-articles.js',
    description: '清空newarticle和scheduledarticle文件夹中的HTML文件'
  },
  {
    name: '删除所有现有文章',
    command: 'npm run delete-all-articles',
    description: '清理网站中的现有文章内容'
  },
  {
    name: '更新主题配置',
    command: 'npm run update-theme-fixed',
    description: '更新网站主题配置和样式'
  },
  {
    name: '更新文章配置并重置追踪',
    command: 'npm run update-articles-full',
    description: '生成新文章配置，重置位置追踪系统'
  },
  {
    name: '生成文章',
    command: 'npm run generate-articles',
    description: '使用AI生成所有配置的文章内容'
  },
  {
    name: '同步配置到模板',
    command: 'npm run sync-config',
    description: '同步配置文件到网站模板'
  },
  {
    name: '添加新文章到网站',
    command: 'npm run add-articles-improved',
    description: '将生成的文章添加到网站中'
  },
  {
    name: '生成新主题方向',
    command: 'npm run generate-new-topics',
    description: '为未来文章生成新的主题和方向'
  },
  {
    name: '生成15篇定时发布文章',
    command: 'npm run generate-articles -- -s -k 25 -c 15',
    description: '跳过前25篇，生成后15篇新主题文章到定时发布目录'
  },
  {
    name: '设置文章定时发布',
    command: 'npm run schedule-articles',
    description: '配置文章的定时发布时间'
  },
  {
    name: '生成AI图标',
    command: 'npm run generate-ai-favicon',
    description: '使用AI生成网站图标'
  },
  {
    name: '生成图标文件',
    command: 'npm run generate-favicon',
    description: '生成所有尺寸的favicon文件'
  },
  {
    name: '更新网站图标',
    command: 'npm run update-favicon',
    description: '将生成的图标应用到网站'
  }
];

async function runTask(task, index, total) {
  log(`\n[${index}/${total}] ${task.name}`, 'cyan');
  log(`   ${task.description}`, 'blue');
  
  try {
    execSync(task.command, { stdio: 'inherit' });
    log(`   ✅ ${task.name} 完成`, 'green');
    return true;
  } catch (error) {
    log(`   ❌ ${task.name} 失败`, 'red');
    log(`   错误: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n====================================', 'bright');
  log('      网站内容重置脚本', 'bright');
  log('====================================', 'bright');
  
  const startTime = Date.now();
  let successCount = 0;
  let failedTasks = [];
  
  for (let i = 0; i < tasks.length; i++) {
    const success = await runTask(tasks[i], i + 1, tasks.length);
    if (success) {
      successCount++;
    } else {
      failedTasks.push(tasks[i].name);
      log(`\n⚠️  任务失败，是否继续执行后续任务？`, 'yellow');
      
      // 如果是关键任务失败，停止执行
      if (i < 3) {  // 前三个任务是关键任务（主题配置、文章配置、生成文章）
        log('❌ 关键任务失败，停止执行', 'red');
        process.exit(1);
      }
    }
  }
  
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  log('\n====================================', 'bright');
  log('         执行完成', 'bright');
  log('====================================', 'bright');
  log(`\n📊 执行统计:`, 'cyan');
  log(`   ✅ 成功: ${successCount}/${tasks.length}`, 'green');
  
  if (failedTasks.length > 0) {
    log(`   ❌ 失败: ${failedTasks.length}`, 'red');
    log(`   失败任务: ${failedTasks.join(', ')}`, 'yellow');
  }
  
  log(`   ⏱️  用时: ${elapsedTime}秒`, 'blue');
  
  if (successCount === tasks.length) {
    log('\n🎉 所有任务成功完成！', 'green');
  } else {
    log('\n⚠️  部分任务失败，请检查错误信息', 'yellow');
  }
}

// 运行脚本
main().catch(error => {
  log(`\n❌ 致命错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});