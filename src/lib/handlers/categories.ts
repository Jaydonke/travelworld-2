import { getCollection } from "astro:content";
import { articlesHandler } from "./articles";

const categoriesCollection = await getCollection('categories');

export const categoriesHandler = {
    allCategories: () => categoriesCollection.sort((a, b) => {
        const nameA = a.data.name || '';
        const nameB = b.data.name || '';
        return nameA.localeCompare(nameB);
    }),
    oneCategory: (categoryId: string) => {
        const category = categoriesCollection.find((category) => category.id === categoryId);
        if (!category) {
            throw new Error(`Category with id ${categoryId} not found`);
        }
        return category;
    },
    allCategoriesWithLatestArticles: () => {
        return categoriesCollection.map((category) => {
            const articles = articlesHandler.allArticles()
                .filter((article) => {
                    // Handle both single category string and array of categories
                    const articleCategories = article.data.categories || 
                                            (article.data.category ? [article.data.category] : []);
                    return articleCategories.includes(category.id);
                });
            return {
                ...category,
                data: {
                    ...category.data,
                    count: articles.length,
                    latestArticles: articles.slice(0, 3)
                }
            }
        })
    }
}