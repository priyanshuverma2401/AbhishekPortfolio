import { MongoClient, type Db } from 'mongodb';

export type Article = {
  slug: string;
  title: string;
  /** Meta description + list-page summary. Kept under ~160 chars by the admin editor. */
  description: string;
  /** Sanitised HTML body produced by the admin editor. */
  html: string;
  coverImage?: { url: string; alt: string; width?: number; height?: number };
  tags: string[];
  publishedAt: string; // ISO
  updatedAt: string; // ISO
  readingMinutes: number;
};

const DB_NAME = process.env.MONGODB_DB ?? 'abhishek';
const COLLECTION = 'articles';

let client: MongoClient | null = null;

/** The untouched values from .env.example, which are not real credentials. */
function isPlaceholder(uri: string): boolean {
  return uri.includes('USER:PASSWORD') || uri.includes('cluster0.xxxxx');
}

async function getDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || isPlaceholder(uri)) return null;

  if (!client) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
    try {
      await client.connect();
    } catch (err) {
      client = null;
      // Deliberately fatal. If the URI is configured but unreachable, falling
      // back to sample content would publish samples over the real articles.
      // Failing the build instead leaves the previous deployment serving.
      throw new Error(
        'Could not connect to MongoDB. The build is stopping rather than ' +
          'publishing placeholder content over your articles.\n' +
          '  · Check MONGODB_URI is correct and the password is URL-encoded.\n' +
          '  · Check Atlas > Network Access allows 0.0.0.0/0 — build runners have rotating IPs.\n' +
          `  · Driver said: ${(err as Error).message}`
      );
    }
  }
  return client.db(DB_NAME);
}

export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function normalise(doc: any): Article {
  const html = String(doc.html ?? '');
  return {
    slug: String(doc.slug),
    title: String(doc.title ?? 'Untitled'),
    description: String(doc.description ?? ''),
    html,
    coverImage: doc.coverImage?.url ? doc.coverImage : undefined,
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    publishedAt: new Date(doc.publishedAt ?? doc.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(doc.updatedAt ?? doc.publishedAt ?? Date.now()).toISOString(),
    readingMinutes: doc.readingMinutes ?? readingMinutes(html),
  };
}

/**
 * Published articles, newest first.
 *
 * Runs at build time on Cloudflare Pages (Node, so the native driver is fine).
 * If MONGODB_URI is absent — a fresh clone, or a preview build — we fall back to
 * the sample posts below so the site still builds and the design is visible.
 */
export async function getArticles(): Promise<Article[]> {
  const db = await getDb();
  if (!db) {
    console.warn('[articles] MONGODB_URI not set — using sample content.');
    return SAMPLES.map(normalise);
  }
  const docs = await db
    .collection(COLLECTION)
    .find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .toArray();
  return docs.map(normalise);
}

export async function getArticle(slug: string): Promise<Article | null> {
  const all = await getArticles();
  return all.find((a) => a.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Sample content — only ever used when there is no database connection.
// ---------------------------------------------------------------------------
const SAMPLES = [
  {
    slug: 'what-i-look-for-when-a-team-stops-shipping',
    title: 'What I Look For When a Team Stops Shipping',
    description:
      'Delivery slowdowns are almost never a velocity problem. A practical order of investigation, from decision latency to ownership boundaries.',
    tags: ['Engineering Leadership', 'Delivery'],
    publishedAt: '2026-06-18T09:00:00.000Z',
    updatedAt: '2026-06-18T09:00:00.000Z',
    html: `<p>When a team that used to ship reliably stops shipping, the instinct is to look at the backlog. In my experience the backlog is the last place the answer lives.</p>
<h2>Start with decision latency</h2>
<p>Measure the gap between a question being raised and a decision being made. In healthy teams this is hours. In stalled teams it is weeks, and nobody can name who is supposed to decide.</p>
<blockquote><p>A team is rarely blocked on work. It is blocked on permission.</p></blockquote>
<h2>Then look at ownership boundaries</h2>
<p>Slowdowns cluster where two teams share a surface neither of them owns. The fix is not more coordination; it is moving the boundary so one team can finish a change alone.</p>
<h2>Only then look at the work itself</h2>
<p>By the time you get here, you usually find the estimates were fine. What changed was the number of people who had to say yes.</p>`,
  },
  {
    slug: 'the-cost-of-a-reorg-nobody-puts-in-the-deck',
    title: 'The Cost of a Reorg Nobody Puts in the Deck',
    description:
      'Reorganisations are priced as an org-chart change. The real invoice arrives over the following two quarters, and it is paid in context.',
    tags: ['Organisational Design'],
    publishedAt: '2026-04-02T09:00:00.000Z',
    updatedAt: '2026-04-02T09:00:00.000Z',
    html: `<p>Every reorg deck I have seen models headcount, reporting lines and a target date. None of them model the thing that actually costs the most: the loss of accumulated context.</p>
<h2>Context is an asset with no line item</h2>
<p>An engineer who has worked on a system for two years carries a map of its failure modes that exists nowhere else. Move them, and you have written that asset off without recording it.</p>
<h2>What I do instead</h2>
<p>I now budget an explicit re-learning period — usually one full quarter of reduced commitments — and I say so to my own leadership before the change, not after the miss.</p>`,
  },
  {
    slug: 'the-meeting-that-should-have-been-a-decision',
    title: 'The Meeting That Should Have Been a Decision',
    description:
      'Recurring meetings are where organisations store unresolved questions. A test for telling the useful ones from the sediment.',
    tags: ['Operating Model', 'Delivery'],
    publishedAt: '2025-11-12T09:00:00.000Z',
    updatedAt: '2025-11-12T09:00:00.000Z',
    html: `<p>Look at any long-running recurring meeting and you can usually date the decision it was created to avoid.</p>
<h2>The test</h2>
<p>Ask what would break if the meeting were cancelled tomorrow. If the honest answer is that a decision would have to be made by a named person instead, you have found the problem rather than the solution.</p>
<h2>What replaces it</h2>
<p>Almost always the same three things: an owner, a written default, and a date by which silence counts as agreement. None of them require a room.</p>`,
  },
  {
    slug: 'hiring-for-the-organisation-you-will-have',
    title: 'Hiring for the Organisation You Will Have',
    description:
      'Most senior hiring optimises for the team as it is today. That is why the hire stops fitting eighteen months later.',
    tags: ['Hiring', 'Organisational Design'],
    publishedAt: '2025-07-30T09:00:00.000Z',
    updatedAt: '2025-07-30T09:00:00.000Z',
    html: `<p>The job description describes today. The person will spend most of their tenure somewhere else entirely.</p>
<h2>Write the second job description</h2>
<p>Before opening a senior role, I write a second description for the same role two years out, at the scale we expect to be. The gap between the two documents is the actual hiring bar.</p>
<blockquote><p>You are not hiring for the org chart. You are hiring for its second derivative.</p></blockquote>
<h2>What this changes in practice</h2>
<p>It moves weight away from present-day domain familiarity, which is learnable, and towards the ability to operate without a settled structure — which, in my experience, is not.</p>`,
  },
];
