#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix terms.astro
const termsPath = path.join(__dirname, '../src/pages/terms.astro');
if (fs.existsSync(termsPath)) {
  const termsContent = `---
import BaseLayout from "@/layouts/BaseLayout.astro";
import { SITE } from "@/lib/config";

const title = SITE.pages.terms.title;
const description = SITE.pages.terms.subtitle;
---

<BaseLayout title={title} description={description}>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-12">
        <h1
          class="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          {SITE.pages.terms.title}
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {SITE.pages.terms.subtitle}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500 mt-4">
          Effective Date: {SITE.pages.terms.lastUpdated}
        </p>
      </div>

      <div class="space-y-8">
        {SITE.pages.terms.sections.map(section => (
          <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              {section.title}
            </h2>
            {section.content && (
              <p class="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-line">
                {section.content}
              </p>
            )}
            {section.subsections && (
              <div class="space-y-4">
                {section.subsections.map(subsection => (
                  <div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      {subsection.title}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-2">
                      {subsection.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  </div>
</BaseLayout>`;
  
  fs.writeFileSync(termsPath, termsContent);
  console.log('✅ Fixed terms.astro');
}

// Fix cookie-policy.astro
const cookiePath = path.join(__dirname, '../src/pages/cookie-policy.astro');
if (fs.existsSync(cookiePath)) {
  const cookieContent = `---
import BaseLayout from "@/layouts/BaseLayout.astro";
import { SITE } from "@/lib/config";

const title = SITE.pages.cookies.title;
const description = SITE.pages.cookies.subtitle;
---

<BaseLayout title={title} description={description}>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-12">
        <h1
          class="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          {SITE.pages.cookies.title}
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {SITE.pages.cookies.subtitle}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500 mt-4">
          Effective Date: {SITE.pages.cookies.lastUpdated}
        </p>
      </div>

      <div class="space-y-8">
        {SITE.pages.cookies.sections.map(section => (
          <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              {section.title}
            </h2>
            {section.content && (
              <p class="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-line">
                {section.content}
              </p>
            )}
            {section.subsections && (
              <div class="space-y-4">
                {section.subsections.map(subsection => (
                  <div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      {subsection.title}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-2">
                      {subsection.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  </div>
</BaseLayout>`;
  
  fs.writeFileSync(cookiePath, cookieContent);
  console.log('✅ Fixed cookie-policy.astro');
}

console.log('🎉 All policy pages fixed!');