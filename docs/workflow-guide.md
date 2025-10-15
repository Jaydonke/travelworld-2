# 🚀 AstroTemp 网站更新流程指南

完整的网站内容更新和替换工作流程，适用于主题转换、内容批量更新等场景。

## 📋 流程概览

```
准备阶段 → 内容替换 → 分类设置 → 配置同步 → 内链优化 → 验证发布
```

---

## 🎯 第一阶段：准备工作

### 1.1 设置作者配置

**位置：** `author/name.txt`

```bash
# 查看当前作者设置
cat author/name.txt

# 设置固定作者（例如：laura-stevens）
echo "laura-stevens" > author/name.txt

# 设置随机作者模式
echo "random" > author/name.txt
```

**选择建议：**
- 🎲 **随机模式** (`random`)：推荐用于多样化内容，避免单一作者
- 👤 **固定作者**：适用于个人博客或品牌一致性要求

### 1.2 准备新文章内容

**位置：** `newarticle/` 目录

```bash
# 清空旧文章
rm newarticle/*.html

# 添加新的HTML文章文件
# 文件格式：article1.html, article2.html, ...
```

**文章要求：**
- ✅ HTML格式，包含完整的 `<title>` 和 meta description
- ✅ 包含图片和丰富的内容结构
- ✅ 确保标题具有SEO价值和关键词

### 1.3 备份现有数据（推荐）

```bash
# 备份现有文章
cp -r src/content/articles backup/articles-$(date +%Y%m%d)

# 备份现有配置
cp src/config.js backup/config-$(date +%Y%m%d).js
```

---

## 🔄 第二阶段：内容替换

### 2.1 删除旧文章

```bash
# 删除所有现有文章
npm run delete-all-articles
```

**此步骤会：**
- 🗑️ 删除 `src/content/articles/` 下的所有文章目录
- 🖼️ 删除 `src/assets/images/articles/` 下的所有图片
- 📊 显示删除统计信息

### 2.2 添加新文章

```bash
# 批量添加新文章（改进版）
npm run add-articles-improved
```

**此脚本功能：**
- 📄 自动转换HTML到MDX格式
- 🖼️ 智能下载和处理图片
- 🎯 自动分类文章（基于智能分类系统）
- 👥 根据配置选择作者（固定/随机）
- 📅 设置合适的发布时间
- 🎬 自动转换YouTube链接为嵌入组件
- 🧹 清理Astro缓存

### 2.3 验证文章创建

```bash
# 检查创建的文章
npm run manage-links analyze

# 预览网站效果
npm run dev
```

---

## 🏷️ 第三阶段：分类设置

### 3.1 检查自动分类结果

```bash
# 查看当前分类分布
npm run category-analyze
```

### 3.2 调整分类规则（如需要）

**编辑：** `scripts/dynamic-categorization.js`

```javascript
// 添加新的分类规则
const categorizationRules = {
  // 现有规则...
  'your-new-category': {
    keywords: ['keyword1', 'keyword2', 'keyword3'],
    titlePatterns: [/pattern1/i, /pattern2/i],
    priority: 6
  }
};
```

### 3.3 创建分类页面界面

**位置：** `src/pages/categories/` 

```bash
# 为新分类创建页面
# 例如：src/pages/categories/travel-tips.astro
```

**分类页面模板：**
```astro
---
// 分类页面示例
export const prerender = true;
import BaseLayout from '@layouts/BaseLayout.astro';
import ArticleGrid from '@components/ArticleGrid.astro';
import { getCollection } from 'astro:content';

const articles = await getCollection('articles', (article) => {
  return article.data.category === 'your-category';
});
---

<BaseLayout title="Your Category">
  <ArticleGrid articles={articles} />
</BaseLayout>
```

### 3.4 更新导航菜单

**编辑：** `src/components/Navigation.astro` 或相应的导航组件

```astro
<!-- 添加新分类链接 -->
<a href="/categories/your-new-category">Your Category</a>
```

---

## ⚙️ 第四阶段：配置同步

### 4.1 准备新配置

**编辑：** `config.template.js`

```javascript
// 网站基本信息
export const CONFIG = {
  site: {
    title: "Your New Site Title",
    description: "Your new site description",
    url: "https://your-domain.com"
  },
  
  // SEO设置
  seo: {
    keywords: ["keyword1", "keyword2", "keyword3"],
    author: "Your Author Name"
  },
  
  // 主题配置
  theme: {
    primaryColor: "#your-color",
    // 其他主题设置...
  },
  
  // 社交媒体链接
  social: {
    twitter: "https://twitter.com/yourhandle",
    // 其他社交链接...
  }
};
```

### 4.2 同步配置

```bash
# 应用新配置到网站
npm run sync
```

**此步骤会：**
- 📝 更新网站标题、描述、关键词
- 🎨 应用新的主题配色
- 🔗 更新社交媒体链接
- 📄 更新meta标签和SEO设置

---

## 🔗 第五阶段：内链优化

### 5.1 清理旧内链映射

**编辑：** `src/lib/rehype/internal-links.js`

```javascript
// 清空或更新静态关键词映射
const staticKeywordMappings = {
  // 根据新内容添加重要的内链关系
  'important-keyword-1': 'target-article-slug-1',
  'important-keyword-2': 'target-article-slug-2',
  // ...
};
```

### 5.2 分析内链机会

```bash
# 分析当前内链状况
npm run manage-links analyze

# 生成详细的内链报告
npm run manage-links report
```

### 5.3 添加SEO内链

**原则：每篇文章至少1-3个内链**

```bash
# 检查特定文章的内链机会
npm run manage-links check article-slug

# 为文章推荐关键词
npm run manage-links suggest article-slug
```

**手动添加重要内链：**

1. **编辑** `src/lib/rehype/internal-links.js`
2. **在 `staticKeywordMappings` 中添加**：

```javascript
const staticKeywordMappings = {
  // 高价值关键词 -> 目标文章
  'travel tips': 'essential-travel-tips-guide',
  'budget travel': 'budget-friendly-travel-destinations',
  'adventure travel': 'extreme-adventure-destinations',
  'wellness retreats': 'top-wellness-retreats-guide',
  'family travel': 'family-friendly-vacation-spots',
  
  // 长尾关键词
  'travel on a budget': 'budget-travel-strategies',
  'solo travel safety': 'solo-travel-safety-guide',
  'sustainable tourism': 'eco-friendly-travel-tips',
  
  // 品牌相关关键词
  'travel planning': 'complete-travel-planning-guide',
  'destination guides': 'ultimate-destination-guides'
};
```

### 5.4 验证内链效果

```bash
# 重新构建并检查内链
npm run build

# 检查内链分布
npm run links-report
```

---

## ✅ 第六阶段：验证和发布

### 6.1 全面测试

```bash
# 开发环境测试
npm run dev
# 访问 http://localhost:4321

# 构建测试
npm run build
npm run preview
```

**测试检查清单：**
- ✅ 所有文章正确显示
- ✅ 图片正常加载
- ✅ 分类页面工作正常
- ✅ 内链正确跳转
- ✅ SEO信息正确
- ✅ 响应式设计正常

### 6.2 SEO检查

```bash
# 检查SEO相关设置
npm run seo-check  # 如果有此脚本
```

**手动检查：**
- 📄 页面标题和描述
- 🔗 内链密度和质量
- 🖼️ 图片alt标签
- 📱 移动端适配
- ⚡ 页面加载速度

### 6.3 提交和部署

```bash
# 提交所有更改
git add .
git commit -m "网站内容全面更新: 新主题文章和配置"

# 推送到远程仓库（触发自动部署）
git push origin main
```

---

## 🛠️ 故障排除

### 常见问题和解决方案

#### 📄 文章处理失败
```bash
# 检查HTML文件格式
npm run validate-html

# 重新运行改进版脚本
npm run add-articles-improved
```

#### 🖼️ 图片下载失败
```bash
# 批量修复图片
npm run localize-images
npm run fix-missing-images
```

#### 🔗 内链不工作
```bash
# 检查内链配置
npm run manage-links check article-slug

# 重新构建
npm run build
```

#### ⚙️ 配置同步失败
```bash
# 手动检查配置文件
node -c config.template.js

# 重新运行同步
npm run sync
```

---

## 📊 性能优化建议

### 构建优化
```bash
# 清理缓存
npm run clean

# 优化构建
npm run build -- --mode production
```

### SEO优化
- 🎯 确保每篇文章有独特的meta description
- 🔗 内链使用描述性锚文本
- 📱 确保移动端友好
- ⚡ 优化图片大小和格式

### 内容优化
- 📝 文章标题包含目标关键词
- 🏷️ 合理使用分类标签
- 🔄 定期更新内链映射
- 📈 监控用户行为数据

---

## 🔄 定期维护

### 每周任务
- 📊 检查内链报告
- 🖼️ 验证图片加载
- 📱 测试移动端体验

### 每月任务
- 🔍 SEO性能分析
- 📈 更新热门关键词内链
- 🧹 清理无效链接

### 季度任务
- 🎯 内容策略调整
- 🔄 大规模内链优化
- 📊 用户体验分析

---

*此指南确保网站更新过程的标准化和高质量，遵循SEO最佳实践并保持内容的一致性。*