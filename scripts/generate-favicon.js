#!/usr/bin/env node

/**
 * Favicon自动生成脚本
 * 从favicon文件夹中的原始图片生成所有需要的favicon文件
 * 模拟favicon.io的输出
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const CONFIG = {
  sourceDir: path.join(__dirname, '../favicon'),
  outputDir: path.join(__dirname, '../favicon_io'),
  sourceFiles: ['favicon.png', 'favicon.jpg', 'favicon.jpeg', 'favicon.webp'],
  faviconSizes: [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 }
  ],
  icoSizes: [16, 32, 48] // ICO文件包含的尺寸
};

/**
 * 查找源图片文件
 */
function findSourceImage() {
  log('🔍 查找源图片文件...', 'cyan');
  
  if (!fs.existsSync(CONFIG.sourceDir)) {
    throw new Error(`源目录不存在: ${CONFIG.sourceDir}`);
  }
  
  for (const filename of CONFIG.sourceFiles) {
    const filepath = path.join(CONFIG.sourceDir, filename);
    if (fs.existsSync(filepath)) {
      log(`✅ 找到源图片: ${filename}`, 'green');
      return filepath;
    }
  }
  
  throw new Error(`在 ${CONFIG.sourceDir} 中未找到favicon源图片 (支持: ${CONFIG.sourceFiles.join(', ')})`);
}

/**
 * 确保输出目录存在
 */
function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    log(`📁 创建输出目录: ${CONFIG.outputDir}`, 'blue');
  } else {
    log(`📁 使用现有输出目录: ${CONFIG.outputDir}`, 'blue');
  }
}

/**
 * 生成PNG格式的favicon
 */
async function generatePngFavicon(sourcePath, targetPath, size) {
  try {
    await sharp(sourcePath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(targetPath);
    
    const fileSize = fs.statSync(targetPath).size;
    log(`  ✅ ${path.basename(targetPath)} (${size}x${size}, ${formatFileSize(fileSize)})`, 'green');
  } catch (error) {
    log(`  ❌ 生成 ${path.basename(targetPath)} 失败: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 生成ICO文件
 */
async function generateIcoFile(sourcePath, targetPath) {
  try {
    log('🎨 生成ICO文件...', 'cyan');
    
    // 为ICO文件生成多个尺寸的PNG缓冲区
    const buffers = await Promise.all(
      CONFIG.icoSizes.map(async (size) => {
        const buffer = await sharp(sourcePath)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png({
            compressionLevel: 9,
            adaptiveFiltering: false,
            force: true
          })
          .toBuffer();
        log(`  📐 准备 ${size}x${size} 尺寸`, 'blue');
        return buffer;
      })
    );
    
    // 转换为ICO格式
    const icoBuffer = await toIco(buffers, {
      resize: false,  // 不要再次调整大小
      sizes: CONFIG.icoSizes  // 明确指定尺寸
    });
    
    // 写入文件
    fs.writeFileSync(targetPath, icoBuffer);
    
    const fileSize = fs.statSync(targetPath).size;
    log(`  ✅ favicon.ico (包含 ${CONFIG.icoSizes.join(', ')} 像素, ${formatFileSize(fileSize)})`, 'green');
    
    // 验证ICO文件是否有效
    if (fileSize < 100) {
      throw new Error('生成的ICO文件太小，可能已损坏');
    }
    
  } catch (error) {
    log(`  ❌ 生成ICO文件失败: ${error.message}`, 'red');
    log(`  💡 提示: 将使用favicon-32x32.png作为favicon.ico的备用方案`, 'yellow');
    
    // 备用方案：直接使用32x32的PNG生成ICO
    try {
      const buffer32 = await sharp(sourcePath)
        .resize(32, 32, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      const icoBuffer = await toIco([buffer32]);
      fs.writeFileSync(targetPath, icoBuffer);
      
      const fileSize = fs.statSync(targetPath).size;
      log(`  ✅ favicon.ico (备用方案: 32x32, ${formatFileSize(fileSize)})`, 'green');
    } catch (fallbackError) {
      log(`  ❌ 备用方案也失败了: ${fallbackError.message}`, 'red');
      throw fallbackError;
    }
  }
}

/**
 * 生成site.webmanifest文件
 */
function generateWebManifest() {
  log('📝 生成site.webmanifest...', 'cyan');
  
  const manifest = {
    name: "",
    short_name: "",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone"
  };
  
  const manifestPath = path.join(CONFIG.outputDir, 'site.webmanifest');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  
  log(`  ✅ site.webmanifest`, 'green');
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 清理旧文件
 */
function cleanOldFiles() {
  log('🧹 清理旧文件...', 'cyan');
  
  const filesToClean = [
    'favicon.ico',
    ...CONFIG.faviconSizes.map(item => item.name),
    'site.webmanifest'
  ];
  
  let cleanedCount = 0;
  filesToClean.forEach(filename => {
    const filepath = path.join(CONFIG.outputDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    log(`  🗑️ 清理了 ${cleanedCount} 个旧文件`, 'yellow');
  } else {
    log(`  ✨ 没有需要清理的文件`, 'blue');
  }
}

/**
 * 验证生成的文件
 */
function verifyGeneratedFiles() {
  log('\n✅ 验证生成的文件...', 'cyan');
  
  const expectedFiles = [
    'favicon.ico',
    ...CONFIG.faviconSizes.map(item => item.name),
    'site.webmanifest'
  ];
  
  const results = {
    success: [],
    missing: []
  };
  
  expectedFiles.forEach(filename => {
    const filepath = path.join(CONFIG.outputDir, filename);
    if (fs.existsSync(filepath)) {
      const size = fs.statSync(filepath).size;
      results.success.push(`${filename} (${formatFileSize(size)})`);
    } else {
      results.missing.push(filename);
    }
  });
  
  if (results.success.length > 0) {
    log('\n✅ 成功生成的文件:', 'green');
    results.success.forEach(file => log(`  • ${file}`, 'green'));
  }
  
  if (results.missing.length > 0) {
    log('\n❌ 缺失的文件:', 'red');
    results.missing.forEach(file => log(`  • ${file}`, 'red'));
  }
  
  return results.missing.length === 0;
}

/**
 * 主函数
 */
async function main() {
  log('\n====================================', 'bright');
  log('      Favicon 自动生成工具', 'bright');
  log('====================================', 'bright');
  log('模拟 favicon.io 生成所有需要的图标文件\n', 'blue');
  
  try {
    // 1. 查找源图片
    const sourceImage = findSourceImage();
    
    // 2. 确保输出目录存在
    ensureOutputDir();
    
    // 3. 清理旧文件
    cleanOldFiles();
    
    // 4. 生成PNG格式的各种尺寸favicon
    log('\n🎨 生成PNG格式favicon...', 'cyan');
    for (const { name, size } of CONFIG.faviconSizes) {
      const targetPath = path.join(CONFIG.outputDir, name);
      await generatePngFavicon(sourceImage, targetPath, size);
    }
    
    // 5. 生成ICO文件
    const icoPath = path.join(CONFIG.outputDir, 'favicon.ico');
    await generateIcoFile(sourceImage, icoPath);
    
    // 6. 生成site.webmanifest
    generateWebManifest();
    
    // 7. 验证结果
    const success = verifyGeneratedFiles();
    
    if (success) {
      log('\n====================================', 'green');
      log('    ✨ Favicon生成完成！', 'green');
      log('====================================', 'green');
      log('\n📁 输出目录: ' + CONFIG.outputDir, 'cyan');
      log('💡 下一步: 运行 npm run update-favicon 应用这些图标', 'cyan');
    } else {
      log('\n⚠️  部分文件生成失败，请检查错误信息', 'yellow');
    }
    
  } catch (error) {
    log(`\n❌ 错误: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行脚本
main().catch(error => {
  log(`\n❌ 致命错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});