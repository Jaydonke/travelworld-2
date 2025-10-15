#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');
const articleDirs = fs.readdirSync(articlesDir);

let latestTime = null;
let latestArticle = null;

for (const dir of articleDirs) {
  const mdxPath = path.join(articlesDir, dir, 'index.mdx');
  if (fs.existsSync(mdxPath)) {
    const content = fs.readFileSync(mdxPath, 'utf8');
    const timeMatch = content.match(/publishedTime: (.+)/);
    if (timeMatch) {
      const articleTime = new Date(timeMatch[1]);
      if (!latestTime || articleTime > latestTime) {
        latestTime = articleTime;
        latestArticle = dir;
      }
    }
  }
}

console.log('最新文章:', latestArticle);
console.log('发布时间:', latestTime ? latestTime.toLocaleString('zh-CN') : '无');
console.log('ISO时间:', latestTime ? latestTime.toISOString() : '无');
console.log('当前时间:', new Date().toLocaleString('zh-CN'));
console.log('差距天数:', latestTime ? Math.ceil((latestTime - new Date()) / (24 * 60 * 60 * 1000)) : '无');