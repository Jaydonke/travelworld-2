#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix PostCard.astro
const postCardPath = path.join(__dirname, '../src/components/PostCard/PostCard.astro');
let postCardContent = fs.readFileSync(postCardPath, 'utf8');

// Replace the Image block with conditional rendering
postCardContent = postCardContent.replace(
  `			<figure class="aspect-[374/195] overflow-hidden rounded-md">
				<Image
					src={cover}
					alt={\`cover for \${title}\`}
					height={700}
					quality="high"
					class="h-full w-full object-cover"
					transition:name={\`blog-image-\${post.id}\`}
				/>
			</figure>`,
  `			<figure class="aspect-[374/195] overflow-hidden rounded-md">
				{cover ? (
					<Image
						src={cover}
						alt={\`cover for \${title}\`}
						height={700}
						quality="high"
						class="h-full w-full object-cover"
						transition:name={\`blog-image-\${post.id}\`}
					/>
				) : (
					<div class="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
						<span class="text-gray-400 text-lg">No image</span>
					</div>
				)}
			</figure>`
);

// Also fix pubDate.toISOString() to handle the new publishedTime
postCardContent = postCardContent.replace(
  '<time datetime={pubDate.toISOString()}>',
  '<time datetime={new Date(pubDate).toISOString()}>'
);

fs.writeFileSync(postCardPath, postCardContent);
console.log('✅ Fixed PostCard.astro');