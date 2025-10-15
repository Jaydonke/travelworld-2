# GitHub Actions 自动构建修复指南

## 问题诊断

你的GitHub Actions定时构建可能没有起作用的原因：

1. **部署目标错误**：原配置部署到`gh-pages`分支，但Netlify从`main`分支部署
2. **没有触发Netlify重新构建**：即使GitHub Actions运行了，Netlify也不会知道需要重新部署

## 已修复的问题

### 1. 主工作流修复 (scheduled-publish.yml)
- ✅ 移除了部署到gh-pages的步骤
- ✅ 改为推送空提交到main分支触发Netlify
- ✅ 修正了权限设置

### 2. 创建了备用工作流 (scheduled-publish-netlify.yml)
- 支持两种触发Netlify的方式
- 更简洁的配置
- 更好的错误处理

## 设置步骤

### 方案A：使用空提交触发（已配置，立即可用）

1. **确认GitHub Actions已启用**
   - 访问：https://github.com/你的用户名/你的仓库/actions
   - 查看是否有"Scheduled Article Publishing"工作流

2. **测试手动触发**
   - 在Actions页面，选择工作流
   - 点击"Run workflow"手动测试

3. **工作原理**
   - 每天北京时间16:00和凌晨4:00自动运行
   - 检查是否有定时发布的文章
   - 如果有，推送空提交到main分支
   - Netlify检测到新提交，自动重新构建

### 方案B：使用Netlify Build Hook（推荐）

1. **创建Netlify Build Hook**
   ```
   1. 登录Netlify控制台
   2. 选择你的站点
   3. 进入 Site settings → Build & deploy → Build hooks
   4. 点击"Add build hook"
   5. 名称输入：GitHub Actions
   6. 分支选择：main
   7. 复制生成的webhook URL
   ```

2. **添加到GitHub Secrets**
   ```
   1. 访问：https://github.com/你的用户名/你的仓库/settings/secrets/actions
   2. 点击"New repository secret"
   3. Name: NETLIFY_BUILD_HOOK
   4. Value: 粘贴Netlify的webhook URL
   5. 点击"Add secret"
   ```

3. **使用新的工作流**
   - 删除或禁用`scheduled-publish.yml`
   - 重命名`scheduled-publish-netlify.yml`为`scheduled-publish.yml`

## 验证是否正常工作

### 1. 检查Actions运行历史
```bash
# 在GitHub仓库页面
Actions → 选择工作流 → 查看运行历史
```

### 2. 检查常见问题

**问题：Actions没有运行**
- 确认工作流文件在`.github/workflows/`目录
- 确认文件格式正确（YAML）
- 确认Actions没有被禁用

**问题：Actions运行但Netlify没有构建**
- 检查是否有推送权限
- 确认Netlify自动部署已启用
- 查看Actions日志中的错误信息

**问题：定时触发不工作**
- GitHub Actions的定时任务可能会延迟
- 免费账户在仓库60天无活动后会禁用定时触发
- 需要在仓库有活动（如提交）来重新激活

### 3. 手动测试
```bash
# 1. 手动运行工作流
在GitHub Actions页面点击"Run workflow"

# 2. 查看日志
点击运行的工作流查看详细日志

# 3. 确认Netlify构建
检查Netlify控制台是否有新的部署
```

## 定时发布文章的要求

确保文章的frontmatter正确设置：
```yaml
---
publishedTime: "2024-12-25T10:00:00"  # 未来的时间
isDraft: false  # 必须为false
---
```

## 故障排除命令

```bash
# 测试preview-scheduled脚本
npm run preview-scheduled

# 查看定时文章
node scripts/preview-scheduled.js

# 手动构建测试
npm run build
```

## 监控建议

1. **设置通知**
   - GitHub Actions失败时会发送邮件
   - 可以在Netlify设置部署通知

2. **定期检查**
   - 每周查看一次Actions运行历史
   - 确认定时发布的文章正常上线

3. **备份方案**
   - 如果自动发布失败，可以手动触发
   - 或直接在Netlify控制台触发重新部署