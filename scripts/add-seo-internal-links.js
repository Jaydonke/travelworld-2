#!/usr/bin/env node

/**
 * Add SEO-optimized internal links to fitness articles
 * Based on Backlinko's internal linking best practices:
 * - Use descriptive anchor text
 * - Link to relevant, related content
 * - Add 1-3 internal links per article
 * - Place links contextually within the content
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

// SEO-optimized internal linking map
const internalLinks = {
  'beginner-weightlifting-guide-start-your-fitness-journey': [
    {
      anchor: 'specialized strength training approaches for women',
      target: 'effective-strength-training-for-women-tips-and-exercises',
      keyword: ['women', 'female', 'specialized']
    },
    {
      anchor: 'comprehensive core strengthening exercises',
      target: 'core-strengthening-routines-for-a-stronger-back-and-abs',
      keyword: ['core', 'trunk', 'stability', 'midline']
    },
    {
      anchor: 'smart resistance training equipment',
      target: 'top-rated-resistance-equipment-with-screens-for-fitness',
      keyword: ['equipment', 'gear', 'tools', 'machines']
    }
  ],
  
  'effective-strength-training-for-women-tips-and-exercises': [
    {
      anchor: 'foundational weightlifting techniques',
      target: 'beginner-weightlifting-guide-start-your-fitness-journey',
      keyword: ['beginner', 'start', 'foundation', 'basic']
    },
    {
      anchor: 'modern strength training renaissance',
      target: 'the-strength-training-renaissance-a-new-era-in-fitness',
      keyword: ['evolution', 'modern', 'trend', 'new era']
    },
    {
      anchor: 'flexibility and mobility training',
      target: 'boost-flexibility-with-expert-stretching-tips-and-exercises',
      keyword: ['flexibility', 'mobility', 'stretch', 'range']
    }
  ],
  
  'core-strengthening-routines-for-a-stronger-back-and-abs': [
    {
      anchor: 'complete strength training program',
      target: 'the-strength-training-renaissance-a-new-era-in-fitness',
      keyword: ['program', 'complete', 'comprehensive']
    },
    {
      anchor: 'yoga-based core stability practices',
      target: 'find-inner-peace-with-yoga-for-mental-calm-practices',
      keyword: ['yoga', 'balance', 'mindful']
    }
  ],
  
  'the-strength-training-renaissance-a-new-era-in-fitness': [
    {
      anchor: 'interactive resistance equipment technology',
      target: 'top-rated-resistance-equipment-with-screens-for-fitness',
      keyword: ['technology', 'smart', 'digital', 'interactive']
    },
    {
      anchor: 'science-backed motivation strategies',
      target: 'discover-proven-fitness-motivation-strategies-for-success',
      keyword: ['motivation', 'commitment', 'consistency']
    }
  ],
  
  'top-rated-resistance-equipment-with-screens-for-fitness': [
    {
      anchor: 'immersive VR cardio equipment',
      target: 'ellipticals-with-vr-features-top-picks-for-home-gyms',
      keyword: ['VR', 'virtual', 'cardio', 'elliptical']
    },
    {
      anchor: 'structured home workout programs',
      target: 'home-gym-online-tutorials-effective-workout-routines',
      keyword: ['home', 'program', 'routine']
    }
  ],
  
  'boost-fitness-with-micro-workouts-for-busy-lives': [
    {
      anchor: 'comprehensive home training programs',
      target: 'home-gym-online-tutorials-effective-workout-routines',
      keyword: ['program', 'structured', 'plan']
    },
    {
      anchor: 'gamified fitness applications',
      target: 'boost-engagement-with-fitness-app-gamification-techniques',
      keyword: ['app', 'mobile', 'digital', 'gamif']
    }
  ],
  
  'ellipticals-with-vr-features-top-picks-for-home-gyms': [
    {
      anchor: 'advanced resistance training systems',
      target: 'top-rated-resistance-equipment-with-screens-for-fitness',
      keyword: ['resistance', 'strength', 'weight']
    },
    {
      anchor: 'wearable fitness tracking technology',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      keyword: ['wearable', 'track', 'monitor']
    }
  ],
  
  'home-gym-online-tutorials-effective-workout-routines': [
    {
      anchor: 'time-efficient micro-workout methods',
      target: 'boost-fitness-with-micro-workouts-for-busy-lives',
      keyword: ['quick', 'short', 'micro', 'time']
    },
    {
      anchor: 'mobile fitness applications',
      target: 'top-mobile-exercise-apps-for-a-healthy-lifestyle',
      keyword: ['app', 'mobile', 'phone']
    },
    {
      anchor: 'VR-enhanced cardio equipment',
      target: 'ellipticals-with-vr-features-top-picks-for-home-gyms',
      keyword: ['VR', 'virtual', 'interactive']
    }
  ],
  
  'immune-boosting-workouts-enhance-your-health-and-fitness': [
    {
      anchor: 'holistic wellness and fitness integration',
      target: 'discover-the-power-of-wellness-plus-fitness-fusion',
      keyword: ['wellness', 'holistic', 'overall']
    },
    {
      anchor: 'seasonal outdoor training strategies',
      target: 'effective-seasonal-outdoor-training-ideas-for-all-levels',
      keyword: ['outdoor', 'seasonal', 'outside']
    }
  ],
  
  'boost-flexibility-with-expert-stretching-tips-and-exercises': [
    {
      anchor: 'mindful yoga practices',
      target: 'find-inner-peace-with-yoga-for-mental-calm-practices',
      keyword: ['yoga', 'mindful', 'practice']
    },
    {
      anchor: 'advanced recovery technologies',
      target: 'smart-ice-bath-recovery-unlock-faster-healing',
      keyword: ['recovery', 'healing', 'restoration']
    }
  ],
  
  'smart-ice-bath-recovery-unlock-faster-healing': [
    {
      anchor: 'wearable recovery monitoring sensors',
      target: 'discover-the-benefits-of-wearable-recovery-sensors',
      keyword: ['sensor', 'monitor', 'track', 'wearable']
    },
    {
      anchor: 'biofeedback monitoring devices',
      target: 'best-biofeedback-fitness-devices-for-fitness-enthusiasts',
      keyword: ['biofeedback', 'monitor', 'data']
    }
  ],
  
  'best-biofeedback-fitness-devices-for-fitness-enthusiasts': [
    {
      anchor: 'specialized recovery sensor technology',
      target: 'discover-the-benefits-of-wearable-recovery-sensors',
      keyword: ['recovery', 'sensor', 'specialized']
    },
    {
      anchor: 'cutting-edge wearable innovations',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      keyword: ['innovation', 'cutting-edge', 'latest', 'new']
    }
  ],
  
  'discover-the-benefits-of-wearable-recovery-sensors': [
    {
      anchor: 'comprehensive biofeedback systems',
      target: 'best-biofeedback-fitness-devices-for-fitness-enthusiasts',
      keyword: ['biofeedback', 'comprehensive', 'system']
    },
    {
      anchor: 'smart recovery protocols',
      target: 'smart-ice-bath-recovery-unlock-faster-healing',
      keyword: ['ice bath', 'cold', 'recovery protocol']
    }
  ],
  
  'top-mobile-exercise-apps-for-a-healthy-lifestyle': [
    {
      anchor: 'engagement-boosting gamification features',
      target: 'boost-engagement-with-fitness-app-gamification-techniques',
      keyword: ['gamif', 'engagement', 'motivat']
    },
    {
      anchor: 'wearable device integration',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      keyword: ['wearable', 'device', 'sync', 'integrat']
    }
  ],
  
  'wearable-fitness-tech-innovations-and-top-picks': [
    {
      anchor: 'recovery-focused sensor technology',
      target: 'discover-the-benefits-of-wearable-recovery-sensors',
      keyword: ['recovery', 'sensor', 'monitor']
    },
    {
      anchor: 'advanced biofeedback monitoring',
      target: 'best-biofeedback-fitness-devices-for-fitness-enthusiasts',
      keyword: ['biofeedback', 'advanced', 'data']
    },
    {
      anchor: 'fitness tracking applications',
      target: 'top-mobile-exercise-apps-for-a-healthy-lifestyle',
      keyword: ['app', 'application', 'mobile']
    }
  ],
  
  'discover-proven-fitness-motivation-strategies-for-success': [
    {
      anchor: 'gamification-based motivation techniques',
      target: 'boost-engagement-with-fitness-app-gamification-techniques',
      keyword: ['gamif', 'reward', 'achievement']
    },
    {
      anchor: 'social fitness challenges',
      target: 'get-fit-with-social-media-gym-challenges-tips-and-ideas',
      keyword: ['social', 'challenge', 'community']
    }
  ],
  
  'discover-the-power-of-wellness-plus-fitness-fusion': [
    {
      anchor: 'mindfulness through yoga practice',
      target: 'find-inner-peace-with-yoga-for-mental-calm-practices',
      keyword: ['yoga', 'mindful', 'mental']
    },
    {
      anchor: 'immune-strengthening workouts',
      target: 'immune-boosting-workouts-enhance-your-health-and-fitness',
      keyword: ['immune', 'health', 'boost']
    }
  ],
  
  'find-inner-peace-with-yoga-for-mental-calm-practices': [
    {
      anchor: 'flexibility enhancement techniques',
      target: 'boost-flexibility-with-expert-stretching-tips-and-exercises',
      keyword: ['flexibility', 'stretch', 'mobile']
    },
    {
      anchor: 'core stability training',
      target: 'core-strengthening-routines-for-a-stronger-back-and-abs',
      keyword: ['core', 'stability', 'strength']
    }
  ],
  
  'boost-engagement-with-fitness-app-gamification-techniques': [
    {
      anchor: 'social media fitness communities',
      target: 'get-fit-with-social-media-gym-challenges-tips-and-ideas',
      keyword: ['social', 'community', 'share']
    },
    {
      anchor: 'top-rated fitness applications',
      target: 'top-mobile-exercise-apps-for-a-healthy-lifestyle',
      keyword: ['app', 'top', 'best', 'rated']
    }
  ],
  
  'get-fit-with-social-media-gym-challenges-tips-and-ideas': [
    {
      anchor: 'app-based fitness gamification',
      target: 'boost-engagement-with-fitness-app-gamification-techniques',
      keyword: ['app', 'gamif', 'digital']
    },
    {
      anchor: 'proven motivation techniques',
      target: 'discover-proven-fitness-motivation-strategies-for-success',
      keyword: ['motivation', 'proven', 'strategy']
    },
    {
      anchor: 'quick micro-workout challenges',
      target: 'boost-fitness-with-micro-workouts-for-busy-lives',
      keyword: ['micro', 'quick', 'short', 'busy']
    }
  ],
  
  'effective-seasonal-outdoor-training-ideas-for-all-levels': [
    {
      anchor: 'sport-specific performance technology',
      target: 'unlock-peak-performance-with-football-performance-tech',
      keyword: ['sport', 'performance', 'athletic']
    },
    {
      anchor: 'adaptive training modifications',
      target: 'adaptive-workouts-for-chronic-issues-a-guide-to-better-fitness',
      keyword: ['adapt', 'modif', 'adjust']
    }
  ],
  
  'unlock-peak-performance-with-football-performance-tech': [
    {
      anchor: 'performance tracking wearables',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      keyword: ['wearable', 'track', 'monitor']
    },
    {
      anchor: 'recovery optimization protocols',
      target: 'smart-ice-bath-recovery-unlock-faster-healing',
      keyword: ['recovery', 'optimize', 'protocol']
    }
  ],
  
  'adaptive-workouts-for-chronic-issues-a-guide-to-better-fitness': [
    {
      anchor: 'senior fitness programs',
      target: 'older-adult-exercise-programs-stay-active-and-healthy',
      keyword: ['senior', 'older', 'age']
    },
    {
      anchor: 'gentle flexibility exercises',
      target: 'boost-flexibility-with-expert-stretching-tips-and-exercises',
      keyword: ['gentle', 'flexibility', 'easy']
    },
    {
      anchor: 'therapeutic yoga practices',
      target: 'find-inner-peace-with-yoga-for-mental-calm-practices',
      keyword: ['therapeutic', 'yoga', 'healing']
    }
  ],
  
  'older-adult-exercise-programs-stay-active-and-healthy': [
    {
      anchor: 'adaptive fitness modifications',
      target: 'adaptive-workouts-for-chronic-issues-a-guide-to-better-fitness',
      keyword: ['adapt', 'modif', 'adjust']
    },
    {
      anchor: 'gentle mobility exercises',
      target: 'boost-flexibility-with-expert-stretching-tips-and-exercises',
      keyword: ['mobility', 'gentle', 'flexibility']
    }
  ],
  
  'clean-eating-meal-prep-hacks-for-a-healthier-you': [
    {
      anchor: 'wellness-focused fitness approach',
      target: 'discover-the-power-of-wellness-plus-fitness-fusion',
      keyword: ['wellness', 'holistic', 'health']
    },
    {
      anchor: 'immune-supporting exercise routines',
      target: 'immune-boosting-workouts-enhance-your-health-and-fitness',
      keyword: ['immune', 'health', 'support']
    }
  ]
};

function findBestLocationForLink(content, link) {
  const lines = content.split('\n');
  let bestLineIndex = -1;
  let bestScore = 0;
  
  // Skip frontmatter
  let contentStartIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '---' && i > 0) {
      contentStartIndex = i + 1;
      break;
    }
  }
  
  // Look for best placement based on keywords
  for (let i = contentStartIndex; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Skip if line already has a link
    if (line.includes('](')) continue;
    
    // Skip headers and empty lines
    if (line.startsWith('#') || line.trim() === '') continue;
    
    // Calculate relevance score
    let score = 0;
    for (const keyword of link.keyword) {
      if (line.includes(keyword.toLowerCase())) {
        score += 10;
      }
    }
    
    // Prefer lines with certain patterns
    if (line.includes('learn') || line.includes('explore') || line.includes('discover')) score += 5;
    if (line.includes('also') || line.includes('additionally') || line.includes('furthermore')) score += 5;
    if (line.includes('improve') || line.includes('enhance') || line.includes('boost')) score += 5;
    
    if (score > bestScore) {
      bestScore = score;
      bestLineIndex = i;
    }
  }
  
  return { lineIndex: bestLineIndex, score: bestScore };
}

function addInternalLinksToArticle(articleSlug, content) {
  const links = internalLinks[articleSlug];
  if (!links || links.length === 0) return { content, linksAdded: 0 };
  
  let modifiedContent = content;
  let linksAdded = 0;
  const usedLineIndices = new Set();
  
  // Try to add each link
  for (const link of links) {
    if (linksAdded >= 3) break; // Maximum 3 links per article
    
    const location = findBestLocationForLink(modifiedContent, link);
    
    if (location.lineIndex === -1 || usedLineIndices.has(location.lineIndex)) {
      // If no good location found, try to add in a general location
      const sections = modifiedContent.split(/\n## /);
      if (sections.length > 2 && linksAdded < sections.length - 1) {
        const sectionIndex = Math.min(linksAdded + 1, sections.length - 2);
        const targetUrl = `/articles/${link.target}`;
        const linkMarkdown = `[${link.anchor}](${targetUrl})`;
        
        // Add at the end of the section
        const sectionLines = sections[sectionIndex].split('\n');
        const insertIndex = sectionLines.findIndex(line => line.trim() === '' && sectionLines[sectionLines.indexOf(line) - 1]?.trim() !== '');
        
        if (insertIndex > 0) {
          sectionLines.splice(insertIndex, 0, `For enhanced results, explore ${linkMarkdown} to complement your training approach.`);
          sections[sectionIndex] = sectionLines.join('\n');
          modifiedContent = sections.join('\n## ');
          linksAdded++;
        }
      }
    } else {
      // Add link at the best location
      const lines = modifiedContent.split('\n');
      const targetUrl = `/articles/${link.target}`;
      const linkMarkdown = `[${link.anchor}](${targetUrl})`;
      
      // Create a natural sentence with the link
      const originalLine = lines[location.lineIndex];
      let modifiedLine = originalLine;
      
      // Try to insert the link naturally in the sentence
      const sentenceEnd = originalLine.lastIndexOf('.');
      if (sentenceEnd > 0) {
        modifiedLine = originalLine.substring(0, sentenceEnd) + `, and consider exploring ${linkMarkdown} for additional techniques` + originalLine.substring(sentenceEnd);
      } else {
        modifiedLine = originalLine + ` For more insights, check out ${linkMarkdown}.`;
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
  
  // Remove any links that were mistakenly added to the description
  content = content.replace(/description: "([^"]+)"/g, (match, desc) => {
    const cleanDesc = desc.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    return `description: "${cleanDesc}"`;
  });
  
  // Check if article already has internal links in the body
  const bodyContent = content.split('---')[2] || '';
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
  log('🔗 Adding SEO-Optimized Internal Links', 'cyan');
  log('📂 Following Backlinko Best Practices', 'blue');
  log('🎯 Using descriptive anchor text for better SEO\n', 'yellow');
  
  const articles = Object.keys(internalLinks);
  let totalLinksAdded = 0;
  let articlesModified = 0;
  
  for (const articleSlug of articles) {
    log(`📝 Processing: ${articleSlug}`, 'cyan');
    const linksAdded = processArticle(articleSlug);
    if (linksAdded > 0) {
      totalLinksAdded += linksAdded;
      articlesModified++;
    }
  }
  
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Summary:', 'green');
  log(`  📄 Articles processed: ${articles.length}`, 'blue');
  log(`  ✏️  Articles modified: ${articlesModified}`, 'green');
  log(`  🔗 Total internal links added: ${totalLinksAdded}`, 'green');
  log('\n✨ SEO-optimized internal linking complete!', 'green');
  log('💡 Links use descriptive anchor text for maximum SEO value', 'yellow');
  log('🚀 Run npm run build to see the changes', 'cyan');
}

main();