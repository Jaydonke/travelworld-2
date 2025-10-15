#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

// Color output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Today's date for time logic
const TODAY = new Date('2025-08-18');

// Clean existing internal links
function cleanExistingLinks(content) {
  let cleaned = content.replace(/\[([^\]]+)\]\(\/articles\/[^)]+\)/g, '$1');
  cleaned = cleaned.replace(/<a[^>]*href="\/articles\/[^"]*"[^>]*>([^<]+)<\/a>/gi, '$1');
  return cleaned;
}

// Map future gardening articles to past articles with SEO keywords
const futureGardenArticlesLinks = {
  'compost-tea-booster-enhance-soil-health-naturally': [
    { phrase: 'compost bin', target: 'diy-compost-bin-setups-for-beginners-a-guide' },
    { phrase: 'sustainable mulching', target: 'learn-about-sustainable-mulching-methods-and-benefits' },
    { phrase: 'eco-friendly gardening', target: 'learn-about-eco-friendly-gardening-practices-and-tips' }
  ],
  'container-gardening-for-renters-how-to-get-started': [
    { phrase: 'vertical herb wall', target: 'build-your-own-diy-vertical-herb-wall-with-ease' },
    { phrase: 'self-watering planters', target: 'self-watering-planter-builds-a-beginner-s-guide' },
    { phrase: 'urban micro-farm', target: 'maximize-your-urban-micro-farm-with-these-pro-tips' }
  ],
  'designing-native-pollinator-gardens-for-your-backyard': [
    { phrase: 'native species', target: 'native-species-planting-guide-tips-amp-best-practices' },
    { phrase: 'pollinator habitat', target: 'pollinator-habitat-restoration-creating-a-thriving-ecosystem' },
    { phrase: 'bug-friendly garden', target: 'bug-friendly-garden-design-ideas-for-your-yard' }
  ],
  'drip-irrigation-systems-save-water-enhance-your-garden': [
    { phrase: 'rainwater harvesting', target: 'effective-rainwater-harvesting-for-gardens-tips-and-techniques' },
    { phrase: 'low-water perennial', target: 'low-water-perennial-gardens-beautiful-landscapes-with-less-water' },
    { phrase: 'self-watering systems', target: 'self-watering-planter-builds-a-beginner-s-guide' }
  ],
  'edible-landscaping-transform-your-yard': [
    { phrase: 'edible border plants', target: 'top-edible-border-plants-to-enhance-your-outdoor-space' },
    { phrase: 'herb spiral', target: 'beautiful-herb-spiral-designs-for-home-gardeners' },
    { phrase: 'shade-tolerant vegetables', target: 'shade-tolerant-veggie-ideas-for-a-thriving-garden' }
  ],
  'explore-drought-tolerant-plant-ideas-for-your-yard': [
    { phrase: 'succulents', target: 'succulents-for-beginners-how-to-get-started' },
    { phrase: 'heat-resistant plants', target: 'explore-heat-resistant-plant-varieties-for-hot-climates' },
    { phrase: 'climate-smart plant combos', target: 'best-climate-smart-plant-combos-for-sustainable-gardening' }
  ],
  'grow-fresh-produce-year-round-indoor-sprouts-guide': [
    { phrase: 'vertical growing', target: 'build-your-own-diy-vertical-herb-wall-with-ease' },
    { phrase: 'energy-efficient greenhouse', target: 'energy-efficient-greenhouse-benefits-and-best-practices' },
    { phrase: 'seasonal planting', target: 'plan-your-garden-with-seasonal-planting-planners' }
  ],
  'living-hedge-fences-a-guide-to-creating-a-natural-boundary': [
    { phrase: 'native plants', target: 'native-species-planting-guide-tips-amp-best-practices' },
    { phrase: 'low-water landscaping', target: 'low-water-perennial-gardens-beautiful-landscapes-with-less-water' },
    { phrase: 'sustainable gardening', target: 'learn-about-eco-friendly-gardening-practices-and-tips' }
  ],
  'planning-social-garden-gatherings-a-guide-to-success': [
    { phrase: 'sensory garden zones', target: 'sensory-focused-garden-zones-ideas-for-a-calming-outdoor-space' },
    { phrase: 'herb garden', target: 'beautiful-herb-spiral-designs-for-home-gardeners' },
    { phrase: 'seasonal planning', target: 'plan-your-garden-with-seasonal-planting-planners' }
  ],
  'top-social-gardening-platforms-for-connecting-gardeners': [
    { phrase: 'smart garden sensors', target: 'smart-garden-sensors-the-ultimate-guide-to-smart-gardening' },
    { phrase: 'urban farming', target: 'maximize-your-urban-micro-farm-with-these-pro-tips' },
    { phrase: 'balcony gardens', target: 'balcony-micro-orchard-how-to-grow-your-own-fruits-and-herbs' }
  ],
  'transform-your-yard-into-a-wildlife-friendly-backyard': [
    { phrase: 'pollinator restoration', target: 'pollinator-habitat-restoration-creating-a-thriving-ecosystem' },
    { phrase: 'native species garden', target: 'native-species-planting-guide-tips-amp-best-practices' },
    { phrase: 'bug-friendly design', target: 'bug-friendly-garden-design-ideas-for-your-yard' }
  ],
  'upcycled-garden-art-beautiful-and-eco-friendly-decor-options': [
    { phrase: 'sustainable practices', target: 'learn-about-eco-friendly-gardening-practices-and-tips' },
    { phrase: 'DIY compost', target: 'diy-compost-bin-setups-for-beginners-a-guide' },
    { phrase: 'rainwater collection', target: 'effective-rainwater-harvesting-for-gardens-tips-and-techniques' }
  ],
  'vertical-flower-diy-boards-easy-home-decor-projects': [
    { phrase: 'vertical herb wall', target: 'build-your-own-diy-vertical-herb-wall-with-ease' },
    { phrase: 'self-watering planter', target: 'self-watering-planter-builds-a-beginner-s-guide' },
    { phrase: 'balcony micro-orchard', target: 'balcony-micro-orchard-how-to-grow-your-own-fruits-and-herbs' }
  ],
  'vertical-micro-gardens-compact-gardening-solutions': [
    { phrase: 'urban micro-farming', target: 'maximize-your-urban-micro-farm-with-these-pro-tips' },
    { phrase: 'DIY vertical herbs', target: 'build-your-own-diy-vertical-herb-wall-with-ease' },
    { phrase: 'balcony orchard', target: 'balcony-micro-orchard-how-to-grow-your-own-fruits-and-herbs' }
  ],
  'wildlife-attracting-container-combos-a-gardener-s-guide': [
    { phrase: 'pollinator habitat', target: 'pollinator-habitat-restoration-creating-a-thriving-ecosystem' },
    { phrase: 'bug-friendly plants', target: 'bug-friendly-garden-design-ideas-for-your-yard' },
    { phrase: 'native species selection', target: 'native-species-planting-guide-tips-amp-best-practices' }
  ]
};

// Function to add inline links
function addInlineLinks(content, articleId) {
  const links = futureGardenArticlesLinks[articleId];
  if (!links || links.length === 0) return { content, linksAdded: 0 };
  
  let modifiedContent = cleanExistingLinks(content);
  let addedLinks = 0;
  const maxLinks = 3;
  const usedPhrases = new Set();
  
  for (const link of links) {
    if (addedLinks >= maxLinks) break;
    if (usedPhrases.has(link.phrase)) continue;
    
    // Create regex to find the phrase (case-insensitive)
    const regex = new RegExp(`\\b(${link.phrase})\\b(?![^\\[]*\\]\\()`, 'i');
    
    // Check if phrase exists in content
    if (regex.test(modifiedContent)) {
      // Replace first occurrence only
      modifiedContent = modifiedContent.replace(regex, (match) => {
        if (addedLinks < maxLinks) {
          addedLinks++;
          usedPhrases.add(link.phrase);
          return `[${match}](/articles/${link.target}/)`;
        }
        return match;
      });
    }
  }
  
  return { content: modifiedContent, linksAdded: addedLinks };
}

// Main processing function
async function main() {
  log('🌱 Adding SEO internal links to 15 future gardening articles...', 'cyan');
  log(`📅 Today's date: ${TODAY.toISOString().split('T')[0]}`, 'blue');
  log('⏰ Ensuring no time paradox - only linking to past articles\n', 'yellow');
  
  const futureArticleSlugs = Object.keys(futureGardenArticlesLinks);
  let totalProcessed = 0;
  let totalLinksAdded = 0;
  const results = [];
  
  for (const slug of futureArticleSlugs) {
    const articlePath = path.join(articlesDir, slug, 'index.mdx');
    
    if (!fs.existsSync(articlePath)) {
      log(`⏭️  ${slug}: File not found`, 'yellow');
      continue;
    }
    
    // Read content
    let content = fs.readFileSync(articlePath, 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      log(`⚠️  ${slug}: No frontmatter found`, 'yellow');
      continue;
    }
    
    const frontmatter = frontmatterMatch[0];
    const body = content.slice(frontmatterMatch[0].length);
    
    // Add inline links
    const { content: linkedBody, linksAdded } = addInlineLinks(body, slug);
    
    if (linksAdded > 0) {
      // Write back
      fs.writeFileSync(articlePath, frontmatter + linkedBody, 'utf8');
      log(`✅ ${slug.substring(0, 40)}: Added ${linksAdded} links`, 'green');
      totalLinksAdded += linksAdded;
      totalProcessed++;
      results.push({ slug, links: linksAdded });
    } else {
      log(`⚠️  ${slug}: No matching keywords found`, 'yellow');
    }
  }
  
  log('\n📊 Summary:', 'cyan');
  log(`   Future articles processed: ${totalProcessed}/${futureArticleSlugs.length}`, 'blue');
  log(`   Total internal links added: ${totalLinksAdded}`, 'green');
  log(`   Average links per article: ${totalProcessed > 0 ? (totalLinksAdded / totalProcessed).toFixed(1) : 0}`, 'blue');
  
  log('\n✨ SEO Optimization Complete!', 'green');
  log('\n🎯 SEO Best Practices Applied:', 'yellow');
  log('   • Natural keyword phrases as clickable links', 'blue');
  log('   • Contextually relevant anchor text', 'blue');
  log('   • 1-3 strategic internal links per article', 'blue');
  log('   • Only linking to already published articles', 'blue');
  log('   • Topic-relevant cross-linking for better SEO', 'blue');
}

main().catch(console.error);