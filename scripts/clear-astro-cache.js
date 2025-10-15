#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');

async function clearCache() {
  console.log('🧹 清理 Astro 缓存...');
  
  const cachePaths = [
    path.join(projectRoot, '.astro'),
    path.join(projectRoot, 'dist'),
    path.join(projectRoot, 'node_modules', '.astro'),
    path.join(projectRoot, 'node_modules', '.cache'),
    path.join(projectRoot, 'node_modules', '.vite')
  ];
  
  for (const cachePath of cachePaths) {
    try {
      if (fs.existsSync(cachePath)) {
        await fs.promises.rm(cachePath, { recursive: true, force: true });
        console.log(`✅ 已清理: ${path.relative(projectRoot, cachePath)}`);
      } else {
        console.log(`ℹ️  不存在: ${path.relative(projectRoot, cachePath)}`);
      }
    } catch (error) {
      console.log(`⚠️  无法清理 ${path.relative(projectRoot, cachePath)}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 缓存清理完成！');
  console.log('💡 现在可以运行 npm run dev 重新启动开发服务器');
}

clearCache().catch(console.error);