import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从最新的HTML文件中提取图片URL进行测试
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    console.log(`正在下载: ${url}`);
    console.log(`目标路径: ${filepath}`);
    
    const request = https.get(url, (response) => {
      console.log(`HTTP状态: ${response.statusCode}`);
      console.log(`Content-Type: ${response.headers['content-type']}`);
      console.log(`Content-Length: ${response.headers['content-length']}`);
      
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: HTTP ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      let downloadedBytes = 0;
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        console.log(`已下载: ${downloadedBytes} bytes`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ 下载完成: ${filepath} (${downloadedBytes} bytes)`);
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        console.error(`文件写入错误: ${err.message}`);
        fs.unlink(filepath, () => {});
        reject(err);
      });
      
      response.on('error', (err) => {
        console.error(`响应错误: ${err.message}`);
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      console.error(`请求错误: ${err.message}`);
      reject(err);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('下载超时'));
    });
  });
}

async function testDownload() {
  // 使用从HTML文件中提取的实际URL
  const testUrl = "https://oaidalleapiprodscus.blob.core.windows.net/private/org-cp9Ljxeqx5rMCEw9FlLnE1jM/user-nhOVtxqeE6EScS97odgNRfWA/img-82trh32lQdZA2elXemMZOnS8.png?st=2025-09-11T05%3A31%3A01Z&se=2025-09-11T07%3A31%3A01Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=1726b4ce-fee1-450b-8b92-1731ad8745f6&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-09-11T06%3A31%3A01Z&ske=2025-09-12T06%3A31%3A01Z&sks=b&skv=2024-08-04&sig=iDVnI/0lqOye6EeCfIc0%2BAaYTI4mxH5xPn0kT0oMEyo%3D";
  
  const testPath = path.join(__dirname, 'test-download.png');
  
  try {
    await downloadImage(testUrl, testPath);
    
    // 检查文件大小
    const stats = fs.statSync(testPath);
    console.log(`\n📊 文件信息:`);
    console.log(`   大小: ${stats.size} bytes`);
    console.log(`   创建时间: ${stats.birthtime}`);
    
    if (stats.size < 1000) {
      console.log(`⚠️  文件太小，可能是损坏的图片`);
    } else {
      console.log(`✅ 文件大小正常`);
    }
    
  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
  }
}

testDownload();