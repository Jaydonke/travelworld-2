# 文章预览模式使用说明

## 功能介绍
该脚本用于在**正常模式**和**预览模式**之间快速切换，方便管理定时发布的文章。

### 模式说明

| 模式 | 说明 | 使用场景 |
|------|------|----------|
| **正常模式** | 只显示已发布的文章，隐藏未来发布的文章 | 生产环境、正式网站 |
| **预览模式** | 显示所有非草稿文章，包括未来发布的文章 | 开发测试、内容审核 |

## 使用方法

### 1. 自动切换（推荐）
```bash
npm run toggle-preview
```
自动检测当前模式并切换到相反模式。

### 2. 切换到指定模式
```bash
# 切换到预览模式
npm run preview-mode

# 切换到正常模式  
npm run normal-mode
```

### 3. 命令行参数
```bash
# 自动切换
node scripts/toggle-preview-mode.js
node scripts/toggle-preview-mode.js toggle
node scripts/toggle-preview-mode.js t

# 指定模式
node scripts/toggle-preview-mode.js normal
node scripts/toggle-preview-mode.js n

node scripts/toggle-preview-mode.js preview  
node scripts/toggle-preview-mode.js p
```

## 功能特点

### 状态显示
- 显示当前模式（正常/预览）
- 统计文章总数
- 显示未来发布文章数量
- 显示已发布文章数量

### 智能提示
- 切换前后的模式对比
- 受影响的文章数量
- 下一步操作建议

### 安全检查
- 自动检测文件状态
- 防止重复切换
- 错误处理和恢复建议

## 使用示例

### 场景1：查看定时发布的文章
```bash
# 1. 切换到预览模式
npm run preview-mode

# 2. 启动开发服务器
npm run dev

# 3. 查看完成后切回正常模式
npm run normal-mode
```

### 场景2：发布前检查
```bash
# 1. 切换到预览模式查看所有文章
npm run toggle-preview

# 2. 构建并预览
npm run build
npm run preview

# 3. 确认无误后切回正常模式
npm run toggle-preview

# 4. 重新构建生产版本
npm run build
```

## 注意事项

1. **切换后需要重新构建**
   - 开发模式：重启 `npm run dev`
   - 生产构建：运行 `npm run build`

2. **影响范围**
   - 仅影响文章列表显示
   - 不影响文章内容和内链
   - 不修改文章发布时间

3. **建议工作流程**
   - 开发时使用预览模式
   - 发布前切换到正常模式
   - 定期检查未来文章状态

## 相关命令

| 命令 | 说明 |
|------|------|
| `npm run schedule-articles` | 添加定时发布文章 |
| `npm run show-all-publish-times` | 查看所有文章发布时间 |
| `npm run check-publish-times` | 检查文章发布时间分布 |
| `npm run verify-internal-links` | 验证内链时间线规则 |

## 文件位置
- 脚本：`scripts/toggle-preview-mode.js`
- 配置文件：`src/lib/handlers/articles.ts`
- 影响页面：所有显示文章列表的页面