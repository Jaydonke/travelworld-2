#!/usr/bin/env node

/**
 * Favicon Update Script
 * 自动将favicon_io文件夹中的favicon文件复制到public目录
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建异步执行函数
const execAsync = promisify(exec);

// 配置
const config = {
  siteName: 'OptiNook',
  siteShortName: 'OptiNook',
  sourceDir: path.join(process.cwd(), 'favicon_io'),
  targetDir: path.join(process.cwd(), 'public'),
  logoTargetDir: path.join(process.cwd(), 'src', 'assets', 'images'),
  requiredFiles: [
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
    'site.webmanifest'
  ],
  optionalFiles: [
    'site-logo.png',  // 可选的网站logo文件
    'site-theme.png'  // 可选的主题图片（用于首页Hero区域）
  ]
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

// 日志函数
const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.blue}→${colors.reset} ${msg}`)
};

// 获取文件大小（格式化）
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const bytes = stats.size;
    const sizes = ['B', 'KB', 'MB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  } catch (error) {
    return 'unknown';
  }
}

// 检查源文件
function checkSourceFiles() {
  log.step('Checking source files in favicon_io folder...');
  
  if (!fs.existsSync(config.sourceDir)) {
    log.error(`Source directory not found: ${config.sourceDir}`);
    process.exit(1);
  }

  const missingFiles = [];
  const existingFiles = [];
  const optionalFilesFound = [];

  // 检查必需文件
  config.requiredFiles.forEach(file => {
    const filePath = path.join(config.sourceDir, file);
    if (fs.existsSync(filePath)) {
      const size = getFileSize(filePath);
      existingFiles.push(`${file} (${size})`);
    } else {
      missingFiles.push(file);
    }
  });

  // 检查可选文件
  config.optionalFiles.forEach(file => {
    const filePath = path.join(config.sourceDir, file);
    if (fs.existsSync(filePath)) {
      const size = getFileSize(filePath);
      optionalFilesFound.push(`${file} (${size})`);
    }
  });

  if (existingFiles.length > 0) {
    log.success(`Found ${existingFiles.length} required files:`);
    existingFiles.forEach(file => console.log(`    ${colors.green}•${colors.reset} ${file}`));
  }

  if (optionalFilesFound.length > 0) {
    log.info(`Found ${optionalFilesFound.length} optional files:`);
    optionalFilesFound.forEach(file => console.log(`    ${colors.cyan}•${colors.reset} ${file}`));
  }

  if (missingFiles.length > 0) {
    log.warning(`Missing ${missingFiles.length} required files:`);
    missingFiles.forEach(file => console.log(`    ${colors.yellow}•${colors.reset} ${file}`));
    
    const proceed = process.argv.includes('--force');
    if (!proceed) {
      log.error('Some required files are missing. Use --force to proceed anyway.');
      process.exit(1);
    }
    log.warning('Proceeding with available files (--force flag used)');
  }
}

// 清理旧文件
function cleanOldFiles() {
  log.step('Cleaning old favicon files from public directory...');
  
  let cleanedCount = 0;
  config.requiredFiles.forEach(file => {
    const targetPath = path.join(config.targetDir, file);
    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
        cleanedCount++;
        log.info(`Removed old: ${file}`);
      } catch (error) {
        log.warning(`Failed to remove: ${file}`);
      }
    }
  });

  if (cleanedCount > 0) {
    log.success(`Cleaned ${cleanedCount} old files`);
  } else {
    log.info('No old files to clean');
  }
}

// 复制新文件
function copyNewFiles() {
  log.step('Copying new favicon files to public directory...');
  
  let copiedCount = 0;
  let failedCount = 0;

  config.requiredFiles.forEach(file => {
    const sourcePath = path.join(config.sourceDir, file);
    const targetPath = path.join(config.targetDir, file);

    if (fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, targetPath);
        const size = getFileSize(targetPath);
        log.success(`Copied: ${file} (${size})`);
        copiedCount++;
      } catch (error) {
        log.error(`Failed to copy ${file}: ${error.message}`);
        failedCount++;
      }
    }
  });

  if (copiedCount > 0) {
    log.success(`Successfully copied ${copiedCount} files`);
  }

  if (failedCount > 0) {
    log.error(`Failed to copy ${failedCount} files`);
  }
}

// 更新site.webmanifest
function updateManifest() {
  log.step('Updating site.webmanifest with site information...');
  
  const manifestPath = path.join(config.targetDir, 'site.webmanifest');
  
  if (!fs.existsSync(manifestPath)) {
    log.warning('site.webmanifest not found, skipping update');
    return;
  }

  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    // 更新网站名称
    const oldName = manifest.name;
    const oldShortName = manifest.short_name;
    
    manifest.name = config.siteName;
    manifest.short_name = config.siteShortName;
    
    // 保持格式化的JSON
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    if (oldName !== config.siteName || oldShortName !== config.siteShortName) {
      log.success(`Updated manifest: "${oldName}" → "${config.siteName}"`);
    } else {
      log.info('Manifest already has correct site name');
    }
  } catch (error) {
    log.error(`Failed to update manifest: ${error.message}`);
  }
}

// 处理网站Logo和主题图片
async function updateSiteLogo() {
  log.step('Checking for site logo and theme image updates...');
  
  // 处理site-logo.png
  const logoSourcePath = path.join(config.sourceDir, 'site-logo.png');
  const logoTargetPath = path.join(config.logoTargetDir, 'site-logo.png');
  
  // 处理site-theme.png
  const themeSourcePath = path.join(config.sourceDir, 'site-theme.png');
  const themeTargetPath = path.join(config.logoTargetDir, 'site-theme.png');
  
  let hasLogo = fs.existsSync(logoSourcePath);
  let hasTheme = fs.existsSync(themeSourcePath);
  
  if (!hasLogo && !hasTheme) {
    log.info('No site-logo.png or site-theme.png found in favicon_io folder, skipping updates');
    return;
  }
  
  // 更新site-logo.png
  if (hasLogo) {
    await updateImageFile(logoSourcePath, logoTargetPath, 'site-logo.png');
  }
  
  // 更新site-theme.png
  if (hasTheme) {
    await updateImageFile(themeSourcePath, themeTargetPath, 'site-theme.png');
  }
}

// 通用图片文件更新函数
async function updateImageFile(sourcePath, targetPath, fileName) {
  try {
    // 强制更新模式 - 总是复制新文件
    log.step(`Updating ${fileName}...`);
    
    // 确保目标目录存在
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      log.info(`Created directory: ${targetDir}`);
    }
    
    // 备份旧文件（如果存在）
    if (fs.existsSync(targetPath)) {
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupPath = path.join(config.logoTargetDir, `${baseName}.backup-${timestamp}${ext}`);
      
      try {
        fs.copyFileSync(targetPath, backupPath);
        log.info(`Backed up old ${fileName}`);
        
        // 清理旧的备份文件（保留最新的3个）
        cleanOldBackups(baseName, ext, 3);
      } catch (backupError) {
        log.warning(`Could not backup old ${fileName}: ${backupError.message}`);
      }
    }
    
    // 使用同步方法复制文件，更可靠
    try {
      // 读取源文件
      const sourceBuffer = fs.readFileSync(sourcePath);
      
      // 写入目标文件
      fs.writeFileSync(targetPath, sourceBuffer);
      
      // 验证复制是否成功
      const sourceStats = fs.statSync(sourcePath);
      const targetStats = fs.statSync(targetPath);
      
      if (sourceStats.size === targetStats.size) {
        log.success(`✅ Successfully updated ${fileName} (${getFileSize(targetPath)})`);
        
        // 清理图片相关缓存
        clearImageCache();
        
        // 如果是site-logo或site-theme，清理Astro缓存
        if (fileName.includes('site-logo') || fileName.includes('site-theme')) {
          const astroCache = path.join(process.cwd(), '.astro');
          if (fs.existsSync(astroCache)) {
            try {
              fs.rmSync(astroCache, { recursive: true, force: true });
              log.info('Cleared Astro cache');
            } catch (err) {
              // 忽略错误
            }
          }
        }
      } else {
        log.warning(`File copied but sizes differ - please verify ${fileName}`);
      }
    } catch (copyError) {
      log.error(`Failed to copy ${fileName}: ${copyError.message}`);
      
      // 尝试使用流复制作为备用方案
      log.info(`Trying alternative copy method for ${fileName}...`);
      
      return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(sourcePath);
        const writeStream = fs.createWriteStream(targetPath);
        
        readStream.on('error', (err) => {
          log.error(`Stream read failed: ${err.message}`);
          reject(err);
        });
        
        writeStream.on('error', (err) => {
          log.error(`Stream write failed: ${err.message}`);
          reject(err);
        });
        
        writeStream.on('finish', () => {
          log.success(`✅ ${fileName} updated using stream copy`);
          clearImageCache();
          resolve();
        });
        
        readStream.pipe(writeStream);
      });
    }
  } catch (error) {
    log.error(`Failed to update ${fileName}: ${error.message}`);
    log.warning(`Please manually copy ${fileName} from ${sourcePath} to ${targetPath}`);
  }
}

// 清理旧的备份文件
function cleanOldBackups(baseName, ext, keepCount) {
  try {
    const backupPattern = new RegExp(`^${baseName}\\.backup-.*${ext.replace('.', '\\.')}$`);
    const backupFiles = fs.readdirSync(config.logoTargetDir)
      .filter(file => backupPattern.test(file))
      .map(file => ({
        name: file,
        path: path.join(config.logoTargetDir, file),
        mtime: fs.statSync(path.join(config.logoTargetDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    // 删除超过保留数量的旧备份
    if (backupFiles.length > keepCount) {
      backupFiles.slice(keepCount).forEach(file => {
        try {
          fs.unlinkSync(file.path);
          log.info(`Removed old backup: ${file.name}`);
        } catch (err) {
          // 忽略删除错误
        }
      });
    }
  } catch (err) {
    // 忽略清理错误
  }
}

// 清理所有可能的缓存
function clearAllCaches() {
  log.step('Clearing all caches to ensure fresh images...');
  
  const cachePaths = [
    path.join(process.cwd(), '.astro'),
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'node_modules', '.astro'),
    path.join(process.cwd(), 'node_modules', '.vite'),
    path.join(process.cwd(), 'public', '_astro')
  ];
  
  let clearedCount = 0;
  cachePaths.forEach(cachePath => {
    try {
      if (fs.existsSync(cachePath)) {
        fs.rmSync(cachePath, { recursive: true, force: true });
        clearedCount++;
        log.info(`Cleared: ${path.basename(cachePath)}`);
      }
    } catch (err) {
      // 忽略错误
    }
  });
  
  if (clearedCount > 0) {
    log.success(`Cleared ${clearedCount} cache directories`);
  }
}

// 验证结果
function verifyInstallation() {
  log.step('Verifying favicon installation...');
  
  let verifiedCount = 0;
  let missingCount = 0;

  config.requiredFiles.forEach(file => {
    const targetPath = path.join(config.targetDir, file);
    if (fs.existsSync(targetPath)) {
      verifiedCount++;
    } else {
      missingCount++;
      log.warning(`Not installed: ${file}`);
    }
  });

  if (missingCount === 0) {
    log.success(`All ${verifiedCount} favicon files are properly installed`);
  } else {
    log.warning(`${missingCount} files are missing in public directory`);
  }
  
  // 验证logo和主题图片
  const logoPath = path.join(config.logoTargetDir, 'site-logo.png');
  const themePath = path.join(config.logoTargetDir, 'site-theme.png');
  
  if (fs.existsSync(logoPath)) {
    log.success('Site logo is properly installed');
  }
  
  if (fs.existsSync(themePath)) {
    log.success('Site theme image is properly installed');
  }
}

// 清理缓存
function clearCache() {
  // 使用新的clearAllCaches函数
  clearAllCaches();
}

// 清理图片缓存（新增函数）
function clearImageCache() {
  try {
    const imageCachePath = path.join(process.cwd(), '.image-cache');
    if (fs.existsSync(imageCachePath)) {
      const cacheFiles = fs.readdirSync(imageCachePath);
      cacheFiles.forEach(file => {
        if (file.includes('site-logo') || file.includes('site-theme') || file.includes('favicon')) {
          try {
            fs.unlinkSync(path.join(imageCachePath, file));
          } catch (err) {
            // 忽略错误
          }
        }
      });
      log.info('Cleared image cache entries');
    }
  } catch (err) {
    // 忽略错误
  }
}

// 提示用户重启开发服务器（不强制停止）
async function notifyDevServerRestart() {
  log.step('Development server notification...');
  
  try {
    // 只是提示用户，不强制停止任何进程
    log.info('✨ Favicon and images have been updated!');
    log.warning('⚠️ Please restart the development server to see changes:');
    console.log(`\n  ${colors.yellow}1. Press Ctrl+C to stop the current server${colors.reset}`);
    console.log(`  ${colors.yellow}2. Run "npm run dev" to restart${colors.reset}\n`);
    
    // 或者提供热重载提示
    log.info('💡 Tip: The changes should appear after clearing browser cache');
    log.info('   Use Ctrl+F5 (Windows) or Cmd+Shift+R (Mac) to hard refresh');
    
  } catch (error) {
    log.warning('Please manually restart the dev server to see changes');
  }
}

// 主函数
async function main() {
  console.log(`\n${colors.bright}🎨 Favicon & Logo Update Script${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  // 执行步骤
  checkSourceFiles();
  console.log();
  
  cleanOldFiles();
  console.log();
  
  copyNewFiles();
  console.log();
  
  updateManifest();
  console.log();
  
  await updateSiteLogo();
  console.log();
  
  clearCache();  // 清理缓存
  console.log();
  
  verifyInstallation();
  console.log();
  
  // 提示用户重启开发服务器（不强制停止）
  await notifyDevServerRestart();
  
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.green}${colors.bright}✨ Favicon & Logo update completed!${colors.reset}\n`);
  
  console.log('Summary:');
  console.log(`  ✅ All favicon files have been updated`);
  console.log(`  ✅ Site logo and theme images have been updated`);
  console.log(`  ✅ All caches have been cleared`);
  console.log('\nNote: To update site images, add the following to the favicon_io folder:');
  console.log(`  • ${colors.cyan}site-logo.png${colors.reset} - For the website logo`);
  console.log(`  • ${colors.cyan}site-theme.png${colors.reset} - For the homepage hero image`);
}

// 运行脚本
main();