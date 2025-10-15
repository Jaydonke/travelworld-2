import { getCollection } from "astro:content";

const authorsCollection = await getCollection("authors");

export const authorsHandler = {
  allAuthors: () => authorsCollection,
  limitAurhors: (limit: number) => authorsCollection.slice(0, limit),
  getAuthors: (authors: string[] | { collection: string; id: string }[] | undefined) => {
    if (!authors || authors.length === 0) {
      return [];
    }
    
    return authors.map((author) => {
      // Skip null/undefined entries
      if (!author) {
        return null;
      }
      
      // Handle both string array and object array formats
      const authorId = typeof author === 'string' ? author : (author?.id || null);
      
      if (!authorId) {
        console.warn('Author ID is undefined, skipping');
        return null;
      }
      
      const foundAuthor = authorsCollection.find((a) => a.id === authorId);
      if (!foundAuthor) {
        console.warn(`Author ${authorId} not found, using default`);
        // Return a default author if not found
        return authorsCollection[0] || null;
      }
      return foundAuthor;
    }).filter(Boolean); // Remove null values
  },
  findAuthor: (id: string) => {
    const author = authorsCollection.find((author) => author.id === id);
    if (!author) {
      throw new Error(`Author ${id} not found`);
    }
    return author;
  },
};
