#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入动态分类系统
import { loadCategorizationRules, categorizeArticle } from './dynamic-categorization.js';

const CONFIG = {
  newArticlesDir: path.join(__dirname, '../newarticle'),
  articlesDir: path.join(__dirname, '../src/content/articles'),
  imagesDir: path.join(__dirname, '../src/assets/images/articles'),
  authorSourceDir: path.join(__dirname, '../author'),
  nameFile: 'name.txt',
  maxDescriptionLength: 300
};

/**
 * 读取作者名字
 */
function readAuthorName() {
  try {
    const nameFilePath = path.join(CONFIG.authorSourceDir, CONFIG.nameFile);
    if (!fs.existsSync(nameFilePath)) {
      console.log(`⚠️  作者名字文件不存在: ${nameFilePath}`);
      return 'brian-mitchell'; // 默认fallback
    }
    
    const name = fs.readFileSync(nameFilePath, 'utf8').trim();
    if (!name) {
      console.log('⚠️  作者名字文件为空');
      return 'brian-mitchell';
    }
    
    // 格式化名字: "Brian Mitchell" -> "brian-mitchell"
    const formattedName = name.split(' ')
      .map(word => word.toLowerCase())
      .join('-');
    
    console.log(`📝 读取作者名字: ${name} -> ${formattedName}`);
    return formattedName;
  } catch (error) {
    console.log(`❌ 读取作者名字失败: ${error.message}`);
    return 'brian-mitchell';
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// 从URL中提取文件名
function extractFileNameFromUrl(url) {
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

// 提取内容中的外部图片URL
function extractExternalImages(content) {
  const imageRegex = /!\[([^\]]*)\]\((https:\/\/[^)]+)\)/g;
  const matches = [...content.matchAll(imageRegex)];
  return matches.map(match => match[2]);
}

function downloadImage(url, targetPath) {
  return new Promise((resolve, reject) => {
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
        downloadImage(response.headers.location, targetPath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(targetPath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    });

    req.on('error', reject);
    
    req.setTimeout(10000, () => { // 10秒超时
      req.destroy();
      reject(new Error('Download timeout'));
    });

    req.end();
  });
}

function extractContentFromHTML(htmlContent) {
  // 提取标题
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i) ||
    htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';

  // 提取描述
  const metaDescMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    htmlContent.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  let description = metaDescMatch ? metaDescMatch[1].trim() : '';

  if (!description) {
    // 从内容中提取第一段作为描述
    const firstParagraphMatch = htmlContent.match(/<p[^>]*>([^<]+)<\/p>/i);
    description = firstParagraphMatch ? firstParagraphMatch[1].trim() : '';
  }

  // 限制描述长度
  if (description.length > CONFIG.maxDescriptionLength) {
    description = description.substring(0, CONFIG.maxDescriptionLength - 3) + '...';
  }

  // 提取第一张图片作为封面
  const imgMatch = htmlContent.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  const coverImageUrl = imgMatch ? imgMatch[1] : null;

  // 提取正文内容
  let content = htmlContent;

  // 移除HTML文档结构标签
  content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
  content = content.replace(/<html[^>]*>[\s\S]*?<\/html>/gi, (match) => {
    // 提取html标签内的内容
    const bodyMatch = match.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : match;
  });
  content = content.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  content = content.replace(/<body[^>]*>([\s\S]*)<\/body>/gi, '$1');
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // 处理YouTube链接 - 必须在p标签处理之前
  content = content.replace(/<p[^>]*>(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^<]*)<\/p>/gi, (match, fullUrl, videoId) => {
    // 只使用videoId，忽略其他URL参数
    return `\n<YouTubeEmbed videoId="${videoId}" title="YouTube video" />\n`;
  });

  // 转换HTML标签为Markdown - 但不转换与标题相同的h1标签，避免重复
  // 首先提取标题，稍后用来检查重复
  const titleForComparison = title.toLowerCase().trim();

  // 转换h1标签，但跳过与文章标题相同的
  content = content.replace(/<h1[^>]*>([^<]+)<\/h1>/gi, (match, h1Content) => {
    const h1Text = h1Content.trim().toLowerCase();
    if (h1Text === titleForComparison) {
      // 如果h1与标题相同，则跳过（不转换）
      console.log(`跳过重复的h1标题: ${h1Content}`);
      return '';  // 返回空字符串，删除重复标题
    }
    return `# ${h1Content}\n\n`;
  });

  content = content.replace(/<h2[^>]*>([^<]+)<\/h2>/gi, '## $1\n\n');
  content = content.replace(/<h3[^>]*>([^<]+)<\/h3>/gi, '### $1\n\n');
  content = content.replace(/<h4[^>]*>([^<]+)<\/h4>/gi, '#### $1\n\n');
  content = content.replace(/<h5[^>]*>([^<]+)<\/h5>/gi, '##### $1\n\n');
  content = content.replace(/<h6[^>]*>([^<]+)<\/h6>/gi, '###### $1\n\n');

  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  content = content.replace(/<br\s*\/?>/gi, '\n');
  content = content.replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**');
  content = content.replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**');
  content = content.replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*');
  content = content.replace(/<i[^>]*>([^<]+)<\/i>/gi, '*$1*');



  // 处理表格标签 - 转换为Markdown表格（在所有其他处理之前）
  content = content.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, tableContent) => {
    const rows = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    if (!rows) return '';

    let markdownTable = '\n';
    rows.forEach((row, index) => {
      const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
      if (!cells) return;

      const cleanCells = cells.map(cell => {
        // 清理单元格内容中的HTML标签
        let cleanContent = cell.replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/i, '$1');
        cleanContent = cleanContent
          .replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**')
          .replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**')
          .replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*')
          .replace(/<i[^>]*>([^<]+)<\/i>/gi, '*$1*')
          .replace(/<[^>]*>/g, '')
          .trim();
        return cleanContent;
      });

      markdownTable += '| ' + cleanCells.join(' | ') + ' |\n';

      // 添加表头分隔符
      if (index === 0) {
        markdownTable += '| ' + cleanCells.map(() => '---').join(' | ') + ' |\n';
      }
    });

    return markdownTable + '\n';
  });

  // 处理图片标签 - 先转换为Markdown格式，稍后替换路径
  // 需要跳过第一张图片（已经用作封面）
  const allImages = content.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
  if (allImages && allImages.length > 0) {
    const firstImageTag = allImages[0];
    console.log(`跳过第一张图片（已用作封面）: ${firstImageTag}`);
    
    // 先移除第一张图片
    const firstImageIndex = content.indexOf(firstImageTag);
    if (firstImageIndex !== -1) {
      content = content.substring(0, firstImageIndex) + content.substring(firstImageIndex + firstImageTag.length);
    }
  }
  
  // 处理剩余的图片（有alt属性的）
  content = content.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, (match, src, alt) => {
    return `![${alt}](${src})\n\n`;
  });

  // 处理剩余的图片（没有alt属性的）
  content = content.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
    return `![](${src})\n\n`;
  });

  // 处理div和其他容器标签
  content = content.replace(/<div[^>]*class=["']styled-container["'][^>]*>/gi, '');
  content = content.replace(/<div[^>]*class=["']img-container["'][^>]*>/gi, '');
  content = content.replace(/<div[^>]*class=["']highlight-box["'][^>]*>/gi, '');
  content = content.replace(/<div[^>]*class=["']cta-block["'][^>]*>/gi, '');
  content = content.replace(/<div[^>]*>/gi, '');
  content = content.replace(/<\/div>/gi, '');

  // 处理section标签
  content = content.replace(/<section[^>]*>/gi, '');
  content = content.replace(/<\/section>/gi, '\n\n');

  // 处理blockquote标签
  content = content.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, quoteContent) => {
    const cleanQuote = quoteContent.replace(/<p[^>]*>([^<]+)<\/p>/gi, '$1').trim();
    return `> ${cleanQuote}\n\n`;
  });



  // 处理代码块 - 确保正确的格式
  content = content.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (match, codeContent) => {
    // 检测代码语言
    const langMatch = match.match(/class=["']language-([^"']+)["']/i);
    const language = langMatch ? langMatch[1] : '';
    const codeBlock = language ? `\`\`\`${language}\n${codeContent.trim()}\n\`\`\`` : `\`\`\`\n${codeContent.trim()}\n\`\`\``;
    return codeBlock + '\n\n';
  });

  // 处理内联代码
  content = content.replace(/<code[^>]*>([^<]+)<\/code>/gi, '`$1`');

  // 处理链接
  content = content.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi, '[$2]($1)');

  // 处理单独的YouTube链接（不在p标签内）
  content = content.replace(/(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\s<]*)/gi, (match, fullUrl, videoId) => {
    // 只使用videoId，忽略其他URL参数
    return `\n<YouTubeEmbed videoId="${videoId}" title="YouTube video" />\n`;
  });

  // 处理剩余的HTML标签
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  content = content.replace(/<br\s*\/?>/gi, '\n');
  content = content.replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**');
  content = content.replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**');
  content = content.replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*');
  content = content.replace(/<i[^>]*>([^<]+)<\/i>/gi, '*$1*');

  // 移除所有剩余的HTML标签（除了列表标签）
  content = content.replace(/<(?!\/?(?:ul|ol|li))[^>]*>/g, '');

  // 处理列表 - 在所有其他处理之后
  content = content.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
    return listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (match, itemContent) => {
      // 清理列表项内容中的HTML标签
      const cleanContent = itemContent
        .replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>([^<]+)<\/i>/gi, '*$1*')
        .replace(/<[^>]*>/g, '')
        .trim();
      return `- ${cleanContent}\n`;
    }) + '\n';
  });

  content = content.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
    let counter = 1;
    return listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (match, itemContent) => {
      // 清理列表项内容中的HTML标签
      const cleanContent = itemContent
        .replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>([^<]+)<\/i>/gi, '*$1*')
        .replace(/<[^>]*>/g, '')
        .trim();
      return `${counter++}. ${cleanContent}\n`;
    }) + '\n';
  });

  // 清理多余的空白字符
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  content = content.trim();

  // 清理重复的代码块标记
  content = content.replace(/```css\n```css/g, '```css');
  content = content.replace(/```javascript\n```javascript/g, '```javascript');
  content = content.replace(/```js\n```js/g, '```js');
  content = content.replace(/```html\n```html/g, '```html');
  content = content.replace(/```\n```/g, '```');

  // 清理嵌套的代码块标记
  content = content.replace(/```css\n```css\n([\s\S]*?)```\n```/g, '```css\n$1```');
  content = content.replace(/```javascript\n```javascript\n([\s\S]*?)```\n```/g, '```javascript\n$1```');
  content = content.replace(/```js\n```js\n([\s\S]*?)```\n```/g, '```js\n$1```');
  content = content.replace(/```html\n```html\n([\s\S]*?)```\n```/g, '```html\n$1```');
  content = content.replace(/```\n```\n([\s\S]*?)```\n```/g, '```\n$1```');

  return { title, description, content, coverImageUrl };
}

function createMdxContent(title, description, content, author = null, category = null) {
  const slug = slugify(title);

  // 使用传入的作者或读取默认作者
  const finalAuthor = author || readAuthorName();
  
  // 进行智能分类
  let finalCategory = category;
  if (!finalCategory) {
    const { rules, settings } = loadCategorizationRules();
    finalCategory = categorizeArticle(title, description, content, rules, settings);
    console.log(`🎯 智能分类结果: ${finalCategory}`);
  }

  // 生成2025年6月到当前系统时间的随机时间
  const now = new Date();
  const startTime = new Date('2025-06-01T00:00:00Z');
  const randomTime = new Date(startTime.getTime() + Math.random() * (now.getTime() - startTime.getTime()));

  // 设置合理的发布时间（上午9点到下午6点）
  const hours = 9 + Math.floor(Math.random() * 9);
  const minutes = Math.floor(Math.random() * 60);
  const seconds = Math.floor(Math.random() * 60);
  randomTime.setHours(hours, minutes, seconds, Math.floor(Math.random() * 1000));

  // 30%的概率设置为subHeadline
  const isSubHeadline = Math.random() < 0.3;

  // 检查内容是否包含YouTube嵌入组件
  const hasYouTubeEmbed = content.includes('<YouTubeEmbed');
  const importStatement = hasYouTubeEmbed ? 'import YouTubeEmbed from "@/components/YouTubeEmbed.astro";\n\n' : '';

  return `---
isDraft: false
isMainHeadline: false
isSubHeadline: ${isSubHeadline}
description: "${description}"
title: "${title}"
category: ${finalCategory}
publishedTime: ${randomTime.toISOString()}
authors:
  - ${finalAuthor}
cover: '@assets/images/articles/${slug}/cover.png'
---

${importStatement}${content}
`;
}

function createDefaultCoverImage(targetPath) {
  // 创建一个简单的默认封面图片（base64编码的PNG）
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(targetPath, pngBuffer);
}

function setupHeadlines(articleSlugs) {
  // 设置一个主标题和四个副标题
  const headlines = {};
  articleSlugs.forEach((slug, index) => {
    if (index === 0) {
      headlines[slug] = { isMainHeadline: true, isSubHeadline: false };
    } else if (index < 5) {
      headlines[slug] = { isMainHeadline: false, isSubHeadline: true };
    } else {
      headlines[slug] = { isMainHeadline: false, isSubHeadline: false };
    }
  });
  return headlines;
}

async function processHtmlFile(htmlFilePath) {
  try {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    const { title, description, content, coverImageUrl } = extractContentFromHTML(htmlContent);
    const slug = slugify(title);

    // 检查文章是否已存在
    const articleDir = path.join(CONFIG.articlesDir, slug);
    if (fs.existsSync(articleDir)) {
      console.log(`⏭️  跳过已存在的文章: ${title}`);
      return null;
    }

    // 创建文章目录
    fs.mkdirSync(articleDir, { recursive: true });

    // 创建图片目录
    const imagesDir = path.join(CONFIG.imagesDir, slug);
    fs.mkdirSync(imagesDir, { recursive: true });

    // 处理封面图片
    const coverImagePath = path.join(imagesDir, 'cover.png');
    if (coverImageUrl && coverImageUrl.startsWith('http')) {
      try {
        await downloadImage(coverImageUrl, coverImagePath);
        console.log(`✅ 下载封面图片: ${coverImageUrl}`);
      } catch (error) {
        console.log(`⚠️  封面图片下载失败，使用默认图片: ${error.message}`);
        createDefaultCoverImage(coverImagePath);
      }
    } else {
      createDefaultCoverImage(coverImagePath);
      console.log(`📄 使用默认封面图片`);
    }

    // 下载内容中的外部图片并替换路径
    const externalImages = extractExternalImages(content);
    let modifiedContent = content;

    for (const imageUrl of externalImages) {
      try {
        const fileName = extractFileNameFromUrl(imageUrl);
        const imagePath = path.join(imagesDir, fileName);
        await downloadImage(imageUrl, imagePath);
        console.log(`✅ 下载内容图片: ${fileName}`);

        // 替换内容中的图片路径
        const localImageUrl = `@assets/images/articles/${slug}/${fileName}`;
        modifiedContent = modifiedContent.replace(
          new RegExp(`!\\[([^\\]]*)\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
          `![$1](${localImageUrl})`
        );
      } catch (error) {
        console.log(`⚠️  内容图片下载失败: ${imageUrl} - ${error.message}`);
      }
    }

    // 创建MDX内容
    const mdxContent = createMdxContent(title, description, modifiedContent);

    // 保存MDX文件
    const mdxPath = path.join(articleDir, 'index.mdx');
    fs.writeFileSync(mdxPath, mdxContent);

    console.log(`✅ 创建文章: ${title}`);
    return slug;
  } catch (error) {
    console.error(`❌ 处理文件失败 ${htmlFilePath}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 HTML到MDX转换脚本启动');
  console.log(`📂 新文章目录: ${CONFIG.newArticlesDir}`);
  console.log(`📂 目标文章目录: ${CONFIG.articlesDir}`);

  if (!fs.existsSync(CONFIG.newArticlesDir)) {
    console.error(`❌ 新文章目录不存在: ${CONFIG.newArticlesDir}`);
    return;
  }

  const htmlFiles = fs.readdirSync(CONFIG.newArticlesDir)
    .filter(file => file.toLowerCase().endsWith('.html'));

  if (htmlFiles.length === 0) {
    console.log('📭 没有找到HTML文件');
    return;
  }

  console.log(`📄 找到 ${htmlFiles.length} 个HTML文件`);

  const createdSlugs = [];

  for (const htmlFile of htmlFiles) {
    const htmlFilePath = path.join(CONFIG.newArticlesDir, htmlFile);
    const slug = await processHtmlFile(htmlFilePath);
    if (slug) {
      createdSlugs.push(slug);
    }
  }

  // 设置标题
  if (createdSlugs.length > 0) {
    const headlines = setupHeadlines(createdSlugs);

    for (const [slug, settings] of Object.entries(headlines)) {
      const mdxPath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        let content = fs.readFileSync(mdxPath, 'utf8');
        content = content.replace(/isMainHeadline: (true|false)/, `isMainHeadline: ${settings.isMainHeadline}`);
        content = content.replace(/isSubHeadline: (true|false)/, `isSubHeadline: ${settings.isSubHeadline}`);
        fs.writeFileSync(mdxPath, content);
      }
    }
  }

  console.log(`\n🎉 转换完成！`);
  console.log(`📊 成功创建: ${createdSlugs.length} 篇文章`);

  if (createdSlugs.length > 0) {
    console.log('\n📝 建议运行以下命令修复格式问题:');
    console.log('npm run fix-all');
  }
}

main().catch(console.error);
