#!/usr/bin/env node

/**
 * Add SEO-optimized internal links to future articles
 * Following Backlinko's best practices:
 * - Future articles can link to published articles
 * - Published articles should NOT link to future articles
 * - Use descriptive, keyword-rich anchor text
 * - Add 1-3 contextual links per article
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../src/content/articles');

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

// Internal linking strategy for future articles
// Each future article links ONLY to already published articles
const futureArticleLinks = {
  'fit-tech-subscription-services-streamline-your-fitness-routine': [
    {
      anchor: 'comprehensive wearable fitness technology ecosystem',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      keywords: ['technology', 'devices', 'tracking', 'wearable']
    },
    {
      anchor: 'engagement-driven fitness app gamification',
      target: 'boost-engagement-with-fitness-app-gamification-techniques',
      keywords: ['app', 'subscription', 'digital', 'platform']
    },
    {
      anchor: 'top-rated mobile exercise applications',
      target: 'top-mobile-exercise-apps-for-a-healthy-lifestyle',
      keywords: ['mobile', 'app', 'digital', 'smartphone']
    }
  ],
  
  'fitness-for-immune-health-exercises-to-try-today': [
    {
      anchor: 'proven immune-boosting workout strategies',
      target: 'immune-boosting-workouts-enhance-your-health-and-fitness',
      keywords: ['immune', 'health', 'boost', 'wellness']
    },
    {
      anchor: 'holistic wellness and fitness integration',
      target: 'discover-the-power-of-wellness-plus-fitness-fusion',
      keywords: ['wellness', 'holistic', 'health', 'overall']
    },
    {
      anchor: 'outdoor seasonal training variations',
      target: 'effective-seasonal-outdoor-training-ideas-for-all-levels',
      keywords: ['outdoor', 'seasonal', 'fresh air', 'nature']
    }
  ],
  
  'functional-movement-drills-for-better-fitness': [
    {
      anchor: 'comprehensive core stabilization exercises',
      target: 'core-strengthening-routines-for-a-stronger-back-and-abs',
      keywords: ['functional', 'movement', 'core', 'stability']
    },
    {
      anchor: 'adaptive workout modifications for all levels',
      target: 'adaptive-workouts-for-chronic-issues-a-guide-to-better-fitness',
      keywords: ['adaptive', 'modification', 'accessible', 'all levels']
    },
    {
      anchor: 'flexibility enhancement through stretching',
      target: 'boost-flexibility-with-expert-stretching-tips-and-exercises',
      keywords: ['flexibility', 'mobility', 'range of motion', 'stretching']
    }
  ],
  
  'get-fit-with-virtual-group-fitness-classes-online-workouts': [
    {
      anchor: 'structured home gym tutorial programs',
      target: 'home-gym-online-tutorials-effective-workout-routines',
      keywords: ['online', 'virtual', 'home', 'tutorial']
    },
    {
      anchor: 'social media fitness challenge communities',
      target: 'get-fit-with-social-media-gym-challenges-tips-and-ideas',
      keywords: ['social', 'group', 'community', 'challenge']
    },
    {
      anchor: 'immersive VR-enhanced elliptical workouts',
      target: 'ellipticals-with-vr-features-top-picks-for-home-gyms',
      keywords: ['virtual', 'immersive', 'technology', 'VR']
    }
  ],
  
  'get-fit-with-fat-burning-hiit-workouts-at-home': [
    {
      anchor: 'time-efficient micro-workout strategies',
      target: 'boost-fitness-with-micro-workouts-for-busy-lives',
      keywords: ['HIIT', 'interval', 'short', 'intense']
    },
    {
      anchor: 'home-based workout routine systems',
      target: 'home-gym-online-tutorials-effective-workout-routines',
      keywords: ['home', 'at-home', 'no gym', 'convenient']
    },
    {
      anchor: 'metabolic conditioning through strength training',
      target: 'the-strength-training-renaissance-a-new-era-in-fitness',
      keywords: ['metabolic', 'strength', 'burn', 'conditioning']
    }
  ],
  
  'get-results-with-trackable-muscle-growth-programs': [
    {
      anchor: 'progressive strength training fundamentals',
      target: 'beginner-weightlifting-guide-start-your-fitness-journey',
      keywords: ['muscle', 'growth', 'progressive', 'strength']
    },
    {
      anchor: 'women-specific strength building methods',
      target: 'effective-strength-training-for-women-tips-and-exercises',
      keywords: ['strength', 'muscle', 'building', 'program']
    },
    {
      anchor: 'biofeedback monitoring for optimal gains',
      target: 'best-biofeedback-fitness-devices-for-fitness-enthusiasts',
      keywords: ['tracking', 'monitor', 'feedback', 'data']
    }
  ],
  
  'healthy-snack-alternatives-nutritious-options-inside': [
    {
      anchor: 'clean eating meal preparation strategies',
      target: 'clean-eating-meal-prep-hacks-for-a-healthier-you',
      keywords: ['nutrition', 'healthy', 'eating', 'food']
    },
    {
      anchor: 'wellness-centered nutritional approach',
      target: 'discover-the-power-of-wellness-plus-fitness-fusion',
      keywords: ['wellness', 'nutrition', 'health', 'holistic']
    },
    {
      anchor: 'immune-supporting nutritional fitness',
      target: 'immune-boosting-workouts-enhance-your-health-and-fitness',
      keywords: ['immune', 'nutrition', 'health', 'support']
    }
  ],
  
  'hybrid-gym-home-programs-train-anywhere-anytime': [
    {
      anchor: 'comprehensive home gym training systems',
      target: 'home-gym-online-tutorials-effective-workout-routines',
      keywords: ['home gym', 'hybrid', 'flexible', 'anywhere']
    },
    {
      anchor: 'smart resistance equipment integration',
      target: 'top-rated-resistance-equipment-with-screens-for-fitness',
      keywords: ['equipment', 'smart', 'gym', 'resistance']
    },
    {
      anchor: 'mobile fitness app synchronization',
      target: 'top-mobile-exercise-apps-for-a-healthy-lifestyle',
      keywords: ['mobile', 'app', 'sync', 'portable']
    }
  ],
  
  'kettlebell-circuit-training-for-strength-and-conditioning': [
    {
      anchor: 'foundational strength training principles',
      target: 'beginner-weightlifting-guide-start-your-fitness-journey',
      keywords: ['strength', 'weight', 'training', 'foundation']
    },
    {
      anchor: 'core power development exercises',
      target: 'core-strengthening-routines-for-a-stronger-back-and-abs',
      keywords: ['core', 'power', 'strength', 'conditioning']
    },
    {
      anchor: 'high-intensity micro-workout circuits',
      target: 'boost-fitness-with-micro-workouts-for-busy-lives',
      keywords: ['circuit', 'intensity', 'quick', 'efficient']
    }
  ],
  
  'maximize-results-with-effective-post-workout-nutrition': [
    {
      anchor: 'smart recovery technology protocols',
      target: 'smart-ice-bath-recovery-unlock-faster-healing',
      keywords: ['recovery', 'post-workout', 'healing', 'restoration']
    },
    {
      anchor: 'wearable recovery monitoring systems',
      target: 'discover-the-benefits-of-wearable-recovery-sensors',
      keywords: ['recovery', 'monitor', 'tracking', 'sensors']
    },
    {
      anchor: 'nutritional meal prep fundamentals',
      target: 'clean-eating-meal-prep-hacks-for-a-healthier-you',
      keywords: ['nutrition', 'meal', 'prep', 'eating']
    }
  ],
  
  'smart-equipment-integration-boosting-efficiency': [
    {
      anchor: 'interactive resistance training technology',
      target: 'top-rated-resistance-equipment-with-screens-for-fitness',
      keywords: ['smart', 'equipment', 'technology', 'interactive']
    },
    {
      anchor: 'VR-enhanced cardio equipment systems',
      target: 'ellipticals-with-vr-features-top-picks-for-home-gyms',
      keywords: ['VR', 'smart', 'equipment', 'technology']
    },
    {
      anchor: 'comprehensive wearable tech innovations',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      keywords: ['wearable', 'smart', 'tech', 'innovation']
    }
  ],
  
  'top-rated-group-fitness-leaderboard-apps-for-motivation': [
    {
      anchor: 'gamification-based motivation systems',
      target: 'boost-engagement-with-fitness-app-gamification-techniques',
      keywords: ['leaderboard', 'gamification', 'competition', 'motivation']
    },
    {
      anchor: 'social media fitness challenge platforms',
      target: 'get-fit-with-social-media-gym-challenges-tips-and-ideas',
      keywords: ['social', 'group', 'challenge', 'community']
    },
    {
      anchor: 'proven fitness motivation strategies',
      target: 'discover-proven-fitness-motivation-strategies-for-success',
      keywords: ['motivation', 'success', 'strategy', 'consistency']
    }
  ],
  
  'top-recovery-analytics-tools-for-data-driven-decisions': [
    {
      anchor: 'advanced biofeedback monitoring devices',
      target: 'best-biofeedback-fitness-devices-for-fitness-enthusiasts',
      keywords: ['analytics', 'data', 'biofeedback', 'monitoring']
    },
    {
      anchor: 'wearable recovery sensor technology',
      target: 'discover-the-benefits-of-wearable-recovery-sensors',
      keywords: ['recovery', 'sensor', 'data', 'analytics']
    },
    {
      anchor: 'smart ice bath recovery optimization',
      target: 'smart-ice-bath-recovery-unlock-faster-healing',
      keywords: ['recovery', 'smart', 'data-driven', 'optimization']
    }
  ],
  
  'unboxing-the-best-fitness-kit-unboxing-trends': [
    {
      anchor: 'cutting-edge wearable fitness technology',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      keywords: ['new', 'latest', 'gear', 'technology']
    },
    {
      anchor: 'smart resistance training equipment',
      target: 'top-rated-resistance-equipment-with-screens-for-fitness',
      keywords: ['equipment', 'gear', 'new', 'smart']
    },
    {
      anchor: 'innovative VR fitness equipment',
      target: 'ellipticals-with-vr-features-top-picks-for-home-gyms',
      keywords: ['innovative', 'VR', 'new', 'equipment']
    }
  ],
  
  'wearable-hydration-alerts-monitor-your-fluid-intake': [
    {
      anchor: 'comprehensive wearable sensor ecosystem',
      target: 'discover-the-benefits-of-wearable-recovery-sensors',
      keywords: ['wearable', 'sensor', 'monitor', 'tracking']
    },
    {
      anchor: 'advanced fitness tracking innovations',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      keywords: ['wearable', 'tracking', 'innovation', 'technology']
    },
    {
      anchor: 'biometric monitoring for peak performance',
      target: 'best-biofeedback-fitness-devices-for-fitness-enthusiasts',
      keywords: ['monitor', 'biometric', 'performance', 'tracking']
    }
  ]
};

function findBestPlacementForLink(content, link) {
  const lines = content.split('\n');
  let bestLineIndex = -1;
  let bestScore = 0;
  
  // Skip frontmatter
  let contentStartIndex = 0;
  let frontmatterCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '---') {
      frontmatterCount++;
      if (frontmatterCount === 2) {
        contentStartIndex = i + 1;
        break;
      }
    }
  }
  
  // Look for best placement based on keywords
  for (let i = contentStartIndex + 5; i < lines.length - 5; i++) {
    const line = lines[i].toLowerCase();
    
    // Skip if line already has a link
    if (line.includes('](')) continue;
    
    // Skip headers, empty lines, and special content
    if (line.startsWith('#') || line.trim() === '' || line.startsWith('!') || line.startsWith('|')) continue;
    
    // Calculate relevance score
    let score = 0;
    for (const keyword of link.keywords) {
      if (line.includes(keyword.toLowerCase())) {
        score += 10;
      }
    }
    
    // Prefer lines with action words
    const actionWords = ['learn', 'explore', 'discover', 'consider', 'try', 'check', 'see', 'improve', 'enhance', 'boost', 'optimize'];
    for (const word of actionWords) {
      if (line.includes(word)) score += 5;
    }
    
    // Prefer lines mentioning related concepts
    const concepts = ['training', 'workout', 'exercise', 'fitness', 'health', 'performance', 'recovery', 'nutrition'];
    for (const concept of concepts) {
      if (line.includes(concept)) score += 3;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestLineIndex = i;
    }
  }
  
  return { lineIndex: bestLineIndex, score: bestScore };
}

function addInternalLinksToArticle(articleSlug, content) {
  const links = futureArticleLinks[articleSlug];
  if (!links || links.length === 0) return { content, linksAdded: 0 };
  
  let modifiedContent = content;
  let linksAdded = 0;
  const usedLineIndices = new Set();
  
  // Try to add each link
  for (const link of links) {
    if (linksAdded >= 3) break; // Maximum 3 links per article
    
    const location = findBestPlacementForLink(modifiedContent, link);
    
    if (location.lineIndex === -1 || location.score < 5 || usedLineIndices.has(location.lineIndex)) {
      // Try to find a different suitable location
      const sections = modifiedContent.split(/\n## /);
      if (sections.length > 2) {
        const targetSectionIndex = Math.min(linksAdded + 1, sections.length - 1);
        const targetUrl = `/articles/${link.target}`;
        const linkMarkdown = `[${link.anchor}](${targetUrl})`;
        
        // Find a good paragraph in the section
        const sectionLines = sections[targetSectionIndex].split('\n');
        let inserted = false;
        
        for (let i = 2; i < sectionLines.length - 2; i++) {
          const line = sectionLines[i];
          if (line.trim() && !line.startsWith('#') && !line.includes('](') && !line.startsWith('|') && !line.startsWith('!')) {
            // Check if any keyword matches
            let matches = false;
            for (const keyword of link.keywords) {
              if (line.toLowerCase().includes(keyword.toLowerCase())) {
                matches = true;
                break;
              }
            }
            
            if (matches) {
              // Add link naturally at the end of the sentence
              const sentenceEnd = line.lastIndexOf('.');
              if (sentenceEnd > 0) {
                sectionLines[i] = line.substring(0, sentenceEnd) + `. For enhanced results, explore ${linkMarkdown}` + line.substring(sentenceEnd);
              } else {
                sectionLines[i] = line + ` Building on this foundation, consider ${linkMarkdown} for additional insights.`;
              }
              sections[targetSectionIndex] = sectionLines.join('\n');
              modifiedContent = sections.join('\n## ');
              linksAdded++;
              inserted = true;
              break;
            }
          }
        }
        
        // If still not inserted, add at a strategic point
        if (!inserted && targetSectionIndex > 0) {
          const insertPoint = Math.floor(sectionLines.length / 2);
          sectionLines.splice(insertPoint, 0, `\nTo maximize your results, explore ${linkMarkdown} for complementary techniques.\n`);
          sections[targetSectionIndex] = sectionLines.join('\n');
          modifiedContent = sections.join('\n## ');
          linksAdded++;
        }
      }
    } else {
      // Add link at the best location found
      const lines = modifiedContent.split('\n');
      const targetUrl = `/articles/${link.target}`;
      const linkMarkdown = `[${link.anchor}](${targetUrl})`;
      
      // Create a natural sentence with the link
      const originalLine = lines[location.lineIndex];
      let modifiedLine = originalLine;
      
      // Insert the link naturally
      const sentenceEnd = originalLine.lastIndexOf('.');
      if (sentenceEnd > 0) {
        // Add before the period
        modifiedLine = originalLine.substring(0, sentenceEnd) + `, while ${linkMarkdown} provides proven methodologies` + originalLine.substring(sentenceEnd);
      } else {
        // Add at the end
        modifiedLine = originalLine + ` For comprehensive guidance, check out ${linkMarkdown}.`;
      }
      
      lines[location.lineIndex] = modifiedLine;
      modifiedContent = lines.join('\n');
      usedLineIndices.add(location.lineIndex);
      linksAdded++;
    }
  }
  
  return { content: modifiedContent, linksAdded };
}

function processArticle(articleSlug) {
  const articlePath = path.join(ARTICLES_DIR, articleSlug, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    log(`  ⚠️  Article not found: ${articleSlug}`, 'yellow');
    return 0;
  }
  
  let content = fs.readFileSync(articlePath, 'utf8');
  
  // Check if article already has internal links
  const bodyContent = content.split('---').slice(2).join('---');
  const existingLinks = (bodyContent.match(/\]\(\/articles\//g) || []).length;
  
  if (existingLinks >= 3) {
    log(`  ℹ️  Already has ${existingLinks} internal links`, 'blue');
    return 0;
  }
  
  // Add internal links
  const result = addInternalLinksToArticle(articleSlug, content);
  
  if (result.linksAdded === 0) {
    log(`  ⚠️  Could not add links`, 'yellow');
    return 0;
  }
  
  // Create backup
  const backupPath = `${articlePath}.backup.${Date.now()}`;
  fs.copyFileSync(articlePath, backupPath);
  
  // Write updated content
  fs.writeFileSync(articlePath, result.content);
  
  log(`  ✅ Added ${result.linksAdded} internal links`, 'green');
  return result.linksAdded;
}

// Main execution
function main() {
  log('🔗 Adding SEO-Optimized Internal Links to Future Articles', 'cyan');
  log('📅 Future articles link to published articles only', 'blue');
  log('🎯 Following Backlinko best practices for SEO\n', 'yellow');
  
  const futureArticles = Object.keys(futureArticleLinks);
  let totalLinksAdded = 0;
  let articlesModified = 0;
  
  log(`Processing ${futureArticles.length} future articles...\n`, 'cyan');
  
  for (const articleSlug of futureArticles) {
    log(`📝 Processing: ${articleSlug}`, 'cyan');
    const linksAdded = processArticle(articleSlug);
    if (linksAdded > 0) {
      totalLinksAdded += linksAdded;
      articlesModified++;
    }
  }
  
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Summary:', 'green');
  log(`  📄 Future articles processed: ${futureArticles.length}`, 'blue');
  log(`  ✏️  Articles modified: ${articlesModified}`, 'green');
  log(`  🔗 Total internal links added: ${totalLinksAdded}`, 'green');
  log('\n✨ Future article internal linking complete!', 'green');
  log('💡 All links point from future → published articles only', 'yellow');
  log('🚀 Run npm run build to verify the changes', 'cyan');
}

main();