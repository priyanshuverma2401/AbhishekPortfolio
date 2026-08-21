import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sanitizeHtml from 'sanitize-html';
import { MongoClient, ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'abhishek';
const DEPLOY_HOOK_URL = process.env.DEPLOY_HOOK_URL || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // empty = no auth (see README)

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not set.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ---------------------------------------------------------------------------
// Database — one client for the process lifetime, reused across requests.
// ---------------------------------------------------------------------------
const client = new MongoClient(MONGODB_URI, { maxPoolSize: 5 });
await client.connect();
const db = client.db(MONGODB_DB);
const articles = db.collection('articles');

// Slugs are the public URL, so they must be unique. Sorting the list and the
// build query both hit these.
await articles.createIndex({ slug: 1 }, { unique: true });
await articles.createIndex({ status: 1, publishedAt: -1 });
console.log(`Connected to MongoDB database "${MONGODB_DB}"`);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));

app.use(
  cors({
    origin(origin, cb) {
      // No Origin header = curl, health checks, server-to-server. Allow.
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.length === 0) return cb(null, true);
      cb(null, ALLOWED_ORIGINS.includes(origin));
    },
  })
);

/**
 * Optional shared-secret gate on every write.
 *
 * Leave ADMIN_TOKEN unset and this is a no-op — the setup you asked for.
 * Set it in Render and add the same value to the admin page to lock writes
 * down without any code change.
 */
function requireAuth(req, res, next) {
  if (!ADMIN_TOKEN) return next();
  const supplied = req.get('X-Admin-Token') || '';
  if (supplied === ADMIN_TOKEN) return next();
  res.status(401).json({ error: 'Unauthorised' });
}

// ---------------------------------------------------------------------------
// Sanitisation — the editor produces HTML, so never trust it verbatim.
// This allowlist matches exactly what the article stylesheet knows how to render.
// ---------------------------------------------------------------------------
const SANITIZE_OPTIONS = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
    'h2', 'h3', 'h4',
    'ul', 'ol', 'li',
    'blockquote', 'hr',
    'a', 'figure', 'figcaption', 'img',
    'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    // Outbound links open safely; the renderer never adds this itself.
    a: (tagName, attribs) => {
      const href = attribs.href || '';
      const external = /^https?:\/\//i.test(href);
      return {
        tagName: 'a',
        attribs: external
          ? { ...attribs, target: '_blank', rel: 'noopener nofollow' }
          : attribs,
      };
    },
    // execCommand still emits these; map them to semantic equivalents.
    b: 'strong',
    i: 'em',
    div: 'p',
  },
  // Drop empty paragraphs the contenteditable leaves behind.
  exclusiveFilter: (frame) =>
    frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren?.length,
};

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[‘’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function readingMinutes(html) {
  const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function clampText(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

/** Build the stored document from whatever the editor posted. */
function buildDoc(body, existing) {
  const html = sanitizeHtml(String(body.html ?? ''), SANITIZE_OPTIONS);
  const status = body.status === 'published' ? 'published' : 'draft';
  const now = new Date();

  const cover = body.coverImage;
  const coverImage =
    cover && typeof cover.url === 'string' && /^https:\/\//.test(cover.url)
      ? {
          url: cover.url,
          alt: clampText(cover.alt, 300),
          width: Number(cover.width) || undefined,
          height: Number(cover.height) || undefined,
        }
      : null;

  const wasPublished = existing?.status === 'published';

  return {
    title: clampText(body.title, 200),
    slug: slugify(body.slug || body.title),
    description: clampText(body.description, 300),
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 6).map((t) => clampText(t, 40)).filter(Boolean) : [],
    html,
    coverImage,
    status,
    readingMinutes: readingMinutes(html),
    // publishedAt is set once, the first time it goes live, and never moves —
    // a changing publish date is read as churn by search engines.
    publishedAt:
      existing?.publishedAt ?? (status === 'published' ? now : null),
    updatedAt: wasPublished || status === 'published' ? now : (existing?.updatedAt ?? now),
    createdAt: existing?.createdAt ?? now,
  };
}

function toClient(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { _id: _id.toString(), ...rest };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get('/health', (_req, res) => res.json({ ok: true }));

/** List everything, drafts included — this feeds the admin sidebar only. */
app.get('/api/articles', requireAuth, async (_req, res, next) => {
  try {
    const docs = await articles
      .find({}, { projection: { html: 0 } })
      .sort({ updatedAt: -1 })
      .toArray();
    res.json(docs.map(toClient));
  } catch (err) {
    next(err);
  }
});

app.get('/api/articles/:id', requireAuth, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Bad id' });
    const doc = await articles.findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(toClient(doc));
  } catch (err) {
    next(err);
  }
});

app.post('/api/articles', requireAuth, async (req, res, next) => {
  try {
    const doc = buildDoc(req.body, null);
    if (!doc.title) return res.status(400).json({ error: 'Title is required' });
    if (!doc.slug) return res.status(400).json({ error: 'Slug is required' });

    const result = await articles.insertOne(doc);
    res.status(201).json(toClient({ _id: result.insertedId, ...doc }));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'That slug is already in use' });
    next(err);
  }
});

app.put('/api/articles/:id', requireAuth, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Bad id' });
    const _id = new ObjectId(req.params.id);
    const existing = await articles.findOne({ _id });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const doc = buildDoc(req.body, existing);
    if (!doc.title) return res.status(400).json({ error: 'Title is required' });
    if (!doc.slug) return res.status(400).json({ error: 'Slug is required' });

    await articles.updateOne({ _id }, { $set: doc });
    res.json(toClient({ _id, ...doc }));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'That slug is already in use' });
    next(err);
  }
});

app.delete('/api/articles/:id', requireAuth, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Bad id' });

    // findOneAndDelete rather than deleteOne: the caller needs to know whether
    // anything actually went, and whether it was live. A published piece that
    // disappears from Mongo is still on the static site until a rebuild runs.
    const result = await articles.findOneAndDelete({ _id: new ObjectId(req.params.id) });
    const deleted = result?.value ?? result; // driver 6 returns the doc directly
    if (!deleted) {
      return res.status(404).json({ error: 'Not found — it may already have been deleted' });
    }

    res.json({
      ok: true,
      slug: deleted.slug,
      title: deleted.title,
      wasPublished: deleted.status === 'published',
    });
  } catch (err) {
    next(err);
  }
});

// ---- Image upload ---------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only JPEG, PNG, WebP, GIF or AVIF images are allowed'), ok);
  },
});

app.post('/api/upload', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file received' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'writeups',
          resource_type: 'image',
          // Cap the stored original, then let Cloudinary pick format and
          // quality per browser. This is what keeps Core Web Vitals green.
          transformation: [
            { width: 1600, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (err, out) => (err ? reject(err) : resolve(out))
      );
      stream.end(req.file.buffer);
    });

    res.json({
      url: result.secure_url,
      width: result.width,
      height: result.height,
      publicId: result.public_id,
    });
  } catch (err) {
    next(err);
  }
});

// ---- Rebuild trigger ------------------------------------------------------
/**
 * Ping the Cloudflare Pages deploy hook so the static site picks up the
 * change. Without this the article sits in MongoDB unseen until the next push.
 */
app.post('/api/deploy', requireAuth, async (_req, res, next) => {
  try {
    if (!DEPLOY_HOOK_URL) return res.status(501).json({ error: 'DEPLOY_HOOK_URL is not configured' });
    const hookRes = await fetch(DEPLOY_HOOK_URL, { method: 'POST' });
    if (!hookRes.ok) throw new Error(`Deploy hook returned ${hookRes.status}`);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || (err instanceof multer.MulterError ? 400 : 500);
  res.status(status).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`API listening on :${PORT}`));

// Render sends SIGTERM on redeploy and on free-tier spin-down.
process.on('SIGTERM', async () => {
  await client.close();
  process.exit(0);
});
