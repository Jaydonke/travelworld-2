/**
 * Add Topics to Config Script (Improved Version)
 * 
 * This script automatically adds generated topics to config.template.js
 * Uses regex to find ARTICLE_GENERATION_CONFIG and appends to the articles array
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
 * Read topics from generated file or direct array
 */
async function readTopics(input) {
  // If input is already an array, return it
  if (Array.isArray(input)) {
    return input;
  }
  
  // Otherwise, treat it as a file path
  try {
    const filePath = input;
    
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
    log(`❌ Error reading topics: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Add topics to config.template.js using regex
 */
async function addTopicsToConfig(topics) {
  const configPath = path.join(__dirname, '..', 'config.template.js');
  
  try {
    // Read the current config file
    let configContent = fs.readFileSync(configPath, 'utf-8');
    
    // Create backup
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = configPath + `.backup-${timestamp}.js`;
    fs.writeFileSync(backupPath, configContent);
    log(`📁 Backup created: ${backupPath}`, 'cyan');
    
    // Find ARTICLE_GENERATION_CONFIG using regex
    // This pattern finds the entire ARTICLE_GENERATION_CONFIG export
    const configPattern = /export\s+const\s+ARTICLE_GENERATION_CONFIG\s*=\s*\{[\s\S]*?"articles"\s*:\s*\[/;
    const match = configContent.match(configPattern);
    
    if (!match) {
      throw new Error('Could not find ARTICLE_GENERATION_CONFIG with articles array in config.template.js');
    }
    
    // Find the closing bracket of the articles array
    const startIndex = match.index + match[0].length;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    let endIndex = -1;
    
    for (let i = startIndex; i < configContent.length; i++) {
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
    
    // Check if the array is empty or has existing items
    const arrayContent = configContent.substring(startIndex, endIndex).trim();
    const hasExistingItems = arrayContent.length > 0 && !arrayContent.match(/^\s*$/);
    
    // Format new topics with proper indentation
    const formattedTopics = topics.map((topic, index) => {
      // Ensure all required fields are present
      if (!topic.topic || !topic.keywords || !topic.category) {
        log(`⚠️ Skipping invalid topic at index ${index}`, 'yellow');
        return null;
      }
      
      return `    {
      "topic": "${topic.topic.replace(/"/g, '\\"')}",
      "keywords": [
        ${topic.keywords.map(k => `"${k.replace(/"/g, '\\"')}"`).join(',\n        ')}
      ],
      "category": "${topic.category}"
    }`;
    }).filter(Boolean).join(',\n');
    
    if (!formattedTopics) {
      throw new Error('No valid topics to add');
    }
    
    // Build the new content
    let newContent;
    if (hasExistingItems) {
      // Find the last closing brace before endIndex to add comma properly
      let lastBraceIndex = -1;
      for (let i = endIndex - 1; i >= startIndex; i--) {
        if (configContent[i] === '}') {
          lastBraceIndex = i;
          break;
        }
      }
      
      if (lastBraceIndex !== -1) {
        // Insert comma right after the last closing brace and clean up formatting
        newContent = configContent.substring(0, lastBraceIndex + 1) + ',\n' + 
                    formattedTopics + '\n  ' + 
                    configContent.substring(endIndex);
      } else {
        // Fallback to original method if can't find brace
        newContent = configContent.substring(0, endIndex) + ',\n' + formattedTopics + '\n  ' + configContent.substring(endIndex);
      }
    } else {
      // Array is empty, just add the topics
      newContent = configContent.substring(0, endIndex) + '\n' + formattedTopics + '\n  ' + configContent.substring(endIndex);
    }
    
    // Write the updated config
    fs.writeFileSync(configPath, newContent);
    
    log(`✅ Successfully added ${topics.length} topics to config.template.js`, 'green');
    
    // Verify the syntax by trying to import it
    try {
      // Force re-import by adding timestamp to URL
      const verifyUrl = `file:///${path.resolve(configPath).replace(/\\/g, '/')}?t=${Date.now()}`;
      await import(verifyUrl);
      log('✅ Config file syntax verified', 'green');
    } catch (syntaxError) {
      log('⚠️ Warning: Config file may have syntax errors', 'yellow');
      log(`   Error: ${syntaxError.message}`, 'yellow');
      log('   You may need to manually check the file', 'yellow');
    }
    
  } catch (error) {
    log(`❌ Error updating config: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Main function - can be called directly or imported
 */
export async function addTopics(topicsOrPath) {
  try {
    log('\n' + '='.repeat(40), 'bold');
    log('    📝 ADD TOPICS TO CONFIG', 'bold');
    log('='.repeat(40), 'bold');
    
    // Read topics (from file or array)
    const topics = await readTopics(topicsOrPath);
    log(`\n📚 Found ${topics.length} topics to add`, 'cyan');
    
    // Display first few topics
    log('\n📋 Topics to add:', 'cyan');
    topics.slice(0, 3).forEach((topic, index) => {
      log(`  ${index + 1}. ${topic.topic}`, 'white');
      log(`     Category: ${topic.category}`, 'gray');
    });
    if (topics.length > 3) {
      log(`  ... and ${topics.length - 3} more`, 'gray');
    }
    
    // Add to config
    log('\n🔧 Updating config.template.js...', 'cyan');
    await addTopicsToConfig(topics);
    
    log('\n✨ Success! Next steps:', 'green');
    log('  1. Verify the changes in config.template.js', 'white');
    log('  2. Run: npm run generate-articles', 'cyan');
    log('  3. Run: npm run add-articles-improved', 'cyan');
    
    return true;
  } catch (error) {
    log(`\n❌ Failed: ${error.message}`, 'red');
    return false;
  }
}

// Allow running as standalone script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const topicsFile = process.argv[2];
  
  if (!topicsFile) {
    log('\n❌ Usage: node add-topics-to-config-improved.js <topics-file.js>', 'red');
    log('\nExample:', 'yellow');
    log('  node add-topics-to-config-improved.js new-topics-2025-09-10.js', 'white');
    process.exit(1);
  }
  
  addTopics(topicsFile).then(success => {
    process.exit(success ? 0 : 1);
  });
}

// Export for use in other scripts
export default { addTopics };