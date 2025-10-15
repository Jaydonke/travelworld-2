import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// 定义blog collection的schema
const blogCollection = defineCollection({
  loader: glob({ pattern: "**/index.mdx", base: "./src/content/blog" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    publishedTime: z.string().or(z.date()).optional(),
    pubDate: z.string().or(z.date()).optional(),
    lastModified: z.string().or(z.date()).optional(),
    cover: image().optional(),
    authors: z.array(z.string()).optional(),
    author: z.string().optional(),
    category: z.string().optional(),
    categories: z.array(z.string()).optional(),
    isDraft: z.boolean().default(false),
    draft: z.boolean().default(false),
    isMainHeadline: z.boolean().default(false),
    isSubHeadline: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
  }),
});

// 定义authors collection的schema
const authorCollection = defineCollection({
  loader: glob({ pattern: "**/index.mdx", base: "./src/content/authors" }),
  schema: ({ image }) => z.object({
    name: z.string(),
    job: z.string().optional(),
    bio: z.string().optional(),
    avatar: image().optional(),
    social: z.object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      email: z.string().optional(),
    }).optional(),
  }),
});

// 向后兼容：创建articles的别名，指向blog目录
const articleCollection = defineCollection({
  loader: glob({ pattern: "**/index.mdx", base: "./src/content/blog" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    publishedTime: z.string().or(z.date()).optional(),
    pubDate: z.string().or(z.date()).optional(),
    lastModified: z.string().or(z.date()).optional(),
    cover: image().optional(),
    authors: z.array(z.string()).optional(),
    author: z.string().optional(),
    category: z.string().optional(),
    categories: z.array(z.string()).optional(),
    isDraft: z.boolean().default(false),
    draft: z.boolean().default(false),
    isMainHeadline: z.boolean().default(false),
    isSubHeadline: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
  }),
});

// 定义空的collections以避免错误
const viewCollection = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/views" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const categoryCollection = defineCollection({
  loader: glob({ pattern: "**/index.json", base: "./src/content/categories" }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
});

// 定义otherPages collection为空集合以避免错误
const otherPagesCollection = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/otherPages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

// 定义tags collection为空集合以避免错误
const tagsCollection = defineCollection({
  loader: glob({ pattern: "**/index.json", base: "./src/content/tags" }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
  articles: articleCollection, // 向后兼容
  authors: authorCollection,
  views: viewCollection,
  categories: categoryCollection,
  otherPages: otherPagesCollection,
  tags: tagsCollection,
};
