#!/usr/bin/env node

/**
 * 改进版文章添加脚本
 * 修复了以下问题：
 * 1. 发布时间时区问题 - 确保时间在当前时间之前
 * 2. YouTube链接转换 - 正确识别和转换YouTube链接
 * 3. 文章目录创建 - 确保index.mdx文件正确创建
 * 4. 图片下载和路径映射 - 改进的错误处理
 * 5. 缓存清理 - 自动清理Astro缓存
 * 6. 错误恢复 - 提供恢复建议和备用方案
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import SmartImageDownloader from './smart-image-downloader.js';
import { generateBatchPublishTimes, generateSmartPublishTime } from './smart-time-generator.js';
import imageDedupManager from './image-dedup-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  newArticlesDir: path.join(__dirname, '../newarticle'),
  articlesDir: path.join(__dirname, '../src/content/blog'),
  imagesDir: path.join(__dirname, '../src/assets/images/articles'),
  authorSourceDir: path.join(__dirname, '../author'),
  nameFile: 'name.txt',
  maxDescriptionLength: 300,
  maxConcurrentDownloads: 10
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 使用通用模板分类系统
import { categorizeArticle as templateCategorize, getAvailableCategories } from './template-categorization.js';

// 使用作者验证系统
import { readAndValidateAuthor, getAvailableAuthors, createAuthorIfNotExists } from './validate-author.js';

/**
 * 检查是否使用随机作者
 */
function checkIfRandomAuthor() {
  try {
    const nameFilePath = path.join(CONFIG.authorSourceDir, CONFIG.nameFile);
    if (fs.existsSync(nameFilePath)) {
      const name = fs.readFileSync(nameFilePath, 'utf8').trim();
      return name.toLowerCase() === 'random';
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 智能随机作者选择器 - 避免连续重复
 */
class SmartAuthorSelector {
  constructor() {
    this.lastAuthor = null;
    this.usedAuthors = [];
    this.availableAuthors = getAvailableAuthors();
  }

  /**
   * 智能选择作者（避免连续重复）
   */
  selectRandomAuthor() {
    if (this.availableAuthors.length === 0) {
      throw new Error('系统中没有可用的作者');
    }

    // 如果所有作者都用过了，重置使用记录
    if (this.usedAuthors.length >= this.availableAuthors.length) {
      this.usedAuthors = [];
    }
    
    // 过滤掉最近使用的作者和已使用的作者
    let candidates = this.availableAuthors.filter(author => 
      author.id !== this.lastAuthor && !this.usedAuthors.includes(author.id)
    );
    
    // 如果没有候选者，则只排除最近使用的
    if (candidates.length === 0) {
      candidates = this.availableAuthors.filter(author => author.id !== this.lastAuthor);
    }
    
    // 如果还是没有，随机选择所有作者
    if (candidates.length === 0) {
      candidates = this.availableAuthors;
    }
    
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selectedAuthor = candidates[randomIndex];
    
    // 更新使用记录
    this.lastAuthor = selectedAuthor.id;
    this.usedAuthors.push(selectedAuthor.id);
    
    // 每3个作者重置一次，增加随机性
    if (this.usedAuthors.length >= Math.min(3, this.availableAuthors.length)) {
      this.usedAuthors = [];
    }
    
    log(`  🎲 智能随机选择作者: ${selectedAuthor.name} (${selectedAuthor.id})`, 'yellow');
    return selectedAuthor.id;
  }
}

/**
 * 为单篇文章选择作者
 */
function selectAuthorForArticle(isRandomAuthor, articleTitle = '', authorSelector = null) {
  try {
    if (isRandomAuthor) {
      // 使用智能随机选择器
      if (authorSelector) {
        return authorSelector.selectRandomAuthor();
      } else {
        // 兼容旧版本调用
        const availableAuthors = getAvailableAuthors();
        if (availableAuthors.length === 0) {
          throw new Error('系统中没有可用的作者');
        }
        
        const randomIndex = Math.floor(Math.random() * availableAuthors.length);
        const selectedAuthor = availableAuthors[randomIndex];
        log(`  🎲 随机选择作者: ${selectedAuthor.name} (${selectedAuthor.id})`, 'yellow');
        return selectedAuthor.id;
      }
    } else {
      // 使用固定作者
      return readAndValidateAuthor();
    }
  } catch (error) {
    log(`❌ 作者选择失败: ${error.message}`, 'red');
    log('💡 使用备用作者', 'cyan');
    
    const availableAuthors = getAvailableAuthors();
    if (availableAuthors.length > 0) {
      const fallbackAuthor = availableAuthors[0];
      log(`🔄 使用备用作者: ${fallbackAuthor.name}`, 'yellow');
      return fallbackAuthor.id;
    } else {
      throw new Error('系统中没有可用的作者，请先创建作者');
    }
  }
}

// 移除旧的分类函数，使用动态分类系统

/**
 * 清理Astro缓存
 */
function clearAstroCache() {
  log('\n🧹 清理Astro缓存...', 'cyan');

  const cacheDir = path.join(__dirname, '../.astro');

  try {
    if (fs.existsSync(cacheDir)) {
      if (process.platform === 'win32') {
        execSync(`Remove-Item -Recurse -Force "${cacheDir}" -ErrorAction SilentlyContinue`, { shell: 'powershell' });
      } else {
        execSync(`rm -rf "${cacheDir}"`);
      }
      log('  ✅ Astro缓存已清除', 'green');
    } else {
      log('  ℹ️  没有找到缓存文件', 'blue');
    }
  } catch (error) {
    log(`  ⚠️  缓存清除失败: ${error.message}`, 'yellow');
    log('  💡 这不会影响文章处理，可以手动删除 .astro 文件夹', 'cyan');
  }
}

/**
 * 错误恢复建议
 */
function showErrorRecovery(error, context = '') {
  log('\n🔧 错误恢复建议:', 'bright');
  log('='.repeat(50), 'yellow');

  if (context === 'image_download') {
    log('📸 图片下载相关错误:', 'yellow');
    log('  1. 检查网络连接', 'cyan');
    log('  2. 运行: npm run localize-images', 'cyan');
    log('  3. 运行: npm run fix-missing-images', 'cyan');
  } else if (context === 'file_creation') {
    log('📄 文件创建相关错误:', 'yellow');
    log('  1. 检查磁盘空间', 'cyan');
    log('  2. 检查文件权限', 'cyan');
    log('  3. 手动创建缺失的目录', 'cyan');
  } else {
    log('🛠️  通用恢复方案:', 'yellow');
    log('  1. 重新运行脚本: npm run add-articles-improved', 'cyan');
    log('  2. 使用one-click修复: npm run one-click-article', 'cyan');
    log('  3. 手动修复: npm run super-automation', 'cyan');
    log('  4. 清理重试: npm run smart-fix', 'cyan');
  }

  log('\n📞 如果问题持续存在:', 'bright');
  log('  • 检查HTML文件格式是否正确', 'cyan');
  log('  • 确保newarticle目录中的文件完整', 'cyan');
  log('  • 查看上面的详细错误信息', 'cyan');
  log('='.repeat(50), 'yellow');
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * 生成发布时间 - 使用智能时间生成器确保时间顺序正确
 * @param {number} index - 文章索引（0是第一个要处理的文章）
 * @param {number} totalCount - 总文章数
 * @returns {string} ISO格式的时间字符串
 */
function generatePublishTime(index, totalCount) {
  const articleTime = generateSmartPublishTime(totalCount, index);
  return articleTime.toISOString();
}

/**
 * 提取和转换YouTube链接
 * @param {string} content - HTML内容
 * @returns {Object} 包含转换后内容和是否包含YouTube的对象
 */
function processYouTubeLinks(content) {
  let hasYouTube = false;
  let processedContent = content;

  // 匹配多种YouTube URL格式
  const youtubePatterns = [
    // 在center标签内的p标签
    /<center[^>]*>\s*<p[^>]*>\s*(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>\s*<\/center>/gi,
    /<center[^>]*>\s*<p[^>]*>\s*(https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>\s*<\/center>/gi,
    // 标准watch URL在p标签内
    /<p[^>]*>\s*(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>/gi,
    // 短链接在p标签内
    /<p[^>]*>\s*(https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>/gi,
    // 纯文本YouTube链接（不在标签内）
    /(?<!["|'])https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?![^<]*<\/a>)/gi,
    /(?<!["|'])https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)(?![^<]*<\/a>)/gi
  ];

  youtubePatterns.forEach(pattern => {
    processedContent = processedContent.replace(pattern, (match, urlOrVideoId, videoId) => {
      hasYouTube = true;
      // 如果第二个参数是URL，第三个参数是videoId
      const actualVideoId = videoId || urlOrVideoId;
      // 确保提取的是videoId而不是完整URL
      const idMatch = actualVideoId.match(/([a-zA-Z0-9_-]+)$/);
      const finalVideoId = idMatch ? idMatch[1] : actualVideoId;
      
      return `\n<YouTubeEmbed videoId="${finalVideoId}" title="YouTube video" />\n`;
    });
  });

  return { content: processedContent, hasYouTube };
}

/**
 * 解码HTML实体
 */
function decodeHTMLEntities(text) {
  if (!text) return text;
  
  // 注意：&amp; 必须最后处理，避免双重解码
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x5C;/g, '\\')
    .replace(/&#x22;/g, '"')
    .replace(/&amp;/g, '&');  // 必须最后处理
}

/**
 * 从HTML中提取内容并转换为MDX
 */
function extractContentFromHTML(htmlContent) {
  // 提取标题
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i) ||
    htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  let title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
  
  // 解码标题中的HTML实体
  title = decodeHTMLEntities(title);

  // 提取描述
  const metaDescMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    htmlContent.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  let description = metaDescMatch ? metaDescMatch[1].trim() : '';

  if (!description) {
    // 从第一段提取描述
    const firstParagraphMatch = htmlContent.match(/<p[^>]*>([^<]+)<\/p>/i);
    if (firstParagraphMatch) {
      description = firstParagraphMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  // 解码描述中的HTML实体
  if (description) {
    description = decodeHTMLEntities(description);
    
    // 移除字符计数标注 (例如: "(153 characters)")
    description = description.replace(/\s*\(\d+\s+characters?\)\s*"?\s*$/i, '');
    // 清理多余的引号
    description = description.replace(/^["']+|["']+$/g, '');
  }

  // 限制描述长度
  if (description.length > CONFIG.maxDescriptionLength) {
    description = description.substring(0, CONFIG.maxDescriptionLength - 3) + '...';
  }

  // 提取正文内容
  let content = htmlContent;

  // 移除HTML文档结构
  content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
  content = content.replace(/<html[^>]*>/gi, '');
  content = content.replace(/<\/html>/gi, '');
  content = content.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  content = content.replace(/<body[^>]*>/gi, '');
  content = content.replace(/<\/body>/gi, '');
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // 处理YouTube链接（必须在其他处理之前）
  const youtubeResult = processYouTubeLinks(content);
  content = youtubeResult.content;
  const hasYouTube = youtubeResult.hasYouTube;

  // 移除与标题重复的h1
  const titleForComparison = title.toLowerCase().trim();
  content = content.replace(/<h1[^>]*>([^<]+)<\/h1>/gi, (match, h1Content) => {
    const h1Text = h1Content.trim().toLowerCase();
    if (h1Text === titleForComparison) {
      return ''; // 删除重复标题
    }
    return `# ${h1Content}\n\n`;
  });

  // 转换其他HTML标签
  content = content.replace(/<h2[^>]*>([^<]+)<\/h2>/gi, '## $1\n\n');
  content = content.replace(/<h3[^>]*>([^<]+)<\/h3>/gi, '### $1\n\n');
  content = content.replace(/<h4[^>]*>([^<]+)<\/h4>/gi, '#### $1\n\n');
  content = content.replace(/<h5[^>]*>([^<]+)<\/h5>/gi, '##### $1\n\n');
  content = content.replace(/<h6[^>]*>([^<]+)<\/h6>/gi, '###### $1\n\n');

  // 处理表格
  content = content.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, tableContent) => {
    const rows = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    if (!rows) return '';

    let markdownTable = '\n';
    let isFirstRow = true;

    rows.forEach((row, index) => {
      const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
      if (!cells) return;

      const cleanCells = cells.map(cell => {
        let cleanContent = cell.replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/i, '$1');
        cleanContent = cleanContent
          .replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '$1')
          .replace(/<b[^>]*>([^<]+)<\/b>/gi, '$1')
          .replace(/<em[^>]*>([^<]+)<\/em>/gi, '$1')
          .replace(/<i[^>]*>([^<]+)<\/i>/gi, '$1')
          .replace(/<[^>]*>/g, '')
          .trim();
        return cleanContent;
      });

      // 添加表格行
      markdownTable += '| ' + cleanCells.join(' | ') + ' |\n';

      // 仅在第一行后添加分隔符行
      if (isFirstRow) {
        markdownTable += '| ' + cleanCells.map(() => '---').join(' | ') + ' |\n';
        isFirstRow = false;
      }
    });

    return markdownTable + '\n';
  });

  // 处理markdown表格（当表格直接在HTML中而不在<table>标签内时）
  // 修复markdown表格的格式：确保每行在单独的一行

  // 首先：预处理步骤 - 确保表格最后一行后有换行
  // 处理表格最后一行后直接跟文字的情况
  content = content.replace(/(\|[^\n]+\|)([A-Z])/g, (match, tableRow, letter) => {
    // 确保这是一个完整的表格行（至少有2个管道符）
    const pipeCount = (tableRow.match(/\|/g) || []).length;
    if (pipeCount >= 2) {
      return tableRow + '\n\n' + letter;
    }
    return match;
  });

  // 新增：修复表格行末尾直接跟文本的情况（在早期处理阶段）
  content = content.replace(/(\|[^\n|]+\|)([A-Z])/g, (match, tableRow, letter) => {
    const pipeCount = (tableRow.match(/\|/g) || []).length;
    if (pipeCount >= 3) { // 至少3个|表示至少2列
      return tableRow + '\n\n' + letter;
    }
    return match;
  });

  // 处理Markdown表格格式（在HTML中的纯文本表格）
  // 简化的方法：专门处理连续的表格行

  // 方法1：处理明显的表格行连接问题
  // 匹配模式：| ... | ... | 后面紧跟另一个 | ... |
  // 这种情况表示两个表格行连在一起了
  for (let i = 0; i < 5; i++) {
    const before = content;

    // 查找连续的表格行（两个或更多管道符分隔的内容紧密相连）
    // 模式: |内容|内容| 后面直接跟着 |内容|
    content = content.replace(/(\|[^|\n]+\|[^|\n]+\|)(\|[^|\n]+\|)/g, (match, row1, row2) => {
      // 确保我们不会在单元格内容中间断开
      // 检查row1是否看起来像完整的行（至少2个单元格）
      const pipes1 = (row1.match(/\|/g) || []).length;
      const pipes2 = (row2.match(/\|/g) || []).length;

      if (pipes1 >= 3 && pipes2 >= 2) {
        // 看起来像两个独立的表格行
        return row1 + '\n' + row2;
      }
      return match;
    });

    // 特殊情况：表格行后紧跟文字
    content = content.replace(/(\|[^|\n]+\|[^|\n]+\|)([A-Z][a-z])/g, '$1\n\n$2');
    content = content.replace(/(\|[^|\n]+\|[^|\n]+\|)([a-z]{2,})/g, '$1\n\n$2');

    if (before === content) break;
  }

  // 方法2：处理具体的表格行模式
  // 查找包含"| Feature |"等标题行的表格
  if (content.includes('| Feature |')) {
    // 分离表格的标题行和数据行
    content = content.replace(/(\| Feature \|[^|\n]+\|[^|\n]+\|)(\|[^|\n]+\|)/g, '$1\n$2');
    content = content.replace(/(\| Engagement Level \|[^|\n]+\|[^|\n]+\|)(\|[^|\n]+\|)/g, '$1\n$2');
    content = content.replace(/(\| Format Length \|[^|\n]+\|[^|\n]+\|)(\|[^|\n]+\|)/g, '$1\n$2');
    content = content.replace(/(\| Platform Compatibility \|[^|\n]+\|[^|\n]+\|)(\|[^|\n]+\|)/g, '$1\n$2');
    content = content.replace(/(\| Narrative Control \|[^|\n]+\|[^|\n]+\|)(\|[^|\n]+\|)/g, '$1\n$2');
    content = content.replace(/(\| Target Audience \|[^|\n]+\|[^|\n]+\|)([A-Z])/g, '$1\n\n$2');
    content = content.replace(/(\| Speed \|[^|\n]+\|[^|\n]+\|)(\|[^|\n]+\|)/g, '$1\n$2');
    content = content.replace(/(\| Cost \|[^|\n]+\|[^|\n]+\|)([^|\n])/g, '$1\n\n$2');
  }

  // 处理表格最后一行后紧跟文本的问题（更通用的方法）
  // 匹配以 | 结束的表格行，后面紧跟非管道符文本
  // 关键修复：确保表格行后面紧跟的任何文本都会被正确分隔
  content = content.replace(/(\|[^|\n]+\|)([A-Z][a-z])/g, '$1\n\n$2');
  content = content.replace(/(\|[^|\n]+\|)([a-z]+\s+[a-z])/g, '$1\n\n$2');

  // 特别处理表格行直接连接文本的情况（如 "| 2019 |The accessibility"）
  // 非常关键的修复：确保表格行真的结束后有换行
  content = content.replace(/(\|\s*[^|\n]+\s*\|)([A-Z][a-z])/g, '$1\n\n$2');
  content = content.replace(/(\|\s*\d{4}\s*\|)([A-Za-z])/g, '$1\n\n$2');
  content = content.replace(/(\|[^|\n]+\|)([A-Z][a-z][a-z])/g, '$1\n\n$2');

  // 更积极地处理表格后的文本
  // 匹配任何以 | 结束的内容后面紧跟字母
  content = content.replace(/(\|)([A-Z][a-z])/g, '$1\n\n$2');
  content = content.replace(/(\|)([a-z][a-z])/g, '$1\n\n$2');

  // 方法3：通用的表格行分离
  // 查找所有看起来像连续表格行的内容
  content = content.replace(/(\|[^|\n]{1,50}\|)(\|[^|\n]{1,50}\|)(\|[^|\n]{1,50}\|)(\|[^|\n]{1,50}\|)/g,
    (match, cell1, cell2, cell3, cell4) => {
      // 检查是否应该是两个独立的行（每行2个单元格）
      if (cell1 && cell2 && cell3 && cell4) {
        return cell1 + cell2 + '\n' + cell3 + cell4;
      }
      return match;
    }
  );

  // 清理多余的换行
  content = content.replace(/\n{3,}/g, '\n\n');

  // 处理段落和其他内联元素
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  content = content.replace(/<br\s*\/?>/gi, '\n');
  
  // 处理强调标签 - 移除格式而不是转换为markdown
  // 因为MDX编译器可能对** 和 * 语法敏感，直接保留文本内容
  content = content.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '$1');
  content = content.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '$1');
  content = content.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '$1');
  content = content.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '$1');

  // 清理未闭合的em和strong标签
  content = content.replace(/<em[^>]*>/gi, '');
  content = content.replace(/<\/em>/gi, '');
  content = content.replace(/<strong[^>]*>/gi, '');
  content = content.replace(/<\/strong>/gi, '');
  
  // 修复混合格式问题 - 移除所有残留的格式标签和星号
  content = content.replace(/\*([^*]+)<\/em>/gi, '$1');
  content = content.replace(/\*([^*]+)<\/i>/gi, '$1');
  content = content.replace(/<em>([^<]+)\*/gi, '$1');
  content = content.replace(/<i>([^<]+)\*/gi, '$1');
  content = content.replace(/\*\*([^*]+)<\/strong>/gi, '$1');
  content = content.replace(/\*\*([^*]+)<\/b>/gi, '$1');
  content = content.replace(/<strong>([^<]+)\*\*/gi, '$1');
  content = content.replace(/<b>([^<]+)\*\*/gi, '$1');

  // 处理图片 - 提取第一张图片作为封面，从正文中移除
  const allImages = content.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
  let firstImageUrl = null;

  if (allImages && allImages.length > 0) {
    const firstImageTag = allImages[0];
    // 提取第一张图片的URL
    const firstImageSrcMatch = firstImageTag.match(/src=["']([^"']+)["']/i);
    if (firstImageSrcMatch) {
      firstImageUrl = firstImageSrcMatch[1];
      log(`  🖼️  提取第一张图片作为封面: ${firstImageUrl}`, 'blue');
    }

    // 从正文内容中移除第一张图片
    const firstImageIndex = content.indexOf(firstImageTag);
    if (firstImageIndex !== -1) {
      content = content.substring(0, firstImageIndex) + content.substring(firstImageIndex + firstImageTag.length);
      log(`  ✂️  已从正文中移除第一张图片`, 'cyan');
    }
  }

  // 处理剩余的图片（确保图片后有换行符）
  content = content.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)\n');
  content = content.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '![]($1)\n');

  // 处理链接
  content = content.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi, '[$2]($1)');

  // 处理列表
  content = content.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    if (!items) return '';
    return items.map(item => {
      const cleanItem = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim();
      return `- ${cleanItem}`;
    }).join('\n') + '\n\n';
  });

  content = content.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
    const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    if (!items) return '';
    return items.map((item, index) => {
      const cleanItem = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1').trim();
      return `${index + 1}. ${cleanItem}`;
    }).join('\n') + '\n\n';
  });

  // 处理blockquote
  content = content.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, quoteContent) => {
    const cleanQuote = quoteContent.replace(/<[^>]*>/g, '').trim();
    return `> ${cleanQuote}\n\n`;
  });

  // 清理剩余的HTML标签
  // 移除meta标签（这些不应该出现在内容中）
  content = content.replace(/<meta[^>]*>/gi, '');
  
  // 移除center标签但保留内容
  content = content.replace(/<center[^>]*>([\s\S]*?)<\/center>/gi, '$1');
  content = content.replace(/<center[^>]*>/gi, '');
  content = content.replace(/<\/center>/gi, '');
  
  // 移除孤立的闭合标签（更全面的清理）
  content = content.replace(/<\/\w+>/gi, (match) => {
    // 检查是否有对应的开始标签
    const tagName = match.match(/<\/(\w+)>/)[1];
    const openTagRegex = new RegExp(`<${tagName}[^>]*>`, 'gi');
    if (!content.match(openTagRegex)) {
      return ''; // 移除孤立的闭合标签
    }
    return match;
  });
  
  // 移除孤立的开始标签（没有对应闭合标签的）
  content = content.replace(/<(\w+)([^>]*)>/gi, (match, tagName, attrs) => {
    // 跳过自闭合标签和特殊标签
    if (match.endsWith('/>') || ['img', 'br', 'hr', 'meta', 'input'].includes(tagName.toLowerCase())) {
      return match;
    }
    const closeTagRegex = new RegExp(`</${tagName}>`, 'gi');
    if (!content.match(closeTagRegex)) {
      return ''; // 移除孤立的开始标签
    }
    return match;
  });
  
  // 移除其他常见的HTML标签
  content = content.replace(/<span[^>]*>/gi, '');
  content = content.replace(/<\/span>/gi, '');
  content = content.replace(/<div[^>]*>/gi, '');
  content = content.replace(/<\/div>/gi, '');
  content = content.replace(/<section[^>]*>/gi, '');
  content = content.replace(/<\/section>/gi, '\n\n');
  
  // 移除任何遗留的自闭合标签（但保留YouTubeEmbed组件）
  content = content.replace(/<(?!YouTubeEmbed)[^>]*\/>/gi, '');

  // 清理多余的空行
  content = content.replace(/\n{3,}/g, '\n\n');

  // 确保图片后面的标题有换行符（修复格式问题）
  content = content.replace(/(!\[[^\]]*\]\([^)]+\))(#{1,6}\s+[^\n]+)/g, '$1\n$2');

  content = content.trim();

  // 修复MDX格式错误
  content = fixMDXFormatErrors(content);

  return {
    title,
    description,
    content,
    hasYouTube,
    firstImageUrl
  };
}

/**
 * 修复MDX格式错误
 * 特别是代码块格式问题、表格格式、粗体文本等
 */
function fixMDXFormatErrors(content) {
  // 修复错误的代码块格式
  // 1. 修复只有语言名称没有反引号的情况 (例如: json 应该是 ```json)
  content = content.replace(/\n(javascript|js|json|html|css|python|bash|shell|yaml|xml|markdown|md|sql|typescript|ts|jsx|tsx)\n/gi, '\n```$1\n');

  // 2. 修复只有两个反引号的结束标记 (例如: `` 应该是 ```)
  content = content.replace(/\n``([^`])/g, '\n```\n$1');
  content = content.replace(/\n``$/gm, '\n```');

  // 3. 修复代码块内的特殊字符
  // 找到所有代码块并确保它们格式正确
  content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    // 确保语言标识符存在且格式正确
    const language = lang || '';
    // 清理代码内容，但不改变其内容
    const cleanCode = code.replace(/```$/g, ''); // 移除可能的嵌套结束标记
    return '```' + language + '\n' + cleanCode + '```';
  });

  // 4. 修复内联代码格式
  // 确保内联代码使用单个反引号
  content = content.replace(/``([^`]+)``/g, '`$1`');

  // 5. 修复未闭合的代码块
  // 计算代码块开始和结束标记
  const codeBlockStarts = (content.match(/```/g) || []).length;
  if (codeBlockStarts % 2 !== 0) {
    // 如果代码块标记数量是奇数，说明有未闭合的代码块
    content += '\n```';
    log('  ⚠️  修复了未闭合的代码块', 'yellow');
  }

  // 6. 修复 HTML 代码块中的 JSX 语法冲突
  content = content.replace(/```html\n([\s\S]*?)```/g, (match, code) => {
    // 如果HTML代码块中包含JSX语法（如 {}），可能需要特殊处理
    if (code.includes('{') && code.includes('}')) {
      // 检查是否是JSX代码误标记为HTML
      if (code.includes('className') || code.includes('onClick') || code.includes('=>')) {
        return '```jsx\n' + code + '```';
      }
    }
    return match;
  });

  // 7. 修复表格格式问题

  // 7.0 首先处理表格最后一行直接连接文本的问题
  // 处理多种情况：表格行后直接跟文本，或者有一个换行

  // Case 1: 表格行和文本在同一行（没有换行）
  content = content.replace(/(\|[^\n]+\|)([A-Z][^|\n])/g, (match, tableEnd, nextText) => {
    const pipeCount = (tableEnd.match(/\|/g) || []).length;
    if (pipeCount >= 3) {
      return tableEnd + '\n\n' + nextText;
    }
    return match;
  });

  // Case 2: 表格行后只有一个换行就跟文本
  content = content.replace(/(\|[^\n]+\|)\n([A-Z])/g, (match, tableEnd, nextLetter) => {
    const pipeCount = (tableEnd.match(/\|/g) || []).length;
    if (pipeCount >= 3) {
      return tableEnd + '\n\n' + nextLetter;
    }
    return match;
  });

  // 7.1 处理所有Markdown表格，确保有分隔符行和正确的格式
  content = content.replace(/(\|[^\n]+\|)(\n\|[^\n]+\|)+/g, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length < 2) return match;

    const headerLine = lines[0];

    // 检查第二行是否已经是分隔符行
    const secondLine = lines[1];
    const hasSeparator = /^\|\s*[-:]+\s*\|/.test(secondLine);

    let result;
    if (hasSeparator) {
      // 如果已经有分隔符，确保格式正确
      const cellCount = (headerLine.match(/\|/g) || []).length - 1;
      const separator = '|' + Array(cellCount).fill(' --- ').join('|') + '|';
      result = [headerLine, separator, ...lines.slice(2)].join('\n');
    } else {
      // 如果没有分隔符，添加一个
      const cellCount = (headerLine.match(/\|/g) || []).length - 1;
      const separator = '|' + Array(cellCount).fill(' --- ').join('|') + '|';
      result = [headerLine, separator, ...lines.slice(1)].join('\n');
    }

    // 确保表格后有适当的换行
    return result + '\n\n';
  });

  // 7.2 修复表格中的内容问题（例如文字和表格混合）
  content = content.replace(/\|\s*([^|]+?)Modern\s+([^|]+?)\s+Approach\s*\|/g, '| $1 | Modern $2 Approach |');

  // 7.3 保留表格分隔符行（MDX需要分隔符行来正确渲染表格）
  // content = content.replace(/^\|\s*[-:]+\s*\|.*$/gm, ''); // 注释掉，保留分隔符行

  // 7.4 修复多余的分隔符行（特别是表格数据行之间的 --- 行）
  content = content.replace(/((?:\|[^\n]+\|\n)+)/g, (tableMatch) => {
    const lines = tableMatch.trim().split('\n');
    const result = [];
    let foundSeparator = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isSeparatorLine = line.match(/^\|\s*---/);

      if (i === 0) {
        // 第一行是表头
        result.push(line);
      } else if (i === 1 && isSeparatorLine) {
        // 第二行应该是分隔符
        result.push(line);
        foundSeparator = true;
      } else if (!isSeparatorLine) {
        // 数据行
        result.push(line);
      }
      // 跳过所有其他的分隔符行
    }

    // 保持表格后的双换行，以确保与后续内容正确分隔
    return result.join('\n') + '\n\n';
  });

  // 7.5 最终检查：确保表格最后一行和后续文本之间有正确的分隔
  // 这必须在所有表格处理之后运行
  // 使用更宽松的匹配模式，匹配任何表格行后跟文本的情况
  content = content.replace(/(\|[^\n]*\|)([A-Z])/g, (match, tableRow, letter) => {
    // 计算管道符数量来确认这是表格行（至少要有3个|，即至少2列）
    const pipeCount = (tableRow.match(/\|/g) || []).length;
    if (pipeCount >= 3) {
      console.log(`    📊 表格分隔修复: 在表格行后添加换行`);
      // 如果表格行后直接跟着大写字母开头的文本，添加换行
      return tableRow + '\n\n' + letter;
    }
    return match;
  });

  // 8. 清理所有残留的粗体标记 (因为我们不再使用**)
  // 8.1 移除所有的 ** 标记
  content = content.replace(/\*\*/g, '');

  // 8.2 移除所有的 * 标记（如果它们是格式化用的）
  // 保留列表中的 *
  content = content.replace(/(?<!^[\s]*)\*(?!\s)/g, '');
  content = content.replace(/(?<!\s)\*(?![\s]*$)/g, '');

  // 9. 清理表格中的HTML垃圾
  content = content.replace(/\|\s*<\/?[^>]+>\s*\|/g, '| |');

  // 10. 移除表格中完全由分隔符组成的多余行
  content = content.replace(/(\|\s*---+\s*)+\|\n(\|\s*---+\s*)+\|/g, (match) => {
    // 保留第一个分隔符行
    const lines = match.split('\n');
    return lines[0] + '\n';
  });

  // 11. 清理多余的空行（但保留代码块内的空行）
  content = content.replace(/\n{4,}/g, '\n\n\n');

  // 12. 修复表格前后的格式
  // 确保表格前后有空行
  content = content.replace(/([^\n])\n(\|[^|\n]+\|)/g, '$1\n\n$2');
  content = content.replace(/(\|[^|\n]+\|)\n([^\n|])/g, '$1\n\n$2');

  // 13. 最终的全面表格修复
  // 移除表格行末尾的任何星号
  content = content.replace(/\|\s*\*+$/gm, '|');

  // 移除独立的带星号的行
  content = content.replace(/^\s*\|\*+\s*$/gm, '');

  // 移除表格行之间的空行
  content = content.replace(/(^\|[^\n]*\|$(?:\n^\s*$\n)?)+/gm, (tableBlock) => {
    const lines = tableBlock.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return tableBlock;

    const isTable = lines.every(line => line.includes('|'));
    if (!isTable) return tableBlock;

    // 重建表格，确保行之间没有空行
    return lines.join('\n');
  });

  // 修复多余的空列
  content = content.replace(/^(\|[^|\n]*)\|\s*\|([^|\n]*\|.*)$/gm, '$1|$2');

  // 修复列数不匹配的表格
  const tablePattern = /(^\|.*\|$\n)(^\|[\s:-]+\|$\n)?((?:^\|.*\|$\n)*)/gm;
  content = content.replace(tablePattern, (match, headerLine, separatorLine, bodyLines) => {
    // 先清理表头中的格式问题（不匹配的星号）
    let cleanedHeader = headerLine.trim();

    // 修复表格单元格内的星号格式问题
    cleanedHeader = cleanedHeader.replace(/\|([^|]*)\|/g, (cellMatch, cellContent) => {
      // 移除单元格内不匹配的星号
      let cleaned = cellContent.trim();
      // 移除开头或结尾不匹配的星号
      cleaned = cleaned.replace(/^\*+([^*]+)$/, '$1'); // 只有开头有星号
      cleaned = cleaned.replace(/^([^*]+)\*+$/, '$1'); // 只有结尾有星号
      cleaned = cleaned.replace(/^\*+([^*]+)\*+$/, '$1'); // 两边星号数量不匹配
      return '| ' + cleaned + ' |';
    });

    // 移除空列
    cleanedHeader = cleanedHeader.replace(/\|\s*\|\s*/g, '|');

    // 检测文章标题混入表格的情况并删除不相关表格
    if (cleanedHeader.toLowerCase().includes('how music influences') ||
        cleanedHeader.toLowerCase().includes('understanding the connection') ||
        cleanedHeader.toLowerCase().includes('review of the latest')) {
      if (bodyLines && (bodyLines.includes('investors') || bodyLines.includes('Investment'))) {
        return ''; // 删除整个不相关的表格
      }
    }

    // 计算清理后的列数
    const headerCols = cleanedHeader.split('|').filter(col => col.trim() !== '').length;

    // 不添加分隔符行，直接处理数据行
    let fixedBody = '';
    if (bodyLines) {
      const lines = bodyLines.split('\n').filter(line => line.trim());
      fixedBody = lines.map(line => {
        // 清理空列
        let cleanedLine = line.replace(/\|\s*\|\s*/g, '|');
        const cols = cleanedLine.split('|').filter((col, idx, arr) =>
          !(idx === 0 && col === '') && !(idx === arr.length - 1 && col === '')
        );

        // 确保列数匹配
        while (cols.length < headerCols) {
          cols.push(' ');
        }
        if (cols.length > headerCols) {
          cols.length = headerCols;
        }

        return '|' + cols.join('|') + '|';
      }).join('\n');

      if (fixedBody) {
        fixedBody += '\n';
      }
    }

    return cleanedHeader + '\n' + fixedBody;
  });

  // 移除重复的分隔符行
  content = content.replace(/(^\|\s*(?:-+\s*\|)+\s*-*\s*\|\s*$\n)(^\|\s*(?:-+\s*\|)+\s*-*\s*\|\s*$\n)+/gm, '$1');

  // 确保表格后有适当的空行
  content = content.replace(/(\|[^\n]+\|\n)([^\n\|])/g, '$1\n$2');

  // 确保表格前有标题的话有空行
  content = content.replace(/(\|[^\n]+\|)\n(#{1,6}\s)/gm, '$1\n\n$2');

  // 14. 清理所有残留的星号格式标记
  // 移除多个连续的星号
  content = content.replace(/\*{2,}/g, '');

  // 移除段落或行首行尾的单个星号
  content = content.replace(/^\s*\*\s+([A-Z])/gm, '$1');
  content = content.replace(/([.!?])\s*\*\s*$/gm, '$1');

  // 清理文本中间的孤立星号（但保留列表项的星号）
  content = content.replace(/([a-zA-Z0-9,.:;!?])\s*\*\s+([A-Z])/g, '$1 $2');

  return content;
}

/**
 * 处理单篇文章
 */
async function processArticle(htmlFile, index, totalCount, publishTime = null, isRandomAuthor = false, authorSelector = null) {
  const htmlPath = path.join(CONFIG.newArticlesDir, htmlFile);

  try {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    log(`\n📄 处理文章 ${index + 1}/${totalCount}: ${htmlFile}`, 'cyan');

    // 提取内容
    const { title, description, content, hasYouTube, firstImageUrl } = extractContentFromHTML(htmlContent);
    const slug = slugify(title);

    // 使用模板分类系统进行智能分类
    const suggestedCategory = await templateCategorize(title, description, content);
    log(`  🎯 智能分类结果: ${suggestedCategory}`, 'cyan');

    // 创建文章目录
    const articleDir = path.join(CONFIG.articlesDir, slug);
    const articleImagesDir = path.join(CONFIG.imagesDir, slug);

    // 检查文章是否已存在
    if (fs.existsSync(articleDir)) {
      log(`  ⏭️  跳过已存在的文章: ${title}`, 'yellow');
      return { success: false, reason: 'exists' };
    }

    // 创建目录
    try {
      if (!fs.existsSync(articleDir)) {
        fs.mkdirSync(articleDir, { recursive: true });
      }
      if (!fs.existsSync(articleImagesDir)) {
        fs.mkdirSync(articleImagesDir, { recursive: true });
      }
    } catch (dirError) {
      log(`  ❌ 目录创建失败: ${dirError.message}`, 'red');
      showErrorRecovery(dirError, 'file_creation');
      return { success: false, reason: 'directory_creation_failed', error: dirError.message };
    }

    // 提取图片URL（不包括已移除的第一张图片）
    const imageUrls = [];
    const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      imageUrls.push(match[2]);
    }

    // 创建下载任务：封面图片 + 正文图片
    const imageTasks = [];
    let coverTaskIndex = -1;

    // 添加封面图片下载任务
    if (firstImageUrl) {
      imageTasks.push({
        url: firstImageUrl,
        targetPath: path.join(articleImagesDir, 'cover.png'),
        fileName: 'cover.png'
      });
      coverTaskIndex = 0;
    }

    // 添加正文图片下载任务
    imageUrls.forEach((url, imgIndex) => {
      imageTasks.push({
        url: url,
        targetPath: path.join(articleImagesDir, `img_${imgIndex}.jpg`),
        fileName: `img_${imgIndex}.jpg`
      });
    });

    log(`  🖼️  发现 ${imageUrls.length} 张正文图片${firstImageUrl ? ' + 1张封面图片' : ''}`, 'blue');

    // 下载所有图片
    let downloadedImages = [];
    if (imageTasks.length > 0) {
      try {
        // 清理无效的图片缓存（当图片文件被手动删除时）
        imageDedupManager.cleanupCache();
        
        // 使用智能下载器批量下载图片
        const downloader = new SmartImageDownloader({
          maxConcurrent: CONFIG.maxConcurrentDownloads || 3,
          timeout: 60000,
          enableCache: true,
          enableDedup: true
        });
        
        downloadedImages = await downloader.batchDownload(imageTasks, {
          checkExisting: true,  // 检查已存在的图片
          useCache: true,
          showProgress: false,
          createPlaceholder: false  // 我们会在后面自己处理占位符
        });
        
        // 显示下载统计
        const stats = downloader.getStats();
        if (stats.skipped > 0) {
          log(`  ⏭️  跳过已存在: ${stats.skipped} 张`, 'cyan');
        }
        if (stats.cached > 0) {
          log(`  💾 使用缓存: ${stats.cached} 张`, 'blue');
        }
        if (stats.success > 0) {
          log(`  ✅ 新下载: ${stats.success} 张`, 'green');
        }
        if (stats.failed > 0) {
          log(`  ❌ 下载失败: ${stats.failed} 张`, 'red');
        }
        
        const totalSuccess = downloadedImages.filter(r => r.success).length;
        log(`  📊 成功处理 ${totalSuccess}/${imageTasks.length} 张图片`, 'green');
      } catch (error) {
        log(`  ⚠️  图片下载出错: ${error.message}`, 'yellow');
        showErrorRecovery(error, 'image_download');
      }
    }

    // 替换正文图片路径
    let mdxContent = content;
    imageUrls.forEach((url, imgIndex) => {
      const localPath = `@assets/images/articles/${slug}/img_${imgIndex}.jpg`;
      mdxContent = mdxContent.replace(url, localPath);
    });

    // 使用预生成的发布时间，或生成新的时间
    const finalPublishTime = publishTime ? publishTime.toISOString() : generatePublishTime(index, totalCount);

    // 决定是否为主标题或副标题
    const isMainHeadline = index === 0;
    const isSubHeadline = index > 0 && index <= 4;

    // 为当前文章选择作者
    const finalAuthorName = selectAuthorForArticle(isRandomAuthor, title, authorSelector);

    // 生成MDX文件内容
    const frontmatter = `---
isDraft: false
isMainHeadline: ${isMainHeadline}
isSubHeadline: ${isSubHeadline}
description: "${description.replace(/"/g, '\\"')}"
title: "${title.replace(/"/g, '\\"')}"
categories:
  - "${suggestedCategory}"
publishedTime: ${finalPublishTime}
authors:
  - ${finalAuthorName}
cover: '@assets/images/articles/${slug}/cover.png'
---`;

    // 添加必要的imports
    let imports = '';
    if (hasYouTube) {
      imports = '\nimport YouTubeEmbed from "@/components/YouTubeEmbed.astro";\n';
    }

    const fullMdxContent = `${frontmatter}${imports}\n${mdxContent}`;

    // 写入MDX文件
    const mdxPath = path.join(articleDir, 'index.mdx');
    fs.writeFileSync(mdxPath, fullMdxContent);

    // 检查封面图片是否成功下载，如果没有则创建占位符
    const coverPath = path.join(articleImagesDir, 'cover.png');
    let coverCreated = fs.existsSync(coverPath);

    if (coverCreated) {
      // 检查是否是有效图片
      const coverStats = fs.statSync(coverPath);
      if (coverStats.size > 1024) {
        log(`  📸 封面图片有效 (${(coverStats.size / 1024 / 1024).toFixed(2)} MB)`, 'green');
      } else if (coverStats.size < 100) {
        // 是占位符，显示警告
        log(`  ⚠️  封面图片是占位符 (${coverStats.size} bytes)`, 'yellow');
      } else {
        log(`  📸 封面图片已存在 (${(coverStats.size / 1024).toFixed(1)} KB)`, 'green');
      }
    } else {
      // 创建占位符封面图片
      try {
        // 创建一个1x1像素的透明PNG作为占位符
        const placeholderBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const placeholderBuffer = Buffer.from(placeholderBase64, 'base64');
        fs.writeFileSync(coverPath, placeholderBuffer);
        log(`  📄 创建了占位符封面图片`, 'yellow');
      } catch (error) {
        log(`  ❌ 无法创建占位符封面: ${error.message}`, 'red');
      }
    }

    log(`  ✅ 文章创建成功: ${slug}`, 'green');
    return { success: true, slug, title };

  } catch (error) {
    log(`  ❌ 文章处理失败: ${error.message}`, 'red');
    showErrorRecovery(error, 'file_creation');
    return { success: false, reason: 'processing_failed', error: error.message };
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n🚀 改进版文章添加脚本启动', 'bright');
  log('='.repeat(60), 'blue');
  log('🎯 功能列表: 时区修复 | YouTube转换 | 图片下载 | 缓存清理 | 错误恢复', 'cyan');
  log('='.repeat(60), 'blue');

  try {
    // 检查源目录
    if (!fs.existsSync(CONFIG.newArticlesDir)) {
      log(`❌ 源目录不存在: ${CONFIG.newArticlesDir}`, 'red');
      log('💡 请先创建 newarticle 目录并放入HTML文件', 'yellow');
      process.exit(1);
    }

    // 获取所有HTML文件
    const htmlFiles = fs.readdirSync(CONFIG.newArticlesDir)
      .filter(file => file.endsWith('.html'))
      .sort(() => Math.random() - 0.5); // 随机排序

    if (htmlFiles.length === 0) {
      log('⚠️  没有找到HTML文件', 'yellow');
      return;
    }

    log(`📋 找到 ${htmlFiles.length} 个HTML文件\n`, 'blue');

    // 检查作者配置
    log('👤 检查作者配置...', 'cyan');
    const isRandomAuthor = checkIfRandomAuthor();
    
    // 如果是随机作者模式，创建智能选择器
    let authorSelector = null;
    if (isRandomAuthor) {
      authorSelector = new SmartAuthorSelector();
      log('✅ 智能随机作者选择器已初始化（避免连续重复）', 'cyan');
    }

    // 预生成所有文章的发布时间，确保时间顺序正确
    log('📅 预生成文章发布时间...', 'cyan');
    const publishTimes = generateBatchPublishTimes(htmlFiles.length);
    log(`✅ 时间范围: ${publishTimes[0].toLocaleString()} 到 ${publishTimes[publishTimes.length - 1].toLocaleString()}\n`, 'blue');

    // 处理每篇文章
    const results = [];
    let newArticleIndex = 0; // 只计算新创建的文章
    
    for (let i = 0; i < htmlFiles.length; i++) {
      const result = await processArticle(htmlFiles[i], newArticleIndex, htmlFiles.length, publishTimes[i], isRandomAuthor, authorSelector);
      results.push(result);
      
      // 只有成功创建的文章才增加索引
      if (result.success) {
        newArticleIndex++;
      }
    }

    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const skipCount = results.filter(r => r.reason === 'exists').length;
    const failedCount = results.length - successCount - skipCount;

    // 使用智能内链系统为新文章添加内链
    if (successCount > 0) {
      log('\n🔗 使用智能内链系统处理新文章...', 'cyan');
      const successfulArticles = results.filter(r => r.success);
      
      for (const article of successfulArticles) {
        try {
          // 使用新的智能内链系统，对新文章强制添加内链
          execSync(`node scripts/smart-internal-links.js article ${article.slug} --force`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
          });
        } catch (error) {
          // 如果智能内链系统不存在，回退到旧系统
          try {
            execSync(`node scripts/add-internal-links.js article ${article.slug}`, {
              cwd: path.join(__dirname, '..'),
              stdio: 'inherit'
            });
          } catch (fallbackError) {
            log(`  ⚠️  内链添加失败: ${article.slug}`, 'yellow');
          }
        }
      }
    }

    // 清理缓存（只在有成功创建的文章时）
    if (successCount > 0) {
      clearAstroCache();
    }

    log('\n' + '='.repeat(60), 'blue');
    log('📊 处理结果统计:', 'bright');
    log(`   ✅ 成功创建: ${successCount} 篇`, 'green');
    log(`   ⏭️  跳过已存在: ${skipCount} 篇`, 'yellow');
    log(`   ❌ 失败: ${failedCount} 篇`, 'red');

    if (successCount > 0) {
      log('\n🎉 文章添加完成！', 'green');
      log('💡 成功功能:', 'cyan');
      log('   ✅ 新文章已设置为最新发布时间', 'cyan');
      log('   ✅ YouTube链接已自动转换为嵌入组件', 'cyan');
      log('   ✅ 所有时间已调整为当前时间之前', 'cyan');
      log('   ✅ 智能分类系统已应用', 'cyan');
      log(`   ✅ 作者选择模式: ${isRandomAuthor ? '每篇文章随机选择' : '使用固定作者'}`, 'cyan');
      log('   ✅ Astro缓存已清理', 'cyan');
      log('   • 运行 npm run dev 查看效果', 'bright');
    }

    if (failedCount > 0) {
      log('\n⚠️  部分文章处理失败', 'yellow');
      showErrorRecovery(new Error('多个文章处理失败'));
    }

  } catch (error) {
    log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
    showErrorRecovery(error);
    process.exit(1);
  }
}

// 运行脚本
main().catch(error => {
  log(`\n❌ 致命错误: ${error.message}`, 'red');
  showErrorRecovery(error);
  console.error(error);
  process.exit(1);
});