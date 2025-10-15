#!/usr/bin/env node

/**
 * 更新品牌名称到 aiCraftDeck 脚本
 * 
 * 功能：
 * 1. 将网站标题和品牌名更新为 aiCraftDeck
 * 2. 保持域名为 aicraftdeck.com
 * 3. 更新所有相关的品牌引用
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 需要更新的文件列表
const FILES_TO_UPDATE = [
  '../config.template.js',
  '../src/lib/config/index.ts',
  '../package.json',
  '../README.md',
  '../astro.config.mjs'
];

// 颜色输出
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
 * 更新单个文件中的品牌名称
 */
function updateBrandInFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    log(`  ⚠️  文件不存在: ${filePath}`, 'yellow');
    return { success: false, error: 'File not found' };
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changeCount = 0;
    const originalContent = content;
    
    // 更新品牌名称 - 保持域名不变
    const brandUpdates = [
      // 标题中的品牌名
      { from: /title:\s*["']ai[cC]raft[dD]eck["']/g, to: 'title: "AICraftDeck"' },
      { from: /title:\s*["']aicrafterhub["']/g, to: 'title: "AICraftDeck"' },
      
      // 网站名称
      { from: /["']ai[cC]raft[dD]eck["']/g, to: '"AICraftDeck"' },
      { from: /["']aicrafterhub["']/g, to: '"AICraftDeck"' },
      
      // 作者/团队名称
      { from: /ai[cC]raft[dD]eck Team/g, to: 'AICraftDeck Team' },
      { from: /aicrafterhub Team/g, to: 'AICraftDeck Team' },
      
      // 关于页面和描述中的品牌名
      { from: /About ai[cC]raft[dD]eck/g, to: 'About AICraftDeck' },
      { from: /About aicrafterhub/g, to: 'About AICraftDeck' },
      { from: /At ai[cC]raft[dD]eck/g, to: 'At AICraftDeck' },
      { from: /At aicrafterhub/g, to: 'At AICraftDeck' },
      
      // 主题名称
      { from: /name:\s*["']ai[cC]raft[dD]eck["']/g, to: 'name: "AICraftDeck"' },
      { from: /name:\s*["']aicrafterhub["']/g, to: 'name: "AICraftDeck"' },
      
      // package.json 中的名称（保持小写，因为npm包名不能有大写）
      { from: /["']name["']:\s*["']aicraftdeck["']/g, to: '"name": "aicraftdeck"' },
      { from: /["']name["']:\s*["']aicrafterhub["']/g, to: '"name": "aicraftdeck"' },
    ];
    
    brandUpdates.forEach(({ from, to }) => {
      const beforeLength = content.length;
      content = content.replace(from, to);
      if (content.length !== beforeLength) {
        changeCount++;
      }
    });
    
    // 特殊处理：确保域名保持小写
    content = content.replace(/https:\/\/AICraftDeck\.com/g, 'https://aicraftdeck.com');
    content = content.replace(/https:\/\/aiCraftDeck\.com/g, 'https://aicraftdeck.com');
    content = content.replace(/aicraftdeck\.com/g, 'aicraftdeck.com');

    if (content !== originalContent) {
      // 创建备份
      const backupPath = fullPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, originalContent);
      
      // 写入更新后的内容
      fs.writeFileSync(fullPath, content);
      
      log(`  ✅ 更新成功 - 品牌名已更新为 AICraftDeck`, 'green');
      return { success: true, changes: changeCount };
    } else {
      log(`  ➡️  无需更新`, 'cyan');
      return { success: true, changes: 0 };
    }
    
  } catch (error) {
    log(`  ❌ 更新失败: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n🏷️  更新品牌名称到 aiCraftDeck', 'bright');
  log('=' .repeat(60), 'blue');
  log('🎯 新品牌名: aiCraftDeck', 'cyan');
  log('🌐 域名保持: aicraftdeck.com', 'cyan');
  log('=' .repeat(60), 'blue');

  try {
    const results = [];
    let filesUpdated = 0;

    // 更新所有配置文件
    log('\n📝 更新品牌名称...', 'cyan');
    
    for (const filePath of FILES_TO_UPDATE) {
      log(`\n📄 处理文件: ${path.basename(filePath)}`, 'magenta');
      const result = updateBrandInFile(filePath);
      result.filePath = filePath;
      results.push(result);
      
      if (result.success && result.changes > 0) {
        filesUpdated++;
      }
    }

    // 显示结果统计
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    log('\n' + '='.repeat(60), 'green');
    log('📊 品牌名称更新完成', 'bright');
    log(`   🏷️  新品牌名: aiCraftDeck`, 'cyan');
    log(`   🌐 域名: aicraftdeck.com`, 'blue');
    log(`   📝 处理文件: ${results.length}`, 'blue');
    log(`   ✅ 更新成功: ${successCount}`, 'green');
    log(`   📂 修改文件: ${filesUpdated}`, 'yellow');
    log(`   ❌ 处理失败: ${errorCount}`, errorCount > 0 ? 'red' : 'green');

    if (errorCount > 0) {
      log('\n⚠️  处理失败的文件:', 'yellow');
      results.filter(r => !r.success).forEach(result => {
        log(`   • ${result.filePath}: ${result.error}`, 'red');
      });
    }

    if (successCount > 0) {
      log('\n🎉 品牌名称更新完成！', 'green');
      log('\n💡 更新内容:', 'cyan');
      log('   • 网站标题: aiCraftDeck', 'blue');
      log('   • 团队名称: aiCraftDeck Team', 'blue');
      log('   • 品牌引用: 统一为 aiCraftDeck', 'blue');
      log('   • 域名保持: aicraftdeck.com', 'blue');
    }

  } catch (error) {
    log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行脚本
main().catch(error => {
  log(`\n❌ 致命错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

export { main };