const fs = require("fs");
const path = require("path");

const blogDir = path.join(__dirname, "..", "src", "content", "blog");

// Available authors
const availableAuthors = ["blogtonic-team", "mike-davidson", "sarah-chen", "web-reaper"];

// Update all blog posts
const folders = fs.readdirSync(blogDir);

folders.forEach((folder) => {
  const mdxPath = path.join(blogDir, folder, "index.mdx");
  
  if (fs.existsSync(mdxPath)) {
    let content = fs.readFileSync(mdxPath, "utf-8");
    
    // Replace authors field with random available author
    const randomAuthor = availableAuthors[Math.floor(Math.random() * availableAuthors.length)];
    
    content = content.replace(/authors:\s*\n\s*-\s*.+/g, `authors:\n  - ${randomAuthor}`);
    
    fs.writeFileSync(mdxPath, content);
    console.log(`Updated ${folder} with author: ${randomAuthor}`);
  }
});

console.log("All authors updated!");