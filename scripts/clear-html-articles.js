#!/usr/bin/env node

/**
 * Clear HTML Articles Script
 * ===========================
 * Clears all HTML files from newarticle and scheduledarticle folders
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function clearHTMLFiles(folderPath, folderName) {
    try {
        // Check if folder exists
        if (!fs.existsSync(folderPath)) {
            log(`📁 Creating ${folderName} folder...`, 'yellow');
            fs.mkdirSync(folderPath, { recursive: true });
            return { created: true, deleted: 0 };
        }

        // Get all HTML files in the folder
        const files = fs.readdirSync(folderPath);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        if (htmlFiles.length === 0) {
            log(`✅ ${folderName} folder is already empty`, 'green');
            return { created: false, deleted: 0 };
        }

        // Delete each HTML file
        let deletedCount = 0;
        for (const file of htmlFiles) {
            const filePath = path.join(folderPath, file);
            try {
                fs.unlinkSync(filePath);
                deletedCount++;
                log(`  🗑️  Deleted: ${file}`, 'cyan');
            } catch (error) {
                log(`  ⚠️  Failed to delete: ${file} - ${error.message}`, 'yellow');
            }
        }

        return { created: false, deleted: deletedCount };
    } catch (error) {
        log(`❌ Error processing ${folderName}: ${error.message}`, 'red');
        return { created: false, deleted: 0, error: error.message };
    }
}

async function main() {
    log('\n🧹 Clearing HTML Articles', 'bright');
    log('━'.repeat(50), 'cyan');
    
    const folders = [
        { 
            name: 'newarticle', 
            path: path.join(__dirname, '../newarticle') 
        },
        { 
            name: 'scheduledarticle', 
            path: path.join(__dirname, '../scheduledarticle') 
        }
    ];
    
    let totalDeleted = 0;
    let foldersCreated = 0;
    
    for (const folder of folders) {
        log(`\n📂 Processing ${folder.name} folder...`, 'blue');
        const result = await clearHTMLFiles(folder.path, folder.name);
        
        if (result.created) {
            foldersCreated++;
            log(`  ✅ Created empty ${folder.name} folder`, 'green');
        } else if (result.deleted > 0) {
            totalDeleted += result.deleted;
            log(`  ✅ Deleted ${result.deleted} HTML files from ${folder.name}`, 'green');
        }
    }
    
    log('\n' + '━'.repeat(50), 'cyan');
    
    if (totalDeleted > 0) {
        log(`✨ Successfully deleted ${totalDeleted} HTML files total!`, 'green');
    } else if (foldersCreated > 0) {
        log(`✨ Created ${foldersCreated} empty folders!`, 'green');
    } else {
        log(`✨ All folders are already clean!`, 'green');
    }
    
    log('\n📝 Summary:', 'cyan');
    log(`  • newarticle folder: ${fs.existsSync(folders[0].path) ? 'Ready' : 'Created'}`, 'blue');
    log(`  • scheduledarticle folder: ${fs.existsSync(folders[1].path) ? 'Ready' : 'Created'}`, 'blue');
    log(`  • Total HTML files deleted: ${totalDeleted}`, 'blue');
}

// Run the script
main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
