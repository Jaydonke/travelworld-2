@echo off
echo Starting article generation...
set NODE_OPTIONS=--max-old-space-size=4096
node scripts/generate-articles.js 1
echo Generation complete!
pause