#!/usr/bin/env node

import https from 'https';
import http from 'http';
import fs from 'fs';
import { URL } from 'url';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

// 不同的User-Agent配置
const USER_AGENTS = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  // Safari on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  // 简单的爬虫标识
  'Mozilla/5.0 (compatible; Bot/1.0)',
  // Wget
  'Wget/1.21.3',
  // Curl
  'curl/7.81.0'
];

// 下载策略枚举
const STRATEGIES = {
  STANDARD: 'standard',
  NO_REDIRECT: 'no_redirect', 
  SIMPLE_GET: 'simple_get',
  FORCE_HTTP10: 'http10',
  NO_HEADERS: 'no_headers',
  MOBILE_UA: 'mobile_ua'
};

// 获取随机User-Agent
function getRandomUserAgent(strategy = null) {
  if (strategy === STRATEGIES.MOBILE_UA) {
    return 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  }
  if (strategy === STRATEGIES.NO_HEADERS) {
    return null;
  }
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// 构建请求头
function buildHeaders(strategy, userAgent) {
  if (strategy === STRATEGIES.NO_HEADERS) {
    return {};
  }

  const headers = {};
  
  if (userAgent) {
    headers['User-Agent'] = userAgent;
  }

  if (strategy !== STRATEGIES.SIMPLE_GET) {
    headers['Accept'] = 'image/webp,image/apng,image/*,*/*;q=0.8';
    headers['Accept-Language'] = 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7';
    headers['Cache-Control'] = 'no-cache';
    headers['Pragma'] = 'no-cache';
  }

  if (strategy === STRATEGIES.STANDARD) {
    headers['Connection'] = 'keep-alive';
    headers['Sec-Fetch-Dest'] = 'image';
    headers['Sec-Fetch-Mode'] = 'no-cors';
    headers['Sec-Fetch-Site'] = 'cross-site';
  }

  return headers;
}

// 处理下载响应
async function handleResponse(response, targetPath, followRedirect = true) {
  // 处理重定向
  if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    if (!followRedirect) {
      throw new Error(`Redirect not followed: ${response.statusCode}`);
    }
    console.log(`    ↻ 重定向到: ${response.headers.location}`);
    return downloadWithStrategy(response.headers.location, targetPath, STRATEGIES.STANDARD);
  }

  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode}`);
  }

  // 保存文件
  const writeStream = fs.createWriteStream(targetPath);
  await pipelineAsync(response, writeStream);
  
  // 验证文件大小
  const stats = fs.statSync(targetPath);
  if (stats.size === 0) {
    fs.unlinkSync(targetPath);
    throw new Error('Downloaded file is empty');
  }

  return true;
}

// 使用特定策略下载
async function downloadWithStrategy(url, targetPath, strategy = STRATEGIES.STANDARD) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const userAgent = getRandomUserAgent(strategy);
      const headers = buildHeaders(strategy, userAgent);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: headers,
        timeout: 20000, // 20秒超时
        rejectUnauthorized: false // 忽略SSL证书错误
      };

      // HTTP 1.0 策略
      if (strategy === STRATEGIES.FORCE_HTTP10) {
        options.agent = new (isHttps ? https : http).Agent({
          keepAlive: false
        });
      }

      const req = httpModule.request(options, async (response) => {
        try {
          const followRedirect = strategy !== STRATEGIES.NO_REDIRECT;
          await handleResponse(response, targetPath, followRedirect);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });

      req.on('error', (err) => {
        // 清理可能创建的空文件
        if (fs.existsSync(targetPath)) {
          try { fs.unlinkSync(targetPath); } catch (e) {}
        }
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

// 尝试不同策略下载
async function downloadWithFallback(url, targetPath, verbose = true) {
  const strategies = [
    { name: STRATEGIES.STANDARD, desc: '标准方式' },
    { name: STRATEGIES.SIMPLE_GET, desc: '简化请求头' },
    { name: STRATEGIES.MOBILE_UA, desc: '移动设备UA' },
    { name: STRATEGIES.NO_HEADERS, desc: '无请求头' },
    { name: STRATEGIES.FORCE_HTTP10, desc: 'HTTP/1.0' },
    { name: STRATEGIES.NO_REDIRECT, desc: '不跟随重定向' }
  ];

  let lastError = null;

  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    
    try {
      if (verbose) {
        console.log(`    尝试策略 ${i + 1}/${strategies.length}: ${strategy.desc}`);
      }
      
      await downloadWithStrategy(url, targetPath, strategy.name);
      
      if (verbose) {
        console.log(`    ✅ 成功使用策略: ${strategy.desc}`);
      }
      return true;
    } catch (error) {
      lastError = error;
      if (verbose) {
        console.log(`    ❌ ${strategy.desc}失败: ${error.message}`);
      }
      
      // 如果文件被部分下载，删除它
      if (fs.existsSync(targetPath)) {
        try { fs.unlinkSync(targetPath); } catch (e) {}
      }

      // 某些错误不需要尝试其他策略
      if (error.message.includes('HTTP 404') || 
          error.message.includes('HTTP 403') ||
          error.message.includes('ENOTFOUND')) {
        throw error;
      }
    }
  }

  throw new Error(`All strategies failed. Last error: ${lastError?.message}`);
}

// 智能下载函数（带重试和策略切换）
export async function smartDownloadImage(url, targetPath, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    verbose = true
  } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (verbose) {
        console.log(`  📥 第 ${attempt}/${maxRetries} 次尝试: ${url}`);
      }

      // 第一次尝试使用标准方式，失败后使用多策略
      if (attempt === 1) {
        try {
          await downloadWithStrategy(url, targetPath, STRATEGIES.STANDARD);
          if (verbose) {
            console.log(`  ✅ 下载成功`);
          }
          return true;
        } catch (error) {
          if (error.message.includes('HTTP 404') || 
              error.message.includes('HTTP 403')) {
            throw error; // 这些错误不需要重试
          }
          // 第一次失败，尝试其他策略
          if (verbose) {
            console.log(`  🔄 标准方式失败，尝试其他策略...`);
          }
        }
      }

      // 使用多种策略尝试
      await downloadWithFallback(url, targetPath, verbose && attempt === maxRetries);
      
      if (verbose) {
        console.log(`  ✅ 下载成功`);
      }
      return true;

    } catch (error) {
      if (verbose) {
        console.log(`  ❌ 第 ${attempt} 次尝试失败: ${error.message}`);
      }

      // 某些错误不需要重试
      if (error.message.includes('HTTP 404') || 
          error.message.includes('HTTP 403') ||
          error.message.includes('ENOTFOUND')) {
        return false;
      }

      if (attempt < maxRetries) {
        if (verbose) {
          console.log(`  ⏳ 等待 ${retryDelay}ms 后重试...`);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  return false;
}

// 批量下载图片
export async function batchDownloadImages(imageUrls, targetDir, options = {}) {
  const results = [];
  
  for (const url of imageUrls) {
    const fileName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const targetPath = path.join(targetDir, fileName);
    
    const success = await smartDownloadImage(url, targetPath, options);
    results.push({ url, targetPath, success });
  }
  
  return results;
}

// 导出所有功能
export default {
  smartDownloadImage,
  batchDownloadImages,
  downloadWithStrategy,
  downloadWithFallback
};