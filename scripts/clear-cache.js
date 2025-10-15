#!/usr/bin/env node

/**
 * Clear All Caches Script
 * ========================
 * Clears all caches to ensure fresh content
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

function deleteFolder(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        return true;
    }
    return false;
}

function clearImageCache() {
    const imageCachePath = path.join(__dirname, '../.image-cache/image-cache.json');
    if (fs.existsSync(imageCachePath)) {
        fs.writeFileSync(imageCachePath, '{}');
        return true;
    }
    return false;
}

async function main() {
    log('\n🧹 Clearing All Caches', 'bright');
    log('━'.repeat(40), 'cyan');
    
    const cacheDirs = [
        { name: 'Astro Cache', path: path.join(__dirname, '../.astro') },
        { name: 'Vite Cache', path: path.join(__dirname, '../node_modules/.vite') },
        { name: 'Build Output', path: path.join(__dirname, '../dist') },
        { name: 'Netlify Cache', path: path.join(__dirname, '../.netlify') }
    ];
    
    let cleared = 0;
    
    for (const cache of cacheDirs) {
        if (deleteFolder(cache.path)) {
            log(`✅ Cleared: ${cache.name}`, 'green');
            cleared++;
        } else {
            log(`⏭️  Skipped: ${cache.name} (not found)`, 'yellow');
        }
    }
    
    // Clear image cache
    if (clearImageCache()) {
        log(`✅ Cleared: Image Cache`, 'green');
        cleared++;
    }
    
    log('━'.repeat(40), 'cyan');
    log(`✨ Cleared ${cleared} caches successfully!`, 'green');
    
    log('\n💡 Next Steps:', 'cyan');
    log('  1. Run "npm run dev" to start with fresh cache', 'yellow');
    log('  2. Open browser in incognito/private mode', 'yellow');
    log('  3. Or use DevTools > Network > Disable cache', 'yellow');
    
    log('\n📝 Browser Cache Tips:', 'blue');
    log('  • Chrome DevTools: F12 → Network → ☑ Disable cache', 'blue');
    log('  • Firefox: about:config → browser.cache.disk.enable = false', 'blue');
    log('  • Edge: Same as Chrome', 'blue');
}

main().catch(error => {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
});
