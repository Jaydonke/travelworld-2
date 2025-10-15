#!/usr/bin/env node

/**
 * 更新页脚和翻译配置脚本
 * 
 * 功能：更新页脚链接和翻译文本
 * 使用方法：npm run update-footer-translations
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

async function updateTranslations() {
  console.log(colors.blue('🌐 正在更新翻译配置...'));
  
  const translationFile = path.join(process.cwd(), 'src/config/translationData.json.ts');
  
  try {
    let content = await fs.readFile(translationFile, 'utf-8');
    
    // 更新hero_description
    const oldDescription = 'Get your blog running in a snap. Multiple pages and sections, i18n, animations, CMS - all ready to go.';
    const newDescription = 'Master digital marketing with proven SEO strategies, content optimization techniques, and data-driven growth solutions for sustainable business growth.';
    
    if (content.includes(oldDescription)) {
      content = content.replace(oldDescription, newDescription);
      console.log(colors.cyan('   ✅ 更新英文版 hero_description'));
    }
    
    // 更新法语版（如果需要）
    const oldFrDescription = 'Lancez votre blog en un clin d\'œil. Plusieurs pages et sections, i18n, animations, CMS - tout est prêt à l\'emploi.';
    const newFrDescription = 'Maîtrisez le marketing digital avec des stratégies SEO éprouvées, des techniques d\'optimisation de contenu et des solutions basées sur les données.';
    
    if (content.includes(oldFrDescription)) {
      content = content.replace(oldFrDescription, newFrDescription);
      console.log(colors.cyan('   ✅ 更新法语版 hero_description'));
    }
    
    await fs.writeFile(translationFile, content, 'utf-8');
    console.log(colors.green('✅ 翻译配置更新成功'));
    
  } catch (error) {
    console.error(colors.red('❌ 更新翻译配置失败:'), error.message);
  }
}

async function updateFooter() {
  console.log(colors.blue('🦶 正在更新页脚组件...'));
  
  const footerFile = path.join(process.cwd(), 'src/components/Footer/Footer.astro');
  
  try {
    // 删除原文件
    await fs.unlink(footerFile);
    
    // 创建新的页脚文件
    const newFooterContent = `---
import FooterLink from "@components/Footer/FooterLink.astro";
import { getLocaleFromUrl } from "@js/localeUtils";
import { getTranslatedData } from "@js/translationUtils";
import { UI_CONFIG } from "@/lib/config";
import { getLocalizedRoute } from "@/js/translationUtils";

const currLocale = getLocaleFromUrl(Astro.url);
const siteData = getTranslatedData("siteData", currLocale);

const today = new Date();
---

<div class="bg-base-800 mt-20">
	<footer class="xs:px-10 m-auto max-w-3xl px-4 pb-2">
		<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
			<!-- Navigation -->
			<div class="flex flex-col">
				<h3 class="text-base-100 mt-6 mb-2 text-lg font-semibold">{UI_CONFIG.footer.sections.navigation.title}</h3>
				{UI_CONFIG.footer.sections.navigation.links.map(link => (
					<FooterLink href={getLocalizedRoute(currLocale, link.href)}>{link.text}</FooterLink>
				))}
			</div>

			<!-- Legal -->
			<div class="flex flex-col">
				<h3 class="text-base-100 mt-6 mb-2 text-lg font-semibold">{UI_CONFIG.footer.sections.legal.title}</h3>
				{UI_CONFIG.footer.sections.legal.links.map(link => (
					<FooterLink href={getLocalizedRoute(currLocale, link.href)}>{link.text}</FooterLink>
				))}
			</div>

			<!-- Social -->
			<div class="flex flex-col">
				<h3 class="text-base-100 mt-6 mb-2 text-lg font-semibold">{UI_CONFIG.footer.sections.social.title}</h3>
				{UI_CONFIG.footer.sections.social.links.map(link => (
					<FooterLink href={link.href} newTab={link.newTab}>{link.text}</FooterLink>
				))}
			</div>
		</div>

		<div class="text-base-100/70 mt-10 text-center text-sm">
			&copy; {today.getFullYear()}
			{" "}{siteData.name}. All rights reserved.
		</div>
	</footer>
</div>`;
    
    await fs.writeFile(footerFile, newFooterContent, 'utf-8');
    console.log(colors.green('✅ 页脚组件更新成功'));
    
  } catch (error) {
    console.error(colors.red('❌ 更新页脚组件失败:'), error.message);
    
    // 如果失败，尝试使用简单的硬编码版本
    console.log(colors.yellow('⚠️  尝试使用硬编码版本...'));
    
    const simpleFooterContent = `---
import FooterLink from "@components/Footer/FooterLink.astro";
import { getLocaleFromUrl } from "@js/localeUtils";
import { getTranslatedData } from "@js/translationUtils";

import { getLocalizedRoute } from "@/js/translationUtils";

const currLocale = getLocaleFromUrl(Astro.url);
const siteData = getTranslatedData("siteData", currLocale);

const today = new Date();
---

<div class="bg-base-800 mt-20">
	<footer class="xs:px-10 m-auto max-w-3xl px-4 pb-2">
		<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
			<!-- Navigation -->
			<div class="flex flex-col">
				<h3 class="text-base-100 mt-6 mb-2 text-lg font-semibold">Navigation</h3>
				<FooterLink href={getLocalizedRoute(currLocale, "/")}>Home</FooterLink>
				<FooterLink href={getLocalizedRoute(currLocale, "/blog")}>Blog</FooterLink>
				<FooterLink href={getLocalizedRoute(currLocale, "/categories")}>Categories</FooterLink>
				<FooterLink href={getLocalizedRoute(currLocale, "/about")}>About</FooterLink>
				<FooterLink href={getLocalizedRoute(currLocale, "/contact")}>Contact</FooterLink>
			</div>

			<!-- Legal -->
			<div class="flex flex-col">
				<h3 class="text-base-100 mt-6 mb-2 text-lg font-semibold">Legal</h3>
				<FooterLink href={getLocalizedRoute(currLocale, "/privacy")}>Privacy Policy</FooterLink>
				<FooterLink href={getLocalizedRoute(currLocale, "/terms")}>Terms of Service</FooterLink>
				<FooterLink href={getLocalizedRoute(currLocale, "/cookie-policy")}>Cookie Policy</FooterLink>
				<FooterLink href={getLocalizedRoute(currLocale, "/contact")}>Support</FooterLink>
			</div>

			<!-- Social -->
			<div class="flex flex-col">
				<h3 class="text-base-100 mt-6 mb-2 text-lg font-semibold">Stay Connected</h3>
				<FooterLink href="https://twitter.com/optinook" newTab={true}>@optinook</FooterLink>
				<FooterLink href="https://www.linkedin.com/company/optinook" newTab={true}>LinkedIn</FooterLink>
				<FooterLink href="https://www.facebook.com/optinook" newTab={true}>Facebook</FooterLink>
			</div>
		</div>

		<div class="text-base-100/70 mt-10 text-center text-sm">
			&copy; {today.getFullYear()}
			{" "}{siteData.name}. All rights reserved.
		</div>
	</footer>
</div>`;
    
    try {
      await fs.writeFile(footerFile, simpleFooterContent, 'utf-8');
      console.log(colors.green('✅ 页脚组件更新成功（硬编码版本）'));
    } catch (err) {
      console.error(colors.red('❌ 无法更新页脚组件'));
    }
  }
}

async function main() {
  console.log(colors.bold(colors.cyan('\n🚀 OptiNook 页脚和翻译更新工具\n')));
  console.log('此工具将更新页脚链接和翻译文本');
  console.log(colors.yellow('⚠️  请确保已关闭开发服务器\n'));
  
  try {
    // 1. 更新翻译
    await updateTranslations();
    
    // 2. 更新页脚
    await updateFooter();
    
    console.log(colors.green(colors.bold('\n🎉 更新完成！')));
    console.log(colors.yellow('\n📌 下一步操作:'));
    console.log('1. 运行 npm run dev 查看更改效果');
    console.log('2. 检查页脚链接是否正确');
    console.log('3. 检查主页描述是否已更新\n');
    
  } catch (error) {
    console.error(colors.red(colors.bold('\n💥 更新过程中发生错误:')), error.message);
    console.log(colors.yellow('\n🔧 故障排除建议:'));
    console.log('1. 确保已关闭开发服务器');
    console.log('2. 检查文件权限');
    console.log('3. 尝试重启命令行工具\n');
    process.exit(1);
  }
}

// 运行脚本
main();

export { main };