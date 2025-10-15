# 🔧 Scripts 使用指南

## 🚀 新文章添加 (主要功能)

| 命令 | 功能 | 推荐度 |
|------|------|--------|
| `npm run add-articles-enhanced` | ⭐ **增强版一键添加** | ⭐⭐⭐⭐⭐ |
| `npm run add-articles` | 基础版添加 | ⭐⭐⭐ |
| `npm run convert-html` | HTML转MDX | ⭐⭐⭐⭐ |

## 🖼️ 图片处理

| 命令 | 功能 | 用途 |
|------|------|------|
| `npm run fix-cover-paths` | 修复封面路径为@assets | 必需 |
| `npm run localize-images` | 下载外部图片到本地 | 推荐 |
| `npm run fix-images-comprehensive` | 全面图片问题检查 | 推荐 |
| `npm run check-images` | 检查图片状态 | 验证 |
| `npm run ensure-images` | 确保图片存在 | 修复 |

## 🔧 内容修复

| 命令 | 功能 | 场景 |
|------|------|------|
| `npm run fix-all` | 修复所有常见问题 | 通用修复 |
| `npm run fix-mdx-codeblocks` | 修复代码块格式 | 代码显示问题 |
| `npm run fix-youtube-links` | 修复YouTube链接 | 视频嵌入 |
| `npm run remove-duplicate-titles` | 移除重复标题 | 格式清理 |

## ⏰ 时间和元数据

| 命令 | 功能 | 说明 |
|------|------|------|
| `npm run update-publish-times` | 更新发布时间 | 2025年6月-现在 |
| `npm run update-authors` | 更新作者信息 | 随机分配作者 |

## 🔗 链接管理

| 脚本文件 | 功能 | 使用方式 |
|----------|------|----------|
| `add-internal-external-links.js` | 添加内链外链 | `node scripts/add-internal-external-links.js` |
| `check-links-coverage.js` | 检查链接覆盖率 | `node scripts/check-links-coverage.js` |

## ✅ 验证和测试

| 命令 | 功能 | 重要性 |
|------|------|--------|
| `npm run test-workflow` | ⭐ **完整工作流程测试** | ⭐⭐⭐⭐⭐ |
| `npm run test-image-localization` | 测试图片本地化 | ⭐⭐⭐ |

## 🎯 高级自动化

| 命令 | 功能 | 场景 |
|------|------|------|
| `npm run super-automation` | 超级自动化处理 | 复杂问题 |
| `npm run smart-fix` | 智能修复 | AI辅助 |
| `npm run one-click-article` | 一键文章处理 | 快速处理 |

## 📋 批量操作

| 命令 | 功能 | 用途 |
|------|------|------|
| `npm run replace-articles` | 批量替换文章 | 内容更新 |
| `npm run reprocess-all` | 重新处理所有文章 | 全面更新 |

---

## 🎯 推荐工作流程

### 新文章上传
```bash
# 1. 放置HTML文件到 newarticle/ 目录
# 2. 一键处理
npm run add-articles-enhanced
# 3. 验证结果
npm run test-workflow
```

### 问题修复
```bash
# 图片问题
npm run fix-images-comprehensive
npm run localize-images

# 格式问题
npm run fix-all
npm run fix-mdx-codeblocks

# 验证
npm run test-workflow
```

### 链接优化
```bash
# 添加内链外链
node scripts/add-internal-external-links.js
# 检查覆盖率
node scripts/check-links-coverage.js
```

---

## ⚠️ 注意事项

1. **先验证再上线**: 总是运行 `test-workflow` 确认无误
2. **图片本地化**: 新文章务必运行 `localize-images`
3. **内链更新**: 新主题文章需要手动更新关键词映射
4. **备份重要**: 批量操作前建议备份

## 📞 故障排除

- **脚本报错**: 检查文件路径和权限
- **图片缺失**: 运行 `localize-images` 和 `check-images`
- **格式错误**: 运行 `fix-all` 和相关修复脚本
- **链接问题**: 检查内链外链脚本配置