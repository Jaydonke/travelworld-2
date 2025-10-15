import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 复制generate-articles.js中的downloadImage函数
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    
    console.log(`📥 开始下载: ${path.basename(filepath)}`);
    console.log(`🔗 URL: ${url.substring(0, 80)}...`);
    
    const request = protocol.get(url, (response) => {
      console.log(`📊 HTTP状态: ${response.statusCode}`);
      console.log(`📏 Content-Length: ${response.headers['content-length']} bytes`);
      
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          console.log(`🔄 重定向到: ${redirectUrl}`);
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      let downloadedBytes = 0;
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (downloadedBytes % 100000 === 0) { // 每100KB输出一次
          console.log(`   📈 已下载: ${Math.round(downloadedBytes / 1024)}KB`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ 下载完成: ${Math.round(downloadedBytes / 1024)}KB`);
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
      
      response.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      reject(err);
    });
  });
}

// 复制saveArticleImages函数的逻辑
async function testSaveArticleImages() {
  console.log('🧪 测试图片下载功能...\n');
  
  // 使用实际的OpenAI URL（从现有HTML文件中提取）
  const testImages = [
    "https://oaidalleapiprodscus.blob.core.windows.net/private/org-cp9Ljxeqx5rMCEw9FlLnE1jM/user-nhOVtxqeE6EScS97odgNRfWA/img-4Lgmp8rYWwtDPDoFiuCJmc4O.png?st=2025-09-11T05%3A10%3A42Z&se=2025-09-11T07%3A10%3A42Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=7aed557a-269d-4dda-ab8b-c66e34024151&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-09-10T23%3A22%3A05Z&ske=2025-09-11T23%3A22%3A05Z&sks=b&skv=2024-08-04&sig=9Eysjo4hqVVfcCL7usqtUBhNkjMvjM/dw4uJxbmE9Qg%3D",
    "https://oaidalleapiprodscus.blob.core.windows.net/private/org-cp9Ljxeqx5rMCEw9FlLnE1jM/user-nhOVtxqeE6EScS97odgNRfWA/img-9y27gLtIGr8EDH09M99J7IXh.png?st=2025-09-11T05%3A11%3A01Z&se=2025-09-11T07%3A11%3A01Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=7aed557a-269d-4dda-ab8b-c66e34024151&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-09-10T19%3A04%3A15Z&ske=2025-09-11T19%3A04%3A15Z&sks=b&skv=2024-08-04&sig=3SZOkf9zq6S5y7z/JH1xkdv30IpQ/dbO5nrcCUCaPZE%3D",
    "https://oaidalleapiprodscus.blob.core.windows.net/private/org-cp9Ljxeqx5rMCEw9FlLnE1jM/user-nhOVtxqeE6EScS97odgNRfWA/img-F5AijeQhLzpQvzhwKtOR14ti.png?st=2025-09-11T05%3A11%3A17Z&se=2025-09-11T07%3A11%3A17Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=1726b4ce-fee1-450b-8b92-1731ad8745f6&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-09-10T08%3A17%3A19Z&ske=2025-09-11T08%3A17%3A19Z&sks=b&skv=2024-08-04&sig=8qUCgeMGaXGJ42atd9YTIJDQh9Vw1WhxdVATTL6iOjM%3D",
    "https://oaidalleapiprodscus.blob.core.windows.net/private/org-cp9Ljxeqx5rMCEw9FlLnE1jM/user-nhOVtxqeE6EScS97odgNRfWA/img-GwLa3l1pHTZn7ZoqNs3f5pLW.png?st=2025-09-11T05%3A11%3A36Z&se=2025-09-11T07%3A11%3A36Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=f245bf7a-16fa-44e0-959a-8c745daf7e3d&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-09-11T06%3A11%3A36Z&ske=2025-09-12T06%3A11%3A36Z&sks=b&skv=2024-08-04&sig=nVBrB/A7s2OnMY1a38WYPouN6esg09ibDauWBFDORok%3D"
  ];
  
  const articleSlug = 'test-image-download';
  const imageDir = path.join(__dirname, 'test-images', articleSlug);
  
  // 确保目录存在
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
    console.log(`📁 创建目录: ${imageDir}`);
  }
  
  const savedImages = [];
  const imageNames = ['cover.png', 'img_0.jpg', 'img_1.jpg', 'img_2.jpg'];
  
  for (let i = 0; i < testImages.length && i < imageNames.length; i++) {
    const imageUrl = testImages[i];
    const imagePath = path.join(imageDir, imageNames[i]);
    
    console.log(`\n📸 处理图片 ${i + 1}/${testImages.length}: ${imageNames[i]}`);
    
    try {
      // 检查URL格式
      if (imageUrl.includes('oaidalleapi') || imageUrl.includes('unsplash')) {
        console.log(`✅ URL匹配 oaidalleapi 或 unsplash`);
        await downloadImage(imageUrl, imagePath);
        console.log(`✅ ${imageNames[i]} 下载成功`);
      } else {
        console.log(`❌ URL不匹配，创建占位符`);
        fs.writeFileSync(imagePath, 'placeholder image');
      }
      savedImages.push(imagePath);
    } catch (error) {
      console.log(`❌ ${imageNames[i]} 下载失败: ${error.message}`);
      // 创建占位符文件
      fs.writeFileSync(imagePath, 'placeholder image');
      savedImages.push(imagePath);
    }
  }
  
  console.log(`\n📊 总结:`);
  console.log(`   📁 保存目录: ${imageDir}`);
  console.log(`   📸 处理图片: ${savedImages.length} 张`);
  
  // 检查文件大小
  savedImages.forEach((imagePath, index) => {
    if (fs.existsSync(imagePath)) {
      const stats = fs.statSync(imagePath);
      console.log(`   ${imageNames[index]}: ${Math.round(stats.size / 1024)}KB`);
    }
  });
  
  return savedImages;
}

// 运行测试
testSaveArticleImages().catch(console.error);