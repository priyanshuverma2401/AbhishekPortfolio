// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { site } from './src/site.config';

export default defineConfig({
  // Fully static output. Articles are read from MongoDB at build time and baked
  // into HTML, which is why the public pages need no server and score well on
  // Core Web Vitals. Publishing from /admin triggers a rebuild.
  output: 'static',
  site: site.url,
  // Cloudflare Pages strips trailing slashes, so canonical URLs, the sitemap
  // and internal links must all agree on the no-slash form.
  trailingSlash: 'never',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
      changefreq: 'weekly',
      lastmod: new Date(),
    }),
  ],
  compressHTML: true,
});
