#!/usr/bin/env node

/**
 * GitHub 自动化部署模块
 * 自动创建仓库、配置、构建并部署网站到 GitHub Pages
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
 * 执行命令并返回输出
 */
function exec(command, options = {}) {
  const { silent = false, ignoreError = false } = options;

  try {
    return execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '..')
    });
  } catch (error) {
    if (ignoreError) {
      return '';
    }
    throw new Error(`命令执行失败: ${command}\n${error.message}`);
  }
}

/**
 * 生成规范化的仓库名称
 * 规则：将网站名称转换为小写、去除特殊字符、用连字符连接
 */
function generateRepoName(siteName, index) {
  // 基础清理
  let repoName = siteName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 多个连字符合并为一个
    .replace(/^-|-$/g, ''); // 移除首尾连字符

  // 如果名称太短或为空，使用序号
  if (repoName.length < 3) {
    repoName = `site-${index}`;
  }

  // 限制长度（GitHub 仓库名限制）
  if (repoName.length > 100) {
    repoName = repoName.substring(0, 100);
  }

  return repoName;
}

/**
 * 检查 GitHub CLI 是否已安装和认证
 */
function checkGitHubCLI() {
  log('\n🔍 检查 GitHub CLI 状态...', 'cyan');

  try {
    // 检查是否安装
    const ghPath = '"C:\\Program Files\\GitHub CLI\\gh.exe"';
    exec(`${ghPath} --version`, { silent: true });

    // 检查是否已登录
    const authStatus = exec(`${ghPath} auth status`, { silent: true, ignoreError: true });

    if (!authStatus || authStatus.includes('not logged into')) {
      throw new Error('GitHub CLI 未登录');
    }

    log('✅ GitHub CLI 已安装并已登录', 'green');
    return ghPath;

  } catch (error) {
    log('❌ GitHub CLI 检查失败', 'red');
    log('   请确保已安装 GitHub CLI 并已使用 gh auth login 登录', 'yellow');
    throw error;
  }
}

/**
 * 检查仓库是否已存在
 */
function checkRepoExists(ghPath, username, repoName) {
  try {
    const result = exec(`${ghPath} repo view ${username}/${repoName}`, {
      silent: true,
      ignoreError: true
    });
    return result && result.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * 获取 GitHub 用户名
 */
function getGitHubUsername(ghPath) {
  try {
    const result = exec(`${ghPath} api user --jq .login`, { silent: true });
    return result.trim();
  } catch (error) {
    throw new Error('无法获取 GitHub 用户名');
  }
}

/**
 * 创建 GitHub 仓库
 */
async function createGitHubRepo(siteName, index) {
  log('\n📦 创建 GitHub 仓库...', 'cyan');

  const ghPath = checkGitHubCLI();
  const username = getGitHubUsername(ghPath);
  let repoName = generateRepoName(siteName, index);

  log(`   用户名: ${username}`, 'blue');
  log(`   仓库名: ${repoName}`, 'blue');

  // 检查仓库是否已存在
  let counter = 1;
  while (checkRepoExists(ghPath, username, repoName)) {
    log(`   ⚠️  仓库 ${repoName} 已存在，尝试新名称...`, 'yellow');
    repoName = `${generateRepoName(siteName, index)}-${counter}`;
    counter++;

    if (counter > 10) {
      throw new Error('无法生成唯一的仓库名称');
    }
  }

  log(`   创建仓库: ${repoName}`, 'cyan');

  try {
    // 创建公开仓库，不推送代码（稍后手动推送）
    exec(`${ghPath} repo create ${repoName} --public --description "Auto-generated blog: ${siteName}"`, { silent: true });

    log(`✅ 仓库创建成功: ${username}/${repoName}`, 'green');

    return {
      username,
      repoName,
      repoUrl: `https://github.com/${username}/${repoName}.git`,
      siteUrl: `https://${username}.github.io/${repoName}`
    };

  } catch (error) {
    log(`❌ 仓库创建失败: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 配置 Astro 用于 GitHub Pages 部署
 */
function configureAstroForGitHub(username, repoName) {
  log('\n⚙️  配置 Astro 用于 GitHub Pages...', 'cyan');

  const configPath = path.resolve(__dirname, '../astro.config.mjs');

  try {
    let config = fs.readFileSync(configPath, 'utf-8');

    // 更新 site 和 base 配置
    const siteUrl = `https://${username}.github.io`;
    const basePath = `/${repoName}`;

    // 使用正则表达式替换 site 配置
    config = config.replace(
      /site:\s*["'][^"']*["']/,
      `site: "${siteUrl}"`
    );

    // 添加或更新 base 配置
    if (config.includes('base:')) {
      config = config.replace(
        /base:\s*["'][^"']*["']/,
        `base: "${basePath}"`
      );
    } else {
      // 在 site 之后插入 base
      config = config.replace(
        /(site:\s*["'][^"']*["'],?)/,
        `$1\n\tbase: "${basePath}",`
      );
    }

    // 确保 output 是 static
    if (!config.includes('output:')) {
      config = config.replace(
        /(site:\s*["'][^"']*["'],?)/,
        `$1\n\toutput: 'static',`
      );
    } else {
      config = config.replace(
        /output:\s*["'][^"']*["']/,
        `output: 'static'`
      );
    }

    fs.writeFileSync(configPath, config, 'utf-8');

    log(`✅ Astro 配置已更新`, 'green');
    log(`   Site: ${siteUrl}`, 'blue');
    log(`   Base: ${basePath}`, 'blue');

  } catch (error) {
    log(`❌ Astro 配置失败: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 确保 GitHub Actions workflow 文件存在
 */
function ensureGitHubActionsWorkflow() {
  log('\n📝 确保 GitHub Actions workflow 存在...', 'cyan');

  const workflowDir = path.resolve(__dirname, '../.github/workflows');
  const workflowFile = path.join(workflowDir, 'deploy.yml');

  // 创建目录（如果不存在）
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  // 如果文件不存在，创建它
  if (!fs.existsSync(workflowFile)) {
    const workflowContent = `name: Deploy to GitHub Pages

on:
  push:
    branches: [ master, main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build with Astro
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

    fs.writeFileSync(workflowFile, workflowContent, 'utf-8');
    log('✅ GitHub Actions workflow 已创建', 'green');
  } else {
    log('✅ GitHub Actions workflow 已存在', 'green');
  }
}

/**
 * 初始化 Git 并推送到远程仓库
 */
function initAndPushToGitHub(repoUrl, siteName) {
  log('\n🚀 推送代码到 GitHub...', 'cyan');

  try {
    const projectRoot = path.resolve(__dirname, '..');

    // 检查是否已是 Git 仓库
    const isGitRepo = fs.existsSync(path.join(projectRoot, '.git'));

    if (!isGitRepo) {
      log('   初始化 Git 仓库...', 'blue');
      exec('git init');
      exec('git config user.name "AutoDeploy Bot"');
      exec('git config user.email "autodeploy@example.com"');
    }

    // 添加远程仓库（如果已存在则更新）
    try {
      exec('git remote remove origin', { silent: true, ignoreError: true });
    } catch {}

    exec(`git remote add origin ${repoUrl}`);
    log(`   已添加远程仓库: ${repoUrl}`, 'blue');

    // 添加所有文件
    exec('git add .');

    // 创建提交
    const commitMessage = `Deploy: ${siteName}

Auto-generated blog deployment

🤖 Generated with Multi-Site Automation System

Co-Authored-By: AutoDeploy <autodeploy@example.com>`;

    exec(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { ignoreError: true });

    // 推送到远程
    log('   推送到 GitHub...', 'blue');
    exec('git push -u origin master --force');

    log('✅ 代码推送成功', 'green');

  } catch (error) {
    log(`❌ Git 推送失败: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 启用 GitHub Pages
 */
function enableGitHubPages(ghPath, username, repoName) {
  log('\n📄 启用 GitHub Pages...', 'cyan');

  try {
    // 使用 GitHub API 启用 Pages
    exec(`${ghPath} api repos/${username}/${repoName}/pages -X POST -f build_type=workflow -f source[branch]=master`, {
      silent: true
    });

    log('✅ GitHub Pages 已启用', 'green');
    return true;

  } catch (error) {
    // 可能已经启用了，不算错误
    if (error.message.includes('409')) {
      log('✅ GitHub Pages 已经启用', 'green');
      return true;
    }

    log(`⚠️  无法启用 GitHub Pages: ${error.message}`, 'yellow');
    log('   请手动在仓库设置中启用 GitHub Pages', 'yellow');
    return false;
  }
}

/**
 * 等待 GitHub Actions 构建完成
 */
async function waitForDeployment(ghPath, repoName, maxWaitMinutes = 10) {
  log('\n⏳ 等待 GitHub Actions 部署...', 'cyan');

  const maxAttempts = maxWaitMinutes * 4; // 每 15 秒检查一次
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const result = exec(`${ghPath} run list --repo ${repoName} --limit 1 --json status,conclusion`, {
        silent: true
      });

      const runs = JSON.parse(result);

      if (runs && runs.length > 0) {
        const run = runs[0];

        if (run.status === 'completed') {
          if (run.conclusion === 'success') {
            log('✅ GitHub Actions 部署成功', 'green');
            return true;
          } else {
            log(`❌ GitHub Actions 部署失败: ${run.conclusion}`, 'red');
            return false;
          }
        }

        log(`   部署进行中... (${attempts * 15}秒)`, 'yellow');
      }

    } catch (error) {
      // 忽略检查错误，继续等待
    }

    await new Promise(resolve => setTimeout(resolve, 15000)); // 等待 15 秒
    attempts++;
  }

  log('⚠️  部署超时，请手动检查 GitHub Actions', 'yellow');
  return false;
}

/**
 * 完整的自动部署流程
 */
export async function autoDeployToGitHub(siteName, index) {
  log('\n╔═══════════════════════════════════════════════════════╗', 'bright');
  log('║          GitHub 自动部署流程                          ║', 'bright');
  log('╚═══════════════════════════════════════════════════════╝', 'bright');

  try {
    // 1. 创建 GitHub 仓库
    const repoInfo = await createGitHubRepo(siteName, index);

    // 2. 确保 GitHub Actions workflow 存在
    ensureGitHubActionsWorkflow();

    // 3. 配置 Astro
    configureAstroForGitHub(repoInfo.username, repoInfo.repoName);

    // 4. 构建网站
    log('\n🔨 构建网站...', 'cyan');
    try {
      exec('npm run build');
      log('✅ 网站构建成功', 'green');
    } catch (error) {
      log('❌ 网站构建失败', 'red');
      throw error;
    }

    // 5. 推送到 GitHub
    initAndPushToGitHub(repoInfo.repoUrl, siteName);

    // 6. 启用 GitHub Pages
    const ghPath = checkGitHubCLI();
    enableGitHubPages(ghPath, repoInfo.username, repoInfo.repoName);

    // 7. 等待部署完成（可选，取消注释以启用）
    // log('\n⏳ 等待 GitHub Actions 部署完成...', 'cyan');
    // const deploySuccess = await waitForDeployment(ghPath, repoInfo.repoName, 5);
    // if (!deploySuccess) {
    //   log('⚠️  无法确认部署状态，请手动检查', 'yellow');
    // }

    log('\n🎉 部署完成！', 'green');
    log(`   仓库: https://github.com/${repoInfo.username}/${repoInfo.repoName}`, 'blue');
    log(`   网站: ${repoInfo.siteUrl}`, 'blue');
    log(`   Actions: https://github.com/${repoInfo.username}/${repoInfo.repoName}/actions`, 'blue');
    log('\n💡 提示: 访问 Actions 页面查看部署进度', 'yellow');

    return {
      success: true,
      ...repoInfo
    };

  } catch (error) {
    log(`\n❌ 自动部署失败: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message
    };
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const siteName = process.argv[2] || 'Test Site';
  const index = parseInt(process.argv[3] || '1', 10);

  autoDeployToGitHub(siteName, index).then(result => {
    process.exit(result.success ? 0 : 1);
  });
}
