#!/usr/bin/env node

/**
 * Excel/CSV读取工具模块
 * 用于读取网站配置表格
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 解析CSV文件
 * @param {string} filePath - CSV文件路径
 * @returns {Array<Object>} 解析后的数据数组
 */
export function parseCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('CSV文件至少需要包含表头和一行数据');
    }

    // 解析表头
    const headers = lines[0].split(',').map(h => h.trim());

    // 验证必需的列
    const requiredColumns = ['theme', 'domain', 'siteName', 'adsenseCode'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      throw new Error(`CSV文件缺少必需的列: ${missingColumns.join(', ')}`);
    }

    // 解析数据行
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // 跳过空行

      const values = line.split(',').map(v => v.trim());
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // 验证必需字段
      if (!row.theme || !row.domain || !row.siteName) {
        console.warn(`⚠️  第 ${i + 1} 行数据不完整，已跳过: ${line}`);
        continue;
      }

      data.push(row);
    }

    return data;
  } catch (error) {
    throw new Error(`读取CSV文件失败: ${error.message}`);
  }
}

/**
 * 读取网站配置列表
 * @param {string} [configFile] - 配置文件路径，默认为项目根目录的websites-config.csv
 * @returns {Array<Object>} 网站配置列表
 */
export function readWebsitesConfig(configFile) {
  const projectRoot = path.resolve(__dirname, '../..');
  const defaultPath = path.join(projectRoot, 'websites-config.csv');
  const filePath = configFile || defaultPath;

  if (!fs.existsSync(filePath)) {
    throw new Error(`配置文件不存在: ${filePath}\n请创建 websites-config.csv 文件或参考 websites-config.example.csv`);
  }

  const websites = parseCSV(filePath);

  if (websites.length === 0) {
    throw new Error('配置文件中没有有效的网站配置');
  }

  console.log(`✅ 成功读取 ${websites.length} 个网站配置`);
  return websites;
}

/**
 * 验证网站配置
 * @param {Object} config - 网站配置对象
 * @returns {boolean} 是否有效
 */
export function validateWebsiteConfig(config) {
  const errors = [];

  if (!config.theme || config.theme.length < 3) {
    errors.push('主题名称不能为空且长度至少3个字符');
  }

  if (!config.domain || !/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(config.domain)) {
    errors.push('域名格式不正确');
  }

  if (!config.siteName || config.siteName.length < 2) {
    errors.push('网站名称不能为空且长度至少2个字符');
  }

  if (config.adsenseCode && !/^ca-pub-\d{16}$/.test(config.adsenseCode)) {
    console.warn(`⚠️  AdSense代码格式可能不正确: ${config.adsenseCode}`);
  }

  if (errors.length > 0) {
    console.error(`❌ 配置验证失败:`);
    errors.forEach(err => console.error(`   - ${err}`));
    return false;
  }

  return true;
}

/**
 * 创建示例配置文件
 */
export function createExampleConfig() {
  const projectRoot = path.resolve(__dirname, '../..');
  const examplePath = path.join(projectRoot, 'websites-config.example.csv');

  const exampleContent = `theme,domain,siteName,adsenseCode
Automotive & Mobility,example1.com,AutoSite,ca-pub-1234567890123456
Travel & Adventure,example2.com,TravelHub,ca-pub-2345678901234567
Technology & Innovation,example3.com,TechVision,ca-pub-3456789012345678
Health & Wellness,example4.com,HealthFirst,ca-pub-4567890123456789`;

  fs.writeFileSync(examplePath, exampleContent, 'utf-8');
  console.log(`✅ 示例配置文件已创建: ${examplePath}`);
}

// 如果直接运行此脚本，显示帮助信息
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Excel/CSV 配置文件读取工具');
  console.log('\n用法:');
  console.log('  import { readWebsitesConfig } from "./excel-reader.js";');
  console.log('  const websites = readWebsitesConfig();');
  console.log('\n配置文件格式 (CSV):');
  console.log('  theme,domain,siteName,adsenseCode');
  console.log('  Automotive & Mobility,example.com,ExampleSite,ca-pub-1234567890123456');
}
