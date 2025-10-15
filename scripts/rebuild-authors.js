#!/usr/bin/env node

/**
 * 重建作者库脚本
 * 保留 brian-mitchell，删除其他作者，根据 author 文件夹中的图片创建新作者
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  authorsDir: path.join(__dirname, '../src/content/authors'),
  authorAssetsDir: path.join(__dirname, '../src/assets/images/authors'),
  sourceImagesDir: path.join(__dirname, '../author'),
  keepAuthor: 'brian-mitchell' // 保留的作者
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

/**
 * 作者背景信息数据库
 */
const authorProfiles = {
  'alexandra-chen': {
    name: 'Alexandra Chen',
    job: 'AI Product Strategist',
    bio: 'Specializes in bridging the gap between cutting-edge AI technology and practical business applications. With 8+ years in product management, Alexandra helps companies navigate AI transformation.',
    linkedin: 'alexandrachen',
    twitter: 'alexandra_ai'
  },
  'benjamin-cole': {
    name: 'Benjamin Cole',
    job: 'Machine Learning Engineer',
    bio: 'Expert in deep learning and neural networks with a passion for building scalable AI systems. Benjamin has contributed to several open-source ML projects and loves sharing knowledge.',
    linkedin: 'benjamincole-ml',
    twitter: 'ben_codes_ai'
  },
  'daniel-foster': {
    name: 'Daniel Foster',
    job: 'AI Ethics Researcher',
    bio: 'Dedicated to ensuring responsible AI development and deployment. Daniel researches bias mitigation, algorithmic fairness, and the societal impact of artificial intelligence.',
    linkedin: 'danielfoster-ethics',
    twitter: 'dan_ai_ethics'
  },
  'emily-roberts': {
    name: 'Emily Roberts',
    job: 'Data Science Consultant',
    bio: 'Transforms complex data into actionable insights for Fortune 500 companies. Emily combines statistical expertise with business acumen to drive data-driven decision making.',
    linkedin: 'emilyroberts-data',
    twitter: 'emily_data_sci'
  },
  'ethan-brooks': {
    name: 'Ethan Brooks',
    job: 'AI Automation Specialist',
    bio: 'Focuses on streamlining business processes through intelligent automation. Ethan has helped over 100 companies reduce manual work by implementing AI-powered solutions.',
    linkedin: 'ethanbrooks-automation',
    twitter: 'ethan_automates'
  },
  'gregory-shaw': {
    name: 'Gregory Shaw',
    job: 'Computer Vision Expert',
    bio: 'Pioneer in image recognition and visual AI applications. Gregory has developed computer vision systems for healthcare, autonomous vehicles, and security applications.',
    linkedin: 'gregoryshaw-cv',
    twitter: 'greg_sees_ai'
  },
  'joshua-reynolds': {
    name: 'Joshua Reynolds',
    job: 'Natural Language Processing Lead',
    bio: 'Specializes in conversational AI and language understanding systems. Joshua has built chatbots and NLP solutions that serve millions of users worldwide.',
    linkedin: 'joshuareynolds-nlp',
    twitter: 'josh_talks_ai'
  },
  'kevin-mitchell': {
    name: 'Kevin Mitchell',
    job: 'AI Infrastructure Architect',
    bio: 'Designs and builds robust AI infrastructure for enterprise-scale deployments. Kevin ensures AI systems run reliably, efficiently, and securely in production environments.',
    linkedin: 'kevinmitchell-infra',
    twitter: 'kevin_builds_ai'
  },
  'laura-stevens': {
    name: 'Laura Stevens',
    job: 'AI Content Creator',
    bio: 'Expert in AI-powered content generation and creative applications. Laura explores the intersection of artificial intelligence and human creativity in digital marketing.',
    linkedin: 'laurastevens-content',
    twitter: 'laura_creates_ai'
  },
  'mark-patterson': {
    name: 'Mark Patterson',
    job: 'Robotics AI Developer',
    bio: 'Combines robotics engineering with artificial intelligence to create intelligent autonomous systems. Mark works on everything from industrial robots to consumer AI devices.',
    linkedin: 'markpatterson-robotics',
    twitter: 'mark_robots_ai'
  },
  'megan-turner': {
    name: 'Megan Turner',
    job: 'AI UX/UI Designer',
    bio: 'Designs intuitive interfaces for AI-powered applications. Megan focuses on making complex AI functionality accessible and user-friendly for everyday users.',
    linkedin: 'meganturner-aiux',
    twitter: 'megan_designs_ai'
  },
  'natalie-hayes': {
    name: 'Natalie Hayes',
    job: 'AI Business Analyst',
    bio: 'Analyzes market trends and business opportunities in the AI space. Natalie helps startups and enterprises identify the most promising AI investment and adoption strategies.',
    linkedin: 'nataliehayes-business',
    twitter: 'natalie_ai_biz'
  },
  'priya-sharma': {
    name: 'Priya Sharma',
    job: 'AI Research Scientist',
    bio: 'Conducts cutting-edge research in artificial general intelligence and neural network architectures. Priya has published 50+ papers in top-tier AI conferences.',
    linkedin: 'priyasharma-research',
    twitter: 'priya_research_ai'
  }
};

/**
 * 生成作者ID
 */
function generateAuthorId(imageName) {
  return imageName
    .replace('.jpg', '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * 删除旧作者（保留指定作者）
 */
function cleanupOldAuthors() {
  log('\n🧹 清理旧作者...', 'cyan');
  
  try {
    const existingAuthors = fs.readdirSync(CONFIG.authorsDir);
    let deletedCount = 0;
    
    for (const authorId of existingAuthors) {
      if (authorId === CONFIG.keepAuthor) {
        log(`  ✅ 保留作者: ${authorId}`, 'green');
        continue;
      }
      
      // 删除作者目录
      const authorDir = path.join(CONFIG.authorsDir, authorId);
      const authorAssetsDir = path.join(CONFIG.authorAssetsDir, authorId);
      
      if (fs.existsSync(authorDir)) {
        fs.rmSync(authorDir, { recursive: true, force: true });
        deletedCount++;
      }
      
      if (fs.existsSync(authorAssetsDir)) {
        fs.rmSync(authorAssetsDir, { recursive: true, force: true });
      }
      
      log(`  🗑️  删除作者: ${authorId}`, 'yellow');
    }
    
    log(`✅ 清理完成，删除了 ${deletedCount} 个作者`, 'green');
    
  } catch (error) {
    log(`❌ 清理失败: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 创建新作者
 */
function createAuthor(imageName, imageSourcePath) {
  const authorId = generateAuthorId(imageName);
  const profile = authorProfiles[authorId];
  
  if (!profile) {
    log(`⚠️  未找到作者资料: ${authorId}`, 'yellow');
    return false;
  }
  
  try {
    // 创建目录
    const authorDir = path.join(CONFIG.authorsDir, authorId);
    const authorAssetsDir = path.join(CONFIG.authorAssetsDir, authorId);
    
    fs.mkdirSync(authorDir, { recursive: true });
    fs.mkdirSync(authorAssetsDir, { recursive: true });
    
    // 复制头像
    const avatarPath = path.join(authorAssetsDir, 'avatar.jpg');
    fs.copyFileSync(imageSourcePath, avatarPath);
    
    // 创建作者MDX文件
    const authorContent = `---
name: ${profile.name}
job: ${profile.job}
avatar: '@assets/images/authors/${authorId}/avatar.jpg'
bio: ${profile.bio}
social:
  - name: LinkedIn
    url: https://linkedin.com/in/${profile.linkedin}
    icon: linkedin-icon.svg
  - name: Twitter
    url: https://twitter.com/${profile.twitter}
    icon: twitter-icon.svg
---
`;
    
    fs.writeFileSync(path.join(authorDir, 'index.mdx'), authorContent);
    
    log(`  ✅ 创建作者: ${profile.name} (${authorId})`, 'green');
    return true;
    
  } catch (error) {
    log(`  ❌ 创建作者失败 ${authorId}: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 从图片创建所有作者
 */
function createAuthorsFromImages() {
  log('\n👤 从图片创建新作者...', 'cyan');
  
  try {
    const imageFiles = fs.readdirSync(CONFIG.sourceImagesDir)
      .filter(file => file.toLowerCase().endsWith('.jpg'));
    
    if (imageFiles.length === 0) {
      log('⚠️  没有找到jpg图片文件', 'yellow');
      return;
    }
    
    log(`📋 找到 ${imageFiles.length} 张作者图片`, 'blue');
    
    let successCount = 0;
    
    for (const imageFile of imageFiles) {
      const imageSourcePath = path.join(CONFIG.sourceImagesDir, imageFile);
      const success = createAuthor(imageFile, imageSourcePath);
      
      if (success) {
        successCount++;
      }
    }
    
    log(`✅ 成功创建 ${successCount} 个新作者`, 'green');
    
  } catch (error) {
    log(`❌ 创建作者失败: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 显示最终作者列表
 */
function showFinalAuthorList() {
  log('\n📋 最终作者列表:', 'bright');
  log('='.repeat(60), 'blue');
  
  try {
    const authors = fs.readdirSync(CONFIG.authorsDir);
    
    authors.forEach((authorId, index) => {
      const mdxPath = path.join(CONFIG.authorsDir, authorId, 'index.mdx');
      
      if (fs.existsSync(mdxPath)) {
        const content = fs.readFileSync(mdxPath, 'utf8');
        const nameMatch = content.match(/name:\s*(.+)/);
        const jobMatch = content.match(/job:\s*(.+)/);
        
        const name = nameMatch ? nameMatch[1].trim() : authorId;
        const job = jobMatch ? jobMatch[1].trim() : 'Unknown';
        
        log(`${(index + 1).toString().padStart(2, ' ')}. ${name}`, 'cyan');
        log(`    📁 ID: ${authorId}`, 'blue');
        log(`    💼 ${job}`, 'green');
        
        if (authorId === CONFIG.keepAuthor) {
          log(`    ⭐ (保留的原作者)`, 'yellow');
        }
        
        log('');
      }
    });
    
    log(`🎉 总计: ${authors.length} 位作者`, 'bright');
    log('='.repeat(60), 'blue');
    
  } catch (error) {
    log(`❌ 获取作者列表失败: ${error.message}`, 'red');
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n🚀 重建作者库脚本启动', 'bright');
  log('='.repeat(80), 'magenta');
  log('🎯 任务: 保留brian-mitchell，根据图片创建13个新作者', 'cyan');
  log('='.repeat(80), 'magenta');
  
  try {
    // 1. 清理旧作者
    cleanupOldAuthors();
    
    // 2. 创建新作者
    createAuthorsFromImages();
    
    // 3. 显示最终结果
    showFinalAuthorList();
    
    log('\n🎉 作者库重建完成！', 'bright');
    log('💡 提示: 运行 npm run validate-authors 查看详细信息', 'cyan');
    
  } catch (error) {
    log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
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