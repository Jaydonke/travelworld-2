#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 图片去重管理器
class ImageDedupManager {
  constructor(cacheDir = path.join(__dirname, '../.image-cache')) {
    this.cacheDir = cacheDir;
    this.cacheFile = path.join(cacheDir, 'image-cache.json');
    this.cache = this.loadCache();
    
    // 确保缓存目录存在
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  }

  // 加载缓存
  loadCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('⚠️  缓存文件损坏，重新创建');
    }
    return {
      urlHashes: {}, // URL -> hash mapping
      fileHashes: {}, // hash -> file info mapping
      urlToFile: {}, // URL -> file path mapping
      stats: {
        totalImages: 0,
        duplicatesFound: 0,
        lastCleanup: Date.now()
      }
    };
  }

  // 保存缓存
  saveCache() {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.error('❌ 保存缓存失败:', error.message);
    }
  }

  // 生成URL的哈希值
  hashUrl(url) {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  // 生成文件内容的哈希值
  hashFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      
      const data = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(data).digest('hex');
    } catch (error) {
      return null;
    }
  }

  // 从URL生成文件名
  generateFileName(url, extension = '.jpg') {
    const urlHash = this.hashUrl(url);
    const urlObj = new URL(url);
    
    // 尝试从URL中提取有意义的名称
    let baseName = path.basename(urlObj.pathname);
    if (baseName && baseName.includes('.')) {
      const ext = path.extname(baseName);
      baseName = path.basename(baseName, ext);
      extension = ext || extension;
    }
    
    // 如果没有有意义的名称，使用哈希
    if (!baseName || baseName.length < 3) {
      baseName = urlHash.substring(0, 12);
    }
    
    // 清理文件名
    baseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 20);
    
    return `${baseName}_${urlHash.substring(0, 8)}${extension}`;
  }

  // 检查URL是否已下载
  isUrlCached(url) {
    const urlHash = this.hashUrl(url);
    return this.cache.urlHashes[urlHash] || null;
  }

  // 检查文件是否存在且内容匹配
  validateCachedFile(cacheInfo) {
    if (!cacheInfo || !cacheInfo.filePath) return false;
    
    // 检查文件是否存在
    if (!fs.existsSync(cacheInfo.filePath)) {
      console.log(`  ⚠️  缓存文件不存在: ${cacheInfo.filePath}`);
      return false;
    }
    
    // 检查文件大小
    const stats = fs.statSync(cacheInfo.filePath);
    if (stats.size === 0) {
      console.log(`  ⚠️  缓存文件为空: ${cacheInfo.filePath}`);
      return false;
    }
    
    // 检查文件哈希（可选，较耗时）
    if (cacheInfo.fileHash) {
      const currentHash = this.hashFile(cacheInfo.filePath);
      if (currentHash !== cacheInfo.fileHash) {
        console.log(`  ⚠️  缓存文件内容已变更: ${cacheInfo.filePath}`);
        return false;
      }
    }
    
    return true;
  }

  // 查找已存在的相似图片
  findExistingImage(url, targetDir, preferredFileName = null) {
    const urlHash = this.hashUrl(url);
    const cacheInfo = this.cache.urlHashes[urlHash];
    
    // 检查URL缓存，但必须验证文件确实存在
    if (cacheInfo && this.validateCachedFile(cacheInfo)) {
      // 双重检查：确保目标目录中的对应文件也存在
      const expectedPath = preferredFileName ? 
        path.join(targetDir, preferredFileName) : 
        path.join(targetDir, path.basename(cacheInfo.filePath));
      
      if (fs.existsSync(expectedPath)) {
        return {
          found: true,
          type: 'url_match',
          existingPath: expectedPath,
          reason: 'URL已下载过且文件存在',
          originalFileName: path.basename(expectedPath)
        };
      } else {
        // 缓存中有记录但目标位置文件不存在，清除缓存记录
        console.log(`  🧹 清除无效缓存记录: ${url}`);
        delete this.cache.urlHashes[urlHash];
        this.saveCache();
      }
    }
    
    // 生成建议的文件名和路径
    let suggestedFileName;
    if (preferredFileName) {
      // 使用首选文件名，但保持扩展名智能
      const extension = path.extname(preferredFileName) || this.getFileExtensionFromUrl(url) || '.jpg';
      const baseName = path.basename(preferredFileName, path.extname(preferredFileName));
      suggestedFileName = baseName + extension;
    } else {
      suggestedFileName = this.generateFileName(url);
    }
    
    const suggestedPath = path.join(targetDir, suggestedFileName);
    
    // 检查建议路径是否已存在相同文件
    if (fs.existsSync(suggestedPath)) {
      const existingHash = this.hashFile(suggestedPath);
      if (existingHash) {
        // 检查是否是相同内容的文件
        const existingInfo = Object.values(this.cache.fileHashes).find(info => 
          info.fileHash === existingHash && info.filePath === suggestedPath
        );
        
        if (existingInfo) {
          return {
            found: true,
            type: 'file_match',
            existingPath: suggestedPath,
            reason: '文件已存在且内容匹配',
            originalFileName: path.basename(suggestedPath)
          };
        }
      }
    }
    
    return {
      found: false,
      suggestedPath: suggestedPath,
      suggestedFileName: suggestedFileName
    };
  }

  // 从URL获取文件扩展名
  getFileExtensionFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extension = path.extname(pathname);
      if (extension && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension.toLowerCase())) {
        return extension;
      }
    } catch (e) {}
    return '.jpg';
  }

  // 记录下载的图片
  recordDownloadedImage(url, filePath, success = true) {
    const urlHash = this.hashUrl(url);
    const now = Date.now();
    
    if (success && fs.existsSync(filePath)) {
      const fileHash = this.hashFile(filePath);
      const stats = fs.statSync(filePath);
      
      const imageInfo = {
        url: url,
        filePath: filePath,
        fileHash: fileHash,
        fileSize: stats.size,
        downloadTime: now,
        lastAccessed: now
      };
      
      // 更新缓存
      this.cache.urlHashes[urlHash] = imageInfo;
      this.cache.fileHashes[fileHash] = imageInfo;
      this.cache.urlToFile[url] = filePath;
      this.cache.stats.totalImages++;
      
      console.log(`  💾 记录图片: ${path.basename(filePath)}`);
    }
    
    this.saveCache();
  }

  // 批量检查图片列表
  checkBatch(imageList, targetDirs = {}) {
    console.log(`\n🔍 检查 ${imageList.length} 张图片的缓存状态...`);
    
    const results = {
      toDownload: [],
      cached: [],
      stats: {
        urlMatches: 0,
        fileMatches: 0,
        newDownloads: 0
      }
    };
    
    for (let i = 0; i < imageList.length; i++) {
      const item = imageList[i];
      const url = typeof item === 'string' ? item : item.url;
      const targetDir = typeof item === 'object' ? 
        (item.targetDir || path.dirname(item.targetPath || '')) : 
        (targetDirs[url] || process.cwd());
      
      // 提取首选文件名（如果有）
      const preferredFileName = typeof item === 'object' ? item.fileName : null;
      
      const check = this.findExistingImage(url, targetDir, preferredFileName);
      
      if (check.found) {
        results.cached.push({
          ...item,
          existingPath: check.existingPath,
          reason: check.reason,
          type: check.type,
          originalFileName: check.originalFileName // 保存原始文件名用于后续处理
        });
        
        if (check.type === 'url_match') {
          results.stats.urlMatches++;
        } else if (check.type === 'file_match') {
          results.stats.fileMatches++;
        }
        
        console.log(`  ✅ [${i + 1}/${imageList.length}] 已存在: ${check.reason}`);
      } else {
        const newItem = typeof item === 'string' ? 
          { url: url, targetPath: check.suggestedPath, fileName: check.suggestedFileName } :
          { ...item, targetPath: item.targetPath || check.suggestedPath };
          
        results.toDownload.push(newItem);
        results.stats.newDownloads++;
        
        console.log(`  📥 [${i + 1}/${imageList.length}] 需下载: ${url.substring(0, 50)}...`);
      }
    }
    
    console.log(`\n📊 缓存检查结果:`);
    console.log(`   ✅ 已缓存: ${results.cached.length}/${imageList.length}`);
    console.log(`   📥 需下载: ${results.toDownload.length}/${imageList.length}`);
    console.log(`   💾 URL匹配: ${results.stats.urlMatches}`);
    console.log(`   📁 文件匹配: ${results.stats.fileMatches}`);
    
    if (results.cached.length > 0) {
      const savedTime = results.cached.length * 2; // 假设每张图片节省2秒
      console.log(`   ⏱️  预计节省时间: ${savedTime}秒`);
    }
    
    return results;
  }

  // 清理缓存（删除不存在的文件记录）
  cleanupCache() {
    console.log('\n🧹 清理图片缓存...');
    
    let removedCount = 0;
    const newUrlHashes = {};
    const newFileHashes = {};
    const newUrlToFile = {};
    
    for (const [hash, info] of Object.entries(this.cache.urlHashes)) {
      if (info.filePath && fs.existsSync(info.filePath)) {
        newUrlHashes[hash] = info;
        newFileHashes[info.fileHash] = info;
        newUrlToFile[info.url] = info.filePath;
      } else {
        removedCount++;
      }
    }
    
    this.cache.urlHashes = newUrlHashes;
    this.cache.fileHashes = newFileHashes;
    this.cache.urlToFile = newUrlToFile;
    this.cache.stats.lastCleanup = Date.now();
    
    if (removedCount > 0) {
      console.log(`  🗑️  清理了 ${removedCount} 个无效缓存记录`);
      this.saveCache();
    } else {
      console.log(`  ✨ 缓存状态良好，无需清理`);
    }
  }

  // 获取缓存统计信息
  getCacheStats() {
    const totalCached = Object.keys(this.cache.urlHashes).length;
    const cacheSize = fs.existsSync(this.cacheFile) ? 
      (fs.statSync(this.cacheFile).size / 1024).toFixed(2) : 0;
    
    return {
      totalCached: totalCached,
      cacheFileSize: `${cacheSize} KB`,
      lastCleanup: new Date(this.cache.stats.lastCleanup).toLocaleString(),
      duplicatesFound: this.cache.stats.duplicatesFound
    };
  }

  // 显示缓存统计
  showStats() {
    const stats = this.getCacheStats();
    console.log('\n📈 图片缓存统计:');
    console.log(`   📦 已缓存图片: ${stats.totalCached}`);
    console.log(`   💽 缓存文件大小: ${stats.cacheFileSize}`);
    console.log(`   🔄 上次清理: ${stats.lastCleanup}`);
    console.log(`   🎯 发现重复: ${stats.duplicatesFound}`);
  }
}

// 导出单例实例
const imageDedupManager = new ImageDedupManager();

export { ImageDedupManager, imageDedupManager };
export default imageDedupManager;