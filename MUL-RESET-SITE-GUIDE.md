# 多网站自动化生成和部署系统使用指南

## 📋 目录
- [功能概述](#功能概述)
- [快速开始](#快速开始)
- [配置文件格式](#配置文件格式)
- [使用方法](#使用方法)
- [工作流程](#工作流程)
- [高级功能](#高级功能)
- [故障排除](#故障排除)

---

## 🎯 功能概述

**mul-reset-site** 是一个强大的多网站批量生成和部署工具，允许你：

✅ **批量生成多个网站**：从Excel/CSV配置文件读取多个网站配置
✅ **自动化流程**：每个网站自动执行完整的reset-site流程（13个步骤）
✅ **自动部署到GitHub**：每个网站生成后立即推送到GitHub，避免数据覆盖
✅ **配置灵活**：支持主题、域名、网站名、AdSense代码等配置
✅ **错误处理**：自动备份、错误恢复、详细日志

---

## 🚀 快速开始

### 第1步：创建配置文件

创建 `websites-config.csv` 文件（或复制 `websites-config.example.csv`）：

```csv
theme,domain,siteName,adsenseCode
Automotive & Mobility,autosite.com,AutoSite,ca-pub-1234567890123456
Travel & Adventure,travelhub.com,TravelHub,ca-pub-2345678901234567
Technology & Innovation,techvision.com,TechVision,ca-pub-3456789012345678
```

### 第2步：运行批量生成

```bash
npm run mul-reset-site
```

### 第3步：等待完成

脚本会自动：
1. 读取配置文件中的所有网站
2. 依次为每个网站执行完整的生成流程
3. 每个网站生成后自动部署到GitHub
4. 显示详细的进度和结果报告

---

## 📊 配置文件格式

### CSV格式（推荐）

**文件名**: `websites-config.csv`

**必需列**:
- `theme` - 网站主题（如：Automotive & Mobility）
- `domain` - 域名（如：example.com）
- `siteName` - 网站名称（如：Example Site）
- `adsenseCode` - Google AdSense代码（可选，格式：ca-pub-xxxxxxxxxxxxxxxx）

**示例**:
```csv
theme,domain,siteName,adsenseCode
Automotive & Mobility,autosite.com,AutoSite,ca-pub-1234567890123456
Travel & Adventure,travelhub.com,TravelHub,ca-pub-2345678901234567
Health & Wellness,healthfirst.com,HealthFirst,ca-pub-3456789012345678
Finance & Investment,moneywize.com,MoneyWize,ca-pub-4567890123456789
```

### 可选列（高级功能）

- `repoUrl` - GitHub仓库URL（如：https://github.com/user/repo.git）
- `branch` - Git分支名称（默认：main）

**完整示例**:
```csv
theme,domain,siteName,adsenseCode,repoUrl,branch
Automotive & Mobility,autosite.com,AutoSite,ca-pub-1234567890123456,https://github.com/user/auto.git,main
Travel & Adventure,travelhub.com,TravelHub,ca-pub-2345678901234567,https://github.com/user/travel.git,gh-pages
```

---

## 💻 使用方法

### 基本用法

```bash
# 处理所有网站
npm run mul-reset-site

# 或直接运行脚本
node scripts/mul-reset-site.js
```

### 高级用法

#### 1. 指定配置文件
```bash
npm run mul-reset-site -- --config=my-websites.csv
```

#### 2. 从特定位置开始
```bash
# 从第3个网站开始处理
npm run mul-reset-site -- --start=3
```

#### 3. 限制处理数量
```bash
# 只处理前5个网站
npm run mul-reset-site -- --limit=5

# 处理第3到第7个网站（共5个）
npm run mul-reset-site -- --start=3 --limit=5
```

#### 4. 组合参数
```bash
# 使用自定义配置，从第2个开始，处理3个网站
npm run mul-reset-site -- --config=sites.csv --start=2 --limit=3
```

---

## 🔄 工作流程

### 整体流程

```
读取CSV配置 → 验证配置 → 循环处理每个网站 → 生成总结报告
```

### 单个网站处理流程

对于每个网站，系统会执行以下步骤：

#### **阶段1：配置准备** (约1-2分钟)
1. ✅ 验证网站配置
2. 💾 备份当前配置
3. ✍️ 写入新配置到 `config.txt`
4. 🔧 更新 `astro.config.mjs` 中的域名
5. 🎯 写入AdSense代码到 `.env`

#### **阶段2：网站生成** (约15-30分钟)
执行完整的reset-site流程（13个步骤）：

6. 📄 清空HTML文章
7. 🗑️ 删除所有现有文章
8. 🎨 更新主题配置（AI生成）
9. 📝 更新文章配置（AI生成40篇文章配置）
10. ✍️ 生成文章内容（AI生成前25篇文章）
11. ⚙️ 同步配置到模板
12. 📰 添加新文章到网站
13. 🎯 生成新主题方向
14. 📅 生成15篇定时发布文章
15. ⏰ 设置文章定时发布
16. 🤖 生成AI图标
17. 🎨 生成图标文件
18. 🔄 更新网站图标

#### **阶段3：部署到GitHub** (约1-2分钟)
19. 📦 初始化Git仓库（如需要）
20. 🔧 配置Git用户信息
21. ➕ 添加所有文件到暂存区
22. 💾 创建Git提交
23. 🚀 推送到GitHub远程仓库

#### **阶段4：准备下一个网站** (10秒)
24. ⏳ 等待10秒（避免API限流）
25. 🔄 继续处理下一个网站

### 总时间估算

- **单个网站**: 约20-35分钟
- **3个网站**: 约1-2小时
- **5个网站**: 约2-3小时

---

## 🛠️ 高级功能

### 1. 批量部署到不同的GitHub仓库

在CSV中为每个网站指定不同的仓库：

```csv
theme,domain,siteName,adsenseCode,repoUrl
Automotive,auto.com,AutoSite,ca-pub-xxx,https://github.com/user/auto-site.git
Travel,travel.com,TravelSite,ca-pub-yyy,https://github.com/user/travel-site.git
```

### 2. 单独部署某个网站

```bash
# 只部署第5个网站
npm run mul-reset-site -- --start=5 --limit=1
```

### 3. 测试配置不部署

修改 `scripts/mul-reset-site.js`，注释掉部署部分：

```javascript
// 5. 部署到GitHub
// log('\n📦 部署到GitHub...', 'cyan');
// const deploySuccess = await deployToGitHub({ ... });
```

### 4. 自定义等待时间

在 `scripts/mul-reset-site.js` 中修改等待时间：

```javascript
// 从10秒改为30秒
await new Promise(resolve => setTimeout(resolve, 30000));
```

---

## 📋 配置文件示例

### 示例1：简单配置（3个网站）

```csv
theme,domain,siteName,adsenseCode
Automotive & Mobility,autoworld.com,AutoWorld,ca-pub-1234567890123456
Travel & Adventure,globetrotters.com,GlobeTrotters,ca-pub-2345678901234567
Technology & Innovation,techdaily.com,TechDaily,ca-pub-3456789012345678
```

### 示例2：完整配置（包含仓库信息）

```csv
theme,domain,siteName,adsenseCode,repoUrl,branch
Automotive & Mobility,autoworld.com,AutoWorld,ca-pub-1234567890123456,https://github.com/mycompany/auto.git,main
Travel & Adventure,globetrotters.com,GlobeTrotters,ca-pub-2345678901234567,https://github.com/mycompany/travel.git,main
Technology & Innovation,techdaily.com,TechDaily,ca-pub-3456789012345678,https://github.com/mycompany/tech.git,gh-pages
Health & Wellness,wellnesscentral.com,WellnessCentral,ca-pub-4567890123456789,https://github.com/mycompany/health.git,main
Finance & Investment,smartmoney.com,SmartMoney,ca-pub-5678901234567890,https://github.com/mycompany/finance.git,main
```

### 示例3：不同主题类型

```csv
theme,domain,siteName,adsenseCode
Food & Cooking,tastybites.com,TastyBites,ca-pub-1111111111111111
Fashion & Style,stylehaven.com,StyleHaven,ca-pub-2222222222222222
Sports & Fitness,fitpro.com,FitPro,ca-pub-3333333333333333
Education & Learning,smartlearn.com,SmartLearn,ca-pub-4444444444444444
Entertainment & Media,popculture.com,PopCulture,ca-pub-5555555555555555
```

---

## 🔍 故障排除

### 问题1：配置文件读取失败

**错误信息**: `配置文件不存在: websites-config.csv`

**解决方案**:
```bash
# 检查文件是否存在
ls websites-config.csv

# 或创建示例文件
cp websites-config.example.csv websites-config.csv
```

### 问题2：CSV格式错误

**错误信息**: `CSV文件缺少必需的列: theme, domain`

**解决方案**:
- 确保第一行包含表头：`theme,domain,siteName,adsenseCode`
- 检查是否使用英文逗号分隔
- 确保没有多余的空格

### 问题3：域名格式不正确

**错误信息**: `域名格式不正确`

**解决方案**:
- 使用正确的域名格式：`example.com`（不要加 http:// 或 https://）
- 确保域名只包含字母、数字、点和短横线

### 问题4：Git推送失败

**错误信息**: `推送到GitHub失败`

**解决方案**:
```bash
# 检查Git配置
git config --list

# 检查远程仓库
git remote -v

# 手动配置远程仓库
git remote add origin https://github.com/user/repo.git
```

### 问题5：OpenAI API配额不足

**错误信息**: `Rate limit exceeded` 或 `Quota exceeded`

**解决方案**:
- 检查OpenAI账户配额
- 减少同时处理的网站数量
- 增加网站之间的等待时间

### 问题6：内存不足

**错误信息**: `JavaScript heap out of memory`

**解决方案**:
```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# Windows:
set NODE_OPTIONS=--max-old-space-size=4096

# 然后重新运行
npm run mul-reset-site
```

### 问题7：中途停止后如何继续

如果脚本在第3个网站时停止，可以从第4个继续：

```bash
npm run mul-reset-site -- --start=4
```

---

## 📊 输出和日志

### 执行过程中的输出

脚本会显示详细的进度信息：

```
███████████████████████████████████████████████████████████
█                                                         █
█      多网站自动化生成和部署系统                         █
█      Multi-Website Automation System                    █
█                                                         █
███████████████████████████████████████████████████████████

📖 读取网站配置列表...
✅ 成功读取 5 个网站配置

📊 将处理第 1 到第 5 个网站 (共 5 个)

📋 待处理网站列表:
   1. AutoSite (autosite.com) - Automotive & Mobility
   2. TravelHub (travelhub.com) - Travel & Adventure
   3. TechVision (techvision.com) - Technology & Innovation
   4. HealthFirst (healthfirst.com) - Health & Wellness
   5. MoneyWize (moneywize.com) - Finance & Investment

═══════════════════════════════════════════════════════════
   网站 1/5: AutoSite
═══════════════════════════════════════════════════════════

📋 验证网站配置...
   主题: Automotive & Mobility
   域名: autosite.com
   网站名: AutoSite
   AdSense: ca-pub-1234567890123456

💾 备份当前配置...
✅ 配置已备份: config.backup.2025-10-15T10-30-45Z.txt

✍️  写入网站配置...
✅ 配置已写入: config.txt
✅ astro.config.mjs 已更新: https://autosite.com
✅ AdSense代码已写入 .env 文件

🚀 执行网站生成流程...
[1/13] 清空HTML文章
   ✅ 清空HTML文章 完成
...
[13/13] 更新网站图标
   ✅ 更新网站图标 完成

📦 部署到GitHub...
✅ 成功推送到GitHub

🎉 网站 "AutoSite" 生成并部署成功！
   用时: 23.5 分钟

⏳ 等待 10 秒后处理下一个网站...
```

### 最终总结报告

```
═══════════════════════════════════════════════════════════
                    执行完成总结
═══════════════════════════════════════════════════════════

📊 执行统计:
   ✅ 成功: 5/5
   ❌ 失败: 0/5
   ⏱️  总用时: 125.3 分钟

📋 详细结果:
   ✅ AutoSite (autosite.com)
   ✅ TravelHub (travelhub.com)
   ✅ TechVision (techvision.com)
   ✅ HealthFirst (healthfirst.com)
   ✅ MoneyWize (moneywize.com)

🎉 所有网站生成并部署成功！
```

---

## ⚙️ 系统要求

### 必需
- Node.js 18+
- npm 或 yarn
- Git
- OpenAI API密钥

### 推荐
- 至少8GB RAM
- 稳定的网络连接
- GitHub账户和Personal Access Token

---

## 🎓 最佳实践

### 1. 测试配置

在批量处理前，先测试单个网站：

```csv
theme,domain,siteName,adsenseCode
Test Theme,test.com,TestSite,ca-pub-1234567890123456
```

```bash
npm run mul-reset-site -- --limit=1
```

### 2. 分批处理

不要一次处理太多网站，建议每批5-10个：

```bash
# 第一批：1-5
npm run mul-reset-site -- --start=1 --limit=5

# 第二批：6-10
npm run mul-reset-site -- --start=6 --limit=5
```

### 3. 监控资源

- 定期检查OpenAI API使用量
- 监控服务器内存和磁盘空间
- 确保网络连接稳定

### 4. 备份重要数据

脚本会自动备份 `config.txt`，但建议也手动备份：
- 整个项目文件夹
- `.env` 文件
- `src/content/` 目录

### 5. 使用Git分支

为每个网站创建独立分支：

```csv
theme,domain,siteName,adsenseCode,branch
Auto,auto.com,AutoSite,ca-pub-xxx,site-auto
Travel,travel.com,TravelSite,ca-pub-yyy,site-travel
```

---

## 📚 相关文档

- [README.md](README.md) - 项目总体说明
- [ARTICLE_GENERATION_WORKFLOW.md](ARTICLE_GENERATION_WORKFLOW.md) - 文章生成工作流程
- [scripts/reset-site.js](scripts/reset-site.js) - 单网站生成脚本
- [scripts/deploy-to-github.js](scripts/deploy-to-github.js) - GitHub部署脚本

---

## 🆘 获取帮助

如果遇到问题：

1. 查看本文档的[故障排除](#故障排除)部分
2. 检查脚本输出的错误信息
3. 查看 `config.backup.*` 文件恢复配置
4. 提交Issue到项目仓库

---

**最后更新**: 2025年10月15日
**版本**: 1.0.0
