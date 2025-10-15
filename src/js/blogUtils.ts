import { type CollectionEntry, getCollection } from "astro:content";

import { locales } from "@/config/siteSettings.json";
import { filterCollectionByLanguage, removeLocaleFromSlug } from "@/js/localeUtils";
import { slugify } from "@/js/textUtils";

// --------------------------------------------------------
/**
 * * get all blog posts in a formatted array
 * @param lang: string (optional) - language to filter by (matching a locale in i18nUtils.ts)
 * @returns all blog posts, filtered for drafts, sorted by date, future posts removed, locale removed from slug, and filtered by language if passed
 *
 * ## Examples
 *
 * ### If not using i18n features
 * ```ts
 * const posts = await getAllPosts();
 * ```
 *
 * ### If using i18n features
 * ```ts
 * const posts = await getAllPosts("en");
 * ```
 * or
 * ```ts
 * const currentLocale = getLocaleFromUrl(Astro.url);
 * const posts = await getAllPosts(currentLocale);
 * ```
 */
export async function getAllPosts(
	lang?: (typeof locales)[number],
): Promise<CollectionEntry<"blog">[]> {
	const posts = await getCollection("blog", ({ data, id }) => {
		// filter out en folder duplicates
		if (id.startsWith('en/')) {
			return false;
		}
		// filter out draft posts (handle both draft and isDraft)
		return data.draft !== true && data.isDraft !== true;
	});

	// Map new field names to old ones for compatibility
	const mappedPosts = posts.map(post => {
		const mappedPost = { ...post };
		if (!mappedPost.data.pubDate && mappedPost.data.publishedTime) {
			mappedPost.data.pubDate = mappedPost.data.publishedTime;
		}
		if (!mappedPost.data.categories && mappedPost.data.category) {
			mappedPost.data.categories = [mappedPost.data.category];
		}
		return mappedPost;
	});

	// if a language is passed, filter the posts by that language
	let filteredPosts: CollectionEntry<"blog">[];
	// Skip language filtering for now since we're not using i18n properly
	// All our posts are in the root, not in language folders
	filteredPosts = mappedPosts;
	
	// Original code kept for reference:
	// if (lang) {
	//     filteredPosts = filterCollectionByLanguage(mappedPosts, lang) as CollectionEntry<"blog">[];
	// } else {
	//     filteredPosts = mappedPosts;
	// }

	// 检查是否为预览模式 - 通过检查当前articles handler的配置
	let isPreviewMode = false;
	try {
		// 读取articles handler文件来检测当前模式
		const fs = await import('fs');
		const path = await import('path');
		const handlerPath = path.resolve('./src/lib/handlers/articles.ts');
		if (fs.existsSync(handlerPath)) {
			const handlerContent = fs.readFileSync(handlerPath, 'utf8');
			// 检查是否包含预览模式的注释和代码
			isPreviewMode = handlerContent.includes('// 预览模式：显示所有文章') && 
							handlerContent.includes('return data.isDraft !== true && data.draft !== true;');
		}
	} catch (error) {
		// 如果读取失败，默认使用正常模式
		isPreviewMode = false;
	}

	// filter out future posts and sort by date
	const formattedPosts = formatPosts(filteredPosts, {
		filterOutFuturePosts: !isPreviewMode, // 预览模式下不过滤未来文章
		sortByDate: true,
		limit: undefined,
		removeLocale: true,
	});

	return formattedPosts;
}

// --------------------------------------------------------
/**
 * * returns all blog posts in a formatted array
 * @param posts: CollectionEntry<"blog">[] - array of posts, unformatted
 * note: this has an optional options object, params below
 * @param filterOutFuturePosts: boolean - if true, filters out future posts
 * @param sortByDate: boolean - if true, sorts posts by date
 * @param limit: number - if number is passed, limits the number of posts returned
 * @returns formatted blog posts according to passed parameters
 */
interface FormatPostsOptions {
	filterOutFuturePosts?: boolean;
	sortByDate?: boolean;
	limit?: number;
	removeLocale?: boolean;
}

export function formatPosts(
	posts: CollectionEntry<"blog">[],
	{
		filterOutFuturePosts = true,
		sortByDate = true,
		limit = undefined,
		removeLocale = true,
	}: FormatPostsOptions = {},
): CollectionEntry<"blog">[] {
	const filteredPosts = posts.reduce((acc: CollectionEntry<"blog">[], post) => {
		// Use publishedTime or pubDate, whichever is available
		const postDate = post.data.publishedTime || post.data.pubDate;

		// filterOutFuturePosts if true
		if (filterOutFuturePosts && postDate && new Date(postDate) > new Date()) return acc;

		// add post to acc
		acc.push(post);

		return acc;
	}, []);

	// now we have filteredPosts
	// sortByDate or randomize
	if (sortByDate) {
		filteredPosts.sort(
			(a: CollectionEntry<"blog">, b: CollectionEntry<"blog">) => {
				const dateA = a.data.publishedTime || a.data.pubDate;
				const dateB = b.data.publishedTime || b.data.pubDate;
				return new Date(dateB).getTime() - new Date(dateA).getTime();
			}
		);
	} else {
		filteredPosts.sort(() => Math.random() - 0.5);
	}

	// remove locale from URL
	if (removeLocale) {
		filteredPosts.forEach((post) => {
			// console.log("removing locale from slug for post", post.id);
			post.id = removeLocaleFromSlug(post.id);
		});
	}

	// limit if number is passed
	if (typeof limit === "number") {
		return filteredPosts.slice(0, limit);
	}

	return filteredPosts;
}

// --------------------------------------------------------
/**
 * * returns true if the posts are related to each other
 * @param postOne: CollectionEntry<"blog">
 * @param postTwo: CollectionEntry<"blog">
 * @returns true if the posts are related, false if not
 *
 * note: this currently compares by categories
 *
 * In a production site, you might want to implement a more robust algorithm, choosing related posts based on tags, categories, dates, authors, or keywords.
 * See example: https://blog.codybrunner.com/2024/adding-related-articles-with-astro-content-collections/
 */
export function arePostsRelated(
	postOne: CollectionEntry<"blog">,
	postTwo: CollectionEntry<"blog">,
): boolean {
	// if titles are the same, then they are the same post. return false
	if (postOne.id === postTwo.id) return false;

	// Handle both categories and category fields
	const postOneCats = postOne.data.categories || (postOne.data.category ? [postOne.data.category] : []);
	const postTwoCats = postTwo.data.categories || (postTwo.data.category ? [postTwo.data.category] : []);

	// if either post has no categories, return false
	if (!postOneCats || !postTwoCats || postOneCats.length === 0 || postTwoCats.length === 0)
		return false;

	const postOneCategories = postOneCats
		.filter((category): category is string => typeof category === "string")
		.map((category) => slugify(category));

	const postTwoCategories = postTwoCats
		.filter((category): category is string => typeof category === "string")
		.map((category) => slugify(category));

	// if any tags or categories match, return true
	const categoriesMatch = postOneCategories.some((category) =>
		postTwoCategories.includes(category),
	);

	return categoriesMatch;
}

// --------------------------------------------------------
/**
 * * returns an array of processed items, sorted by count
 * @param items: string[] - array of items to count and sort
 * @returns object with counts of each item in the array
 *
 * note: return looks like { productivity: 2, 'cool-code': 1 }
 */

export function countItems(items: string[]): object {
	// get counts of each item in the array
	const countedItems = items.reduce((acc, item) => {
		// Skip undefined, null, or empty items
		if (!item) return acc;
		
		const slugifiedItem = slugify(item);
		const val = acc[slugifiedItem] || 0;

		return {
			...acc,
			[slugifiedItem]: val + 1,
		};
	}, {});

	return countedItems;
}

// --------------------------------------------------------
/**
 * * returns array of arrays, sorted by value (high value first)
 * @param jsObj: object - array of "key: value" pairs to sort
 * @returns array of arrays with counts, sorted by count
 *
 * note: return looks like [ [ 'productivity', 2 ], [ 'cool-code', 1 ] ]
 * note: this is used for tag and category cloud ordering
 */
export function sortByValue(jsObj: object): [string, number][] {
	const array: [string, number][] = [];
	for (const i in jsObj) {
		array.push([i, jsObj[i]]);
	}

	const sorted = array.sort((a, b) => {
		return b[1] - a[1];
	});

	// looks like [ [ 'productivity', 2 ], [ 'cool-code', 1 ] ]
	return sorted;
}
