#!/usr/bin/env node

/**
 * 创建主题相关的作者
 * 根据config.template.js中的主题自动创建合适的作者
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authorsDir = path.join(__dirname, '../src/content/authors');
const assetsDir = path.join(__dirname, '../src/assets/images/authors');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 读取当前主题配置
async function getCurrentTheme() {
  const templatePath = path.join(__dirname, '../config.template.js');
  
  try {
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const tempFile = path.join(__dirname, `temp-config-${Date.now()}.js`);
    fs.writeFileSync(tempFile, templateContent);
    
    const tempFileUrl = `file:///${path.resolve(tempFile).replace(/\\/g, '/')}?t=${Date.now()}`;
    const configModule = await import(tempFileUrl);
    
    fs.unlinkSync(tempFile);
    
    return configModule.CURRENT_WEBSITE_CONTENT.theme?.name || 'default';
  } catch (error) {
    log(`⚠️ 无法读取主题配置，使用默认作者`, 'yellow');
    return 'default';
  }
}

// 定义不同主题的作者
const themeAuthors = {
  okoge: [
    {
      slug: 'yuki-tanaka',
      name: 'Yuki Tanaka',
      job: 'Japanese Food Blogger',
      bio: 'Passionate about preserving traditional Japanese street food culture while exploring modern twists.'
    },
    {
      slug: 'kenji-yamamoto',
      name: 'Kenji Yamamoto',
      job: 'Rice Culture Researcher',
      bio: 'Dedicated to documenting the history and cultural significance of rice in Japanese society.'
    },
    {
      slug: 'sakura-nakamura',
      name: 'Sakura Nakamura',
      job: 'Recipe Developer',
      bio: 'Creates accessible Japanese recipes for home cooks worldwide.'
    },
    {
      slug: 'hiroshi-suzuki',
      name: 'Hiroshi Suzuki',
      job: 'Food Photographer',
      bio: 'Captures the beauty of Japanese street food through stunning photography.'
    },
    {
      slug: 'mei-chen',
      name: 'Mei Chen',
      job: 'Cultural Food Writer',
      bio: 'Explores the intersection of Japanese and other Asian cuisines.'
    }
  ],
  default: [
    {
      slug: 'alex-johnson',
      name: 'Alex Johnson',
      job: 'Content Writer',
      bio: 'Experienced writer with a passion for creating engaging and informative content.'
    },
    {
      slug: 'emma-wilson',
      name: 'Emma Wilson',
      job: 'Senior Editor',
      bio: 'Expert editor with over 10 years of experience in digital publishing.'
    },
    {
      slug: 'michael-brown',
      name: 'Michael Brown',
      job: 'Technical Writer',
      bio: 'Specializes in making complex topics accessible to general audiences.'
    },
    {
      slug: 'sophia-davis',
      name: 'Sophia Davis',
      job: 'Creative Director',
      bio: 'Brings creative vision and strategic thinking to content development.'
    },
    {
      slug: 'james-miller',
      name: 'James Miller',
      job: 'Research Analyst',
      bio: 'Provides data-driven insights and thorough research for all content.'
    },
    {
      slug: 'olivia-garcia',
      name: 'Olivia Garcia',
      job: 'Digital Strategist',
      bio: 'Focuses on creating content that drives engagement and conversions.'
    }
  ]
};

// 创建作者
function createAuthor(author) {
  const authorDir = path.join(authorsDir, author.slug);
  const assetDir = path.join(assetsDir, author.slug);
  
  // 创建目录
  if (!fs.existsSync(authorDir)) {
    fs.mkdirSync(authorDir, { recursive: true });
  }
  if (!fs.existsSync(assetDir)) {
    fs.mkdirSync(assetDir, { recursive: true });
  }
  
  // 创建MDX文件
  const mdxContent = `---
name: ${author.name}
job: ${author.job}
avatar: '@assets/images/authors/${author.slug}/avatar.jpg'
bio: ${author.bio}
social:
  - name: LinkedIn
    url: https://linkedin.com/in/${author.slug}
    icon: linkedin-icon.svg
  - name: Twitter
    url: https://twitter.com/${author.slug.replace('-', '_')}
    icon: twitter-icon.svg
---

${author.bio}

With extensive experience in their field, ${author.name} brings unique insights and expertise to every article.
`;
  
  const mdxPath = path.join(authorDir, 'index.mdx');
  fs.writeFileSync(mdxPath, mdxContent);
  
  // 创建默认头像（如果不存在）
  const avatarPath = path.join(assetDir, 'avatar.jpg');
  if (!fs.existsSync(avatarPath)) {
    // 尝试复制现有的头像
    const existingAuthors = fs.readdirSync(assetsDir).filter(dir => 
      fs.existsSync(path.join(assetsDir, dir, 'avatar.jpg'))
    );
    
    if (existingAuthors.length > 0) {
      const sourceAvatar = path.join(assetsDir, existingAuthors[0], 'avatar.jpg');
      fs.copyFileSync(sourceAvatar, avatarPath);
    } else {
      log(`  ⚠️ 无法创建头像: ${author.slug}`, 'yellow');
    }
  }
  
  log(`  ✅ 创建作者: ${author.name} (${author.slug})`, 'green');
}

// 主函数
async function main() {
  log('\n📝 创建主题作者', 'cyan');
  log('=' .repeat(50), 'blue');
  
  // 获取当前主题
  const theme = await getCurrentTheme();
  log(`\n🎨 当前主题: ${theme}`, 'blue');
  
  // 选择作者列表
  const authors = themeAuthors[theme] || themeAuthors.default;
  log(`📚 将创建 ${authors.length} 个作者\n`, 'yellow');
  
  // 创建每个作者
  for (const author of authors) {
    createAuthor(author);
  }
  
  log('\n✨ 所有作者创建完成！', 'green');
  log('💡 文章将随机分配给这些作者', 'cyan');
}

// 运行脚本
main().catch(error => {
  log(`\n❌ 错误: ${error.message}`, 'red');
  process.exit(1);
});