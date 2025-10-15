#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '..', 'src', 'content', 'articles');

// Clean existing internal links
function cleanExistingLinks(content) {
  let cleaned = content.replace(/\[([^\]]+)\]\(\/articles\/[^)]+\)/g, '$1');
  cleaned = cleaned.replace(/<a[^>]*href="\/articles\/[^"]*"[^>]*>([^<]+)<\/a>/gi, '$1');
  return cleaned;
}

// SEO keyword phrases to link mapping for OptiNook marketing theme
const keywordLinks = {
  'responsive design': 'improve-ad-performance-with-responsive-ads-messaging-tests',
  'ad performance': 'dynamic-search-ads-optimization-tips-and-best-practices',
  'user engagement': 'enhance-user-experience-with-gamified-content-entry-forms-online',
  'video content': 'short-form-video-integration-strategies-for-success',
  'influencer marketing': 'elevate-your-brand-with-micro-influencer-campaigns',
  'content strategy': 'predictive-content-calendars-planning-for-success',
  'content clusters': 'improve-seo-with-content-cluster-planning-techniques',
  'feedback loops': 'how-to-implement-successful-content-feedback-loops',
  'evergreen content': 'evergreen-vs-topical-slicing-seo-content-approach',
  'user experience': 'adaptive-header-strategies-boosting-user-experience',
  'interactive elements': 'enhance-user-experience-with-gamified-content-entry-forms-online',
  'conversion optimization': 'chatbot-lead-generation-funnels-boost-your-sales',
  'lead generation': 'chatbot-lead-generation-funnels-boost-your-sales',
  'user interface': 'content-experience-design-strategies-for-success',
  'conversion rates': 'improve-bookings-with-generative-chat-booking-ads-strategies',
  'semantic keywords': 'mastering-semantic-keyword-grouping-for-better-seo-results',
  'zero-volume keywords': 'boost-your-seo-with-zero-keyword-content-ideas',
  'long-tail keywords': 'long-tail-conversational-keywords-a-guide-to-effective-seo',
  'chatbot technology': 'chatbot-lead-generation-funnels-boost-your-sales',
  'ad messaging': 'improve-ad-performance-with-responsive-ads-messaging-tests',
  'mobile optimization': 'improve-mobile-ad-experience-ux-tips-and-best-practices',
  'short-form video': 'short-form-video-integration-strategies-for-success',
  'brand storytelling': 'brand-story-micro-videos-engage-your-audience',
  'content planning': 'predictive-content-calendars-planning-for-success',
  'SERP analysis': 'semantic-serp-analysis-understanding-search-results',
  'content calendar': 'predictive-content-calendars-planning-for-success',
  'SEO strategy': 'boost-your-online-visibility-with-influencer-seo-synergy',
  'SERP features': 'semantic-serp-analysis-understanding-search-results',
  'local SEO': 'mastering-local-topic-authority-building-for-better-seo',
  'structured data': 'structured-data-adoption-a-guide-for-marketers',
  'semantic search': 'mastering-semantic-keyword-grouping-for-better-seo-results',
  'search results': 'semantic-serp-analysis-understanding-search-results',
  'SEO performance': 'boost-your-seo-with-zero-keyword-content-ideas',
  'micro-influencers': 'elevate-your-brand-with-micro-influencer-campaigns',
  'brand content': 'brand-story-micro-videos-engage-your-audience',
  'content marketing': 'content-experience-design-strategies-for-success',
  'dynamic search ads': 'dynamic-search-ads-optimization-tips-and-best-practices',
  'mobile experience': 'improve-mobile-ad-experience-ux-tips-and-best-practices',
  'chat ads': 'improve-bookings-with-generative-chat-booking-ads-strategies',
  'keyword grouping': 'mastering-semantic-keyword-grouping-for-better-seo-results',
  'search intent': 'long-tail-conversational-keywords-a-guide-to-effective-seo',
  'local search': 'mastering-local-topic-authority-building-for-better-seo',
  'semantic SEO': 'mastering-semantic-keyword-grouping-for-better-seo-results',
  'keyword clustering': 'mastering-semantic-keyword-grouping-for-better-seo-results',
  'content optimization': 'improve-seo-with-content-cluster-planning-techniques',
  'content design': 'content-experience-design-strategies-for-success',
  'interactive forms': 'enhance-user-experience-with-gamified-content-entry-forms-online',
  'responsive ads': 'improve-ad-performance-with-responsive-ads-messaging-tests',
  'mobile advertising': 'improve-mobile-ad-experience-ux-tips-and-best-practices',
  'conversion tracking': 'privacy-law-compliant-tracking-ensuring-data-protection',
  'user behavior': 'analyze-user-behavior-with-advanced-heatmap-engagement-analyses',
  'data analytics': 'how-to-implement-successful-content-feedback-loops',
  'privacy compliance': 'privacy-law-compliant-tracking-ensuring-data-protection',
  'user analytics': 'analyze-user-behavior-with-advanced-heatmap-engagement-analyses',
  'booking optimization': 'improve-bookings-with-generative-chat-booking-ads-strategies',
  'gamification': 'enhance-user-experience-with-gamified-content-entry-forms-online',
  'micro-moments': 'maximizing-impact-with-micro-moment-content-formats',
  'influencer content': 'elevate-your-brand-with-micro-influencer-campaigns'
};

// Function to add inline internal links
function addInlineLinks(content, articleId) {
  let modifiedContent = content;
  let addedLinks = 0;
  const maxLinks = 3;
  const usedPhrases = new Set();
  const currentArticle = articleId;
  
  // Sort keywords by length (longer phrases first to avoid partial matches)
  const sortedKeywords = Object.keys(keywordLinks).sort((a, b) => b.length - a.length);
  
  for (const phrase of sortedKeywords) {
    if (addedLinks >= maxLinks) break;
    if (usedPhrases.has(phrase)) continue;
    
    const targetArticle = keywordLinks[phrase];
    
    // Don't link to the same article
    if (targetArticle === currentArticle) continue;
    
    // Create regex to find the phrase (case-insensitive)
    const regex = new RegExp(`\\b(${phrase})\\b(?![^\\[]*\\]\\()`, 'i');
    
    // Check if phrase exists in content
    if (regex.test(modifiedContent)) {
      // Replace first occurrence only
      modifiedContent = modifiedContent.replace(regex, (match) => {
        if (addedLinks < maxLinks) {
          addedLinks++;
          usedPhrases.add(phrase);
          return `[${match}](/articles/${targetArticle}/)`;
        }
        return match;
      });
    }
  }
  
  return { content: modifiedContent, linksAdded: addedLinks };
}

// Unused mapping kept for reference
const articleRelationships = {
  'improve-mobile-ad-experience-ux-tips-and-best-practices': {
    links: [
      {
        anchor: 'self-watering systems for container gardens',
        target: 'self-watering-planter-builds-a-beginner-s-guide',
        context: 'To maintain your micro-orchard efficiently, consider implementing '
      },
      {
        anchor: 'vertical herb wall designs that maximize space',
        target: 'build-your-own-diy-vertical-herb-wall-with-ease',
        context: 'Expand your balcony growing area with '
      }
    ]
  },
  'beautiful-herb-spiral-designs-for-home-gardeners': {
    links: [
      {
        anchor: 'sensory garden zones for aromatic experiences',
        target: 'sensory-focused-garden-zones-ideas-for-a-calming-outdoor-space',
        context: 'Herb spirals naturally create '
      },
      {
        anchor: 'edible border plants that complement herbs',
        target: 'top-edible-border-plants-to-enhance-your-outdoor-space',
        context: 'Surround your spiral with '
      }
    ]
  },
  'best-climate-smart-plant-combos-for-sustainable-gardening': {
    links: [
      {
        anchor: 'native species planting strategies for local ecosystems',
        target: 'native-species-planting-guide-tips-amp-best-practices',
        context: 'Climate-smart combinations often include '
      },
      {
        anchor: 'heat-resistant varieties for changing climates',
        target: 'explore-heat-resistant-plant-varieties-for-hot-climates',
        context: 'As temperatures rise, incorporate '
      },
      {
        anchor: 'low-water perennial gardens that thrive naturally',
        target: 'low-water-perennial-gardens-beautiful-landscapes-with-less-water',
        context: 'Create resilient landscapes with '
      }
    ]
  },
  'bug-friendly-garden-design-ideas-for-your-yard': {
    links: [
      {
        anchor: 'pollinator habitat restoration techniques',
        target: 'pollinator-habitat-restoration-creating-a-thriving-ecosystem',
        context: 'Take your bug-friendly garden further with comprehensive '
      },
      {
        anchor: 'native species that support beneficial insects',
        target: 'native-species-planting-guide-tips-amp-best-practices',
        context: 'Foundation plantings should focus on '
      }
    ]
  },
  'build-your-own-diy-vertical-herb-wall-with-ease': {
    links: [
      {
        anchor: 'self-watering planters for vertical systems',
        target: 'self-watering-planter-builds-a-beginner-s-guide',
        context: 'Simplify maintenance by incorporating '
      },
      {
        anchor: 'urban micro-farming techniques',
        target: 'maximize-your-urban-micro-farm-with-these-pro-tips',
        context: 'This vertical approach is essential for '
      }
    ]
  },
  'diy-compost-bin-setups-for-beginners-a-guide': {
    links: [
      {
        anchor: 'sustainable mulching methods using compost',
        target: 'learn-about-sustainable-mulching-methods-and-benefits',
        context: 'Use your finished compost for '
      },
      {
        anchor: 'eco-friendly gardening practices',
        target: 'learn-about-eco-friendly-gardening-practices-and-tips',
        context: 'Composting is a cornerstone of '
      }
    ]
  },
  'effective-rainwater-harvesting-for-gardens-tips-and-techniques': {
    links: [
      {
        anchor: 'self-watering planter systems connected to rain barrels',
        target: 'self-watering-planter-builds-a-beginner-s-guide',
        context: 'Maximize your harvested water with '
      },
      {
        anchor: 'low-water perennial garden designs',
        target: 'low-water-perennial-gardens-beautiful-landscapes-with-less-water',
        context: 'Pair your water harvesting with '
      }
    ]
  },
  'effective-seed-saving-practices-for-home-gardeners': {
    links: [
      {
        anchor: 'seasonal planting schedules for succession growing',
        target: 'plan-your-garden-with-seasonal-planting-planners',
        context: 'Coordinate your saved seeds with '
      },
      {
        anchor: 'native species seed collection and storage',
        target: 'native-species-planting-guide-tips-amp-best-practices',
        context: 'Focus your seed saving efforts on '
      }
    ]
  },
  'energy-efficient-greenhouse-benefits-and-best-practices': {
    links: [
      {
        anchor: 'smart garden sensors for climate monitoring',
        target: 'smart-garden-sensors-the-ultimate-guide-to-smart-gardening',
        context: 'Optimize your greenhouse efficiency with '
      },
      {
        anchor: 'heat-resistant plants for greenhouse cultivation',
        target: 'explore-heat-resistant-plant-varieties-for-hot-climates',
        context: 'Select appropriate crops including '
      }
    ]
  },
  'explore-heat-resistant-plant-varieties-for-hot-climates': {
    links: [
      {
        anchor: 'succulent gardens for beginners in dry regions',
        target: 'succulents-for-beginners-how-to-get-started',
        context: 'Start with low-maintenance options like '
      },
      {
        anchor: 'sustainable mulching to retain moisture',
        target: 'learn-about-sustainable-mulching-methods-and-benefits',
        context: 'Protect heat-resistant plants with '
      },
      {
        anchor: 'climate-smart plant combinations',
        target: 'best-climate-smart-plant-combos-for-sustainable-gardening',
        context: 'Integrate these varieties into '
      }
    ]
  },
  'how-to-build-no-dig-vegetable-beds-at-home': {
    links: [
      {
        anchor: 'sustainable mulching layers for no-dig systems',
        target: 'learn-about-sustainable-mulching-methods-and-benefits',
        context: 'The foundation of no-dig beds relies on '
      },
      {
        anchor: 'shade-tolerant vegetables for partially covered beds',
        target: 'shade-tolerant-veggie-ideas-for-a-thriving-garden',
        context: 'If your beds receive partial sun, consider '
      }
    ]
  },
  'learn-about-eco-friendly-gardening-practices-and-tips': {
    links: [
      {
        anchor: 'DIY composting systems for organic waste',
        target: 'diy-compost-bin-setups-for-beginners-a-guide',
        context: 'Start your eco-journey with '
      },
      {
        anchor: 'native plant selection for sustainable landscapes',
        target: 'native-species-planting-guide-tips-amp-best-practices',
        context: 'Build ecological gardens through '
      },
      {
        anchor: 'rainwater harvesting techniques',
        target: 'effective-rainwater-harvesting-for-gardens-tips-and-techniques',
        context: 'Conserve resources by implementing '
      }
    ]
  },
  'learn-about-sustainable-mulching-methods-and-benefits': {
    links: [
      {
        anchor: 'compost-based mulch production',
        target: 'diy-compost-bin-setups-for-beginners-a-guide',
        context: 'Create your own mulch through '
      },
      {
        anchor: 'no-dig bed preparation with mulch layers',
        target: 'how-to-build-no-dig-vegetable-beds-at-home',
        context: 'Apply these mulching principles in '
      }
    ]
  },
  'low-water-perennial-gardens-beautiful-landscapes-with-less-water': {
    links: [
      {
        anchor: 'succulent varieties for drought-prone areas',
        target: 'succulents-for-beginners-how-to-get-started',
        context: 'Incorporate water-wise plants like '
      },
      {
        anchor: 'rainwater harvesting systems for irrigation',
        target: 'effective-rainwater-harvesting-for-gardens-tips-and-techniques',
        context: 'Support your low-water garden with '
      },
      {
        anchor: 'heat-resistant perennials for extreme conditions',
        target: 'explore-heat-resistant-plant-varieties-for-hot-climates',
        context: 'Choose resilient species from these '
      }
    ]
  },
  'maximize-your-urban-micro-farm-with-these-pro-tips': {
    links: [
      {
        anchor: 'vertical herb walls for space optimization',
        target: 'build-your-own-diy-vertical-herb-wall-with-ease',
        context: 'Maximize vertical space with '
      },
      {
        anchor: 'balcony micro-orchards for fruit production',
        target: 'balcony-micro-orchard-how-to-grow-your-own-fruits-and-herbs',
        context: 'Expand your urban farm with '
      },
      {
        anchor: 'smart gardening technology for urban farms',
        target: 'smart-garden-sensors-the-ultimate-guide-to-smart-gardening',
        context: 'Automate your micro-farm using '
      }
    ]
  },
  'native-species-planting-guide-tips-amp-best-practices': {
    links: [
      {
        anchor: 'pollinator habitat creation with native plants',
        target: 'pollinator-habitat-restoration-creating-a-thriving-ecosystem',
        context: 'Native species are essential for '
      },
      {
        anchor: 'bug-friendly garden designs using local flora',
        target: 'bug-friendly-garden-design-ideas-for-your-yard',
        context: 'Create beneficial insect havens through '
      },
      {
        anchor: 'seed saving from native plant varieties',
        target: 'effective-seed-saving-practices-for-home-gardeners',
        context: 'Preserve local genetics by '
      }
    ]
  },
  'plan-your-garden-with-seasonal-planting-planners': {
    links: [
      {
        anchor: 'seed saving schedules for succession planting',
        target: 'effective-seed-saving-practices-for-home-gardeners',
        context: 'Coordinate your planting calendar with '
      },
      {
        anchor: 'shade-tolerant vegetables for year-round growing',
        target: 'shade-tolerant-veggie-ideas-for-a-thriving-garden',
        context: 'Include season-extending crops like '
      }
    ]
  },
  'pollinator-habitat-restoration-creating-a-thriving-ecosystem': {
    links: [
      {
        anchor: 'native plant communities for pollinators',
        target: 'native-species-planting-guide-tips-amp-best-practices',
        context: 'Foundation plantings should emphasize '
      },
      {
        anchor: 'bug-friendly garden features and designs',
        target: 'bug-friendly-garden-design-ideas-for-your-yard',
        context: 'Enhance your habitat with '
      },
      {
        anchor: 'edible plants that attract beneficial insects',
        target: 'top-edible-border-plants-to-enhance-your-outdoor-space',
        context: 'Include dual-purpose plantings like '
      }
    ]
  },
  'raised-bed-mushroom-logs-a-guide-to-mushroom-cultivation': {
    links: [
      {
        anchor: 'shade-tolerant companion vegetables',
        target: 'shade-tolerant-veggie-ideas-for-a-thriving-garden',
        context: 'Grow mushrooms alongside '
      },
      {
        anchor: 'no-dig bed construction for mushroom gardens',
        target: 'how-to-build-no-dig-vegetable-beds-at-home',
        context: 'Create mushroom-friendly environments using '
      }
    ]
  },
  'self-watering-planter-builds-a-beginner-s-guide': {
    links: [
      {
        anchor: 'vertical herb walls with integrated watering',
        target: 'build-your-own-diy-vertical-herb-wall-with-ease',
        context: 'Apply self-watering principles to '
      },
      {
        anchor: 'rainwater collection for planter reservoirs',
        target: 'effective-rainwater-harvesting-for-gardens-tips-and-techniques',
        context: 'Fill your self-watering systems using '
      }
    ]
  },
  'sensory-focused-garden-zones-ideas-for-a-calming-outdoor-space': {
    links: [
      {
        anchor: 'herb spiral designs for aromatic experiences',
        target: 'beautiful-herb-spiral-designs-for-home-gardeners',
        context: 'Create fragrant focal points with '
      },
      {
        anchor: 'edible border plants with sensory appeal',
        target: 'top-edible-border-plants-to-enhance-your-outdoor-space',
        context: 'Define sensory zones using '
      }
    ]
  },
  'shade-tolerant-veggie-ideas-for-a-thriving-garden': {
    links: [
      {
        anchor: 'mushroom cultivation in shaded areas',
        target: 'raised-bed-mushroom-logs-a-guide-to-mushroom-cultivation',
        context: 'Maximize shade production with '
      },
      {
        anchor: 'seasonal planning for shade gardens',
        target: 'plan-your-garden-with-seasonal-planting-planners',
        context: 'Optimize your harvest timing using '
      }
    ]
  },
  'smart-garden-sensors-the-ultimate-guide-to-smart-gardening': {
    links: [
      {
        anchor: 'greenhouse automation and monitoring',
        target: 'energy-efficient-greenhouse-benefits-and-best-practices',
        context: 'Implement sensor technology in '
      },
      {
        anchor: 'urban micro-farm optimization',
        target: 'maximize-your-urban-micro-farm-with-these-pro-tips',
        context: 'Scale smart technology for '
      }
    ]
  },
  'succulents-for-beginners-how-to-get-started': {
    links: [
      {
        anchor: 'heat-resistant plant combinations with succulents',
        target: 'explore-heat-resistant-plant-varieties-for-hot-climates',
        context: 'Pair your succulents with other '
      },
      {
        anchor: 'low-water perennial garden designs',
        target: 'low-water-perennial-gardens-beautiful-landscapes-with-less-water',
        context: 'Integrate succulents into '
      }
    ]
  },
  'top-edible-border-plants-to-enhance-your-outdoor-space': {
    links: [
      {
        anchor: 'herb spirals as edible landscape features',
        target: 'beautiful-herb-spiral-designs-for-home-gardeners',
        context: 'Create vertical interest with '
      },
      {
        anchor: 'pollinator-friendly edible plants',
        target: 'pollinator-habitat-restoration-creating-a-thriving-ecosystem',
        context: 'Select border plants that support '
      },
      {
        anchor: 'sensory garden designs with edible elements',
        target: 'sensory-focused-garden-zones-ideas-for-a-calming-outdoor-space',
        context: 'Incorporate these plants into '
      }
    ]
  }
};

// Main processing function (old function removed)

// Process all articles
async function processArticles() {
  console.log('🔗 Creating inline SEO internal links for OptiNook articles...\n');
  
  const articles = fs.readdirSync(articlesDir)
    .filter(dir => fs.statSync(path.join(articlesDir, dir)).isDirectory());
  
  let totalProcessed = 0;
  let totalLinksAdded = 0;
  
  for (const articleId of articles) {
    const mdxPath = path.join(articlesDir, articleId, 'index.mdx');
    
    if (!fs.existsSync(mdxPath)) continue;
    
    // Read content
    let content = fs.readFileSync(mdxPath, 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;
    
    const frontmatter = frontmatterMatch[0];
    const body = content.slice(frontmatterMatch[0].length);
    
    // Clean existing links and add new inline links
    const cleanedBody = cleanExistingLinks(body);
    const { content: linkedBody, linksAdded } = addInlineLinks(cleanedBody, articleId);
    
    // Write back
    fs.writeFileSync(mdxPath, frontmatter + linkedBody, 'utf8');
    
    console.log(`✅ ${articleId}: Added ${linksAdded} inline links`);
    totalProcessed++;
    totalLinksAdded += linksAdded;
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Articles processed: ${totalProcessed}`);
  console.log(`   Total inline links added: ${totalLinksAdded}`);
  console.log(`   Average links per article: ${(totalLinksAdded / totalProcessed).toFixed(1)}`);
  
  console.log('\n✨ Inline internal linking complete!');
  console.log('\nSEO Best Practices Applied:');
  console.log('   - Natural keyword phrases as clickable links');
  console.log('   - Contextually relevant anchor text');
  console.log('   - 1-3 strategic links per article');
  console.log('   - No self-linking or over-optimization');
}

processArticles().catch(console.error);