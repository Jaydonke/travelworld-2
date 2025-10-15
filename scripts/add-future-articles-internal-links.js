#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

// 内链映射关系 - 未来文章指向已发布文章
// 使用描述性锚文本，符合SEO最佳实践
const internalLinksMapping = {
  // 2025/8/17 - compost-tea-booster
  'compost-tea-booster-enhance-soil-health-naturally': [
    {
      anchor: 'DIY composting systems for organic gardens',
      target: 'diy-compost-bin-setups-for-beginners-a-guide',
      context: 'Before brewing compost tea, establish '
    },
    {
      anchor: 'sustainable mulching techniques that enrich soil',
      target: 'learn-about-sustainable-mulching-methods-and-benefits',
      context: 'Combine compost tea applications with '
    },
    {
      anchor: 'eco-friendly gardening practices for healthy plants',
      target: 'learn-about-eco-friendly-gardening-practices-and-tips',
      context: 'This natural fertilizer aligns with broader '
    }
  ],
  
  // 2025/8/20 - container-gardening-for-renters
  'container-gardening-for-renters-how-to-get-started': [
    {
      anchor: 'self-watering planter systems for busy gardeners',
      target: 'self-watering-planter-builds-a-beginner-s-guide',
      context: 'Simplify container maintenance with '
    },
    {
      anchor: 'urban balcony gardening strategies',
      target: 'balcony-micro-orchard-how-to-grow-your-own-fruits-and-herbs',
      context: 'Expand your rental garden following these '
    },
    {
      anchor: 'vertical herb wall designs for small spaces',
      target: 'build-your-own-diy-vertical-herb-wall-with-ease',
      context: 'Maximize limited rental space using '
    }
  ],
  
  // 2025/8/23 - designing-native-pollinator-gardens
  'designing-native-pollinator-gardens-for-your-backyard': [
    {
      anchor: 'pollinator habitat restoration techniques',
      target: 'pollinator-habitat-restoration-creating-a-thriving-ecosystem',
      context: 'Your native garden contributes to larger '
    },
    {
      anchor: 'bug-friendly garden designs that support ecosystems',
      target: 'bug-friendly-garden-design-ideas-for-your-yard',
      context: 'Incorporate these proven '
    },
    {
      anchor: 'native plant selection guidelines',
      target: 'native-species-planting-guide-tips-amp-best-practices',
      context: 'Foundation plantings should follow these '
    }
  ],
  
  // 2025/8/26 - drip-irrigation-systems
  'drip-irrigation-systems-save-water-enhance-your-garden': [
    {
      anchor: 'rainwater harvesting methods for sustainable irrigation',
      target: 'effective-rainwater-harvesting-for-gardens-tips-and-techniques',
      context: 'Supply your drip system with '
    },
    {
      anchor: 'smart garden sensor technology',
      target: 'smart-garden-sensors-the-ultimate-guide-to-smart-gardening',
      context: 'Automate your irrigation using '
    },
    {
      anchor: 'low-water perennial garden designs',
      target: 'low-water-perennial-gardens-beautiful-landscapes-with-less-water',
      context: 'Perfect your system for '
    }
  ],
  
  // 2025/8/29 - edible-landscaping
  'edible-landscaping-transform-your-yard': [
    {
      anchor: 'edible border plants for productive landscapes',
      target: 'top-edible-border-plants-to-enhance-your-outdoor-space',
      context: 'Start your transformation with these '
    },
    {
      anchor: 'herb spiral designs for culinary gardens',
      target: 'beautiful-herb-spiral-designs-for-home-gardeners',
      context: 'Create functional focal points using '
    },
    {
      anchor: 'seasonal planting strategies for continuous harvests',
      target: 'plan-your-garden-with-seasonal-planting-planners',
      context: 'Maximize productivity through '
    }
  ],
  
  // 2025/9/1 - drought-tolerant-plant-ideas
  'explore-drought-tolerant-plant-ideas-for-your-yard': [
    {
      anchor: 'heat-resistant plant varieties for extreme climates',
      target: 'explore-heat-resistant-plant-varieties-for-hot-climates',
      context: 'Build on these proven '
    },
    {
      anchor: 'succulent gardens for water-wise landscaping',
      target: 'succulents-for-beginners-how-to-get-started',
      context: 'Include easy-care options like '
    },
    {
      anchor: 'sustainable mulching for moisture retention',
      target: 'learn-about-sustainable-mulching-methods-and-benefits',
      context: 'Protect drought-tolerant plants with '
    }
  ],
  
  // 2025/9/4 - indoor-sprouts-guide
  'grow-fresh-produce-year-round-indoor-sprouts-guide': [
    {
      anchor: 'seed saving techniques for continuous growing',
      target: 'effective-seed-saving-practices-for-home-gardeners',
      context: 'Source quality seeds using these '
    },
    {
      anchor: 'urban micro-farming methods',
      target: 'maximize-your-urban-micro-farm-with-these-pro-tips',
      context: 'Scale your indoor growing with '
    }
  ],
  
  // 2025/9/7 - living-hedge-fences
  'living-hedge-fences-a-guide-to-creating-a-natural-boundary': [
    {
      anchor: 'native plant selections for privacy screens',
      target: 'native-species-planting-guide-tips-amp-best-practices',
      context: 'Choose appropriate species from these '
    },
    {
      anchor: 'pollinator-friendly boundary plantings',
      target: 'pollinator-habitat-restoration-creating-a-thriving-ecosystem',
      context: 'Your living fence can support '
    },
    {
      anchor: 'sustainable garden practices for hedge maintenance',
      target: 'sustainable-garden-practices',
      context: 'Maintain your living boundary using '
    }
  ],
  
  // 2025/9/10 - planning-social-garden-gatherings
  'planning-social-garden-gatherings-a-guide-to-success': [
    {
      anchor: 'sensory garden zones for memorable experiences',
      target: 'sensory-focused-garden-zones-ideas-for-a-calming-outdoor-space',
      context: 'Create inviting spaces with '
    },
    {
      anchor: 'edible landscaping for entertaining',
      target: 'top-edible-border-plants-to-enhance-your-outdoor-space',
      context: 'Impress guests with functional '
    }
  ],
  
  // 2025/9/13 - social-gardening-platforms
  'top-social-gardening-platforms-for-connecting-gardeners': [
    {
      anchor: 'smart gardening technology and apps',
      target: 'smart-garden-sensors-the-ultimate-guide-to-smart-gardening',
      context: 'Complement social platforms with '
    },
    {
      anchor: 'seasonal planning tools for garden communities',
      target: 'plan-your-garden-with-seasonal-planting-planners',
      context: 'Share and coordinate using '
    }
  ],
  
  // 2025/9/16 - wildlife-friendly-backyard
  'transform-your-yard-into-a-wildlife-friendly-backyard': [
    {
      anchor: 'pollinator habitat creation strategies',
      target: 'pollinator-habitat-restoration-creating-a-thriving-ecosystem',
      context: 'Essential foundation includes '
    },
    {
      anchor: 'native plant ecosystems for local wildlife',
      target: 'native-species-planting-guide-tips-amp-best-practices',
      context: 'Build habitat using '
    },
    {
      anchor: 'bug-friendly garden features',
      target: 'bug-friendly-garden-design-ideas-for-your-yard',
      context: 'Incorporate beneficial '
    }
  ],
  
  // 2025/9/19 - upcycled-garden-art
  'upcycled-garden-art-beautiful-and-eco-friendly-decor-options': [
    {
      anchor: 'DIY vertical garden structures',
      target: 'build-your-own-diy-vertical-herb-wall-with-ease',
      context: 'Repurpose materials for functional '
    },
    {
      anchor: 'sustainable gardening philosophies',
      target: 'learn-about-eco-friendly-gardening-practices-and-tips',
      context: 'Upcycling aligns with comprehensive '
    }
  ],
  
  // 2025/9/22 - vertical-flower-diy-boards
  'vertical-flower-diy-boards-easy-home-decor-projects': [
    {
      anchor: 'vertical herb wall construction techniques',
      target: 'build-your-own-diy-vertical-herb-wall-with-ease',
      context: 'Apply similar methods from these '
    },
    {
      anchor: 'small-space vertical gardening solutions',
      target: 'vertical-garden-ideas',
      context: 'Expand your vertical displays with '
    },
    {
      anchor: 'sensory garden vertical elements',
      target: 'sensory-focused-garden-zones-ideas-for-a-calming-outdoor-space',
      context: 'Create aromatic displays inspired by '
    }
  ],
  
  // 2025/9/25 - vertical-micro-gardens
  'vertical-micro-gardens-compact-gardening-solutions': [
    {
      anchor: 'urban micro-farming optimization strategies',
      target: 'maximize-your-urban-micro-farm-with-these-pro-tips',
      context: 'Implement professional techniques from '
    },
    {
      anchor: 'balcony gardening vertical systems',
      target: 'balcony-micro-orchard-how-to-grow-your-own-fruits-and-herbs',
      context: 'Adapt these methods from successful '
    },
    {
      anchor: 'self-watering systems for vertical gardens',
      target: 'self-watering-planter-builds-a-beginner-s-guide',
      context: 'Automate maintenance with '
    }
  ],
  
  // 2025/9/28 - wildlife-attracting-container-combos
  'wildlife-attracting-container-combos-a-gardener-s-guide': [
    {
      anchor: 'pollinator-friendly plant combinations',
      target: 'pollinator-habitat-restoration-creating-a-thriving-ecosystem',
      context: 'Select plants based on '
    },
    {
      anchor: 'native plants for container gardens',
      target: 'native-species-planting-guide-tips-amp-best-practices',
      context: 'Choose appropriate species following '
    },
    {
      anchor: 'edible plants that attract beneficial insects',
      target: 'top-edible-border-plants-to-enhance-your-outdoor-space',
      context: 'Include dual-purpose options like these '
    }
  ]
};

// 添加内链到文章内容
function addInternalLinksToArticle(articlePath, links) {
  try {
    let content = fs.readFileSync(articlePath, 'utf-8');
    let modified = false;
    
    // 分离frontmatter和正文
    const parts = content.split('---');
    if (parts.length < 3) {
      console.log(`  ⚠️  文件格式不正确`);
      return false;
    }
    
    let body = parts.slice(2).join('---');
    const paragraphs = body.split('\n\n');
    
    // 为每个链接找到合适的位置插入
    links.forEach((link, index) => {
      // 计算插入位置（均匀分布）
      const targetIndex = Math.floor((index + 1) * paragraphs.length / (links.length + 1));
      
      if (targetIndex < paragraphs.length) {
        const linkText = `${link.context}[${link.anchor}](/articles/${link.target}/)`;
        
        // 在段落末尾添加链接
        if (paragraphs[targetIndex].trim()) {
          paragraphs[targetIndex] = paragraphs[targetIndex] + ' ' + linkText;
          modified = true;
        }
      }
    });
    
    if (modified) {
      body = paragraphs.join('\n\n');
      const newContent = `---${parts[1]}---${body}`;
      fs.writeFileSync(articlePath, newContent);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`  ❌ 处理失败: ${error.message}`);
    return false;
  }
}

// 主函数
function main() {
  console.log('\n🔗 为未来发布文章添加SEO优化内链\n');
  console.log('=' .repeat(80));
  console.log('遵循原则:');
  console.log('  • 使用描述性锚文本（非简单词语）');
  console.log('  • 每篇文章1-3个内链');
  console.log('  • 只链接到已发布文章');
  console.log('  • 创建主题集群提升SEO');
  console.log('=' .repeat(80));
  
  let totalAdded = 0;
  let processedCount = 0;
  
  Object.entries(internalLinksMapping).forEach(([slug, links]) => {
    const articlePath = path.join(articlesDir, slug, 'index.mdx');
    
    if (fs.existsSync(articlePath)) {
      console.log(`\n📄 处理: ${slug}`);
      console.log(`  添加 ${links.length} 个内链`);
      
      links.forEach(link => {
        console.log(`    → "${link.anchor}" 指向 ${link.target}`);
      });
      
      if (addInternalLinksToArticle(articlePath, links)) {
        console.log(`  ✅ 成功添加内链`);
        totalAdded += links.length;
        processedCount++;
      } else {
        console.log(`  ⚠️  未能添加内链`);
      }
    } else {
      console.log(`\n⚠️  文章不存在: ${slug}`);
    }
  });
  
  console.log('\n' + '=' .repeat(80));
  console.log(`\n✅ 完成！`);
  console.log(`   处理文章: ${processedCount} 篇`);
  console.log(`   添加内链: ${totalAdded} 个`);
  console.log(`   平均每篇: ${(totalAdded / processedCount).toFixed(1)} 个内链`);
  console.log('\nSEO优势:');
  console.log('  • 增强网站内部链接结构');
  console.log('  • 提高页面权重传递');
  console.log('  • 改善用户导航体验');
  console.log('  • 降低跳出率');
  console.log('  • 建立主题权威性');
}

// 运行
main();