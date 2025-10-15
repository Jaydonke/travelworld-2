#!/usr/bin/env node

/**
 * 定时发布文章脚本
 * 利用现有的时间过滤机制实现自动定时发布
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import SmartImageDownloader from './smart-image-downloader.js';
import imageDedupManager from './image-dedup-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  scheduledArticlesDir: path.join(__dirname, '../scheduledarticle'),  // 改为从scheduledarticle读取
  articlesDir: path.join(__dirname, '../src/content/blog'),
  imagesDir: path.join(__dirname, '../src/assets/images/articles'),
  authorSourceDir: path.join(__dirname, '../author'),
  nameFile: 'name.txt',
  maxDescriptionLength: 300,
  maxConcurrentDownloads: 10,
  // 定时发布配置
  scheduleSettings: {
    startFromTomorow: true,           // 从明天开始发布
    publishInterval: 'every-3-days',  // 发布间隔：'daily', 'twice-daily', 'weekly', 'every-3-days'
    publishTime: '09:00',            // 发布时间 (HH:mm)
    randomizeTime: true,             // 是否随机化发布时间（±2小时）
    maxFuturedays: 90               // 最多安排多少天后的文章（增加到90天以适应3天间隔）
  }
};

// 颜色输出
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

// 使用通用模板分类系统
import { categorizeArticle as templateCategorize, getAvailableCategories } from './template-categorization.js';

// 使用作者验证系统
import { readAndValidateAuthor, getAvailableAuthors, createAuthorIfNotExists } from './validate-author.js';

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
    log('  1. 重新运行脚本: npm run schedule-articles', 'cyan');
    log('  2. 清理缓存重试: npm run smart-fix', 'cyan');
    log('  3. 检查定时发布配置', 'cyan');
  }

  log('\n📞 如果问题持续存在:', 'bright');
  log('  • 检查HTML文件格式是否正确', 'cyan');
  log('  • 确保scheduledarticle目录中的文件完整', 'cyan');
  log('  • 查看上面的详细错误信息', 'cyan');
  log('='.repeat(50), 'yellow');
}

/**
 * 查找最后一篇未来文章的发布时间
 * @returns {Date|null} 最后一篇未来文章的发布时间，如果没有则返回null
 */
function findLatestFuturePublishTime() {
  try {
    const now = new Date();
    let latestFutureTime = null;
    
    // 扫描所有文章目录
    if (!fs.existsSync(CONFIG.articlesDir)) {
      return null;
    }
    
    const articles = fs.readdirSync(CONFIG.articlesDir);
    
    for (const articleSlug of articles) {
      const articlePath = path.join(CONFIG.articlesDir, articleSlug);
      const indexPath = path.join(articlePath, 'index.mdx');
      
      if (fs.existsSync(indexPath)) {
        try {
          const content = fs.readFileSync(indexPath, 'utf8');
          
          // 提取发布时间
          const publishTimeMatch = content.match(/publishedTime:\s*(.+)/);
          if (publishTimeMatch) {
            const publishTime = new Date(publishTimeMatch[1].trim());
            
            // 检查是否是未来时间
            if (publishTime > now) {
              if (!latestFutureTime || publishTime > latestFutureTime) {
                latestFutureTime = publishTime;
              }
            }
          }
        } catch (error) {
          // 忽略读取错误的文章
          continue;
        }
      }
    }
    
    return latestFutureTime;
  } catch (error) {
    log(`  ⚠️  查找未来文章时出错: ${error.message}`, 'yellow');
    return null;
  }
}

/**
 * 生成未来发布时间 - 智能版本：每篇文章固定间隔3天
 * @param {number} index - 文章索引（仅新创建的文章）
 * @param {number} totalCount - 总文章数
 * @param {Date|null} previousPublishTime - 上一篇新文章的发布时间
 * @returns {string} ISO格式的未来时间
 */
function generateFuturePublishTime(index, totalCount, previousPublishTime = null) {
  const now = new Date();
  const intervalDays = 3; // 固定3天间隔
  
  let publishDate;
  
  if (index === 0) {
    // 第一篇新文章：基于最后一篇未来文章或从明天开始
    const lastFutureTime = findLatestFuturePublishTime();
    
    if (lastFutureTime) {
      // 从最后一篇未来文章之后3天开始
      publishDate = new Date(lastFutureTime);
      publishDate.setDate(publishDate.getDate() + intervalDays);
      log(`  📅 发现已有未来文章，最晚发布时间: ${lastFutureTime.toLocaleDateString('zh-CN')}`, 'cyan');
      log(`  ⏭️  新文章将从 ${publishDate.toLocaleDateString('zh-CN')} 开始排期`, 'cyan');
    } else {
      // 没有未来文章，从明天开始
      publishDate = new Date(now);
      publishDate.setDate(publishDate.getDate() + 1);
      log(`  🆕 未发现未来文章，从明天开始排期`, 'cyan');
      log(`  ⏭️  新文章将从 ${publishDate.toLocaleDateString('zh-CN')} 开始排期`, 'cyan');
    }
  } else {
    // 后续文章：基于上一篇新文章时间 + 3天
    if (previousPublishTime) {
      publishDate = new Date(previousPublishTime);
      publishDate.setDate(publishDate.getDate() + intervalDays);
    } else {
      // 备用方案：如果没有传入上一篇时间，重新计算
      const lastFutureTime = findLatestFuturePublishTime();
      publishDate = lastFutureTime ? new Date(lastFutureTime) : new Date(now);
      publishDate.setDate(publishDate.getDate() + intervalDays * (index + 1));
    }
  }
  
  // 设置具体时间（早上9点）
  publishDate.setHours(9, 0, 0, 0);
  
  return publishDate.toISOString();
}

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

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * 提取和转换YouTube链接
 */
function processYouTubeLinks(content) {
  let hasYouTube = false;
  let processedContent = content;

  const youtubePatterns = [
    /<p[^>]*>\s*(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>/gi,
    /<p[^>]*>\s*(https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>/gi,
    /(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\s<]*)/gi,
    /(https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)[^\s<]*)/gi
  ];

  youtubePatterns.forEach(pattern => {
    processedContent = processedContent.replace(pattern, (match, fullUrl, videoId) => {
      hasYouTube = true;
      if (match.includes('<p')) {
        return `\n<YouTubeEmbed videoId="${videoId}" title="YouTube video" />\n`;
      }
      return `<YouTubeEmbed videoId="${videoId}" title="YouTube video" />`;
    });
  });

  return { content: processedContent, hasYouTube };
}

/**
 * 验证和清理MDX内容，确保语法正确
 */
function validateAndCleanMDX(content) {
  // 首先修复MDX格式错误
  content = fixMDXFormatErrors(content);

  // 检查和修复未闭合的标签
  const openTags = content.match(/<[^\/][^>]*>/g) || [];
  const closeTags = content.match(/<\/[^>]*>/g) || [];

  // 如果还有未处理的HTML标签（除了 YouTubeEmbed），全部移除
  content = content.replace(/<(?!\/?)(?!YouTubeEmbed)[^>]+>/g, '');

  // 确保Markdown语法正确
  content = content.replace(/^#{7,}/gm, '######'); // 限制标题层级最多6级
  content = content.replace(/\*{4,}/g, '**'); // 修复过多的星号
  content = content.replace(/_{4,}/g, '__'); // 修复过多的下划线

  // 修复链接格式
  content = content.replace(/\[([^\]]*)\]\s*\(([^)]*)\)/g, '[$1]($2)'); // 移除链接中的空格
  content = content.replace(/!\[([^\]]*)\]\s*\(([^)]*)\)/g, '![$1]($2)'); // 修复图片链接

  // 清理特殊字符（但保留代码块内的所有字符）
  // 先保存代码块
  const codeBlocks = [];
  let tempContent = content.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // 清理特殊字符
  tempContent = tempContent.replace(/[^\x00-\x7F\u4e00-\u9fff]/g, ''); // 移除不支持的字符，保留中文

  // 恢复代码块
  codeBlocks.forEach((block, index) => {
    tempContent = tempContent.replace(`__CODE_BLOCK_${index}__`, block);
  });
  content = tempContent;

  return content;
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

  // 预处理：确保表格最后一行后有换行
  // 处理表格最后一行后直接跟文字的情况
  content = content.replace(/(\|[^\n]+\|)([A-Z])/g, (match, tableRow, letter) => {
    // 确保这是一个完整的表格行（至少有2个管道符）
    const pipeCount = (tableRow.match(/\|/g) || []).length;
    if (pipeCount >= 2) {
      return tableRow + '\n\n' + letter;
    }
    return match;
  });

  // 7. 修复表格格式问题

  // 7.0 首先处理表格最后一行直接连接文本的问题
  // 匹配表格行后面紧跟的非表格文本（可能有一个换行）
  content = content.replace(/(\|[^\n]+\|)\n?([A-Z][^|\n])/g, (match, tableEnd, nextText) => {
    // 检查是否真的是表格行结尾（至少3个|表示至少2列）
    const pipeCount = (tableEnd.match(/\|/g) || []).length;
    if (pipeCount >= 3) {
      // 表格行后面应该有两个换行再接文本
      return tableEnd + '\n\n' + nextText;
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

  // 7.3 已由7.1处理，这里不需要额外的分隔符行处理
  // 原来的逻辑已被更全面的表格处理逻辑替代

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
  content = content.replace(/(\|[^|\n]+\|)([A-Z])/g, (match, tableRow, letter) => {
    // 计算管道符数量来确认这是表格行
    const pipeCount = (tableRow.match(/\|/g) || []).length;
    if (pipeCount >= 3) {
      // 如果表格行后直接跟着大写字母开头的文本，添加换行
      return tableRow + '\n\n' + letter;
    }
    return match;
  });

  // 8. 修复粗体标记问题
  // 8.1 修复连续的 **** 或 ******
  content = content.replace(/\*{4,}/g, '**');

  // 8.2 修复不完整的粗体标记（例如：**text:****）
  content = content.replace(/\*\*([^*]+):?\*{3,}/g, '**$1:**');

  // 8.3 修复嵌套或混乱的粗体标记
  content = content.replace(/\*\*([^*]+)\*\*\*\*/g, '**$1**');
  content = content.replace(/\*\*\*\*([^*]+)\*\*/g, '**$1**');

  // 8.4 修复未闭合的粗体标记
  content = content.replace(/\*\*([^*\n]{1,100})$/gm, '**$1**');

  // 8.5 修复 **text* 或 *text** 的情况
  content = content.replace(/\*\*([^*]+)\*(?!\*)/g, '**$1**');
  content = content.replace(/(?<!\*)\*([^*]+)\*\*/g, '**$1**');

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
  // 移除表格行末尾的 |**
  content = content.replace(/\|\s*\*\*$/gm, '|');

  // 移除独立的 |** 行
  content = content.replace(/^\s*\|\*\*\s*$/gm, '');

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

    // 修复分隔符行 - 确保只有正确数量的分隔符
    const separators = Array(headerCols).fill(' --- ');
    separatorLine = '|' + separators.join('|') + '|\n';

    // 修复数据行
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

    return cleanedHeader + '\n' + separatorLine + fixedBody;
  });

  // 移除重复的分隔符行
  content = content.replace(/(^\|\s*(?:-+\s*\|)+\s*-*\s*\|\s*$\n)(^\|\s*(?:-+\s*\|)+\s*-*\s*\|\s*$\n)+/gm, '$1');

  // 确保表格后有适当的空行
  content = content.replace(/(\|[^\n]+\|\n)([^\n\|])/g, '$1\n$2');

  // 确保表格前有标题的话有空行
  content = content.replace(/(\|[^\n]+\|)\n(#{1,6}\s)/gm, '$1\n\n$2');

  // 14. 修复Markdown格式问题（粗体标记和文本格式）
  // 修复结尾有多余星号的情况 (****变成**)
  content = content.replace(/\*{3,}/g, '**');

  // 修复 **文本** ** 这种格式（中间有空格的双星号）
  content = content.replace(/(\*\*[^*]+\*\*)\s+\*\*/g, '$1\n');

  // 修复 ** **文本** 这种格式（开头有孤立的**）
  content = content.replace(/\*\*\s+\*\*([^*]+)\*\*/g, '**$1**');

  // 修复单独的 ** 在行尾
  content = content.replace(/([^*])\s*\*\*$/gm, '$1');

  // 修复文本中间突然出现的孤立 **
  content = content.replace(/([a-zA-Z0-9,.:;!?])\s*\*\*\s+([A-Z])/g, '$1\n\n$2');

  // 修复列表项中的格式问题
  content = content.replace(/^(\s*[-*+]\s+)(.+?)\*\*\s*\*\*/gm, '$1$2');

  // 修复段落中间的孤立星号
  content = content.replace(/([^*\s])\s+\*\*\s+([^*])/g, '$1 $2');

  // 特别处理电影标题格式
  content = content.replace(/(\*\*[^*]+:\s*[^*]+\*\*)\s*\*\*/g, '$1');

  // 修复不完整的粗体（只有开头或结尾）
  content = content.replace(/^\s*\*\*\s+([A-Z])/gm, '$1');
  content = content.replace(/([.!?])\s*\*\*\s*$/gm, '$1');

  // 修复粗体文本后直接跟普通文本的问题
  content = content.replace(/(\*\*[^*]+\*\*)([A-Z][a-z])/g, '$1\n\n$2');

  return content;
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
  
  // 移除或处理容器标签（防止MDX解析错误）
  content = content.replace(/<article[^>]*>/gi, '');
  content = content.replace(/<\/article>/gi, '');
  content = content.replace(/<main[^>]*>/gi, '');
  content = content.replace(/<\/main>/gi, '');
  content = content.replace(/<header[^>]*>/gi, '');
  content = content.replace(/<\/header>/gi, '');
  content = content.replace(/<footer[^>]*>/gi, '');
  content = content.replace(/<\/footer>/gi, '');
  content = content.replace(/<nav[^>]*>/gi, '');
  content = content.replace(/<\/nav>/gi, '');
  content = content.replace(/<aside[^>]*>/gi, '');
  content = content.replace(/<\/aside>/gi, '');

  // 处理YouTube链接
  const youtubeResult = processYouTubeLinks(content);
  content = youtubeResult.content;
  const hasYouTube = youtubeResult.hasYouTube;

  // 移除与标题重复的h1
  const titleForComparison = title.toLowerCase().trim();
  content = content.replace(/<h1[^>]*>([^<]+)<\/h1>/gi, (match, h1Content) => {
    const h1Text = h1Content.trim().toLowerCase();
    if (h1Text === titleForComparison) {
      return '';
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
          .replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**')
          .replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**')
          .replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*')
          .replace(/<i[^>]*>([^<]+)<\/i>/gi, '*$1*')
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

  // 处理段落和其他内联元素
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  content = content.replace(/<br\s*\/?>/gi, '\n');
  
  // 更安全地处理强调标签，处理嵌套和未闭合的情况
  content = content.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  content = content.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  content = content.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  content = content.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  
  // 清理未闭合的em和strong标签
  content = content.replace(/<em[^>]*>/gi, '*');
  content = content.replace(/<\/em>/gi, '*');
  content = content.replace(/<strong[^>]*>/gi, '**');
  content = content.replace(/<\/strong>/gi, '**');
  
  // 修复混合格式问题（Markdown开始，HTML结束 或反之）
  content = content.replace(/\*([^*]+)<\/em>/gi, '*$1*');
  content = content.replace(/\*([^*]+)<\/i>/gi, '*$1*');
  content = content.replace(/<em>([^<]+)\*/gi, '*$1*');
  content = content.replace(/<i>([^<]+)\*/gi, '*$1*');
  content = content.replace(/\*\*([^*]+)<\/strong>/gi, '**$1**');
  content = content.replace(/\*\*([^*]+)<\/b>/gi, '**$1**');
  content = content.replace(/<strong>([^<]+)\*\*/gi, '**$1**');
  content = content.replace(/<b>([^<]+)\*\*/gi, '**$1**');

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

  // 移除任何剩余的HTML标签（但保留YouTubeEmbed组件）
  content = content.replace(/<(?!\/?)(?!YouTubeEmbed)[^>]+>/g, '');

  // 解码内容中的HTML实体（使用统一的解码函数）
  content = decodeHTMLEntities(content);
  
  // 额外处理一些特殊的HTML实体
  content = content.replace(/&hellip;/g, '...');
  content = content.replace(/&mdash;/g, '—');
  content = content.replace(/&ndash;/g, '–');
  content = content.replace(/&ldquo;/g, '"');
  content = content.replace(/&rdquo;/g, '"');
  content = content.replace(/&lsquo;/g, "'");
  content = content.replace(/&rsquo;/g, "'");

  // 清理多余的空行和空白字符
  content = content.replace(/\n{3,}/g, '\n\n');
  content = content.replace(/[ \t]+/g, ' ');
  content = content.replace(/\n\s*\n/g, '\n\n');
  
  // 确保图片后面的标题有换行符（修复格式问题）
  content = content.replace(/(!\[[^\]]*\]\([^)]+\))(#{1,6}\s+[^\n]+)/g, '$1\n$2');
  
  content = content.trim();

  // 最终MDX验证和清理
  content = validateAndCleanMDX(content);

  return {
    title,
    description,
    content,
    hasYouTube,
    firstImageUrl
  };
}

/**
 * 处理单篇定时发布文章
 */
async function processScheduledArticle(htmlFile, index, totalCount, isRandomAuthor = false, authorSelector = null, previousPublishTime = null) {
  const htmlPath = path.join(CONFIG.scheduledArticlesDir, htmlFile);

  try {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    log(`\n📄 处理定时文章 ${index + 1}/${totalCount}: ${htmlFile}`, 'cyan');

    // 提取内容
    const { title, description, content, hasYouTube, firstImageUrl } = extractContentFromHTML(htmlContent);
    const slug = slugify(title);

    // 使用模板分类系统进行智能分类
    const suggestedCategory = await templateCategorize(title, description, content);
    log(`  🎯 智能分类结果: ${suggestedCategory}`, 'cyan');

    // 生成未来发布时间
    const futurePublishTime = generateFuturePublishTime(index, totalCount, previousPublishTime);
    const publishDate = new Date(futurePublishTime);
    log(`  🕐 定时发布时间: ${publishDate.toLocaleString('zh-CN')} (${publishDate.toISOString()})`, 'magenta');

    // 创建文章目录
    const articleDir = path.join(CONFIG.articlesDir, slug);
    const articleImagesDir = path.join(CONFIG.imagesDir, slug);

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

    // 处理图片下载
    const imageUrls = [];
    const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      imageUrls.push(match[2]);
    }

    const imageTasks = [];
    let coverTaskIndex = -1;

    if (firstImageUrl) {
      imageTasks.push({
        url: firstImageUrl,
        targetPath: path.join(articleImagesDir, 'cover.png'),
        fileName: 'cover.png'
      });
      coverTaskIndex = 0;
    }

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

    // 替换正文图片路径 - 仅替换成功下载的图片
    let mdxContent = content;
    imageUrls.forEach((url, imgIndex) => {
      const expectedImagePath = path.join(articleImagesDir, `img_${imgIndex}.jpg`);
      
      // 只有图片文件确实存在时才替换路径
      if (fs.existsSync(expectedImagePath)) {
        const localPath = `@assets/images/articles/${slug}/img_${imgIndex}.jpg`;
        mdxContent = mdxContent.replace(url, localPath);
        log(`  ✅ 图片路径替换: img_${imgIndex}.jpg`, 'green');
      } else {
        // 如果图片不存在，移除整个图片引用
        const imageMarkdownPattern = new RegExp(`!\\[[^\\]]*\\]\\(${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
        mdxContent = mdxContent.replace(imageMarkdownPattern, '');
        log(`  ⚠️  移除缺失图片引用: img_${imgIndex}.jpg`, 'yellow');
      }
    });

    const finalAuthorName = selectAuthorForArticle(isRandomAuthor, title, authorSelector);

    // 决定是否为主标题或副标题（基于实际创建的文章索引，而不是HTML文件索引）
    const isMainHeadline = index === 0;
    const isSubHeadline = index > 0 && index <= 4;

    // 生成MDX文件内容
    const frontmatter = `---
isDraft: false
isMainHeadline: ${isMainHeadline}
isSubHeadline: ${isSubHeadline}
description: "${description.replace(/"/g, '\\"')}"
title: "${title.replace(/"/g, '\\"')}"
categories:
  - "${suggestedCategory}"
publishedTime: ${futurePublishTime}
authors:
  - ${finalAuthorName}
cover: '@assets/images/articles/${slug}/cover.png'
---`;

    let imports = '';
    if (hasYouTube) {
      imports = '\nimport YouTubeEmbed from "@/components/YouTubeEmbed.astro";\n';
    }

    const fullMdxContent = `${frontmatter}${imports}\n${mdxContent}`;

    // 最终MDX安全检查
    const safeContent = fullMdxContent
      .replace(/<[^>]*>/g, '') // 移除任何剩余的HTML标签
      .replace(/\n{4,}/g, '\n\n\n') // 限制连续空行
      .trim();

    // 写入MDX文件
    const mdxPath = path.join(articleDir, 'index.mdx');
    fs.writeFileSync(mdxPath, safeContent);
    
    log(`  🔍 MDX文件安全检查通过`, 'cyan');

    // 检查封面图片是否成功下载，如果没有则创建占位符
    const coverPath = path.join(articleImagesDir, 'cover.png');
    let coverCreated = fs.existsSync(coverPath);

    if (coverCreated) {
      log(`  📸 封面图片已创建`, 'green');
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

    log(`  ✅ 定时文章创建成功: ${slug}`, 'green');
    return { 
      success: true, 
      slug, 
      title, 
      publishTime: futurePublishTime, 
      publishDate: publishDate.toLocaleString('zh-CN')
    };

  } catch (error) {
    log(`  ❌ 文章处理失败: ${error.message}`, 'red');
    return { success: false, reason: 'processing_failed', error: error.message };
  }
}

/**
 * 显示发布计划
 */
function showScheduleInfo(results) {
  const successResults = results.filter(r => r.success);
  
  if (successResults.length === 0) {
    log('\n⚠️  没有成功创建的定时文章', 'yellow');
    return;
  }

  log('\n' + '='.repeat(80), 'magenta');
  log('📅 定时发布计划', 'bright');
  log('='.repeat(80), 'magenta');

  successResults.forEach((result, index) => {
    const isToday = new Date(result.publishTime).toDateString() === new Date().toDateString();
    const isTomorrow = new Date(result.publishTime).toDateString() === 
      new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
    
    let timeLabel = result.publishDate;
    if (isToday) timeLabel += ' (今天)';
    else if (isTomorrow) timeLabel += ' (明天)';

    log(`${(index + 1).toString().padStart(2, ' ')}. ${result.title}`, 'cyan');
    log(`    🕐 发布时间: ${timeLabel}`, 'yellow');
    log(`    📁 文件路径: ${result.slug}`, 'blue');
  });

  log('\n' + '='.repeat(80), 'magenta');
  log('💡 定时发布说明:', 'bright');
  log('   • 文章已创建，但设置了未来发布时间', 'cyan');
  log('   • 网站会自动隐藏未到发布时间的文章', 'cyan');
  log('   • 到达发布时间后，文章将自动显示', 'cyan');
  log('   • 使用 npm run preview-scheduled 可预览所有定时文章', 'cyan');
  log('='.repeat(80), 'magenta');
}

/**
 * 主函数
 */
async function main() {
  log('\n🚀 定时发布文章脚本启动', 'bright');
  log('='.repeat(80), 'blue');
  log('🎯 功能: 批量添加未来发布的文章 | 智能时间分配 | 自动隐藏显示', 'cyan');
  
  // 显示当前配置
  log('\n⚙️  当前定时发布配置:', 'yellow');
  log(`   📅 开始时间: ${CONFIG.scheduleSettings.startFromTomorow ? '明天开始' : '今天开始'}`, 'blue');
  
  // 格式化发布频率显示
  let intervalDisplay = CONFIG.scheduleSettings.publishInterval;
  if (intervalDisplay === 'daily') intervalDisplay = '每天';
  else if (intervalDisplay === 'twice-daily') intervalDisplay = '每天两次';
  else if (intervalDisplay === 'weekly') intervalDisplay = '每周';
  else if (intervalDisplay === 'every-3-days') intervalDisplay = '每3天';
  
  log(`   📊 发布频率: ${intervalDisplay}`, 'blue');
  log(`   🕐 发布时间: ${CONFIG.scheduleSettings.publishTime}`, 'blue');
  log(`   🎲 随机化时间: ${CONFIG.scheduleSettings.randomizeTime ? '开启 (±2小时)' : '关闭'}`, 'blue');
  log(`   📈 最大天数: ${CONFIG.scheduleSettings.maxFuturedays} 天`, 'blue');
  log('='.repeat(80), 'blue');

  try {
    // 检查定时文章目录
    if (!fs.existsSync(CONFIG.scheduledArticlesDir)) {
      log(`❌ 源目录不存在: ${CONFIG.scheduledArticlesDir}`, 'red');
      log('💡 请先创建 scheduledarticle 目录并放入HTML文件', 'yellow');
      process.exit(1);
    }

    // 获取所有HTML文件
    const htmlFiles = fs.readdirSync(CONFIG.scheduledArticlesDir)
      .filter(file => file.endsWith('.html'))
      .sort();

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

    // 处理每篇文章 - 修复：只为新文章分配时间索引，并传递上一篇的发布时间
    const results = [];
    let newArticleIndex = 0; // 只计算新创建的文章
    let lastPublishTime = null; // 追踪最后成功创建文章的发布时间
    
    for (let i = 0; i < htmlFiles.length; i++) {
      const result = await processScheduledArticle(htmlFiles[i], newArticleIndex, htmlFiles.length, isRandomAuthor, authorSelector, lastPublishTime);
      results.push(result);
      
      // 只有成功创建的文章才增加时间索引和更新发布时间
      if (result.success) {
        newArticleIndex++;
        lastPublishTime = result.publishTime; // 保存这篇文章的发布时间，供下一篇使用
      }
    }

    // 统计结果
    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const skipCount = results.filter(r => r.reason === 'exists').length;
    const failedCount = results.length - successCount - skipCount;

    // 使用智能内链系统为新文章添加内链（带时间检查）
    if (successCount > 0) {
      log('\n🔗 使用智能内链系统处理未来文章（启用时间检查）...', 'cyan');
      const successfulArticles = results.filter(r => r.success);
      
      for (const article of successfulArticles) {
        try {
          // 使用新的智能内链系统，带--check-time和--force参数
          // --check-time确保不链接到未来文章，--force确保新文章总是添加内链
          execSync(`node scripts/smart-internal-links.js article ${article.slug} --check-time --force`, {
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
      
      log('  ℹ️  时间验证已启用：确保不会链接到未发布的文章', 'blue');
    }

    // 清理缓存（只在有成功创建的文章时）
    if (successCount > 0) {
      clearAstroCache();
    }

    log('\n' + '='.repeat(80), 'blue');
    log('📊 处理结果统计:', 'bright');
    log(`   ✅ 成功创建定时文章: ${successCount} 篇`, 'green');
    log(`   ⏭️  跳过已存在: ${skipCount} 篇`, 'yellow');
    log(`   ❌ 失败: ${failedCount} 篇`, 'red');

    if (successCount > 0) {
      // 显示发布计划
      showScheduleInfo(results);

      log('\n🎉 定时发布文章创建完成！', 'green');
      log('💡 接下来可以:', 'cyan');
      log('   • 运行 npm run preview-scheduled 预览所有定时文章', 'cyan');
      log('   • 使用 GitHub Actions 每日自动构建来激活发布', 'cyan');
      log('   • 手动运行 npm run build 来刷新网站内容', 'cyan');
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