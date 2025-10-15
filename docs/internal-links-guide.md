# 🔗 内链系统使用指南

## 概述

网站现在拥有一个智能的内链系统，可以自动为新文章生成相关内链，无需手动维护大量关键词映射。

## 系统特点

### ✅ 自动化
- **动态关键词生成**：从文章标题和类别自动提取关键词
- **智能映射**：自动建立关键词到文章的链接关系
- **构建时处理**：在网站构建时自动添加内链

### ✅ 灵活性
- **静态 + 动态**：结合手动维护的重要链接和自动生成的链接
- **优先级控制**：静态关键词优先级更高
- **质量过滤**：自动过滤常见停词和无意义关键词

### ✅ 管理工具
- **分析工具**：查看当前内链状况
- **检查工具**：检查特定文章的内链机会
- **报告生成**：生成详细的内链报告

## 工作原理

### 1. 静态关键词映射
位于 `src/lib/rehype/internal-links.js` 中的 `staticKeywordMappings`，包含手动维护的重要内链：

```javascript
const staticKeywordMappings = {
  'wellness retreats': 'escape-to-top-wellness-retreats-for-a-refreshing-getaway',
  'adventure travel': 'discover-exciting-adventure-travel-destinations-and-tips',
  // ...更多手动维护的关键词
};
```

### 2. 动态关键词生成
系统会自动从每篇文章中提取：
- **标题关键词**：从文章标题中提取有意义的词汇
- **类别关键词**：基于文章类别添加相关关键词
- **短语生成**：从标题生成2-4个词的有意义短语
- **特殊关键词**：基于内容特征添加专门的旅行术语

### 3. 构建时处理
使用 Rehype 插件在 MDX 处理过程中：
- 扫描文章内容中的关键词
- 自动创建到相关文章的链接
- 避免自链接和重复链接

## 使用方法

### 为新文章添加内链

1. **自动处理**（推荐）
   - 新文章会自动获得相关内链
   - 无需手动操作
   - 基于标题和类别自动匹配

2. **手动检查**
   ```bash
   # 检查特定文章的内链机会
   npm run manage-links check your-article-slug
   
   # 为新文章推荐关键词
   npm run manage-links suggest your-article-slug
   ```

3. **分析整体状况**
   ```bash
   # 查看当前内链概况
   npm run links-analyze
   
   # 生成详细报告
   npm run links-report
   ```

### 添加重要的静态关键词

对于重要的内链关系，建议添加到静态映射中：

1. 编辑 `src/lib/rehype/internal-links.js`
2. 在 `staticKeywordMappings` 中添加新的关键词映射：
   ```javascript
   const staticKeywordMappings = {
     // 现有映射...
     'your-important-keyword': 'target-article-slug',
   };
   ```

### 管理命令

```bash
# 完整分析
npm run manage-links analyze

# 检查特定文章
npm run manage-links check <article-slug>

# 推荐关键词
npm run manage-links suggest <article-slug>

# 生成报告
npm run manage-links report
```

## 最佳实践

### ✅ 推荐做法

1. **新文章发布前检查**
   ```bash
   npm run manage-links check new-article-slug
   ```

2. **定期生成报告**
   ```bash
   npm run links-report
   ```

3. **重要关键词手动维护**
   - 将核心业务关键词添加到静态映射
   - 确保重要文章之间的链接关系

4. **合理的文章标题**
   - 使用清晰的关键词
   - 避免过于抽象的标题
   - 包含相关的旅行术语

### ❌ 避免的做法

1. **不要过度依赖动态生成**
   - 重要的内链关系应该手动维护
   
2. **不要忽略内链质量**
   - 定期检查生成的内链是否合理

3. **不要使用过于通用的标题**
   - 避免"Tips"、"Guide"等过于宽泛的词汇

## 系统维护

### 添加新的关键词类别

在 `src/lib/utils/dynamic-internal-links.js` 中的 `TRAVEL_KEYWORD_CATEGORIES` 添加新类别：

```javascript
const TRAVEL_KEYWORD_CATEGORIES = {
  // 现有类别...
  'new-category': ['keyword1', 'keyword2', 'keyword3'],
};
```

### 改进关键词生成算法

在 `generateSpecialKeywords` 函数中添加新的规则：

```javascript
if (titleLower.includes('your-pattern')) {
  keywords.push('related-keyword1', 'related-keyword2');
}
```

### 文章类别映射

在 `categoryKeywords` 对象中为新类别添加关键词：

```javascript
const categoryKeywords = {
  'your-new-category': ['keyword1', 'keyword2', 'keyword3'],
};
```

## 性能考虑

- **构建时处理**：内链在构建时生成，不影响运行时性能
- **缓存机制**：动态关键词映射在构建过程中缓存
- **质量过滤**：自动过滤低质量关键词减少噪音

## 故障排除

### 问题：新文章没有内链
- 检查文章标题是否包含有意义的关键词
- 确认文章类别设置正确
- 运行 `npm run manage-links check article-slug` 查看详情

### 问题：内链质量不高
- 将重要关键词添加到静态映射
- 改进文章标题，使用更具体的术语
- 检查停词列表是否需要更新

### 问题：构建错误
- 检查动态内链文件路径是否正确
- 确认所有依赖项已安装
- 查看构建日志中的具体错误信息

## 未来改进

- [ ] 基于内容相似度的智能关键词匹配
- [ ] 内链密度优化建议
- [ ] A/B测试不同内链策略的效果
- [ ] 与分析工具集成，追踪内链点击率

---

*这个系统让你可以专注于创作高质量内容，而内链会自动为你处理！*