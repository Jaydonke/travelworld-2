import mdx from "@astrojs/mdx";
// import node from "@astrojs/node"; // GitHub Pages 不需要
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
// import keystatic from "@keystatic/astro"; // GitHub Pages 静态模式不支持
import compress from "@playform/compress";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import AutoImport from "astro-auto-import";
import icon from "astro-icon";
import { fileURLToPath, URL } from 'url';

// https://astro.build/config
export default defineConfig({
	site: "https://Jaydonke.github.io",
	base: "/automobility-2",
	// 不需要 base 路径，因为部署在根域名
	// 取消 adapter 配置以支持静态导出到 GitHub Pages
	// adapter: node({
	// 	mode: 'standalone'
	// }),
	output: 'static', // 静态站点生成模式
	// redirects: { // 静态模式不支持服务端重定向
	// 	"/admin": "/keystatic",
	// },
	// i18n configuration must match src/config/translationData.json.ts
	i18n: {
		defaultLocale: "en",
		locales: ["en", "fr"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
	markdown: {
		shikiConfig: {
			// Shiki Themes: https://github.com/shikijs/shiki/blob/main/docs/themes.md
			theme: "dracula",
			wrap: true,
		},
	},

	integrations: [
		// example auto import component into blog post mdx files
		AutoImport({
			imports: [
				// https://github.com/delucis/astro-auto-import
				"@components/Admonition/Admonition.astro",
				"@components/Newsletter/Newsletter.astro",
			],
		}),
		mdx(),
		react(),
		icon(),
		// keystatic(), // 静态模式不支持 Keystatic
		sitemap(),
		compress({
			HTML: true,
			JavaScript: true,
			CSS: false, // enabling this can cause issues
			Image: false, // astro:assets handles this. Enabling this can dramatically increase build times
			SVG: false, // astro-icon handles this
		}),
	],

	vite: {
		plugins: [tailwindcss()],
		// stop inlining short scripts to fix issues with ClientRouter
		build: {
			assetsInlineLimit: 0,
		},
		// Disable HTTP caching for development
		server: {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0'
			}
		},
		// Force reload on file changes
		optimizeDeps: {
			force: true
		},
		resolve: {
			alias: [
				{
					find: '@components',
					replacement: fileURLToPath(new URL('./src/components', import.meta.url))
				},
				{
					find: '@layouts',
					replacement: fileURLToPath(new URL('./src/layouts', import.meta.url))
				},
				{
					find: '@assets',
					replacement: fileURLToPath(new URL('./src/assets', import.meta.url))
				},
				{
					find: '@images',
					replacement: fileURLToPath(new URL('./src/assets/images', import.meta.url))
				},
				{
					find: '@config',
					replacement: fileURLToPath(new URL('./src/config', import.meta.url))
				},
				{
					find: '@js',
					replacement: fileURLToPath(new URL('./src/js', import.meta.url))
				},
				{
					find: '@',
					replacement: fileURLToPath(new URL('./src', import.meta.url))
				}
			]
		}
	},
});
