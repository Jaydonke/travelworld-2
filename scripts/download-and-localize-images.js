#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');
const imagesDir = path.join(__dirname, '../src/assets/images/articles');

// 下载图片函数
function downloadImage(url, targetPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(targetPath);
    
    // 设置请求选项，包括User-Agent和其他headers
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      }
    };

    const req = https.request(options, (response) => {
      // 处理重定向
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`🔄 重定向到: ${response.headers.location}`);
        fs.unlink(targetPath, () => {}); // 删除已创建的文件
        downloadImage(response.headers.location, targetPath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        fs.unlink(targetPath, () => {}); // 删除空文件
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    });

    req.on('error', (err) => {
      fs.unlink(targetPath, () => {}); // 删除不完整的文件
      reject(err);
    });

    req.setTimeout(10000, () => { // 10秒超时
      req.destroy();
      fs.unlink(targetPath, () => {});
      reject(new Error('Download timeout'));
    });

    req.end();
  });
}

// 从URL中提取文件名
function extractFileName(url) {
  const urlParts = url.split('/');
  const lastPart = urlParts[urlParts.length - 1];

  // 如果URL以.jpg结尾，直接使用
  if (lastPart.includes('.jpg') || lastPart.includes('.jpeg') || lastPart.includes('.png')) {
    return lastPart;
  }

  // 否则生成一个基于URL哈希的文件名
  const urlHash = url.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  return `${urlHash}.jpg`;
}

// 处理单个MDX文件
async function processMdxFile(mdxPath) {
  try {
    console.log(`🔧 处理文件: ${path.basename(mdxPath)}`);

    const content = fs.readFileSync(mdxPath, 'utf8');
    const articleDir = path.dirname(mdxPath);
    const articleName = path.basename(articleDir);

    // 创建文章图片目录
    const articleImagesDir = path.join(imagesDir, articleName);
    if (!fs.existsSync(articleImagesDir)) {
      fs.mkdirSync(articleImagesDir, { recursive: true });
    }

    let modifiedContent = content;
    let downloadCount = 0;

    // 匹配外部图片链接
    const imageRegex = /!\[([^\]]*)\]\((https:\/\/[^)]+)\)/g;
    const matches = [...content.matchAll(imageRegex)];

    for (const match of matches) {
      const [fullMatch, altText, imageUrl] = match;

      // 跳过已经是本地路径的图片
      if (imageUrl.startsWith('@assets') || imageUrl.startsWith('/')) {
        continue;
      }

      try {
        // 生成本地文件名
        const fileName = extractFileName(imageUrl);
        const localImagePath = path.join(articleImagesDir, fileName);
        const localImageUrl = `@assets/images/articles/${articleName}/${fileName}`;

        // 下载图片
        console.log(`📥 下载图片: ${fileName}`);
        await downloadImage(imageUrl, localImagePath);

        // 替换文章中的图片链接
        modifiedContent = modifiedContent.replace(fullMatch, `![${altText}](${localImageUrl})`);
        downloadCount++;

        console.log(`✅ 已下载并本地化: ${fileName}`);
      } catch (error) {
        console.error(`❌ 下载失败: ${imageUrl} - ${error.message}`);
      }
    }

    // 保存修改后的内容
    if (downloadCount > 0) {
      fs.writeFileSync(mdxPath, modifiedContent);
      console.log(`✅ 已更新文章: ${path.basename(mdxPath)} (${downloadCount} 张图片)`);
      return downloadCount;
    } else {
      console.log(`📋 无需处理: ${path.basename(mdxPath)}`);
      return 0;
    }

  } catch (error) {
    console.error(`❌ 处理失败: ${path.basename(mdxPath)} - ${error.message}`);
    return 0;
  }
}

// 主函数
async function downloadAndLocalizeImages() {
  console.log('🚀 图片下载和本地化脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);
  console.log(`🖼️ 图片目录: ${imagesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  // 确保图片目录存在
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const items = fs.readdirSync(articlesDir);
  let totalImages = 0;
  let processedFiles = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        const imageCount = await processMdxFile(mdxPath);
        totalImages += imageCount;
        if (imageCount > 0) {
          processedFiles++;
        }
      }
    }
  }

  console.log('\n📊 本地化结果摘要:');
  console.log(`📁 处理文件数: ${processedFiles}`);
  console.log(`🖼️ 总下载图片数: ${totalImages}`);

  if (totalImages > 0) {
    console.log('\n🎉 图片本地化完成！');
    console.log('💡 所有外部图片已下载到本地并更新了文章链接');
    console.log('📝 现在所有图片都使用 @assets 别名路径');
  } else {
    console.log('\n📝 没有发现需要本地化的图片');
  }
}

downloadAndLocalizeImages(); 