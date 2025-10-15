# GitHub Pages 部署指南

本指南将帮助你将 Astro 博客项目部署到 GitHub Pages。

## 已完成的配置

1. ✅ Git 仓库已初始化
2. ✅ GitHub Actions 工作流已创建
3. ✅ Astro 配置已更新为静态站点生成模式
4. ✅ 初始提交已创建

## 下一步：推送到 GitHub

### 1. 在 GitHub 上创建新仓库

访问 [GitHub](https://github.com/new) 并创建一个新仓库：
- 仓库名称：建议使用 `your-username.github.io` (个人站点) 或其他名称
- 可见性：Public (GitHub Pages 免费版需要公开仓库)
- 不要初始化 README、.gitignore 或 license

### 2. 添加远程仓库并推送

在项目根目录执行以下命令：

```bash
# 添加远程仓库 (替换为你的仓库 URL)
git remote add origin https://github.com/your-username/your-repo-name.git

# 推送到 GitHub
git push -u origin master
```

或者使用 SSH：
```bash
git remote add origin git@github.com:your-username/your-repo-name.git
git push -u origin master
```

### 3. 配置 GitHub Pages

1. 进入仓库的 **Settings** > **Pages**
2. 在 **Source** 部分：
   - 选择 **GitHub Actions** 作为部署源
3. 保存设置

### 4. 等待部署完成

- 推送后，GitHub Actions 会自动开始构建和部署
- 在仓库的 **Actions** 标签页查看部署进度
- 部署成功后，你的网站将在 `https://your-username.github.io/your-repo-name` 访问

## 更新站点 URL

如果你使用自定义仓库名称（不是 `username.github.io`），需要更新 Astro 配置：

编辑 `astro.config.mjs`：
```javascript
export default defineConfig({
  site: "https://your-username.github.io",
  base: "/your-repo-name", // 添加这一行
  // ... 其他配置
});
```

## 自动部署

现在每次你推送到 `main` 分支时，GitHub Actions 会自动：
1. 安装依赖
2. 构建网站
3. 部署到 GitHub Pages

## 工作流文件

GitHub Actions 工作流位于：`.github/workflows/deploy.yml`

## 故障排除

### 构建失败
- 检查 Actions 标签页的错误日志
- 确保所有依赖在 `package.json` 中正确声明

### 404 错误
- 确保在仓库设置中正确配置了 GitHub Pages
- 检查 `astro.config.mjs` 中的 `site` 和 `base` 配置

### 样式丢失
- 确保 `base` 配置正确（如果使用子路径）
- 检查静态资源路径是否正确

## 本地测试构建

在推送之前，你可以在本地测试构建：

```bash
npm run build
```

这会在 `dist` 目录生成静态文件。

## 需要帮助？

查看 GitHub Actions 的运行日志以获取详细的错误信息。
