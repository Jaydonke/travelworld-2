#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

// Function to clean all existing internal links from content
function cleanInternalLinks(content) {
  // Remove markdown links (but keep the link text)
  let cleaned = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove HTML anchor tags (but keep the text)
  cleaned = cleaned.replace(/<a[^>]*>([^<]+)<\/a>/gi, '$1');
  
  return cleaned;
}

// SEO-optimized internal links mapping for OptiNook marketing theme
// Following Backlinko best practices: descriptive anchor text, contextual relevance
const internalLinksMap = {
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
  'brand-story-micro-videos-engage-your-audience': [
    {
      anchor: 'short-form video integration strategies for marketing success',
      target: 'short-form-video-integration-strategies-for-success',
      context: 'Expand your video strategy with '
    },
    {
      anchor: 'micro-influencer campaigns to elevate brand awareness',
      target: 'elevate-your-brand-with-micro-influencer-campaigns',
      context: 'Amplify your brand stories through '
    }
  ],
  'predictive-content-calendars-planning-for-success': [
    {
      anchor: 'content cluster planning techniques for improved SEO',
      target: 'improve-seo-with-content-cluster-planning-techniques',
      context: 'Structure your calendar using '
    },
    {
      anchor: 'content feedback loops implementation',
      target: 'how-to-implement-successful-content-feedback-loops',
      context: 'Refine your planning process with '
    }
  ],
  'content-experience-design-strategies-for-success': [
    {
      anchor: 'adaptive header strategies for better user experience',
      target: 'adaptive-header-strategies-boosting-user-experience',
      context: 'Enhance your design with '
    },
    {
      anchor: 'gamified content entry forms to boost engagement',
      target: 'enhance-user-experience-with-gamified-content-entry-forms-online',
      context: 'Add interactive elements using '
    }
  ],
  'enhance-user-experience-with-gamified-content-entry-forms-online': [
    {
      anchor: 'chatbot lead generation funnels for higher conversions',
      target: 'chatbot-lead-generation-funnels-boost-your-sales',
      context: 'Complement gamification with '
    },
    {
      anchor: 'content experience design strategies',
      target: 'content-experience-design-strategies-for-success',
      context: 'Integrate gamification into broader '
    }
  ],
  'mastering-local-topic-authority-building-for-better-seo': [
    {
      anchor: 'semantic keyword grouping for enhanced SEO results',
      target: 'mastering-semantic-keyword-grouping-for-better-seo-results',
      context: 'Strengthen local authority with '
    },
    {
      anchor: 'zero keyword content ideas to boost rankings',
      target: 'boost-your-seo-with-zero-keyword-content-ideas',
      context: 'Target untapped opportunities using '
    },
    {
      anchor: 'long-tail conversational keywords guide',
      target: 'long-tail-conversational-keywords-a-guide-to-effective-seo',
      context: 'Expand your reach with '
    }
  ],
  'improve-bookings-with-generative-chat-booking-ads-strategies': [
    {
      anchor: 'chatbot lead generation funnels',
      target: 'chatbot-lead-generation-funnels-boost-your-sales',
      context: 'Enhance booking conversions with '
    },
    {
      anchor: 'responsive ads messaging optimization',
      target: 'improve-ad-performance-with-responsive-ads-messaging-tests',
      context: 'Test different approaches using '
    }
  ],
  'maximizing-impact-with-micro-moment-content-formats': [
    {
      anchor: 'short-form video integration for quick wins',
      target: 'short-form-video-integration-strategies-for-success',
      context: 'Capture micro-moments with '
    },
    {
      anchor: 'brand story micro-videos',
      target: 'brand-story-micro-videos-engage-your-audience',
      context: 'Tell compelling stories through '
    }
  ],
  'improve-seo-with-content-cluster-planning-techniques': [
    {
      anchor: 'evergreen vs topical content slicing approach',
      target: 'evergreen-vs-topical-slicing-seo-content-approach',
      context: 'Balance your clusters with '
    },
    {
      anchor: 'semantic SERP analysis for better understanding',
      target: 'semantic-serp-analysis-understanding-search-results',
      context: 'Research cluster opportunities through '
    },
    {
      anchor: 'predictive content calendars',
      target: 'predictive-content-calendars-planning-for-success',
      context: 'Plan cluster rollout using '
    }
  ],
  'elevate-your-brand-with-micro-influencer-campaigns': [
    {
      anchor: 'influencer SEO synergy strategies',
      target: 'boost-your-online-visibility-with-influencer-seo-synergy',
      context: 'Maximize campaign impact with '
    },
    {
      anchor: 'brand story micro-videos for engagement',
      target: 'brand-story-micro-videos-engage-your-audience',
      context: 'Create authentic content through '
    }
  ],
  'evergreen-vs-topical-slicing-seo-content-approach': [
    {
      anchor: 'content cluster planning techniques',
      target: 'improve-seo-with-content-cluster-planning-techniques',
      context: 'Organize your content strategy with '
    },
    {
      anchor: 'predictive content calendars for strategic planning',
      target: 'predictive-content-calendars-planning-for-success',
      context: 'Schedule your mix using '
    }
  ],
  'mastering-semantic-keyword-grouping-for-better-seo-results': [
    {
      anchor: 'semantic SERP analysis techniques',
      target: 'semantic-serp-analysis-understanding-search-results',
      context: 'Validate your groupings with '
    },
    {
      anchor: 'local topic authority building strategies',
      target: 'mastering-local-topic-authority-building-for-better-seo',
      context: 'Apply semantic grouping to '
    },
    {
      anchor: 'structured data adoption guide',
      target: 'structured-data-adoption-a-guide-for-marketers',
      context: 'Enhance semantic signals through '
    }
  ],
  'structured-data-adoption-a-guide-for-marketers': [
    {
      anchor: 'semantic keyword grouping for structured data',
      target: 'mastering-semantic-keyword-grouping-for-better-seo-results',
      context: 'Align your schema with '
    },
    {
      anchor: 'semantic SERP analysis',
      target: 'semantic-serp-analysis-understanding-search-results',
      context: 'Monitor structured data impact via '
    }
  ],
  'boost-your-online-visibility-with-influencer-seo-synergy': [
    {
      anchor: 'micro-influencer campaigns for targeted reach',
      target: 'elevate-your-brand-with-micro-influencer-campaigns',
      context: 'Start with focused '
    },
    {
      anchor: 'brand story micro-videos',
      target: 'brand-story-micro-videos-engage-your-audience',
      context: 'Co-create authentic content using '
    }
  ],
  'improve-ad-performance-with-responsive-ads-messaging-tests': [
    {
      anchor: 'dynamic search ads optimization',
      target: 'dynamic-search-ads-optimization-tips-and-best-practices',
      context: 'Combine responsive testing with '
    },
    {
      anchor: 'mobile ad experience UX optimization',
      target: 'improve-mobile-ad-experience-ux-tips-and-best-practices',
      context: 'Ensure messages work across devices with '
    },
    {
      anchor: 'generative chat booking ads strategies',
      target: 'improve-bookings-with-generative-chat-booking-ads-strategies',
      context: 'Test conversational formats using '
    }
  ],
  'semantic-serp-analysis-understanding-search-results': [
    {
      anchor: 'semantic keyword grouping techniques',
      target: 'mastering-semantic-keyword-grouping-for-better-seo-results',
      context: 'Apply SERP insights to '
    },
    {
      anchor: 'content cluster planning based on SERP data',
      target: 'improve-seo-with-content-cluster-planning-techniques',
      context: 'Structure content using '
    }
  ],
  'long-tail-conversational-keywords-a-guide-to-effective-seo': [
    {
      anchor: 'zero keyword content opportunities',
      target: 'boost-your-seo-with-zero-keyword-content-ideas',
      context: 'Discover hidden gems with '
    },
    {
      anchor: 'local topic authority building',
      target: 'mastering-local-topic-authority-building-for-better-seo',
      context: 'Target long-tail queries for '
    }
  ],
  'boost-your-seo-with-zero-keyword-content-ideas': [
    {
      anchor: 'long-tail conversational keywords strategy',
      target: 'long-tail-conversational-keywords-a-guide-to-effective-seo',
      context: 'Expand zero-volume targeting with '
    },
    {
      anchor: 'semantic keyword grouping for discovery',
      target: 'mastering-semantic-keyword-grouping-for-better-seo-results',
      context: 'Find related opportunities through '
    }
  ],
  'adaptive-header-strategies-boosting-user-experience': [
    {
      anchor: 'content experience design strategies',
      target: 'content-experience-design-strategies-for-success',
      context: 'Integrate adaptive headers into comprehensive '
    },
    {
      anchor: 'gamified content entry forms',
      target: 'enhance-user-experience-with-gamified-content-entry-forms-online',
      context: 'Enhance header areas with '
    }
  ],
  'dynamic-search-ads-optimization-tips-and-best-practices': [
    {
      anchor: 'responsive ads messaging tests',
      target: 'improve-ad-performance-with-responsive-ads-messaging-tests',
      context: 'Complement DSAs with '
    },
    {
      anchor: 'mobile ad experience optimization',
      target: 'improve-mobile-ad-experience-ux-tips-and-best-practices',
      context: 'Ensure DSAs work well with '
    }
  ],
  'privacy-law-compliant-tracking-ensuring-data-protection': [
    {
      anchor: 'advanced heatmap engagement analyses',
      target: 'analyze-user-behavior-with-advanced-heatmap-engagement-analyses',
      context: 'Implement compliant tracking for '
    }
  ],
  'analyze-user-behavior-with-advanced-heatmap-engagement-analyses': [
    {
      anchor: 'privacy law compliant tracking methods',
      target: 'privacy-law-compliant-tracking-ensuring-data-protection',
      context: 'Ensure your analysis follows '
    },
    {
      anchor: 'content feedback loops from user data',
      target: 'how-to-implement-successful-content-feedback-loops',
      context: 'Transform insights into action with '
    }
  ],
  'how-to-implement-successful-content-feedback-loops': [
    {
      anchor: 'predictive content calendars using feedback data',
      target: 'predictive-content-calendars-planning-for-success',
      context: 'Feed insights into '
    },
    {
      anchor: 'advanced heatmap analyses for feedback',
      target: 'analyze-user-behavior-with-advanced-heatmap-engagement-analyses',
      context: 'Gather behavioral data through '
    }
  ],
  'chatbot-lead-generation-funnels-boost-your-sales': [
    {
      anchor: 'generative chat booking ads',
      target: 'improve-bookings-with-generative-chat-booking-ads-strategies',
      context: 'Extend chatbot success to '
    },
    {
      anchor: 'gamified content entry forms for lead capture',
      target: 'enhance-user-experience-with-gamified-content-entry-forms-online',
      context: 'Combine chatbots with '
    }
  ],
  'short-form-video-integration-strategies-for-success': [
    {
      anchor: 'brand story micro-videos creation',
      target: 'brand-story-micro-videos-engage-your-audience',
      context: 'Focus your short-form content on '
    },
    {
      anchor: 'micro-moment content formats',
      target: 'maximizing-impact-with-micro-moment-content-formats',
      context: 'Optimize videos for '
    },
    {
      anchor: 'micro-influencer campaigns with video content',
      target: 'elevate-your-brand-with-micro-influencer-campaigns',
      context: 'Amplify reach through '
    }
  ]
};

// Function to add internal links to content
function addInternalLinks(content, articleId) {
  const links = internalLinksMap[articleId];
  if (!links || links.length === 0) return content;
  
  let modifiedContent = content;
  let addedLinks = 0;
  
  // Try to add links at natural points in the content
  for (const link of links) {
    if (addedLinks >= 3) break; // Max 3 links per article for optimal SEO
    
    // Search for context phrases or add at paragraph breaks
    const searchPhrases = [
      link.context,
      'Additionally, ',
      'Furthermore, ',
      'To enhance this, ',
      'For better results, ',
      'Consider also ',
      '\n\n',
    ];
    
    let linkAdded = false;
    for (const phrase of searchPhrases) {
      if (modifiedContent.includes(phrase) && !linkAdded) {
        const linkMarkdown = `[${link.anchor}](/articles/${link.target}/)`;
        const replacement = phrase === '\n\n' 
          ? `\n\n${link.context}${linkMarkdown}.\n\n`
          : `${phrase}${linkMarkdown}`;
        
        // Only add if not already present
        if (!modifiedContent.includes(linkMarkdown)) {
          modifiedContent = modifiedContent.replace(phrase, replacement);
          linkAdded = true;
          addedLinks++;
          break;
        }
      }
    }
    
    // If no context found, add at end of a paragraph (before double newline)
    if (!linkAdded && modifiedContent.includes('\n\n')) {
      const paragraphs = modifiedContent.split('\n\n');
      const insertIndex = Math.min(2, Math.floor(paragraphs.length / 3)); // Add in first third
      if (paragraphs[insertIndex] && paragraphs[insertIndex].length > 100) {
        const linkMarkdown = `[${link.anchor}](/articles/${link.target}/)`;
        paragraphs[insertIndex] += ` ${link.context}${linkMarkdown}.`;
        modifiedContent = paragraphs.join('\n\n');
        addedLinks++;
      }
    }
  }
  
  return modifiedContent;
}

// Process all articles
console.log('🔗 Processing internal links for OptiNook marketing articles...\n');

const articles = fs.readdirSync(articlesDir)
  .filter(dir => fs.statSync(path.join(articlesDir, dir)).isDirectory());

let processedCount = 0;
let linksAdded = 0;

for (const articleId of articles) {
  const mdxPath = path.join(articlesDir, articleId, 'index.mdx');
  
  if (fs.existsSync(mdxPath)) {
    // Read current content
    let content = fs.readFileSync(mdxPath, 'utf8');
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      console.log(`⚠️  Skipping ${articleId}: No frontmatter found`);
      continue;
    }
    
    const frontmatter = frontmatterMatch[0];
    const bodyContent = content.slice(frontmatterMatch[0].length);
    
    // Clean existing internal links
    const cleanedContent = cleanInternalLinks(bodyContent);
    
    // Add new SEO-optimized internal links
    const contentWithLinks = addInternalLinks(cleanedContent, articleId);
    
    // Count links added
    const beforeLinks = (cleanedContent.match(/\[.*?\]\(.*?\)/g) || []).length;
    const afterLinks = (contentWithLinks.match(/\[.*?\]\(.*?\)/g) || []).length;
    const addedForArticle = afterLinks - beforeLinks;
    
    // Write updated content
    const updatedContent = frontmatter + contentWithLinks;
    fs.writeFileSync(mdxPath, updatedContent);
    
    console.log(`✅ ${articleId}: Added ${addedForArticle} internal links`);
    processedCount++;
    linksAdded += addedForArticle;
  }
}

console.log('\n📊 Summary:');
console.log(`   Articles processed: ${processedCount}`);
console.log(`   Total internal links added: ${linksAdded}`);
console.log(`   Average links per article: ${(linksAdded / processedCount).toFixed(1)}`);
console.log('\n✨ SEO-optimized internal linking complete!');
console.log('\nFollowing Backlinko best practices:');
console.log('   - Descriptive anchor text with article context');
console.log('   - Natural placement within content');
console.log('   - 1-3 relevant links per article');
console.log('   - Contextually appropriate link targets');