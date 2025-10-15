#!/usr/bin/env node

/**
 * Create SEO-optimized internal links for fitness articles
 * Based on Backlinko's internal linking best practices
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

// Define internal linking strategy based on content relationships
const internalLinkStrategy = {
  // Strength Training Articles
  'beginner-weightlifting-guide-start-your-fitness-journey': [
    {
      text: 'progressive strength training techniques',
      target: 'effective-strength-training-for-women-tips-and-exercises',
      context: 'For more specialized approaches, explore'
    },
    {
      text: 'core strengthening routines for stability',
      target: 'core-strengthening-routines-for-a-stronger-back-and-abs',
      context: 'Complement your weightlifting with'
    },
    {
      text: 'home gym equipment with smart features',
      target: 'top-rated-resistance-equipment-with-screens-for-fitness',
      context: 'Consider upgrading to'
    }
  ],
  
  'effective-strength-training-for-women-tips-and-exercises': [
    {
      text: 'beginner-friendly weightlifting fundamentals',
      target: 'beginner-weightlifting-guide-start-your-fitness-journey',
      context: 'New to strength training? Start with'
    },
    {
      text: 'strength training renaissance movement',
      target: 'the-strength-training-renaissance-a-new-era-in-fitness',
      context: 'Learn about the broader'
    },
    {
      text: 'flexibility training for better performance',
      target: 'boost-flexibility-with-expert-stretching-tips-and-exercises',
      context: 'Balance your strength work with'
    }
  ],
  
  'core-strengthening-routines-for-a-stronger-back-and-abs': [
    {
      text: 'comprehensive strength training program',
      target: 'the-strength-training-renaissance-a-new-era-in-fitness',
      context: 'Integrate core work into a'
    },
    {
      text: 'yoga practices for core stability',
      target: 'find-inner-peace-with-yoga-for-mental-calm-practices',
      context: 'Complement your core training with'
    },
    {
      text: 'home workout strategies',
      target: 'home-gym-online-tutorials-effective-workout-routines',
      context: 'Apply these exercises in your'
    }
  ],
  
  'the-strength-training-renaissance-a-new-era-in-fitness': [
    {
      text: 'smart resistance equipment innovations',
      target: 'top-rated-resistance-equipment-with-screens-for-fitness',
      context: 'Experience the renaissance with'
    },
    {
      text: 'women-specific strength training methods',
      target: 'effective-strength-training-for-women-tips-and-exercises',
      context: 'Discover specialized approaches like'
    },
    {
      text: 'evidence-based fitness motivation strategies',
      target: 'discover-proven-fitness-motivation-strategies-for-success',
      context: 'Stay committed with'
    }
  ],
  
  'top-rated-resistance-equipment-with-screens-for-fitness': [
    {
      text: 'VR-enhanced cardio equipment',
      target: 'ellipticals-with-vr-features-top-picks-for-home-gyms',
      context: 'Expand your smart gym with'
    },
    {
      text: 'comprehensive home gym tutorials',
      target: 'home-gym-online-tutorials-effective-workout-routines',
      context: 'Maximize your equipment with'
    },
    {
      text: 'beginner weightlifting fundamentals',
      target: 'beginner-weightlifting-guide-start-your-fitness-journey',
      context: 'New to resistance training? Master'
    }
  ],
  
  // Home Workout Articles
  'boost-fitness-with-micro-workouts-for-busy-lives': [
    {
      text: 'complete home workout programs',
      target: 'home-gym-online-tutorials-effective-workout-routines',
      context: 'Expand your micro-workouts into'
    },
    {
      text: 'immune-boosting exercise routines',
      target: 'immune-boosting-workouts-enhance-your-health-and-fitness',
      context: 'Enhance your health further with'
    },
    {
      text: 'fitness app gamification techniques',
      target: 'boost-engagement-with-fitness-app-gamification-techniques',
      context: 'Stay motivated using'
    }
  ],
  
  'ellipticals-with-vr-features-top-picks-for-home-gyms': [
    {
      text: 'smart resistance training equipment',
      target: 'top-rated-resistance-equipment-with-screens-for-fitness',
      context: 'Complete your smart home gym with'
    },
    {
      text: 'home gym tutorial resources',
      target: 'home-gym-online-tutorials-effective-workout-routines',
      context: 'Learn to maximize your equipment through'
    },
    {
      text: 'wearable fitness technology',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      context: 'Track your VR workouts with'
    }
  ],
  
  'home-gym-online-tutorials-effective-workout-routines': [
    {
      text: 'time-efficient micro-workout strategies',
      target: 'boost-fitness-with-micro-workouts-for-busy-lives',
      context: 'Short on time? Try'
    },
    {
      text: 'VR-equipped elliptical machines',
      target: 'ellipticals-with-vr-features-top-picks-for-home-gyms',
      context: 'Enhance your home gym with'
    },
    {
      text: 'mobile workout applications',
      target: 'top-mobile-exercise-apps-for-a-healthy-lifestyle',
      context: 'Supplement your routines with'
    }
  ],
  
  'immune-boosting-workouts-enhance-your-health-and-fitness': [
    {
      text: 'wellness and fitness fusion approach',
      target: 'discover-the-power-of-wellness-plus-fitness-fusion',
      context: 'Explore a holistic'
    },
    {
      text: 'micro-workout techniques for busy schedules',
      target: 'boost-fitness-with-micro-workouts-for-busy-lives',
      context: 'Maintain consistency with'
    },
    {
      text: 'seasonal outdoor training variations',
      target: 'effective-seasonal-outdoor-training-ideas-for-all-levels',
      context: 'Boost immunity through'
    }
  ],
  
  // Recovery & Flexibility Articles
  'boost-flexibility-with-expert-stretching-tips-and-exercises': [
    {
      text: 'yoga for mental clarity and flexibility',
      target: 'find-inner-peace-with-yoga-for-mental-calm-practices',
      context: 'Deepen your practice with'
    },
    {
      text: 'advanced recovery technology',
      target: 'smart-ice-bath-recovery-unlock-faster-healing',
      context: 'Enhance recovery with'
    },
    {
      text: 'strength training for women',
      target: 'effective-strength-training-for-women-tips-and-exercises',
      context: 'Balance flexibility with'
    }
  ],
  
  'smart-ice-bath-recovery-unlock-faster-healing': [
    {
      text: 'wearable recovery monitoring devices',
      target: 'discover-the-benefits-of-wearable-recovery-sensors',
      context: 'Track your recovery with'
    },
    {
      text: 'flexibility enhancement techniques',
      target: 'boost-flexibility-with-expert-stretching-tips-and-exercises',
      context: 'Complement cold therapy with'
    },
    {
      text: 'biofeedback fitness devices',
      target: 'best-biofeedback-fitness-devices-for-fitness-enthusiasts',
      context: 'Monitor your recovery using'
    }
  ],
  
  // Fitness Technology Articles
  'best-biofeedback-fitness-devices-for-fitness-enthusiasts': [
    {
      text: 'wearable recovery sensor technology',
      target: 'discover-the-benefits-of-wearable-recovery-sensors',
      context: 'Explore specialized'
    },
    {
      text: 'comprehensive wearable fitness innovations',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      context: 'Discover the latest in'
    },
    {
      text: 'smart ice bath recovery systems',
      target: 'smart-ice-bath-recovery-unlock-faster-healing',
      context: 'Optimize recovery with'
    }
  ],
  
  'discover-the-benefits-of-wearable-recovery-sensors': [
    {
      text: 'biofeedback training devices',
      target: 'best-biofeedback-fitness-devices-for-fitness-enthusiasts',
      context: 'Enhance your monitoring with'
    },
    {
      text: 'cutting-edge wearable fitness technology',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      context: 'Stay updated with'
    },
    {
      text: 'smart recovery solutions',
      target: 'smart-ice-bath-recovery-unlock-faster-healing',
      context: 'Combine sensors with'
    }
  ],
  
  'top-mobile-exercise-apps-for-a-healthy-lifestyle': [
    {
      text: 'gamification strategies for fitness apps',
      target: 'boost-engagement-with-fitness-app-gamification-techniques',
      context: 'Maximize app engagement through'
    },
    {
      text: 'home workout video tutorials',
      target: 'home-gym-online-tutorials-effective-workout-routines',
      context: 'Complement apps with'
    },
    {
      text: 'wearable device integration',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      context: 'Sync your apps with'
    }
  ],
  
  'wearable-fitness-tech-innovations-and-top-picks': [
    {
      text: 'specialized recovery sensors',
      target: 'discover-the-benefits-of-wearable-recovery-sensors',
      context: 'Focus on recovery with'
    },
    {
      text: 'biofeedback monitoring systems',
      target: 'best-biofeedback-fitness-devices-for-fitness-enthusiasts',
      context: 'Advanced monitoring through'
    },
    {
      text: 'mobile fitness applications',
      target: 'top-mobile-exercise-apps-for-a-healthy-lifestyle',
      context: 'Pair your wearables with'
    }
  ],
  
  // Mental Fitness & Motivation
  'discover-proven-fitness-motivation-strategies-for-success': [
    {
      text: 'gamified fitness challenges',
      target: 'boost-engagement-with-fitness-app-gamification-techniques',
      context: 'Boost motivation through'
    },
    {
      text: 'social media gym challenges',
      target: 'get-fit-with-social-media-gym-challenges-tips-and-ideas',
      context: 'Stay accountable with'
    },
    {
      text: 'holistic wellness and fitness integration',
      target: 'discover-the-power-of-wellness-plus-fitness-fusion',
      context: 'Enhance motivation through'
    }
  ],
  
  'discover-the-power-of-wellness-plus-fitness-fusion': [
    {
      text: 'yoga for mental wellness',
      target: 'find-inner-peace-with-yoga-for-mental-calm-practices',
      context: 'Deepen your practice with'
    },
    {
      text: 'proven motivation techniques',
      target: 'discover-proven-fitness-motivation-strategies-for-success',
      context: 'Stay committed using'
    },
    {
      text: 'immune-enhancing workout routines',
      target: 'immune-boosting-workouts-enhance-your-health-and-fitness',
      context: 'Support overall health with'
    }
  ],
  
  'find-inner-peace-with-yoga-for-mental-calm-practices': [
    {
      text: 'flexibility training fundamentals',
      target: 'boost-flexibility-with-expert-stretching-tips-and-exercises',
      context: 'Enhance your yoga practice with'
    },
    {
      text: 'core strengthening for yoga practitioners',
      target: 'core-strengthening-routines-for-a-stronger-back-and-abs',
      context: 'Build a strong foundation with'
    },
    {
      text: 'wellness-fitness integration strategies',
      target: 'discover-the-power-of-wellness-plus-fitness-fusion',
      context: 'Explore comprehensive'
    }
  ],
  
  // Fitness Trends
  'boost-engagement-with-fitness-app-gamification-techniques': [
    {
      text: 'social media fitness challenges',
      target: 'get-fit-with-social-media-gym-challenges-tips-and-ideas',
      context: 'Extend gamification to'
    },
    {
      text: 'mobile exercise app recommendations',
      target: 'top-mobile-exercise-apps-for-a-healthy-lifestyle',
      context: 'Discover top-rated apps in our'
    },
    {
      text: 'motivation strategies for long-term success',
      target: 'discover-proven-fitness-motivation-strategies-for-success',
      context: 'Sustain engagement with'
    }
  ],
  
  'get-fit-with-social-media-gym-challenges-tips-and-ideas': [
    {
      text: 'app-based gamification techniques',
      target: 'boost-engagement-with-fitness-app-gamification-techniques',
      context: 'Enhance your challenges with'
    },
    {
      text: 'fitness motivation strategies',
      target: 'discover-proven-fitness-motivation-strategies-for-success',
      context: 'Stay committed using proven'
    },
    {
      text: 'micro-workout challenges for busy people',
      target: 'boost-fitness-with-micro-workouts-for-busy-lives',
      context: 'Perfect for social sharing:'
    }
  ],
  
  // Sports Performance
  'effective-seasonal-outdoor-training-ideas-for-all-levels': [
    {
      text: 'sport-specific performance technology',
      target: 'unlock-peak-performance-with-football-performance-tech',
      context: 'Enhance outdoor training with'
    },
    {
      text: 'immune-boosting outdoor workouts',
      target: 'immune-boosting-workouts-enhance-your-health-and-fitness',
      context: 'Maximize health benefits with'
    },
    {
      text: 'adaptable training for various fitness levels',
      target: 'adaptive-workouts-for-chronic-issues-a-guide-to-better-fitness',
      context: 'Modify your approach with'
    }
  ],
  
  'unlock-peak-performance-with-football-performance-tech': [
    {
      text: 'wearable performance tracking devices',
      target: 'wearable-fitness-tech-innovations-and-top-picks',
      context: 'Monitor your progress with'
    },
    {
      text: 'seasonal training periodization',
      target: 'effective-seasonal-outdoor-training-ideas-for-all-levels',
      context: 'Optimize performance through'
    },
    {
      text: 'advanced recovery protocols',
      target: 'smart-ice-bath-recovery-unlock-faster-healing',
      context: 'Accelerate recovery using'
    }
  ],
  
  // Specialized Training
  'adaptive-workouts-for-chronic-issues-a-guide-to-better-fitness': [
    {
      text: 'senior-specific exercise programs',
      target: 'older-adult-exercise-programs-stay-active-and-healthy',
      context: 'Explore age-appropriate options with'
    },
    {
      text: 'gentle flexibility routines',
      target: 'boost-flexibility-with-expert-stretching-tips-and-exercises',
      context: 'Start with'
    },
    {
      text: 'restorative yoga practices',
      target: 'find-inner-peace-with-yoga-for-mental-calm-practices',
      context: 'Consider therapeutic'
    }
  ],
  
  'older-adult-exercise-programs-stay-active-and-healthy': [
    {
      text: 'adaptive fitness solutions',
      target: 'adaptive-workouts-for-chronic-issues-a-guide-to-better-fitness',
      context: 'Find modifications in our'
    },
    {
      text: 'gentle flexibility exercises',
      target: 'boost-flexibility-with-expert-stretching-tips-and-exercises',
      context: 'Improve mobility with'
    },
    {
      text: 'home-based workout routines',
      target: 'home-gym-online-tutorials-effective-workout-routines',
      context: 'Stay active at home with'
    }
  ],
  
  // Nutrition
  'clean-eating-meal-prep-hacks-for-a-healthier-you': [
    {
      text: 'wellness-focused fitness approach',
      target: 'discover-the-power-of-wellness-plus-fitness-fusion',
      context: 'Complement your nutrition with a'
    },
    {
      text: 'immune-supporting exercise routines',
      target: 'immune-boosting-workouts-enhance-your-health-and-fitness',
      context: 'Enhance your health with'
    },
    {
      text: 'recovery nutrition strategies',
      target: 'smart-ice-bath-recovery-unlock-faster-healing',
      context: 'Optimize post-workout nutrition for'
    }
  ]
};

function addInternalLinks(articleSlug, content) {
  const links = internalLinkStrategy[articleSlug];
  if (!links || links.length === 0) return content;
  
  let modifiedContent = content;
  let linksAdded = 0;
  
  for (const link of links) {
    // Find a good place to insert the link
    // Look for relevant paragraphs that discuss related topics
    const searchPatterns = [
      // Look for sentences about related topics
      /([^.!?]*)(train|workout|exercise|program|routine|strength|flexibility|recovery|equipment|technology|app|motivation)([^.!?]*[.!?])/gi,
      // Look for transition phrases
      /(Additionally|Moreover|Furthermore|Also|Consider|Explore|Discover|Learn|Try|Check out)([^.!?]*[.!?])/gi,
      // Look for recommendation sections
      /(recommend|suggest|consider|explore|try|benefit from|complement|enhance|improve)([^.!?]*[.!?])/gi
    ];
    
    let linkInserted = false;
    
    for (const pattern of searchPatterns) {
      if (linkInserted) break;
      
      const matches = [...modifiedContent.matchAll(pattern)];
      if (matches.length > 0) {
        // Find a match that doesn't already contain a link
        for (const match of matches) {
          if (!match[0].includes('](') && !match[0].includes('http')) {
            const targetUrl = `/articles/${link.target}`;
            const linkText = `[${link.text}](${targetUrl})`;
            
            // Create a contextual sentence with the link
            let newSentence = '';
            if (link.context) {
              newSentence = ` ${link.context} ${linkText}.`;
            } else {
              newSentence = match[0].replace(/\.$/, `, and explore ${linkText}.`);
            }
            
            // Replace the original sentence
            modifiedContent = modifiedContent.replace(match[0], match[0] + newSentence);
            linksAdded++;
            linkInserted = true;
            break;
          }
        }
      }
    }
    
    // If we couldn't find a good place, add it at the end of a relevant section
    if (!linkInserted && linksAdded < 3) {
      // Find section headers
      const sectionPattern = /## [^#\n]+\n\n[^#]+?\n\n/g;
      const sections = [...modifiedContent.matchAll(sectionPattern)];
      
      if (sections.length > linksAdded + 1) {
        const targetSection = sections[linksAdded + 1];
        const targetUrl = `/articles/${link.target}`;
        const linkText = `[${link.text}](${targetUrl})`;
        const contextSentence = link.context ? 
          `${link.context} ${linkText}.` : 
          `For more insights, check out our guide on ${linkText}.`;
        
        const replacement = targetSection[0].trimEnd() + ` ${contextSentence}\n\n`;
        modifiedContent = modifiedContent.replace(targetSection[0], replacement);
        linksAdded++;
      }
    }
    
    if (linksAdded >= 3) break; // Maximum 3 links per article
  }
  
  return { content: modifiedContent, linksAdded };
}

function processArticle(articleSlug) {
  const articlePath = path.join(ARTICLES_DIR, articleSlug, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    log(`  ⚠️  Article not found: ${articleSlug}`, 'yellow');
    return false;
  }
  
  const content = fs.readFileSync(articlePath, 'utf8');
  
  // Check if article already has internal links
  const existingLinks = (content.match(/\]\(\/articles\//g) || []).length;
  if (existingLinks > 0) {
    log(`  ℹ️  Article already has ${existingLinks} internal links`, 'blue');
    return false;
  }
  
  // Add internal links
  const result = addInternalLinks(articleSlug, content);
  
  if (!result || result.linksAdded === 0) {
    log(`  ℹ️  No links to add`, 'yellow');
    return false;
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
  log('🔗 Creating SEO-Optimized Internal Links for Fitness Articles', 'cyan');
  log('📂 Articles directory: ' + ARTICLES_DIR, 'blue');
  log('🎯 Following Backlinko best practices\n', 'yellow');
  
  const articles = Object.keys(internalLinkStrategy);
  let totalLinksAdded = 0;
  let articlesModified = 0;
  
  for (const articleSlug of articles) {
    log(`\n📝 Processing: ${articleSlug}`, 'cyan');
    const linksAdded = processArticle(articleSlug);
    if (linksAdded) {
      totalLinksAdded += linksAdded;
      articlesModified++;
    }
  }
  
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Summary:', 'green');
  log(`  📄 Articles processed: ${articles.length}`, 'blue');
  log(`  ✏️  Articles modified: ${articlesModified}`, 'green');
  log(`  🔗 Total links added: ${totalLinksAdded}`, 'green');
  log(`  📁 Backups created for all modified files`, 'yellow');
  log('\n✨ Internal linking complete!', 'green');
  log('💡 Remember to run npm run build to see the changes', 'yellow');
}

main();