import rss from '@astrojs/rss';
import { getArticles } from '../lib/articles';
import { site } from '../site.config';

export async function GET() {
  const articles = await getArticles();
  return rss({
    title: `${site.name} — Writeups`,
    description: site.description,
    site: site.url,
    trailingSlash: false,
    items: articles.map((a) => ({
      title: a.title,
      description: a.description,
      link: `/writeups/${a.slug}`,
      pubDate: new Date(a.publishedAt),
      categories: a.tags,
      content: a.html,
    })),
    customData: `<language>${site.lang}</language>`,
  });
}
