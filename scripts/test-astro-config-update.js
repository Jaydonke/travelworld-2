#!/usr/bin/env node

/**
 * 测试脚本 - 仅更新astro.config.mjs的site配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 读取config.txt文件
 */
function readConfigFile() {
  const configPath = path.join(__dirname, '../config.txt');

  if (!fs.existsSync(configPath)) {
    throw new Error('config.txt file not found');
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const lines = content.trim().split('\n');

  if (lines.length < 3) {
    throw new Error('config.txt must have at least 3 lines: theme, domain, site name');
  }

  return {
    theme: lines[0].trim(),
    domain: lines[1].trim(),
    siteName: lines[2].trim()
  };
}

/**
 * 更新astro.config.mjs文件的site配置
 */
function updateAstroConfig(domain) {
  const astroConfigPath = path.join(__dirname, '../astro.config.mjs');

  try {
    // 读取文件
    let fileContent = fs.readFileSync(astroConfigPath, 'utf-8');

    // 保存原始内容用于对比
    const originalContent = fileContent;

    // 构建完整的URL（添加https://）
    const siteUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    // 替换site配置
    // 匹配 site: "任何内容"
    const siteRegex = /site:\s*["']([^"']+)["']/;

    if (!siteRegex.test(fileContent)) {
      log(`⚠️  Could not find site configuration in astro.config.mjs`, 'yellow');
      return false;
    }

    const oldSite = fileContent.match(siteRegex)[1];
    fileContent = fileContent.replace(siteRegex, `site: "${siteUrl}"`);

    // 显示变更
    log(`\n📄 File: astro.config.mjs`, 'cyan');
    log(`   Old site: ${oldSite}`, 'gray');
    log(`   New site: ${siteUrl}`, 'green');

    // 显示文件变更预览
    log(`\n📝 Preview of changes:`, 'blue');
    const lines = fileContent.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('site:')) {
        log(`   Line ${index + 1}: ${line.trim()}`, 'green');
      }
    });

    // 写入文件
    fs.writeFileSync(astroConfigPath, fileContent, 'utf-8');

    log(`\n✅ Successfully updated astro.config.mjs`, 'green');

    return true;
  } catch (error) {
    log(`❌ Failed to update astro.config.mjs: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    log(`\n🧪 Astro Config Update Test Script`, 'bright');
    log('This script will update the site URL in astro.config.mjs\n', 'cyan');

    // 读取配置
    log(`📖 Reading config.txt...`, 'blue');
    const themeInfo = readConfigFile();
    log(`  Theme: ${themeInfo.theme}`, 'cyan');
    log(`  Domain: ${themeInfo.domain}`, 'cyan');
    log(`  Site Name: ${themeInfo.siteName}`, 'cyan');

    // 更新astro.config.mjs
    log(`\n🌐 Updating astro.config.mjs site URL...`, 'blue');
    const success = updateAstroConfig(themeInfo.domain);

    if (success) {
      log(`\n✨ Test completed successfully!`, 'green');
      log(`The site URL in astro.config.mjs has been updated to: https://${themeInfo.domain}`, 'cyan');
    } else {
      log(`\n⚠️  Test completed with warnings`, 'yellow');
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 运行主函数
main();