#!/usr/bin/env node

/**
 * 切换文章显示模式脚本
 * 在正常模式（隐藏未来文章）和预览模式（显示所有文章）之间切换
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文件路径
const ARTICLES_HANDLER_PATH = path.join(__dirname, '../src/lib/handlers/articles.ts');

// 模式定义
const MODES = {
  NORMAL: {
    comment: '    // 正常模式：只显示已发布的文章（隐藏未来发布的）',
    code: '    return data.isDraft !== true && data.draft !== true && new Date(data.publishedTime || data.pubDate) < new Date();',
    name: '正常模式',
    description: '只显示已发布的文章，隐藏未来发布的文章'
  },
  PREVIEW: {
    comment: '    // 预览模式：显示所有文章（包括未来发布的）',
    code: '    return data.isDraft !== true && data.draft !== true;',
    name: '预览模式',
    description: '显示所有非草稿文章，包括未来发布的文章'
  }
};

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
 * 检测当前模式
 */
function detectCurrentMode(content) {
  if (content.includes(MODES.PREVIEW.comment) && content.includes(MODES.PREVIEW.code)) {
    return 'PREVIEW';
  } else if (content.includes(MODES.NORMAL.comment) && content.includes(MODES.NORMAL.code)) {
    return 'NORMAL';
  }
  return 'UNKNOWN';
}

/**
 * 切换模式
 */
function toggleMode(content, fromMode, toMode) {
  let newContent = content;
  
  // 替换注释
  newContent = newContent.replace(
    MODES[fromMode].comment,
    MODES[toMode].comment
  );
  
  // 替换代码
  newContent = newContent.replace(
    MODES[fromMode].code,
    MODES[toMode].code
  );
  
  return newContent;
}

/**
 * 统计未来文章数量
 */
function countFutureArticles() {
  const articlesDir = path.join(__dirname, '../src/content/blog');
  let futureCount = 0;
  let totalCount = 0;
  
  try {
    const now = new Date();
    const folders = fs.readdirSync(articlesDir);
    
    for (const folder of folders) {
      const indexPath = path.join(articlesDir, folder, 'index.mdx');
      if (fs.existsSync(indexPath)) {
        totalCount++;
        const content = fs.readFileSync(indexPath, 'utf8');
        const match = content.match(/publishedTime:\s*(.+)/);
        if (match) {
          const publishTime = new Date(match[1].trim());
          if (publishTime > now) {
            futureCount++;
          }
        }
      }
    }
  } catch (error) {
    // 忽略错误
  }
  
  return { futureCount, totalCount };
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const targetMode = args[0]?.toLowerCase();
  
  log('\n🔄 文章显示模式切换工具', 'bright');
  log('=' .repeat(60), 'blue');
  
  // 检查文件是否存在
  if (!fs.existsSync(ARTICLES_HANDLER_PATH)) {
    log(`❌ 文件不存在: ${ARTICLES_HANDLER_PATH}`, 'red');
    process.exit(1);
  }
  
  // 读取文件内容
  const content = fs.readFileSync(ARTICLES_HANDLER_PATH, 'utf8');
  const currentMode = detectCurrentMode(content);
  
  // 显示当前状态
  log('\n📊 当前状态:', 'cyan');
  log(`   模式: ${currentMode === 'UNKNOWN' ? '未知' : MODES[currentMode].name}`, 'yellow');
  
  // 统计文章
  const { futureCount, totalCount } = countFutureArticles();
  log(`   文章总数: ${totalCount} 篇`, 'blue');
  log(`   未来发布: ${futureCount} 篇`, 'blue');
  log(`   已发布: ${totalCount - futureCount} 篇`, 'blue');
  
  if (currentMode === 'UNKNOWN') {
    log('\n❌ 无法识别当前模式，文件可能已被修改', 'red');
    log('   请手动检查文件内容', 'yellow');
    process.exit(1);
  }
  
  // 确定目标模式
  let newMode;
  
  if (targetMode === 'normal' || targetMode === 'n') {
    newMode = 'NORMAL';
  } else if (targetMode === 'preview' || targetMode === 'p') {
    newMode = 'PREVIEW';
  } else if (targetMode === 'toggle' || targetMode === 't' || !targetMode) {
    // 自动切换到相反模式
    newMode = currentMode === 'NORMAL' ? 'PREVIEW' : 'NORMAL';
  } else {
    log('\n📖 使用说明:', 'cyan');
    log('   npm run toggle-preview          # 自动切换模式', 'blue');
    log('   npm run toggle-preview normal   # 切换到正常模式', 'blue');
    log('   npm run toggle-preview preview  # 切换到预览模式', 'blue');
    log('   npm run toggle-preview toggle   # 切换到相反模式', 'blue');
    log('\n   简写: n = normal, p = preview, t = toggle', 'yellow');
    process.exit(0);
  }
  
  // 检查是否需要切换
  if (currentMode === newMode) {
    log(`\n✅ 已经处于${MODES[newMode].name}，无需切换`, 'green');
    log(`   ${MODES[newMode].description}`, 'cyan');
    
    if (newMode === 'NORMAL' && futureCount > 0) {
      log(`\n📌 提示: 当前有 ${futureCount} 篇未来文章被隐藏`, 'yellow');
    } else if (newMode === 'PREVIEW' && futureCount > 0) {
      log(`\n📌 提示: 当前有 ${futureCount} 篇未来文章正在显示`, 'yellow');
    }
    process.exit(0);
  }
  
  // 执行切换
  log('\n🔄 切换模式...', 'cyan');
  log(`   从: ${MODES[currentMode].name}`, 'yellow');
  log(`   到: ${MODES[newMode].name}`, 'green');
  
  const newContent = toggleMode(content, currentMode, newMode);
  
  // 写入文件
  try {
    fs.writeFileSync(ARTICLES_HANDLER_PATH, newContent);
    log('\n✅ 切换成功！', 'green');
    log(`   当前模式: ${MODES[newMode].name}`, 'bright');
    log(`   ${MODES[newMode].description}`, 'cyan');
    
    // 显示影响
    if (futureCount > 0) {
      log('\n📌 影响:', 'yellow');
      if (newMode === 'NORMAL') {
        log(`   ${futureCount} 篇未来文章将被隐藏`, 'blue');
        log('   这些文章会在发布时间到达后自动显示', 'cyan');
      } else {
        log(`   ${futureCount} 篇未来文章将被显示`, 'blue');
        log('   访客可以看到所有定时发布的文章', 'cyan');
      }
    }
    
    log('\n💡 下一步:', 'cyan');
    log('   运行 npm run build 重新构建网站', 'blue');
    log('   或运行 npm run dev 在开发模式查看效果', 'blue');
    
  } catch (error) {
    log(`\n❌ 切换失败: ${error.message}`, 'red');
    process.exit(1);
  }
  
  log('\n' + '=' .repeat(60), 'blue');
}

// 运行脚本
main();