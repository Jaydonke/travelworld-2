#!/usr/bin/env node

/**
 * GitHub自动部署脚本
 * 将生成的网站自动提交并推送到GitHub
 */

import { execSync } from 'child_process';
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

/**
 * 执行shell命令
 * @param {string} command - 命令
 * @param {boolean} silent - 是否静默执行
 * @returns {string} 命令输出
 */
function exec(command, silent = false) {
  try {
    return execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8'
    });
  } catch (error) {
    throw new Error(`命令执行失败: ${command}\n${error.message}`);
  }
}

/**
 * 检查是否是Git仓库
 */
function checkGitRepo() {
  try {
    exec('git rev-parse --git-dir', true);
    return true;
  } catch {
    return false;
  }
}

/**
 * 初始化Git仓库
 */
function initGitRepo() {
  log('\n📦 初始化Git仓库...', 'cyan');

  if (checkGitRepo()) {
    log('✅ Git仓库已存在', 'green');
    return;
  }

  exec('git init');
  log('✅ Git仓库初始化完成', 'green');
}

/**
 * 配置Git用户信息（如果未配置）
 */
function configureGit() {
  try {
    const userName = exec('git config user.name', true).trim();
    const userEmail = exec('git config user.email', true).trim();

    if (!userName) {
      exec('git config user.name "AutoDeploy Bot"');
      log('✅ 已设置Git用户名: AutoDeploy Bot', 'green');
    }

    if (!userEmail) {
      exec('git config user.email "autodeploy@example.com"');
      log('✅ 已设置Git邮箱: autodeploy@example.com', 'green');
    }
  } catch (error) {
    log(`⚠️  配置Git用户信息失败: ${error.message}`, 'yellow');
  }
}

/**
 * 检查是否有远程仓库
 */
function checkRemoteRepo() {
  try {
    const remotes = exec('git remote', true).trim();
    return remotes.includes('origin');
  } catch {
    return false;
  }
}

/**
 * 添加远程仓库
 * @param {string} repoUrl - 仓库URL
 */
function addRemoteRepo(repoUrl) {
  if (!repoUrl) {
    log('⚠️  未提供远程仓库URL，跳过添加远程仓库', 'yellow');
    return false;
  }

  try {
    if (checkRemoteRepo()) {
      exec(`git remote set-url origin ${repoUrl}`, true);
      log(`✅ 已更新远程仓库: ${repoUrl}`, 'green');
    } else {
      exec(`git remote add origin ${repoUrl}`, true);
      log(`✅ 已添加远程仓库: ${repoUrl}`, 'green');
    }
    return true;
  } catch (error) {
    log(`❌ 添加远程仓库失败: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 检查是否有未提交的更改
 */
function hasChanges() {
  try {
    const status = exec('git status --porcelain', true);
    return status.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * 部署到GitHub
 * @param {Object} options - 部署选项
 * @param {string} options.siteName - 网站名称
 * @param {string} options.domain - 域名
 * @param {string} [options.repoUrl] - GitHub仓库URL（可选）
 * @param {string} [options.branch] - 分支名称（默认main）
 * @param {boolean} [options.force] - 是否强制推送（默认false）
 */
export async function deployToGitHub(options) {
  const {
    siteName,
    domain,
    repoUrl = '',
    branch = 'main',
    force = false
  } = options;

  log('\n====================================', 'bright');
  log('      GitHub 自动部署', 'bright');
  log('====================================', 'bright');

  try {
    // 1. 检查/初始化Git仓库
    initGitRepo();

    // 2. 配置Git用户信息
    configureGit();

    // 3. 添加远程仓库（如果提供）
    if (repoUrl) {
      addRemoteRepo(repoUrl);
    } else if (!checkRemoteRepo()) {
      log('⚠️  未配置远程仓库，将只在本地提交', 'yellow');
    }

    // 4. 检查是否有更改
    if (!hasChanges()) {
      log('✅ 没有需要提交的更改', 'green');
      return true;
    }

    // 5. 添加所有文件到暂存区
    log('\n📝 添加文件到暂存区...', 'cyan');
    exec('git add .');
    log('✅ 文件已添加到暂存区', 'green');

    // 6. 创建提交
    const timestamp = new Date().toISOString();
    const commitMessage = `🤖 自动部署: ${siteName} (${domain})

生成时间: ${timestamp}
域名: https://${domain}

🤖 Generated with AutoDeploy Bot`;

    log('\n💾 创建提交...', 'cyan');
    exec(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
    log('✅ 提交已创建', 'green');

    // 7. 推送到远程仓库
    if (checkRemoteRepo()) {
      log(`\n🚀 推送到远程仓库 (${branch})...`, 'cyan');

      try {
        // 尝试推送
        const pushCommand = force
          ? `git push -f origin ${branch}`
          : `git push origin ${branch}`;

        exec(pushCommand);
        log('✅ 成功推送到GitHub', 'green');
      } catch (error) {
        // 如果推送失败，可能是因为分支不存在，尝试创建并推送
        log('⚠️  推送失败，尝试创建新分支...', 'yellow');
        exec(`git push -u origin ${branch}`);
        log('✅ 成功推送到GitHub（新分支）', 'green');
      }

      // 8. 显示仓库信息
      try {
        const remoteUrl = exec('git remote get-url origin', true).trim();
        log('\n📊 部署信息:', 'cyan');
        log(`   仓库: ${remoteUrl}`, 'blue');
        log(`   分支: ${branch}`, 'blue');
        log(`   网站: ${siteName}`, 'blue');
        log(`   域名: https://${domain}`, 'blue');
      } catch {
        // 忽略错误
      }
    } else {
      log('\n✅ 本地提交已完成（无远程仓库）', 'green');
    }

    log('\n🎉 部署成功！', 'green');
    return true;

  } catch (error) {
    log(`\n❌ 部署失败: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

/**
 * 构建网站
 */
export function buildWebsite() {
  log('\n🔨 构建网站...', 'cyan');

  try {
    exec('npm run build');
    log('✅ 网站构建完成', 'green');
    return true;
  } catch (error) {
    log(`❌ 网站构建失败: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 部署流程：构建 + 提交 + 推送
 * @param {Object} options - 部署选项
 */
export async function buildAndDeploy(options) {
  log('\n====================================', 'bright');
  log('   构建并部署到GitHub', 'bright');
  log('====================================', 'bright');

  // 1. 构建网站
  const buildSuccess = buildWebsite();
  if (!buildSuccess) {
    log('\n❌ 构建失败，终止部署', 'red');
    return false;
  }

  // 2. 部署到GitHub
  const deploySuccess = await deployToGitHub(options);
  if (!deploySuccess) {
    log('\n❌ 部署失败', 'red');
    return false;
  }

  log('\n🎉 构建和部署全部完成！', 'green');
  return true;
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('用法: node deploy-to-github.js <siteName> <domain> [repoUrl] [branch]');
    console.log('示例: node deploy-to-github.js "MySite" "example.com" "https://github.com/user/repo.git" "main"');
    process.exit(1);
  }

  const [siteName, domain, repoUrl, branch] = args;

  buildAndDeploy({
    siteName,
    domain,
    repoUrl,
    branch: branch || 'main'
  }).then(success => {
    process.exit(success ? 0 : 1);
  });
}
