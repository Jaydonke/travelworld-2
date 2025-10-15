import { visit } from 'unist-util-visit';

/**
 * Rehype plugin: Automatically add internal links during build time
 * Based on Backlinko SEO best practices for internal linking
 */

// SEO-optimized static keyword mappings - Natural phrases from actual content
const staticKeywordMappings = {
  // Debt Management (phrases that appear in articles)
  'debt snowball': 'debt-snowball-method-revival-a-fresh-start-for-your-finances',
  'debt repayment': 'debt-snowball-method-revival-a-fresh-start-for-your-finances', 
  'paying off debt': 'debt-snowball-method-revival-a-fresh-start-for-your-finances',
  'smallest balance': 'debt-snowball-method-revival-a-fresh-start-for-your-finances',
  'student loan': 'student-loan-repayment-changes-what-you-need-to-know',
  
  // Budgeting & Savings (actual phrases from budget article)
  'personal budget': 'personal-budget-tips-for-effective-money-management',
  'monthly budget': 'personal-budget-tips-for-effective-money-management',
  'spending plan': 'personal-budget-tips-for-effective-money-management',
  'budget categories': 'personal-budget-tips-for-effective-money-management',
  'net income': 'personal-budget-tips-for-effective-money-management',
  'fixed expenses': 'personal-budget-tips-for-effective-money-management',
  'variable expenses': 'personal-budget-tips-for-effective-money-management',
  'emergency fund': 'personal-budget-tips-for-effective-money-management',
  'financial goals': 'setting-clear-financial-goals-a-path-to-financial-freedom',
  'saving money': 'saving-more-as-top-resolution-achieve-financial-goals',
  'spending tracker': 'spending-tracker-monitor-your-daily-expenses',
  
  // Digital Banking & Investment
  'digital banking': 'digital-banks-a-guide-to-online-banking-options',
  'mobile banking': 'mobile-banking-secure-convenient-financial-management',
  'online banking': 'digital-banks-a-guide-to-online-banking-options',
  'cryptocurrency': 'understanding-crypto-investment-momentum-and-its-impact',
  'crypto investment': 'understanding-crypto-investment-momentum-and-its-impact',
  'stablecoins': 'stablecoins-explained-benefits-and-use-cases',
  
  // Financial Planning & Housing
  'tax cuts': 'new-tax-cuts-2025-how-to-maximize-your-savings',
  'tax savings': 'new-tax-cuts-2025-how-to-maximize-your-savings',
  'homebuying': 'navigating-the-homebuying-gridlocked-housing-market',
  'housing market': 'navigating-the-homebuying-gridlocked-housing-market',
  'financial stress': 'inflation-anxiety-how-to-manage-financial-stress',
  'interest rates': 'interest-rates-higher-for-longer-how-it-affects-your-finances',
  
  // Financial Services
  'credit monitoring': 'stay-ahead-with-real-time-credit-monitoring-amp-alerts',
  'buy now pay later': 'discover-the-best-bnpl-options-for-online-shopping',
  'rent insurance': 'understanding-rent-insurance-coverage-amp-benefits'
};

let linkCount = 0;
const MAX_LINKS_PER_ARTICLE = 3; // Follow Backlinko's recommendation

export default function internalLinksPlugin() {
  return (tree, file) => {
    // Reset link count for each article
    linkCount = 0;
    
    // Extract current article slug from file path
    const filePath = file.history[0] || '';
    const currentSlug = filePath.split('/').slice(-2, -1)[0] || '';
    
    // SEO best practice: Limit internal links per article (1-3 high-quality links)
    const sortedKeywords = Object.keys(staticKeywordMappings)
      .sort((a, b) => b.length - a.length); // Process longer keywords first
    
    visit(tree, 'text', (node, index, parent) => {
      // SEO best practice: Stop when link limit is reached
      if (linkCount >= MAX_LINKS_PER_ARTICLE) return;
      
      // Skip if already inside a link
      if (isInsideLink(parent)) return;
      
      // Process high-value keywords
      for (const keyword of sortedKeywords) {
        // Stop when link limit is reached
        if (linkCount >= MAX_LINKS_PER_ARTICLE) break;
        
        const targetSlug = staticKeywordMappings[keyword];
        if (targetSlug === currentSlug) continue; // Avoid self-linking
        
        // Create case-insensitive regex
        const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'gi');
        
        if (regex.test(node.value)) {
          // Create new node structure
          const parts = node.value.split(regex);
          const matches = node.value.match(regex) || [];
          
          if (matches.length > 0) {
            const newNodes = [];
            
            parts.forEach((part, i) => {
              if (i > 0) {
                // Add link node
                newNodes.push({
                  type: 'element',
                  tagName: 'a',
                  properties: {
                    href: `/articles/${targetSlug}`,
                    className: ['internal-link', 'seo-optimized'] // Add SEO identifier class
                  },
                  children: [{
                    type: 'text',
                    value: matches[i - 1]
                  }]
                });
              }
              
              // Add text part
              if (part) {
                newNodes.push({
                  type: 'text',
                  value: part
                });
              }
            });
            
            // Replace current node
            parent.children.splice(index, 1, ...newNodes);
            
            linkCount++; // Increase link count
            
            // Update text for subsequent processing
            node.value = node.value.replace(regex, ''); 
            
            // SEO optimization: Only replace one keyword per text node to avoid over-linking
            break;
          }
        }
      }
    });
  };
}

// Check if node is inside a link
function isInsideLink(parent) {
  if (!parent) return false;
  if (parent.tagName === 'a') return true;
  return isInsideLink(parent.parent);
}

// Extract slug from file path
function extractSlug(filePath) {
  const parts = filePath.split('/');
  return parts[parts.length - 2] || '';
}

// Escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}