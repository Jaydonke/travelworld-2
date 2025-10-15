#!/usr/bin/env node

import https from 'https';
import http from 'http';
import fs from 'fs';
import { URL } from 'url';
import { pipeline } from 'stream';
import { promisify } from 'util';
import path from 'path';
import imageDedupManager from './image-dedup-manager.js';

const pipelineAsync = promisify(pipeline);

// 配置
const CONFIG = {
  maxConcurrent: 5,  // 最大并发数
  defaultTimeout: 20000,  // 默认超时时间
  retryDelay: 1000,  // 重试延迟
  maxRetries: 2  // 最大重试次数
};

// User-Agent池
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (compatible; Bot/1.0)',
  'Wget/1.21.3',
  'curl/7.81.0'
];

// 下载策略
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

// 单个下载任务
async function downloadSingle(url, targetPath, strategy = STRATEGIES.STANDARD) {
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
        timeout: CONFIG.defaultTimeout,
        rejectUnauthorized: false
      };

      if (strategy === STRATEGIES.FORCE_HTTP10) {
        options.agent = new (isHttps ? https : http).Agent({
          keepAlive: false
        });
      }

      const req = httpModule.request(options, async (response) => {
        try {
          // 处理重定向
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            if (strategy === STRATEGIES.NO_REDIRECT) {
              reject(new Error(`Redirect not followed: ${response.statusCode}`));
              return;
            }
            await downloadSingle(response.headers.location, targetPath, STRATEGIES.STANDARD);
            resolve(true);
            return;
          }

          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}`));
            return;
          }

          const writeStream = fs.createWriteStream(targetPath);
          await pipelineAsync(response, writeStream);
          
          const stats = fs.statSync(targetPath);
          if (stats.size === 0) {
            fs.unlinkSync(targetPath);
            reject(new Error('Downloaded file is empty'));
            return;
          }

          resolve(true);
        } catch (error) {
          reject(error);
        }
      });

      req.on('error', (err) => {
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

// 使用多策略下载
async function downloadWithStrategies(url, targetPath) {
  const strategies = [
    STRATEGIES.STANDARD,
    STRATEGIES.SIMPLE_GET,
    STRATEGIES.MOBILE_UA,
    STRATEGIES.NO_HEADERS,
    STRATEGIES.FORCE_HTTP10,
    STRATEGIES.NO_REDIRECT
  ];

  let lastError = null;

  for (const strategy of strategies) {
    try {
      await downloadSingle(url, targetPath, strategy);
      return { success: true, strategy };
    } catch (error) {
      lastError = error;
      
      if (fs.existsSync(targetPath)) {
        try { fs.unlinkSync(targetPath); } catch (e) {}
      }

      // 某些错误不需要尝试其他策略
      if (error.message.includes('HTTP 404') || 
          error.message.includes('HTTP 403') ||
          error.message.includes('ENOTFOUND')) {
        break;
      }
    }
  }

  return { success: false, error: lastError };
}

// 下载任务队列
class DownloadQueue {
  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
    this.results = [];
    this.totalTasks = 0;
    this.completedTasks = 0;
    this.failedTasks = 0;
    this.startTime = null;
  }

  // 添加下载任务
  add(url, targetPath, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        url,
        targetPath,
        metadata,
        resolve,
        reject,
        retries: 0
      });
      this.totalTasks++;
      this.process();
    });
  }

  // 处理队列
  async process() {
    if (!this.startTime) {
      this.startTime = Date.now();
    }

    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      this.running++;
      
      this.executeTask(task).then(() => {
        this.running--;
        this.process();
      });
    }
  }

  // 执行单个任务
  async executeTask(task) {
    try {
      const result = await downloadWithStrategies(task.url, task.targetPath);
      
      if (result.success) {
        this.completedTasks++;
        this.updateProgress('success', task);
        task.resolve({
          success: true,
          url: task.url,
          targetPath: task.targetPath,
          metadata: task.metadata,
          strategy: result.strategy
        });
      } else {
        // 重试逻辑
        if (task.retries < CONFIG.maxRetries && 
            !result.error?.message.includes('404') &&
            !result.error?.message.includes('403')) {
          task.retries++;
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
          this.queue.push(task);
          this.process();
        } else {
          this.failedTasks++;
          this.updateProgress('fail', task);
          task.resolve({
            success: false,
            url: task.url,
            targetPath: task.targetPath,
            metadata: task.metadata,
            error: result.error?.message
          });
        }
      }
    } catch (error) {
      this.failedTasks++;
      this.updateProgress('error', task);
      task.resolve({
        success: false,
        url: task.url,
        targetPath: task.targetPath,
        metadata: task.metadata,
        error: error.message
      });
    }
  }

  // 更新进度
  updateProgress(status, task) {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const speed = this.completedTasks / elapsed;
    const progress = ((this.completedTasks + this.failedTasks) / this.totalTasks * 100).toFixed(1);
    
    const statusIcon = status === 'success' ? '✅' : status === 'cached' ? '💾' : '❌';
    const shortUrl = task.url.length > 50 ? task.url.substring(0, 47) + '...' : task.url;
    
    console.log(`  ${statusIcon} [${progress}%] ${shortUrl}`);
    
    if (this.completedTasks + this.failedTasks === this.totalTasks) {
      console.log(`\n  📊 下载统计:`);
      console.log(`     成功: ${this.completedTasks}/${this.totalTasks}`);
      console.log(`     失败: ${this.failedTasks}/${this.totalTasks}`);
      console.log(`     耗时: ${elapsed.toFixed(1)}秒`);
      if (elapsed > 0) {
        console.log(`     速度: ${speed.toFixed(1)}张/秒`);
      }
    }
  }

  // 等待所有任务完成
  async waitForCompletion() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.running === 0 && this.queue.length === 0) {
          clearInterval(checkInterval);
          resolve(this.results);
        }
      }, 100);
    });
  }
}

// 批量下载图片（带去重）
export async function batchDownloadImages(imageList, options = {}) {
  const {
    maxConcurrent = CONFIG.maxConcurrent,
    showProgress = true,
    targetDir = null,
    enableDedup = true,
    recordCache = true
  } = options;

  // 去重检查
  let actualDownloadList = imageList;
  let cachedResults = [];
  
  if (enableDedup) {
    console.log(`\n🔍 检查图片缓存状态 (${imageList.length}张图片)...`);
    
    // 准备目标目录映射
    const targetDirs = {};
    imageList.forEach(item => {
      const url = typeof item === 'string' ? item : item.url;
      const itemTargetDir = typeof item === 'object' ? 
        (item.targetDir || path.dirname(item.targetPath || '')) : targetDir;
      if (itemTargetDir) {
        targetDirs[url] = itemTargetDir;
      }
    });
    
    const dedupResult = imageDedupManager.checkBatch(imageList, targetDirs);
    actualDownloadList = dedupResult.toDownload;
    
    // 为缓存的图片创建结果对象
    cachedResults = dedupResult.cached.map(item => ({
      success: true,
      url: typeof item === 'string' ? item : item.url,
      targetPath: item.existingPath,
      metadata: typeof item === 'object' ? item.metadata || {} : {},
      cached: true,
      reason: item.reason,
      originalFileName: item.originalFileName // 保存原始文件名
    }));
    
    if (cachedResults.length > 0) {
      console.log(`💾 使用缓存图片 ${cachedResults.length} 张`);
    }
  }

  if (actualDownloadList.length === 0) {
    console.log(`\n✅ 所有图片都已缓存，无需下载`);
    return cachedResults;
  }

  console.log(`\n🚀 批量下载开始 (${actualDownloadList.length}张图片, ${maxConcurrent}并发)`);
  
  const queue = new DownloadQueue(maxConcurrent);
  const promises = [];
  
  for (let i = 0; i < actualDownloadList.length; i++) {
    const item = actualDownloadList[i];
    let targetPath, url;
    
    // 支持不同的输入格式
    if (typeof item === 'string') {
      url = item;
      const fileName = `img_${Date.now()}_${i}.jpg`;
      targetPath = targetDir ? path.join(targetDir, fileName) : fileName;
    } else {
      url = item.url;
      targetPath = item.targetPath || (targetDir ? 
        path.join(targetDir, item.fileName || `img_${Date.now()}_${i}.jpg`) : 
        item.fileName || `img_${Date.now()}_${i}.jpg`);
    }
    
    promises.push(queue.add(url, targetPath, { index: i }));
  }
  
  const downloadResults = await Promise.all(promises);
  
  // 记录成功下载的图片到缓存
  if (recordCache && enableDedup) {
    downloadResults.forEach(result => {
      if (result.success) {
        imageDedupManager.recordDownloadedImage(result.url, result.targetPath, true);
      }
    });
  }
  
  // 合并缓存结果和下载结果
  const allResults = [...cachedResults, ...downloadResults];
  
  return allResults;
}

// 智能批量下载（带验证和去重）
export async function smartBatchDownload(imageList, options = {}) {
  const {
    validateFirst = true,
    createPlaceholder = true,
    enableDedup = true,
    showCacheStats = true,
    placeholderData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    ...downloadOptions
  } = options;

  // 显示缓存统计
  if (showCacheStats && enableDedup) {
    imageDedupManager.showStats();
  }

  // 验证阶段
  if (validateFirst) {
    console.log('\n🔍 验证图片可访问性...');
    const tempDir = path.join(process.cwd(), 'temp-validate');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const validateList = imageList.map((item, i) => ({
      url: typeof item === 'string' ? item : item.url,
      targetPath: path.join(tempDir, `validate_${i}.tmp`),
      originalItem: item
    }));
    
    const validateResults = await batchDownloadImages(validateList, {
      ...downloadOptions,
      showProgress: false
    });
    
    // 清理验证文件
    validateResults.forEach(result => {
      if (result.success && fs.existsSync(result.targetPath)) {
        try { fs.unlinkSync(result.targetPath); } catch (e) {}
      }
    });
    
    try { fs.rmdirSync(tempDir); } catch (e) {}
    
    const failedCount = validateResults.filter(r => !r.success).length;
    if (failedCount > 0) {
      console.log(`  ⚠️  ${failedCount}/${imageList.length} 张图片无法访问`);
    } else {
      console.log(`  ✅ 所有图片可访问`);
    }
  }

  // 实际下载阶段
  console.log('\n📥 开始批量下载...');
  const results = await batchDownloadImages(imageList, {
    ...downloadOptions,
    enableDedup: enableDedup,
    recordCache: enableDedup
  });
  
  // 创建占位符
  if (createPlaceholder) {
    const placeholderBuffer = Buffer.from(placeholderData, 'base64');
    results.forEach(result => {
      if (!result.success && result.targetPath) {
        try {
          fs.writeFileSync(result.targetPath, placeholderBuffer);
          result.placeholder = true;
          console.log(`  📄 为 ${path.basename(result.targetPath)} 创建占位符`);
        } catch (e) {
          console.log(`  ❌ 无法创建占位符: ${e.message}`);
        }
      }
    });
  }
  
  return results;
}

// 导出所有功能
export default {
  batchDownloadImages,
  smartBatchDownload,
  DownloadQueue,
  downloadWithStrategies
};