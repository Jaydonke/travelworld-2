#!/usr/bin/env node

/**
 * 配置写入工具
 * 将网站配置写入config.txt文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 写入网站配置到config.txt
 * @param {Object} config - 网站配置对象 {theme, domain, siteName, adsenseCode}
 * @param {string} [configPath] - config.txt文件路径
 */
export function writeConfig(config, configPath) {
  const projectRoot = path.resolve(__dirname, '../..');
  const filePath = configPath || path.join(projectRoot, 'config.txt');

  // 创建配置内容
  const content = `${config.theme}
${config.domain}
${config.siteName}`;

  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ 配置已写入: ${filePath}`);
    console.log(`   主题: ${config.theme}`);
    console.log(`   域名: ${config.domain}`);
    console.log(`   网站名: ${config.siteName}`);
    return true;
  } catch (error) {
    console.error(`❌ 写入配置文件失败: ${error.message}`);
    return false;
  }
}

/**
 * 读取当前config.txt配置
 * @param {string} [configPath] - config.txt文件路径
 * @returns {Object|null} 配置对象或null
 */
export function readConfig(configPath) {
  const projectRoot = path.resolve(__dirname, '../..');
  const filePath = configPath || path.join(projectRoot, 'config.txt');

  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    if (lines.length < 3) {
      return null;
    }

    return {
      theme: lines[0].trim(),
      domain: lines[1].trim(),
      siteName: lines[2].trim()
    };
  } catch (error) {
    console.error(`❌ 读取配置文件失败: ${error.message}`);
    return null;
  }
}

/**
 * 备份当前配置
 * @param {string} [configPath] - config.txt文件路径
 * @returns {string|null} 备份文件路径或null
 */
export function backupConfig(configPath) {
  const projectRoot = path.resolve(__dirname, '../..');
  const filePath = configPath || path.join(projectRoot, 'config.txt');

  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(projectRoot, `config.backup.${timestamp}.txt`);

    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ 配置已备份: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`❌ 备份配置文件失败: ${error.message}`);
    return null;
  }
}

/**
 * 更新astro.config.mjs中的site URL
 * @param {string} domain - 域名
 */
export function updateAstroConfig(domain) {
  const projectRoot = path.resolve(__dirname, '../..');
  const astroConfigPath = path.join(projectRoot, 'astro.config.mjs');

  try {
    if (!fs.existsSync(astroConfigPath)) {
      console.warn(`⚠️  astro.config.mjs 不存在，跳过更新`);
      return false;
    }

    let content = fs.readFileSync(astroConfigPath, 'utf-8');

    // 更新site配置
    const siteRegex = /site:\s*["']https?:\/\/[^"']+["']/;
    const newSite = `site: "https://${domain}"`;

    if (siteRegex.test(content)) {
      content = content.replace(siteRegex, newSite);
    } else {
      console.warn(`⚠️  未找到site配置，无法更新`);
      return false;
    }

    fs.writeFileSync(astroConfigPath, content, 'utf-8');
    console.log(`✅ astro.config.mjs 已更新: https://${domain}`);
    return true;
  } catch (error) {
    console.error(`❌ 更新astro.config.mjs失败: ${error.message}`);
    return false;
  }
}

/**
 * 写入AdSense代码到环境变量或配置文件
 * @param {string} adsenseCode - AdSense代码
 */
export function writeAdsenseConfig(adsenseCode) {
  if (!adsenseCode) {
    console.log(`⚠️  未提供AdSense代码，跳过配置`);
    return;
  }

  const projectRoot = path.resolve(__dirname, '../..');
  const envPath = path.join(projectRoot, '.env');

  try {
    let envContent = '';

    // 读取现有.env文件
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // 更新或添加ADSENSE_CODE
    const adsenseRegex = /^ADSENSE_CODE=.*/m;
    const newLine = `ADSENSE_CODE=${adsenseCode}`;

    if (adsenseRegex.test(envContent)) {
      envContent = envContent.replace(adsenseRegex, newLine);
    } else {
      envContent += `\n${newLine}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log(`✅ AdSense代码已写入 .env 文件`);
  } catch (error) {
    console.error(`❌ 写入AdSense配置失败: ${error.message}`);
  }
}

export default {
  writeConfig,
  readConfig,
  backupConfig,
  updateAstroConfig,
  writeAdsenseConfig
};
