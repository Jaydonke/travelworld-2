#!/usr/bin/env node

/**
 * mul-reset-site 功能测试脚本
 * 用于验证配置读取和解析功能
 */

import { readWebsitesConfig, validateWebsiteConfig } from './utils/excel-reader.js';
import { writeConfig, updateAstroConfig, readConfig } from './utils/config-writer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function testConfigReader() {
  log('\n=== 测试1: CSV配置文件读取 ===', 'cyan');

  try {
    const websites = readWebsitesConfig();
    log(`✅ 成功读取 ${websites.length} 个网站配置`, 'green');

    websites.forEach((site, i) => {
      log(`\n网站 ${i + 1}:`, 'blue');
      log(`  主题: ${site.theme}`, 'reset');
      log(`  域名: ${site.domain}`, 'reset');
      log(`  网站名: ${site.siteName}`, 'reset');
      if (site.adsenseCode) {
        log(`  AdSense: ${site.adsenseCode}`, 'reset');
      }
    });

    return true;
  } catch (error) {
    log(`❌ 配置读取失败: ${error.message}`, 'red');
    return false;
  }
}

async function testConfigValidation() {
  log('\n=== 测试2: 配置验证 ===', 'cyan');

  const testConfigs = [
    {
      name: '有效配置',
      config: {
        theme: 'Test Theme',
        domain: 'example.com',
        siteName: 'Example Site',
        adsenseCode: 'ca-pub-1234567890123456'
      },
      shouldPass: true
    },
    {
      name: '无效域名',
      config: {
        theme: 'Test Theme',
        domain: 'invalid domain',
        siteName: 'Example Site'
      },
      shouldPass: false
    },
    {
      name: '缺少主题',
      config: {
        theme: '',
        domain: 'example.com',
        siteName: 'Example Site'
      },
      shouldPass: false
    }
  ];

  let passCount = 0;

  for (const test of testConfigs) {
    const isValid = validateWebsiteConfig(test.config);
    const passed = isValid === test.shouldPass;

    if (passed) {
      log(`✅ ${test.name}: 通过`, 'green');
      passCount++;
    } else {
      log(`❌ ${test.name}: 失败`, 'red');
    }
  }

  log(`\n验证测试: ${passCount}/${testConfigs.length} 通过`, passCount === testConfigs.length ? 'green' : 'yellow');
  return passCount === testConfigs.length;
}

async function testConfigWriter() {
  log('\n=== 测试3: 配置写入 ===', 'cyan');

  const testConfig = {
    theme: 'Test Theme',
    domain: 'test.com',
    siteName: 'Test Site',
    adsenseCode: 'ca-pub-1234567890123456'
  };

  try {
    // 写入测试配置
    const testPath = path.resolve(__dirname, '../config.test.txt');
    writeConfig(testConfig, testPath);

    // 读取并验证
    const readData = readConfig(testPath);

    if (!readData) {
      throw new Error('读取配置失败');
    }

    const matches = readData.theme === testConfig.theme &&
                    readData.domain === testConfig.domain &&
                    readData.siteName === testConfig.siteName;

    if (matches) {
      log('✅ 配置写入和读取测试通过', 'green');

      // 清理测试文件
      import('fs').then(fs => {
        if (fs.existsSync(testPath)) {
          fs.unlinkSync(testPath);
          log('✅ 测试文件已清理', 'green');
        }
      });

      return true;
    } else {
      throw new Error('配置数据不匹配');
    }
  } catch (error) {
    log(`❌ 配置写入测试失败: ${error.message}`, 'red');
    return false;
  }
}

async function testExample() {
  log('\n=== 测试4: 示例配置文件 ===', 'cyan');

  try {
    const examplePath = path.resolve(__dirname, '../websites-config.example.csv');
    const websites = readWebsitesConfig(examplePath);

    log(`✅ 成功读取示例配置文件 (${websites.length} 个网站)`, 'green');

    let validCount = 0;
    for (const site of websites) {
      if (validateWebsiteConfig(site)) {
        validCount++;
      }
    }

    log(`✅ 配置验证: ${validCount}/${websites.length} 个有效`, 'green');
    return validCount === websites.length;
  } catch (error) {
    log(`❌ 示例配置测试失败: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n', 'reset');
  log('========================================', 'bright');
  log('   mul-reset-site 功能测试', 'bright');
  log('========================================', 'bright');

  const results = {
    configReader: await testConfigReader(),
    configValidation: await testConfigValidation(),
    configWriter: await testConfigWriter(),
    example: await testExample()
  };

  log('\n========================================', 'bright');
  log('          测试结果总结', 'bright');
  log('========================================', 'bright');

  const allPassed = Object.values(results).every(r => r);

  Object.entries(results).forEach(([name, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${icon} ${name}: ${passed ? '通过' : '失败'}`, color);
  });

  log('\n========================================', 'bright');

  if (allPassed) {
    log('🎉 所有测试通过！mul-reset-site 功能正常', 'green');
    log('\n可以运行以下命令开始使用:', 'cyan');
    log('  npm run mul-reset-site', 'blue');
    process.exit(0);
  } else {
    log('❌ 部分测试失败，请检查配置', 'red');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ 测试过程中发生错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
