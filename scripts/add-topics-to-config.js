/**
 * Add Topics to Config Script
 * 
 * This script automatically adds generated topics to config.template.js
 * It reads topics from a generated file and appends them to the articles array
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color output functions
const log = (msg, color = 'white') => {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color] || colors.white}${msg}${colors.reset}`);
};

/**
 * Read topics from generated file
 */
async function readTopicsFile(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Import the module
    const fileUrl = `file:///${path.resolve(filePath).replace(/\\/g, '/')}`;
    const module = await import(fileUrl);
    
    // Get the topics array
    const topics = module.default || module.newArticles;
    
    if (!Array.isArray(topics)) {
      throw new Error('Topics file does not export an array');
    }
    
    return topics;
  } catch (error) {
    log(`❌ Error reading topics file: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Add topics to config.template.js
 */
function addTopicsToConfig(topics) {
  const configPath = path.join(__dirname, '..', 'config.template.js');
  
  try {
    // Read the current config file
    let configContent = fs.readFileSync(configPath, 'utf-8');
    
    // Find the articles array - look for the pattern more carefully
    // We need to find the complete articles array from opening to closing bracket
    const startPattern = 'articles: [';
    const startIndex = configContent.indexOf(startPattern);
    
    if (startIndex === -1) {
      throw new Error('Could not find articles array in config.template.js');
    }
    
    // Find the matching closing bracket for the articles array
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    let endIndex = -1;
    
    for (let i = startIndex + startPattern.length; i < configContent.length; i++) {
      const char = configContent[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !inString) {
        inString = true;
      } else if (char === '"' && inString) {
        inString = false;
      }
      
      if (!inString) {
        if (char === '[') {
          bracketCount++;
        } else if (char === ']') {
          if (bracketCount === 0) {
            endIndex = i;
            break;
          }
          bracketCount--;
        }
      }
    }
    
    if (endIndex === -1) {
      throw new Error('Could not find closing bracket of articles array');
    }
    
    // Format new topics
    const formattedTopics = topics.map(topic => {
      return `    {
      "topic": "${topic.topic}",
      "keywords": [
        ${topic.keywords.map(k => `"${k}"`).join(',\n        ')}
      ],
      "category": "${topic.category}"
    }`;
    }).join(',\n');
    
    // Insert new topics before the closing bracket
    const beforeArray = configContent.substring(0, endIndex);
    const afterArray = configContent.substring(endIndex);
    
    // Add comma after last existing article if there are existing articles
    const articlesContent = configContent.substring(startIndex + startPattern.length, endIndex).trim();
    const needsComma = articlesContent.length > 0 && !articlesContent.endsWith(',');
    
    const newConfigContent = 
      beforeArray + 
      (needsComma ? ',\n' : '\n') + 
      formattedTopics + '\n  ' + 
      afterArray;
    
    // Create backup
    const backupPath = configPath + `.backup-${Date.now()}.js`;
    fs.writeFileSync(backupPath, configContent);
    log(`📦 Created backup: ${path.basename(backupPath)}`, 'gray');
    
    // Write the updated config
    fs.writeFileSync(configPath, newConfigContent);
    
    log(`✅ Successfully added ${topics.length} topics to config.template.js`, 'green');
    
    return topics.length;
    
  } catch (error) {
    log(`❌ Error updating config: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('\n' + '='.repeat(40), 'bold');
    log('     📝 ADD TOPICS TO CONFIG', 'bold');
    log('='.repeat(40), 'bold');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
      log('\nUsage: node add-topics-to-config.js <topics-file>', 'cyan');
      log('\nExample:', 'yellow');
      log('  node add-topics-to-config.js new-topics-2025-09-08.js', 'white');
      log('  node add-topics-to-config.js test-2-topics.js', 'white');
      log('\nThis script will:', 'yellow');
      log('  1. Read topics from the specified file', 'white');
      log('  2. Create a backup of config.template.js', 'white');
      log('  3. Add the topics to the articles array', 'white');
      log('  4. Save the updated config', 'white');
      return;
    }
    
    const topicsFile = args[0];
    
    // Read topics from file
    log(`\n📚 Reading topics from: ${topicsFile}`, 'cyan');
    const topics = await readTopicsFile(topicsFile);
    
    log(`  Found ${topics.length} topics`, 'gray');
    
    // Display topics
    log('\n📋 Topics to add:', 'cyan');
    topics.forEach((topic, index) => {
      log(`  ${index + 1}. ${topic.topic}`, 'white');
      log(`     Category: ${topic.category}`, 'gray');
    });
    
    // Add to config
    log('\n🔧 Updating config.template.js...', 'cyan');
    const added = addTopicsToConfig(topics);
    
    // Success message
    log('\n✨ Next Steps:', 'yellow');
    log(`  1. ${added} topics have been added to config.template.js`, 'white');
    log(`  2. Run: npm run generate-articles -s -c ${added}`, 'white');
    log('     (This will generate them to scheduledarticle folder)', 'white');
    log('  3. Schedule them using: npm run schedule-articles', 'white');
    
    log('\n✅ Done!', 'green');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Export for use in other scripts
export { addTopicsToConfig };

// Run the script if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}