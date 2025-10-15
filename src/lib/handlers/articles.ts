import { getCollection } from "astro:content";

const articlesCollection = (
  await getCollection("blog", ({ data, id }) => {
    // 过滤掉en文件夹中的文章（避免重复）
    if (id.startsWith('en/')) {
      return false;
    }
    // 预览模式：显示所有文章（包括未来发布的）
    return data.isDraft !== true && data.draft !== true;
  })
).sort((a, b) => {
  const dateA = new Date(b.data.publishedTime || b.data.pubDate || '');
  const dateB = new Date(a.data.publishedTime || a.data.pubDate || '');
  return dateA.toISOString().localeCompare(dateB.toISOString());
});

export const articlesHandler = {
  allArticles: () => articlesCollection,

  mainHeadline: () => {
    const article = articlesCollection.filter(
      (article) => article.data.isMainHeadline === true
    )[0];
    if (!article)
      throw new Error(
        "Please ensure there is at least one item to display for the main headline."
      );
    return article;
  },

  subHeadlines: () => {
    const mainHeadline = articlesHandler.mainHeadline();
    const subHeadlines = articlesCollection
      .filter(
        (article) =>
          article.data.isSubHeadline === true &&
          mainHeadline.id !== article.id
      )
      .slice(0, 4);

    if (subHeadlines.length === 0)
      throw new Error(
        "Please ensure there is at least one item to display for the sub headlines."
      );
    return subHeadlines;
  },
};
