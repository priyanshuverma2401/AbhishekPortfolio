import type { APIRoute } from 'astro';
import { site } from '../site.config';

// Generated rather than static so the Sitemap line always matches site.config.ts.
export const GET: APIRoute = () =>
  new Response(
    `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/

Sitemap: ${new URL('/sitemap-index.xml', site.url).href}
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
