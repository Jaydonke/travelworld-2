#!/usr/bin/env node

/**
 * 为旅行主题文章生成SEO友好的内链脚本
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 旅行文章类别和关键词映射
const TRAVEL_CATEGORIES = {
  'adventure-nature': ['adventure', 'nature', 'wildlife', 'safari', 'balloon', 'outdoor'],
  'wellness-escapes': ['wellness', 'retreat', 'spa', 'relax', 'health', 'mindful'],
  'cultural-immersion': ['culture', 'festival', 'local', 'tradition', 'heritage'],
  'hidden-gems': ['mystery', 'hidden', 'gems', 'secret', 'unique', 'phenomena'],
  'budget-family': ['family', 'budget', 'kids', 'affordable', 'island', 'escape'],
  'mindful-travel': ['slow', 'mindful', 'bleisure', 'shoulder', 'JOMO', 'vintage'],
  'specialty-tourism': ['noctourism', 'set-jetting', 'workout', 'monsoon', 'nostalgications', 'experiential']
};

// 预定义的旅行相关内链映射
const TRAVEL_INTERNAL_LINKS = {
  'budget-family-friendly-island-escapes-top-picks': [
    {
      targetSlug: 'escape-to-top-wellness-retreats-for-a-refreshing-getaway',
      linkText: 'wellness retreats',
      contextHint: 'family-friendly relaxation options'
    },
    {
      targetSlug: 'discover-hidden-gems-detour-destinations-to-visit',
      linkText: 'hidden gem destinations',
      contextHint: 'off-the-beaten-path family travel'
    },
    {
      targetSlug: 'explore-shoulder-season-travel-tips-deals-and-more',
      linkText: 'shoulder season travel tips',
      contextHint: 'budget travel timing'
    }
  ],
  'coolcations-escape-the-heat-with-refreshing-destinations': [
    {
      targetSlug: 'top-monsoon-getaways-for-a-refreshing-vacation',
      linkText: 'monsoon getaways',
      contextHint: 'refreshing weather alternatives'
    },
    {
      targetSlug: 'escape-to-top-wellness-retreats-for-a-refreshing-getaway',
      linkText: 'refreshing wellness retreats',
      contextHint: 'cool climate wellness'
    },
    {
      targetSlug: 'embracing-slow-travel-a-guide-to-mindful-exploration',
      linkText: 'slow travel experiences',
      contextHint: 'mindful coolcation planning'
    }
  ],
  'discover-enchanting-mystery-travel-destinations': [
    {
      targetSlug: 'phenomena-tourism-uncovering-the-strange-and-unknown',
      linkText: 'phenomena tourism',
      contextHint: 'strange and unknown destinations'
    },
    {
      targetSlug: 'discover-hidden-gems-detour-destinations-to-visit',
      linkText: 'hidden detour destinations',
      contextHint: 'mystery travel spots'
    },
    {
      targetSlug: 'experience-noctourism-nighttime-travel-amp-exploration',
      linkText: 'nighttime travel experiences',
      contextHint: 'mysterious night exploration'
    }
  ],
  'discover-exciting-adventure-travel-destinations-and-tips': [
    {
      targetSlug: 'discover-the-best-wildlife-safaris-for-nature-lovers',
      linkText: 'wildlife safari adventures',
      contextHint: 'nature-based adventure travel'
    },
    {
      targetSlug: 'take-to-the-skies-with-hot-air-balloon-rides',
      linkText: 'hot air balloon adventures',
      contextHint: 'aerial adventure experiences'
    },
    {
      targetSlug: 'workout-holidays-get-fit-on-vacation-in-the-us',
      linkText: 'active adventure holidays',
      contextHint: 'fitness-focused travel'
    }
  ],
  'discover-festival-centric-travel-your-ultimate-guide': [
    {
      targetSlug: 'experiential-travel-unique-experiences-around-the-world',
      linkText: 'unique experiential travel',
      contextHint: 'festival and cultural experiences'
    },
    {
      targetSlug: 'experience-vintage-voyaging-timeless-travel-destinations',
      linkText: 'vintage travel experiences',
      contextHint: 'traditional festival destinations'
    },
    {
      targetSlug: 'discover-enchanting-mystery-travel-destinations',
      linkText: 'mystery travel destinations',
      contextHint: 'unexpected festival locations'
    }
  ],
  'discover-hidden-gems-detour-destinations-to-visit': [
    {
      targetSlug: 'phenomena-tourism-uncovering-the-strange-and-unknown',
      linkText: 'phenomena tourism spots',
      contextHint: 'strange hidden destinations'
    },
    {
      targetSlug: 'discover-enchanting-mystery-travel-destinations',
      linkText: 'enchanting mystery destinations',
      contextHint: 'hidden mysterious places'
    },
    {
      targetSlug: 'experience-noctourism-nighttime-travel-amp-exploration',
      linkText: 'nighttime hidden gems',
      contextHint: 'night exploration of hidden spots'
    }
  ],
  'discover-the-best-wildlife-safaris-for-nature-lovers': [
    {
      targetSlug: 'discover-exciting-adventure-travel-destinations-and-tips',
      linkText: 'adventure travel destinations',
      contextHint: 'wildlife adventure planning'
    },
    {
      targetSlug: 'experiential-travel-unique-experiences-around-the-world',
      linkText: 'unique wildlife experiences',
      contextHint: 'nature-focused experiential travel'
    },
    {
      targetSlug: 'take-to-the-skies-with-hot-air-balloon-rides',
      linkText: 'aerial wildlife viewing',
      contextHint: 'balloon safari experiences'
    }
  ],
  'embracing-slow-travel-a-guide-to-mindful-exploration': [
    {
      targetSlug: 'jomo-travel-the-art-of-enjoying-slow-travel',
      linkText: 'JOMO travel philosophy',
      contextHint: 'mindful slow travel approach'
    },
    {
      targetSlug: 'slow-travel-a-guide-to-mindful-travel-experiences',
      linkText: 'mindful travel experiences',
      contextHint: 'comprehensive slow travel guide'
    },
    {
      targetSlug: 'maximizing-your-trip-bleisure-travel-essentials',
      linkText: 'bleisure travel essentials',
      contextHint: 'slow-paced business travel'
    }
  ],
  'escape-to-top-wellness-retreats-for-a-refreshing-getaway': [
    {
      targetSlug: 'experience-celestial-retreats-for-inner-peace-amp-renewal',
      linkText: 'celestial wellness retreats',
      contextHint: 'spiritual wellness experiences'
    },
    {
      targetSlug: 'coolcations-escape-the-heat-with-refreshing-destinations',
      linkText: 'refreshing coolcation destinations',
      contextHint: 'cooling wellness travel'
    },
    {
      targetSlug: 'workout-holidays-get-fit-on-vacation-in-the-us',
      linkText: 'fitness wellness holidays',
      contextHint: 'active wellness retreats'
    }
  ],
  'experience-celestial-retreats-for-inner-peace-amp-renewal': [
    {
      targetSlug: 'explore-night-sky-tourism-top-us-stargazing-spots',
      linkText: 'night sky tourism destinations',
      contextHint: 'stargazing and celestial experiences'
    },
    {
      targetSlug: 'escape-to-top-wellness-retreats-for-a-refreshing-getaway',
      linkText: 'wellness retreat experiences',
      contextHint: 'spiritual wellness travel'
    },
    {
      targetSlug: 'embracing-slow-travel-a-guide-to-mindful-exploration',
      linkText: 'mindful travel practices',
      contextHint: 'contemplative travel approaches'
    }
  ],
  'experience-noctourism-nighttime-travel-amp-exploration': [
    {
      targetSlug: 'explore-night-sky-tourism-top-us-stargazing-spots',
      linkText: 'stargazing tourism spots',
      contextHint: 'night sky travel experiences'
    },
    {
      targetSlug: 'phenomena-tourism-uncovering-the-strange-and-unknown',
      linkText: 'strange nighttime phenomena',
      contextHint: 'mysterious night experiences'
    },
    {
      targetSlug: 'discover-hidden-gems-detour-destinations-to-visit',
      linkText: 'hidden nighttime destinations',
      contextHint: 'secret nocturnal spots'
    }
  ],
  'experience-set-jetting-tour-famous-movie-and-tv-sites': [
    {
      targetSlug: 'experiential-travel-unique-experiences-around-the-world',
      linkText: 'unique experiential travel',
      contextHint: 'film location experiences'
    },
    {
      targetSlug: 'experience-vintage-voyaging-timeless-travel-destinations',
      linkText: 'vintage filming locations',
      contextHint: 'classic movie destinations'
    },
    {
      targetSlug: 'discover-enchanting-mystery-travel-destinations',
      linkText: 'mystery filming locations',
      contextHint: 'secret movie spots'
    }
  ],
  'experience-vintage-voyaging-timeless-travel-destinations': [
    {
      targetSlug: 'experiential-travel-unique-experiences-around-the-world',
      linkText: 'timeless experiential travel',
      contextHint: 'vintage travel experiences'
    },
    {
      targetSlug: 'experience-set-jetting-tour-famous-movie-and-tv-sites',
      linkText: 'vintage movie locations',
      contextHint: 'classic film destinations'
    },
    {
      targetSlug: 'the-power-of-nostalgications-how-memories-shape-us',
      linkText: 'nostalgic travel experiences',
      contextHint: 'memory-driven vintage travel'
    }
  ],
  'experiential-travel-unique-experiences-around-the-world': [
    {
      targetSlug: 'discover-festival-centric-travel-your-ultimate-guide',
      linkText: 'festival-centric experiences',
      contextHint: 'cultural experiential travel'
    },
    {
      targetSlug: 'phenomena-tourism-uncovering-the-strange-and-unknown',
      linkText: 'unique phenomena experiences',
      contextHint: 'extraordinary travel phenomena'
    },
    {
      targetSlug: 'experience-set-jetting-tour-famous-movie-and-tv-sites',
      linkText: 'film location experiences',
      contextHint: 'cinematic travel experiences'
    }
  ],
  'explore-night-sky-tourism-top-us-stargazing-spots': [
    {
      targetSlug: 'experience-celestial-retreats-for-inner-peace-amp-renewal',
      linkText: 'celestial retreat experiences',
      contextHint: 'spiritual stargazing travel'
    },
    {
      targetSlug: 'experience-noctourism-nighttime-travel-amp-exploration',
      linkText: 'nighttime tourism experiences',
      contextHint: 'comprehensive night travel'
    },
    {
      targetSlug: 'phenomena-tourism-uncovering-the-strange-and-unknown',
      linkText: 'celestial phenomena tourism',
      contextHint: 'astronomical travel experiences'
    }
  ],
  'explore-shoulder-season-travel-tips-deals-and-more': [
    {
      targetSlug: 'budget-family-friendly-island-escapes-top-picks',
      linkText: 'budget family travel options',
      contextHint: 'affordable family vacation timing'
    },
    {
      targetSlug: 'embracing-slow-travel-a-guide-to-mindful-exploration',
      linkText: 'slow travel approaches',
      contextHint: 'mindful off-peak travel'
    },
    {
      targetSlug: 'maximizing-your-trip-bleisure-travel-essentials',
      linkText: 'bleisure travel strategies',
      contextHint: 'business travel optimization'
    }
  ],
  'jomo-travel-the-art-of-enjoying-slow-travel': [
    {
      targetSlug: 'embracing-slow-travel-a-guide-to-mindful-exploration',
      linkText: 'mindful slow travel guide',
      contextHint: 'comprehensive slow travel approach'
    },
    {
      targetSlug: 'slow-travel-a-guide-to-mindful-travel-experiences',
      linkText: 'mindful travel experiences',
      contextHint: 'JOMO travel practices'
    },
    {
      targetSlug: 'experience-celestial-retreats-for-inner-peace-amp-renewal',
      linkText: 'peaceful retreat experiences',
      contextHint: 'contemplative JOMO travel'
    }
  ],
  'maximizing-your-trip-bleisure-travel-essentials': [
    {
      targetSlug: 'explore-shoulder-season-travel-tips-deals-and-more',
      linkText: 'shoulder season strategies',
      contextHint: 'business travel timing optimization'
    },
    {
      targetSlug: 'embracing-slow-travel-a-guide-to-mindful-exploration',
      linkText: 'mindful business travel',
      contextHint: 'slow-paced bleisure approach'
    },
    {
      targetSlug: 'workout-holidays-get-fit-on-vacation-in-the-us',
      linkText: 'active business travel',
      contextHint: 'fitness-focused bleisure'
    }
  ],
  'me-mooning-a-fun-and-creative-activity-to-try': [
    {
      targetSlug: 'the-power-of-nostalgications-how-memories-shape-us',
      linkText: 'nostalgic travel memories',
      contextHint: 'memory-focused travel experiences'
    },
    {
      targetSlug: 'experiential-travel-unique-experiences-around-the-world',
      linkText: 'creative travel experiences',
      contextHint: 'unique personal travel activities'
    },
    {
      targetSlug: 'jomo-travel-the-art-of-enjoying-slow-travel',
      linkText: 'personal JOMO travel',
      contextHint: 'individual slow travel experiences'
    }
  ],
  'phenomena-tourism-uncovering-the-strange-and-unknown': [
    {
      targetSlug: 'discover-hidden-gems-detour-destinations-to-visit',
      linkText: 'hidden mysterious destinations',
      contextHint: 'strange hidden travel spots'
    },
    {
      targetSlug: 'experience-noctourism-nighttime-travel-amp-exploration',
      linkText: 'nighttime phenomena experiences',
      contextHint: 'mysterious night phenomena'
    },
    {
      targetSlug: 'explore-night-sky-tourism-top-us-stargazing-spots',
      linkText: 'celestial phenomena viewing',
      contextHint: 'astronomical phenomena tourism'
    }
  ],
  'slow-travel-a-guide-to-mindful-travel-experiences': [
    {
      targetSlug: 'embracing-slow-travel-a-guide-to-mindful-exploration',
      linkText: 'mindful travel exploration',
      contextHint: 'comprehensive slow travel approach'
    },
    {
      targetSlug: 'jomo-travel-the-art-of-enjoying-slow-travel',
      linkText: 'JOMO slow travel art',
      contextHint: 'enjoying mindful travel'
    },
    {
      targetSlug: 'experience-celestial-retreats-for-inner-peace-amp-renewal',
      linkText: 'peaceful retreat experiences',
      contextHint: 'contemplative slow travel'
    }
  ],
  'take-to-the-skies-with-hot-air-balloon-rides': [
    {
      targetSlug: 'discover-exciting-adventure-travel-destinations-and-tips',
      linkText: 'adventure travel experiences',
      contextHint: 'aerial adventure activities'
    },
    {
      targetSlug: 'discover-the-best-wildlife-safaris-for-nature-lovers',
      linkText: 'wildlife viewing experiences',
      contextHint: 'aerial wildlife observation'
    },
    {
      targetSlug: 'experiential-travel-unique-experiences-around-the-world',
      linkText: 'unique aerial experiences',
      contextHint: 'distinctive balloon travel'
    }
  ],
  'the-power-of-nostalgications-how-memories-shape-us': [
    {
      targetSlug: 'experience-vintage-voyaging-timeless-travel-destinations',
      linkText: 'vintage travel destinations',
      contextHint: 'nostalgic travel experiences'
    },
    {
      targetSlug: 'me-mooning-a-fun-and-creative-activity-to-try',
      linkText: 'creative memory activities',
      contextHint: 'personal memory travel'
    },
    {
      targetSlug: 'experiential-travel-unique-experiences-around-the-world',
      linkText: 'memorable travel experiences',
      contextHint: 'memory-making travel'
    }
  ],
  'top-monsoon-getaways-for-a-refreshing-vacation': [
    {
      targetSlug: 'coolcations-escape-the-heat-with-refreshing-destinations',
      linkText: 'refreshing coolcation spots',
      contextHint: 'cooling monsoon alternatives'
    },
    {
      targetSlug: 'escape-to-top-wellness-retreats-for-a-refreshing-getaway',
      linkText: 'refreshing wellness getaways',
      contextHint: 'monsoon wellness travel'
    },
    {
      targetSlug: 'explore-shoulder-season-travel-tips-deals-and-more',
      linkText: 'monsoon season travel tips',
      contextHint: 'rainy season travel strategies'
    }
  ],
  'workout-holidays-get-fit-on-vacation-in-the-us': [
    {
      targetSlug: 'escape-to-top-wellness-retreats-for-a-refreshing-getaway',
      linkText: 'wellness retreat fitness',
      contextHint: 'fitness-focused wellness travel'
    },
    {
      targetSlug: 'discover-exciting-adventure-travel-destinations-and-tips',
      linkText: 'active adventure destinations',
      contextHint: 'fitness adventure travel'
    },
    {
      targetSlug: 'maximizing-your-trip-bleisure-travel-essentials',
      linkText: 'active bleisure travel',
      contextHint: 'fitness business travel'
    }
  ]
};

/**
 * 生成新的内链配置文件
 */
function generateTravelInternalLinksConfig() {
  // 获取当前文章信息
  const articlesDir = path.join(__dirname, '../src/content/articles');
  const articles = [];
  
  if (fs.existsSync(articlesDir)) {
    const articleDirs = fs.readdirSync(articlesDir);
    
    for (const dir of articleDirs) {
      const mdxPath = path.join(articlesDir, dir, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        try {
          const content = fs.readFileSync(mdxPath, 'utf8');
          const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
          const categoryMatch = content.match(/category:\s*([^\n]+)/);
          
          if (titleMatch) {
            articles.push({
              slug: dir,
              title: titleMatch[1],
              category: categoryMatch ? categoryMatch[1].trim() : 'uncategorized'
            });
          }
        } catch (error) {
          log(`跳过文章 ${dir}: ${error.message}`, 'yellow');
        }
      }
    }
  }
  
  const config = {
    siteConfig: {
      baseUrl: '',
      useRelativePaths: true,
      placeholder: 'DOMAIN_PLACEHOLDER'
    },
    statistics: {
      totalArticles: articles.length,
      processedArticles: articles.length,
      totalLinksAdded: Object.keys(TRAVEL_INTERNAL_LINKS).length * 3,
      averageLinksPerArticle: 3.00,
      lastUpdated: new Date().toISOString()
    },
    articleIndex: articles.map(article => ({
      slug: article.slug,
      title: article.title,
      category: article.category,
      keywords: generateKeywordsFromTitle(article.title),
      wordCount: 1500 // 估算值
    })),
    linkMapping: TRAVEL_INTERNAL_LINKS
  };
  
  return config;
}

/**
 * 从标题生成关键词
 */
function generateKeywordsFromTitle(title) {
  const commonWords = ['the', 'to', 'and', 'for', 'of', 'in', 'on', 'with', 'your', 'a', 'an', 'is', 'are', 'best', 'top', 'guide'];
  const keywords = title.toLowerCase()
    .split(/[\s-]+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 10);
  
  // 添加旅行相关的通用关键词
  const travelKeywords = ['travel', 'destination', 'vacation', 'trip', 'adventure', 'experience'];
  return [...new Set([...keywords, ...travelKeywords])];
}

/**
 * 主函数
 */
async function main() {
  log('\n🔗 生成旅行主题内链配置', 'bright');
  log('=' .repeat(60), 'blue');
  
  try {
    log('🚀 生成新的旅行内链配置...', 'cyan');
    
    const config = generateTravelInternalLinksConfig();
    
    // 写入配置文件
    const configPath = path.join(__dirname, '../src/lib/config/internal-links.ts');
    const configContent = `// 内链管理配置文件 - 旅行主题
// 自动生成于: ${new Date().toISOString()}

export const INTERNAL_LINKS_CONFIG = ${JSON.stringify(config, null, 2)};

export default INTERNAL_LINKS_CONFIG;
`;

    fs.writeFileSync(configPath, configContent);
    
    log(`✅ 内链配置已更新`, 'green');
    log(`📊 统计信息:`, 'yellow');
    log(`   - 文章总数: ${config.statistics.totalArticles}`, 'blue');
    log(`   - 内链总数: ${config.statistics.totalLinksAdded}`, 'blue');
    log(`   - 平均每篇: ${config.statistics.averageLinksPerArticle} 个内链`, 'blue');
    
    log('\n🎯 内链类型分布:', 'cyan');
    const linkTypes = {
      '冒险旅游': 0,
      '健康度假': 0,
      '文化体验': 0,
      '隐秘景点': 0,
      '预算旅行': 0,
      '慢旅行': 0,
      '特色旅游': 0
    };
    
    Object.keys(TRAVEL_INTERNAL_LINKS).forEach(slug => {
      // 根据slug分类统计
      if (slug.includes('adventure') || slug.includes('wildlife') || slug.includes('balloon')) linkTypes['冒险旅游']++;
      else if (slug.includes('wellness') || slug.includes('retreat') || slug.includes('workout')) linkTypes['健康度假']++;
      else if (slug.includes('festival') || slug.includes('culture') || slug.includes('vintage')) linkTypes['文化体验']++;
      else if (slug.includes('hidden') || slug.includes('mystery') || slug.includes('phenomena')) linkTypes['隐秘景点']++;
      else if (slug.includes('budget') || slug.includes('shoulder')) linkTypes['预算旅行']++;
      else if (slug.includes('slow') || slug.includes('jomo') || slug.includes('mindful')) linkTypes['慢旅行']++;
      else linkTypes['特色旅游']++;
    });
    
    Object.entries(linkTypes).forEach(([type, count]) => {
      if (count > 0) {
        log(`   - ${type}: ${count} 篇文章`, 'blue');
      }
    });
    
  } catch (error) {
    log(`❌ 生成失败: ${error.message}`, 'red');
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