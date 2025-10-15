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

// Get all article directories
function getArticles() {
  return fs.readdirSync(articlesDir)
    .filter(file => fs.statSync(path.join(articlesDir, file)).isDirectory())
    .map(dir => ({
      slug: dir,
      path: path.join(articlesDir, dir, 'index.mdx')
    }));
}

// Read article content and metadata
function readArticle(articlePath) {
  if (!fs.existsSync(articlePath)) {
    return null;
  }
  
  const content = fs.readFileSync(articlePath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!frontmatterMatch) {
    return null;
  }
  
  const frontmatter = frontmatterMatch[1];
  const body = content.slice(frontmatterMatch[0].length);
  
  // Extract metadata
  const title = frontmatter.match(/title:\s*["'](.+?)["']/)?.[1] || '';
  const category = frontmatter.match(/category:\s*(.+)/)?.[1] || '';
  
  return {
    content,
    frontmatter,
    body,
    title,
    category
  };
}

// Clean existing internal links (removes all markdown links)
function cleanInternalLinks(content) {
  // Remove existing markdown links but keep the text
  let cleaned = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Also remove any HTML anchor tags if present
  cleaned = cleaned.replace(/<a[^>]*>([^<]+)<\/a>/gi, '$1');
  
  return cleaned;
}

// SEO-optimized internal linking mapping for OptiNook marketing articles
const internalLinksMapping = {
  'improve-mobile-ad-experience-ux-tips-and-best-practices': [
    {
      anchor: 'responsive ads messaging tests to improve performance',
      target: 'improve-ad-performance-with-responsive-ads-messaging-tests',
      context: 'After optimizing mobile UX, consider running '
    },
    {
      anchor: 'dynamic search ads optimization strategies',
      target: 'dynamic-search-ads-optimization-tips-and-best-practices',
      context: 'Combine mobile improvements with '
    }
  ],
  'achieve-quick-closet-organization-with-simple-steps': [
    {
      anchor: 'multi-purpose stair storage solutions',
      target: 'multi-purpose-stair-storage-solutions-for-every-home',
      context: 'expand beyond closets with '
    },
    {
      anchor: 'tension rod room dividers for organization',
      target: 'effective-tension-rod-room-dividers-for-home-organization',
      context: 'create zones using '
    },
    {
      anchor: 'open-shelf kitchen organization hacks',
      target: 'open-shelf-kitchen-hacks-maximizing-space-with-style',
      context: 'Apply similar principles to '
    }
  ],
  'add-character-with-recycled-tile-accents-for-your-home': [
    {
      anchor: 'creative DIY accent wall treatments',
      target: 'creative-diy-accent-wall-treatments-for-your-home',
      context: 'complement your tile work with '
    },
    {
      anchor: 'sustainable flooring alternatives',
      target: 'explore-sustainable-flooring-options-for-a-greener-home',
      context: 'Consider '
    },
    {
      anchor: 'current wallpaper and wall design trends',
      target: 'explore-current-wallpaper-replacement-trends-and-designs',
      context: 'Stay updated with '
    }
  ],
  'backyard-shed-conversions-maximizing-outdoor-space': [
    {
      anchor: 'indoor-outdoor living harmony',
      target: 'indoor-outdoor-living-blends-creating-harmonious-spaces',
      context: 'Create seamless transitions with '
    },
    {
      anchor: 'upcycled pallet projects for outdoor spaces',
      target: 'upcycled-pallet-projects-inspiring-ideas-for-home-and-garden',
      context: 'Furnish your shed with '
    },
    {
      anchor: 'home office desk solutions',
      target: 'easy-diy-floating-desk-installs-for-home-office',
      context: 'Transform your shed into a workspace with '
    }
  ],
  'creative-diy-accent-wall-treatments-for-your-home': [
    {
      anchor: 'minimalist entryway design inspiration',
      target: 'simple-elegance-minimalist-entryway-designs-for-inspiration',
      context: 'Balance bold walls with '
    },
    {
      anchor: 'plant-integrated interior ideas',
      target: 'transform-your-home-with-plant-integrated-interior-ideas',
      context: 'Enhance your accent walls with '
    },
    {
      anchor: 'smart lighting remodel solutions',
      target: 'transform-your-space-with-smart-lighting-remodels',
      context: 'Highlight your walls using '
    }
  ],
  'discover-inspiring-upcycled-cabinet-makeovers': [
    {
      anchor: 'zero-waste home improvement techniques',
      target: 'zero-waste-home-fixes-easy-eco-friendly-home-improvements',
      context: 'Follow '
    },
    {
      anchor: 'bathroom upgrade ideas on a budget',
      target: 'transform-your-bathroom-with-budget-bathroom-upgrades',
      context: 'Apply similar makeover principles to '
    }
  ],
  'diy-smart-home-setups-easy-automation-ideas': [
    {
      anchor: 'smart lighting transformation guide',
      target: 'transform-your-space-with-smart-lighting-remodels',
      context: 'Start your automation journey with '
    },
    {
      anchor: 'energy-saving insulation strategies',
      target: 'simple-energy-saving-insulation-tips-to-save-money',
      context: 'Maximize efficiency with '
    },
    {
      anchor: 'noise-reducing materials for peaceful automation',
      target: 'noise-reducing-materials-top-choices-for-soundproofing',
      context: 'Complement your smart home with '
    }
  ],
  'dual-purpose-furniture-hacks-to-maximize-your-living-space': [
    {
      anchor: 'modular desk systems for small spaces',
      target: 'small-space-big-productivity-small-space-modular-desks',
      context: 'Optimize your workspace with '
    },
    {
      anchor: 'innovative stair storage solutions',
      target: 'multi-purpose-stair-storage-solutions-for-every-home',
      context: 'Utilize vertical space through '
    },
    {
      anchor: 'barn door space-saving installations',
      target: 'diy-sliding-barn-door-plans-step-by-step-instructions',
      context: 'Save floor space with '
    }
  ],
  'easy-diy-floating-desk-installs-for-home-office': [
    {
      anchor: 'compact modular desk alternatives',
      target: 'small-space-big-productivity-small-space-modular-desks',
      context: 'Explore '
    },
    {
      anchor: 'smart home office automation',
      target: 'diy-smart-home-setups-easy-automation-ideas',
      context: 'Enhance productivity with '
    },
    {
      anchor: 'soundproofing materials for quiet workspaces',
      target: 'noise-reducing-materials-top-choices-for-soundproofing',
      context: 'Create focus with '
    }
  ],
  'easy-seasonal-d-cor-transitions-for-a-fresh-look': [
    {
      anchor: 'minimalist design principles',
      target: 'simple-elegance-minimalist-entryway-designs-for-inspiration',
      context: 'Simplify transitions using '
    },
    {
      anchor: 'plant-based seasonal decorating',
      target: 'transform-your-home-with-plant-integrated-interior-ideas',
      context: 'Add natural elements through '
    }
  ],
  'effective-tension-rod-room-dividers-for-home-organization': [
    {
      anchor: 'comprehensive closet organization systems',
      target: 'achieve-quick-closet-organization-with-simple-steps',
      context: 'Apply similar techniques to '
    },
    {
      anchor: 'kitchen storage maximization methods',
      target: 'open-shelf-kitchen-hacks-maximizing-space-with-style',
      context: 'Extend your organization to '
    }
  ],
  'explore-current-wallpaper-replacement-trends-and-designs': [
    {
      anchor: 'DIY accent wall alternatives',
      target: 'creative-diy-accent-wall-treatments-for-your-home',
      context: 'Go beyond wallpaper with '
    },
    {
      anchor: 'recycled tile accent designs',
      target: 'add-character-with-recycled-tile-accents-for-your-home',
      context: 'Consider textured options like '
    },
    {
      anchor: 'ambient smart lighting effects',
      target: 'transform-your-space-with-smart-lighting-remodels',
      context: 'Enhance wall treatments with '
    }
  ],
  'explore-sustainable-flooring-options-for-a-greener-home': [
    {
      anchor: 'eco-friendly home improvement strategies',
      target: 'zero-waste-home-fixes-easy-eco-friendly-home-improvements',
      context: 'Extend sustainability with '
    },
    {
      anchor: 'energy-efficient insulation solutions',
      target: 'simple-energy-saving-insulation-tips-to-save-money',
      context: 'Combine with '
    },
    {
      anchor: 'upcycled material projects',
      target: 'upcycled-pallet-projects-inspiring-ideas-for-home-and-garden',
      context: 'Complement sustainable floors with '
    }
  ],
  'indoor-outdoor-living-blends-creating-harmonious-spaces': [
    {
      anchor: 'backyard shed conversion ideas',
      target: 'backyard-shed-conversions-maximizing-outdoor-space',
      context: 'Extend your living space with '
    },
    {
      anchor: 'creative pallet furniture for patios',
      target: 'upcycled-pallet-projects-inspiring-ideas-for-home-and-garden',
      context: 'Furnish transitions with '
    },
    {
      anchor: 'natural plant integration techniques',
      target: 'transform-your-home-with-plant-integrated-interior-ideas',
      context: 'Bridge spaces using '
    }
  ],
  'multi-purpose-stair-storage-solutions-for-every-home': [
    {
      anchor: 'dual-function furniture innovations',
      target: 'dual-purpose-furniture-hacks-to-maximize-your-living-space',
      context: 'Maximize every space with '
    },
    {
      anchor: 'closet organization strategies',
      target: 'achieve-quick-closet-organization-with-simple-steps',
      context: 'Apply similar principles to '
    },
    {
      anchor: 'cabinet upcycling for storage',
      target: 'discover-inspiring-upcycled-cabinet-makeovers',
      context: 'Transform existing furniture with '
    }
  ],
  'noise-reducing-materials-top-choices-for-soundproofing': [
    {
      anchor: 'productive home office setups',
      target: 'easy-diy-floating-desk-installs-for-home-office',
      context: 'Create quiet workspaces for '
    },
    {
      anchor: 'smart home acoustic optimization',
      target: 'diy-smart-home-setups-easy-automation-ideas',
      context: 'Integrate soundproofing with '
    }
  ],
  'open-shelf-kitchen-hacks-maximizing-space-with-style': [
    {
      anchor: 'versatile room divider solutions',
      target: 'effective-tension-rod-room-dividers-for-home-organization',
      context: 'Define kitchen zones using '
    },
    {
      anchor: 'stairway storage innovations',
      target: 'multi-purpose-stair-storage-solutions-for-every-home',
      context: 'Extend storage beyond kitchens with '
    },
    {
      anchor: 'cabinet transformation techniques',
      target: 'discover-inspiring-upcycled-cabinet-makeovers',
      context: 'Refresh existing cabinets using '
    }
  ],
  'simple-elegance-minimalist-entryway-designs-for-inspiration': [
    {
      anchor: 'seasonal décor transitions',
      target: 'easy-seasonal-d-cor-transitions-for-a-fresh-look',
      context: 'Keep designs fresh with '
    },
    {
      anchor: 'accent wall design elements',
      target: 'creative-diy-accent-wall-treatments-for-your-home',
      context: 'Add subtle interest through '
    },
    {
      anchor: 'efficient closet systems',
      target: 'achieve-quick-closet-organization-with-simple-steps',
      context: 'Maintain minimalism with '
    }
  ],
  'simple-energy-saving-insulation-tips-to-save-money': [
    {
      anchor: 'sustainable home improvements',
      target: 'zero-waste-home-fixes-easy-eco-friendly-home-improvements',
      context: 'Combine insulation with '
    },
    {
      anchor: 'eco-conscious flooring choices',
      target: 'explore-sustainable-flooring-options-for-a-greener-home',
      context: 'Complement insulation with '
    },
    {
      anchor: 'smart home energy management',
      target: 'diy-smart-home-setups-easy-automation-ideas',
      context: 'Automate efficiency through '
    }
  ],
  'small-space-big-productivity-small-space-modular-desks': [
    {
      anchor: 'wall-mounted floating desk options',
      target: 'easy-diy-floating-desk-installs-for-home-office',
      context: 'Consider space-saving '
    },
    {
      anchor: 'multi-functional furniture solutions',
      target: 'dual-purpose-furniture-hacks-to-maximize-your-living-space',
      context: 'Expand functionality with '
    },
    {
      anchor: 'acoustic treatment for focus',
      target: 'noise-reducing-materials-top-choices-for-soundproofing',
      context: 'Enhance concentration using '
    }
  ],
  'transform-your-bathroom-with-budget-bathroom-upgrades': [
    {
      anchor: 'upcycled cabinet refinishing',
      target: 'discover-inspiring-upcycled-cabinet-makeovers',
      context: 'Save money with '
    },
    {
      anchor: 'sustainable tile accent ideas',
      target: 'add-character-with-recycled-tile-accents-for-your-home',
      context: 'Add character through '
    }
  ],
  'transform-your-home-with-plant-integrated-interior-ideas': [
    {
      anchor: 'harmonious indoor-outdoor transitions',
      target: 'indoor-outdoor-living-blends-creating-harmonious-spaces',
      context: 'Create natural flow with '
    },
    {
      anchor: 'minimalist design principles',
      target: 'simple-elegance-minimalist-entryway-designs-for-inspiration',
      context: 'Balance greenery using '
    },
    {
      anchor: 'seasonal decorating strategies',
      target: 'easy-seasonal-d-cor-transitions-for-a-fresh-look',
      context: 'Rotate plants following '
    }
  ],
  'transform-your-space-with-smart-lighting-remodels': [
    {
      anchor: 'comprehensive smart home integration',
      target: 'diy-smart-home-setups-easy-automation-ideas',
      context: 'Expand automation with '
    },
    {
      anchor: 'accent wall highlighting techniques',
      target: 'creative-diy-accent-wall-treatments-for-your-home',
      context: 'Illuminate features using '
    },
    {
      anchor: 'wallpaper and lighting combinations',
      target: 'explore-current-wallpaper-replacement-trends-and-designs',
      context: 'Complement designs with '
    }
  ],
  'upcycled-pallet-projects-inspiring-ideas-for-home-and-garden': [
    {
      anchor: 'outdoor shed furnishing solutions',
      target: 'backyard-shed-conversions-maximizing-outdoor-space',
      context: 'Perfect for '
    },
    {
      anchor: 'sustainable flooring companions',
      target: 'explore-sustainable-flooring-options-for-a-greener-home',
      context: 'Match eco-friendly themes with '
    },
    {
      anchor: 'zero-waste improvement philosophy',
      target: 'zero-waste-home-fixes-easy-eco-friendly-home-improvements',
      context: 'Embrace the '
    }
  ],
  'zero-waste-home-fixes-easy-eco-friendly-home-improvements': [
    {
      anchor: 'cabinet upcycling projects',
      target: 'discover-inspiring-upcycled-cabinet-makeovers',
      context: 'Start with '
    },
    {
      anchor: 'money-saving insulation upgrades',
      target: 'simple-energy-saving-insulation-tips-to-save-money',
      context: 'Reduce waste and costs through '
    },
    {
      anchor: 'reclaimed pallet creations',
      target: 'upcycled-pallet-projects-inspiring-ideas-for-home-and-garden',
      context: 'Repurpose materials with '
    }
  ]
};

// Add internal links to content
function addInternalLinks(articleSlug, body) {
  const links = internalLinksMapping[articleSlug];
  if (!links || links.length === 0) {
    return body;
  }
  
  let modifiedBody = body;
  let addedLinks = 0;
  
  for (const link of links) {
    // Find the anchor text in the content
    const searchText = link.anchor;
    const targetUrl = `/articles/${link.target}`;
    
    // Create the markdown link
    const markdownLink = `[${searchText}](${targetUrl})`;
    
    // Try to find and replace the text
    // First try to find it with the context
    if (link.context) {
      const contextPattern = new RegExp(
        `(${link.context.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
        'i'
      );
      
      if (contextPattern.test(modifiedBody)) {
        modifiedBody = modifiedBody.replace(contextPattern, `$1${markdownLink}`);
        addedLinks++;
        continue;
      }
    }
    
    // If context search failed, try direct replacement
    const directPattern = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (directPattern.test(modifiedBody)) {
      modifiedBody = modifiedBody.replace(directPattern, markdownLink);
      addedLinks++;
    } else {
      // If exact text not found, try to add it in a relevant paragraph
      // Look for good insertion points based on context keywords
      const paragraphs = modifiedBody.split('\n\n');
      let inserted = false;
      
      for (let i = 0; i < paragraphs.length; i++) {
        if (paragraphs[i].length > 100 && 
            !paragraphs[i].startsWith('#') && 
            !paragraphs[i].startsWith('!') &&
            !paragraphs[i].includes('](') && // No existing links
            i > 2 && i < paragraphs.length - 2) { // Not too early or late
          
          // Add link at the end of a suitable paragraph
          paragraphs[i] = paragraphs[i] + ` For related solutions, explore ${markdownLink}.`;
          inserted = true;
          addedLinks++;
          break;
        }
      }
      
      if (inserted) {
        modifiedBody = paragraphs.join('\n\n');
      }
    }
  }
  
  return { body: modifiedBody, linksAdded: addedLinks };
}

// Main function
async function processArticles() {
  log('🧹 Starting internal link cleanup and SEO optimization...', 'cyan');
  
  const articles = getArticles();
  let totalCleaned = 0;
  let totalLinksAdded = 0;
  
  for (const article of articles) {
    const data = readArticle(article.path);
    if (!data) {
      log(`⚠️  Skipping ${article.slug} - could not read file`, 'yellow');
      continue;
    }
    
    // Step 1: Clean existing links
    const cleanedBody = cleanInternalLinks(data.body);
    
    // Step 2: Add new SEO-optimized internal links
    const result = addInternalLinks(article.slug, cleanedBody);
    const finalBody = typeof result === 'string' ? result : result.body;
    const linksAdded = typeof result === 'object' ? result.linksAdded : 0;
    
    // Step 3: Reconstruct the full content
    const newContent = `---\n${data.frontmatter}\n---${finalBody}`;
    
    // Step 4: Write back to file
    fs.writeFileSync(article.path, newContent, 'utf8');
    
    if (linksAdded > 0) {
      log(`✅ ${article.slug}: Cleaned and added ${linksAdded} SEO links`, 'green');
      totalLinksAdded += linksAdded;
    } else {
      log(`📝 ${article.slug}: Cleaned existing links`, 'blue');
    }
    
    totalCleaned++;
  }
  
  log('\n📊 Summary:', 'cyan');
  log(`   Articles processed: ${totalCleaned}`, 'blue');
  log(`   Total SEO links added: ${totalLinksAdded}`, 'green');
  log('\n✨ Internal linking optimization complete!', 'green');
  log('\n💡 SEO Best Practices Applied:', 'yellow');
  log('   • Descriptive anchor text with article-specific keywords', 'blue');
  log('   • Natural contextual placement within content', 'blue');
  log('   • 1-3 relevant internal links per article', 'blue');
  log('   • Topic-related cross-linking for better site structure', 'blue');
}

// Run the script
processArticles().catch(console.error);