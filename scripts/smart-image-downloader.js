#!/usr/bin/env node

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import { pipeline } from 'stream';
import { promisify } from 'util';
import imageDedupManager from './image-dedup-manager.js';

const pipelineAsync = promisify(pipeline);

/**
 * 智能图片下载器
 * 结合简单方法（类似fix-images）和复杂方法（类似batch-downloader）
 * 根据URL特征智能选择下载策略
 */
class SmartImageDownloader {
  constructor(options = {}) {
    this.config = {
      maxConcurrent: options.maxConcurrent || 3,
      timeout: options.timeout || 60000, // 60秒默认超时
      retryCount: options.retryCount || 2,
      retryDelay: options.retryDelay || 3000,
      enableCache: options.enableCache !== false,
      enableDedup: options.enableDedup !== false,
      ...options
    };

    // URL模式映射到策略
    this.urlPatterns = {
      // DALL-E API - 使用简单方法
      'oaidalleapi': 'simple',
      'openai': 'simple',
      'dalle': 'simple',
      
      // 图片服务 - 使用标准方法
      'unsplash.com': 'standard',
      'pexels.com': 'standard',
      'pixabay.com': 'standard',
      'picsum.photos': 'standard',
      'placeholder.com': 'standard',
      
      // CDN服务 - 使用简单方法
      'cloudinary.com': 'simple',
      'imgix.net': 'simple',
      'fastly.net': 'simple',
      'amazonaws.com': 'simple',
      'cloudfront.net': 'simple',
      
      // 社交媒体 - 使用浏览器headers
      'instagram.com': 'browser',
      'twitter.com': 'browser',
      'facebook.com': 'browser'
    };

    this.stats = {
      success: 0,
      failed: 0,
      cached: 0,
      skipped: 0
    };
  }

  /**
   * 根据URL检测最佳下载策略
   */
  detectStrategy(url) {
    const urlLower = url.toLowerCase();
    
    // 检查URL模式
    for (const [pattern, strategy] of Object.entries(this.urlPatterns)) {
      if (urlLower.includes(pattern)) {
        return strategy;
      }
    }
    
    // 默认策略：先尝试简单方法
    return 'auto';
  }

  /**
   * 简单下载方法（类似fix-images.cjs）
   * 最小化headers，无超时，直接处理
   */
  async downloadSimple(url, targetPath) {
    return new Promise((resolve, reject) => {
      try {
        const protocol = url.startsWith('https') ? https : http;
        
        const request = protocol.get(url, (response) => {
          // 处理重定向
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              this.downloadSimple(redirectUrl, targetPath).then(resolve).catch(reject);
              return;
            }
          }
          
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}`));
            return;
          }
          
          const file = fs.createWriteStream(targetPath);
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            const stats = fs.statSync(targetPath);
            if (stats.size === 0) {
              fs.unlinkSync(targetPath);
              reject(new Error('Downloaded file is empty'));
              return;
            }
            resolve({ success: true, size: stats.size, method: 'simple' });
          });
          
          file.on('error', (err) => {
            fs.unlink(targetPath, () => {});
            reject(err);
          });
          
          response.on('error', (err) => {
            fs.unlink(targetPath, () => {});
            reject(err);
          });
        });
        
        request.on('error', (err) => {
          reject(err);
        });
        
        // 添加超时处理（可选）
        if (this.config.timeout > 0) {
          request.setTimeout(this.config.timeout, () => {
            request.destroy();
            reject(new Error('Request timeout'));
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 标准下载方法（带基本headers）
   */
  async downloadStandard(url, targetPath) {
    return new Promise((resolve, reject) => {
      try {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
          },
          timeout: this.config.timeout,
          rejectUnauthorized: false
        };
        
        const req = httpModule.request(options, async (response) => {
          // 处理重定向
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            await this.downloadStandard(response.headers.location, targetPath);
            resolve({ success: true, method: 'standard' });
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
          
          resolve({ success: true, size: stats.size, method: 'standard' });
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

  /**
   * 浏览器模拟下载方法（完整headers）
   */
  async downloadBrowser(url, targetPath) {
    return new Promise((resolve, reject) => {
      try {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site'
          },
          timeout: this.config.timeout,
          rejectUnauthorized: false
        };
        
        const req = httpModule.request(options, async (response) => {
          // 处理重定向
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            await this.downloadBrowser(response.headers.location, targetPath);
            resolve({ success: true, method: 'browser' });
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
          
          resolve({ success: true, size: stats.size, method: 'browser' });
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

  /**
   * 智能下载单个图片
   */
  async downloadSingle(url, targetPath) {
    const strategy = this.detectStrategy(url);
    const methods = [];
    
    // 根据策略确定尝试顺序
    switch (strategy) {
      case 'simple':
        methods.push('simple', 'standard', 'browser');
        break;
      case 'standard':
        methods.push('standard', 'simple', 'browser');
        break;
      case 'browser':
        methods.push('browser', 'standard', 'simple');
        break;
      case 'auto':
      default:
        // 默认顺序：简单优先
        methods.push('simple', 'standard', 'browser');
    }
    
    let lastError = null;
    
    // 按顺序尝试不同方法
    for (const method of methods) {
      try {
        let result;
        switch (method) {
          case 'simple':
            result = await this.downloadSimple(url, targetPath);
            break;
          case 'standard':
            result = await this.downloadStandard(url, targetPath);
            break;
          case 'browser':
            result = await this.downloadBrowser(url, targetPath);
            break;
        }
        
        if (result && result.success) {
          return { ...result, strategy, attemptedMethod: method };
        }
      } catch (error) {
        lastError = error;
        
        // 清理失败的文件
        if (fs.existsSync(targetPath)) {
          try { fs.unlinkSync(targetPath); } catch (e) {}
        }
        
        // 某些错误不需要重试其他方法
        if (error.message.includes('HTTP 404') || 
            error.message.includes('HTTP 403') ||
            error.message.includes('ENOTFOUND')) {
          break;
        }
      }
    }
    
    throw lastError || new Error('All download methods failed');
  }

  /**
   * 下载图片（带重试和缓存）
   */
  async download(url, targetPath, options = {}) {
    const {
      checkExisting = true,
      useCache = this.config.enableCache,
      retries = this.config.retryCount,
      metadata = {}
    } = options;
    
    // 确保目标目录存在
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // 检查是否已存在有效图片
    if (checkExisting && fs.existsSync(targetPath)) {
      const stats = fs.statSync(targetPath);
      if (stats.size > 1024) { // 大于1KB认为是有效图片
        this.stats.skipped++;
        return {
          success: true,
          url,
          targetPath,
          skipped: true,
          size: stats.size,
          reason: '文件已存在'
        };
      } else {
        // 删除无效的占位符
        fs.unlinkSync(targetPath);
      }
    }
    
    // 检查缓存
    if (useCache && this.config.enableDedup) {
      const cached = imageDedupManager.findExistingImage(url, targetDir, path.basename(targetPath));
      if (cached.found) {
        this.stats.cached++;
        return {
          success: true,
          url,
          targetPath: cached.existingPath,
          cached: true,
          reason: cached.reason
        };
      }
    }
    
    // 尝试下载（带重试）
    let attempt = 0;
    let lastError = null;
    
    while (attempt <= retries) {
      try {
        const result = await this.downloadSingle(url, targetPath);
        
        // 记录到缓存
        if (useCache && this.config.enableDedup && result.success) {
          imageDedupManager.recordDownloadedImage(url, targetPath, true);
        }
        
        this.stats.success++;
        return {
          success: true,
          url,
          targetPath,
          size: result.size,
          method: result.attemptedMethod,
          strategy: result.strategy,
          attempts: attempt + 1
        };
      } catch (error) {
        lastError = error;
        attempt++;
        
        // 不需要重试的错误
        if (error.message.includes('404') || 
            error.message.includes('403') ||
            error.message.includes('ENOTFOUND')) {
          break;
        }
        
        // 等待后重试
        if (attempt <= retries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }
    
    this.stats.failed++;
    return {
      success: false,
      url,
      targetPath,
      error: lastError?.message || 'Download failed',
      attempts: attempt
    };
  }

  /**
   * 批量下载图片
   */
  async batchDownload(imageList, options = {}) {
    const {
      showProgress = true,
      createPlaceholder = true,
      placeholderData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    } = options;
    
    const results = [];
    const queue = [...imageList];
    const running = new Set();
    
    if (showProgress) {
      console.log(`\n🚀 开始批量下载 ${imageList.length} 张图片`);
    }
    
    // 使用并发控制下载
    while (queue.length > 0 || running.size > 0) {
      // 启动新的下载任务
      while (running.size < this.config.maxConcurrent && queue.length > 0) {
        const item = queue.shift();
        const promise = this.download(item.url, item.targetPath, {
          metadata: item.metadata,
          ...options
        }).then(result => {
          running.delete(promise);
          
          if (showProgress) {
            const icon = result.success ? 
              (result.skipped ? '⏭️' : result.cached ? '💾' : '✅') : '❌';
            const shortUrl = item.url.length > 50 ? 
              item.url.substring(0, 47) + '...' : item.url;
            console.log(`  ${icon} ${shortUrl}`);
          }
          
          results.push(result);
          return result;
        }).catch(error => {
          running.delete(promise);
          const result = {
            success: false,
            url: item.url,
            targetPath: item.targetPath,
            error: error.message
          };
          results.push(result);
          return result;
        });
        
        running.add(promise);
      }
      
      // 等待至少一个任务完成
      if (running.size > 0) {
        await Promise.race(running);
      }
    }
    
    // 为失败的图片创建占位符
    if (createPlaceholder) {
      const placeholderBuffer = Buffer.from(placeholderData, 'base64');
      for (const result of results) {
        if (!result.success && result.targetPath && !fs.existsSync(result.targetPath)) {
          try {
            fs.writeFileSync(result.targetPath, placeholderBuffer);
            result.placeholder = true;
          } catch (e) {
            // 忽略错误
          }
        }
      }
    }
    
    // 显示统计
    if (showProgress) {
      console.log(`\n📊 下载统计:`);
      console.log(`   ✅ 成功: ${this.stats.success}`);
      console.log(`   ⏭️  跳过: ${this.stats.skipped}`);
      console.log(`   💾 缓存: ${this.stats.cached}`);
      console.log(`   ❌ 失败: ${this.stats.failed}`);
    }
    
    return results;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = {
      success: 0,
      failed: 0,
      cached: 0,
      skipped: 0
    };
  }
}

// 导出
export { SmartImageDownloader };
export default SmartImageDownloader;