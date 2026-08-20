# abhishek.com — personal site

A static, SEO-first writing site with a private editor for publishing.

```
┌──────────────────┐   build time    ┌─────────────────┐
│ Cloudflare Pages │ ◄────reads───── │ MongoDB Atlas   │
│ (static site)    │                 │ db: abhishek    │
│  /, /about,      │                 │ coll: articles  │
│  /contact,       │                 └────────▲────────┘
│  /writeups/*     │                          │ writes
│  /admin ─────────┼──── fetch ──────► ┌──────┴────────┐
└────────▲─────────┘                   │ Render (API)  │
         │                             │ Express       │
         └──── deploy hook ─────────── │ + Cloudinary  │
                                       └───────────────┘
```

**Why this shape.** The public pages are plain HTML files with no server in front
of them — that is the fastest thing a browser can be given, and Core Web Vitals
are a ranking input. Articles are read from MongoDB *at build time* and baked in.
Render's free tier sleeps after inactivity, but that only ever affects you in the
editor, never a visitor or a crawler.

| | |
|---|---|
| `web/` | Astro site → **Cloudflare Pages** |
| `api/` | Express API → **Render** |

---

## 1. Fill in your details first

Everything personal lives in one file: **`web/src/site.config.ts`**. Open it and
replace every value marked `TODO`:

| Field | What it does |
|---|---|
| `name` | Your full name. Appears in `<title>`, the footer and Person schema. |
| `jobTitle` | Feeds Person schema — this is how Google learns who you are. |
| `url` | Your final domain. **Canonical URLs, sitemap and RSS all derive from it.** |
| `linkedin` | Your real LinkedIn URL. Also a `sameAs` entity signal. |
| `location` | e.g. `Bengaluru, India`. Helps entity resolution. |
| `apiBase` | Your Render service URL, once it exists. |

Then edit the two hand-written pages:

- **`web/src/pages/about.astro`** — has a clearly marked editable block with
  `[bracketed placeholders]`. Replace them with your real history. Do not ship the
  brackets; I deliberately did not invent your career.
- **`web/src/pages/contact.astro`** — the "what I say yes to" lists.

---

## 2. MongoDB Atlas (free)

1. Create a free **M0** cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a user with *Read and write to any database*.
3. **Network Access** → add `0.0.0.0/0`. Both Render and the Cloudflare build
   runner have rotating IPs, so an allowlist is not workable here.
4. **Connect → Drivers** → copy the connection string.

The database is called `abhishek` and holds one collection, `articles`. Both are
created automatically on first write — nothing to set up by hand. A document
looks like this:

```js
{
  _id, slug, title, description,   // description is the meta description
  html,                            // sanitised body from the editor
  coverImage: { url, alt, width, height },
  tags: [], status: 'draft' | 'published',
  publishedAt, updatedAt, createdAt, readingMinutes
}
```

> **Do not paste your connection string into a chat window.** It contains a
> password with write access to your data. Put it straight into `.env` locally
> and into the Render / Cloudflare dashboards. Both `.env` files are gitignored.

---

## 3. Cloudinary (free — the image answer)

Sign up at <https://cloudinary.com>. The free tier is 25 GB storage and 25 GB
delivery per month, which for a text-led writing site is effectively unlimited.

From **Dashboard → Product Environment Credentials**, copy the cloud name, API key
and API secret into `api/.env`.

The API uploads with `quality: auto` and `fetch_format: auto`, so a visitor on
Chrome is served AVIF, Safari gets WebP, and everything is capped at 1600px and
delivered from a CDN. That is the part that keeps image-heavy posts fast.

*Why not store images in MongoDB?* You can (GridFS), but you would be serving
bytes from a database with no CDN and no format negotiation. Slow images are the
most common cause of a failing Largest Contentful Paint score, and you said
ranking matters — so: Cloudinary.

---

## 4. Run it locally

```bash
# terminal 1 — API
cd api
cp .env.example .env      # then fill it in
npm install
npm run dev               # http://localhost:8080

# terminal 2 — site
cd web
cp .env.example .env      # then fill it in
npm install
npm run dev               # http://localhost:4321
```

Set `apiBase` in `site.config.ts` to `http://localhost:8080` while developing.

Without `MONGODB_URI` the site still builds — it falls back to two sample posts
so you can see the design. Delete them from `web/src/lib/articles.ts` once you
have real content.

---

## 5. Deploy the API to Render

1. Push this repo to GitHub.
2. Render → **New → Web Service** → connect the repo.
3. Settings:
   - Root directory: `api`
   - Build command: `npm ci`
   - Start command: `npm start`
   - Health check path: `/health`
4. Add the environment variables from `api/.env.example`.
5. Deploy, then copy the service URL (`https://….onrender.com`) into
   `site.config.ts` → `apiBase`.

`api/render.yaml` is included if you prefer Render's Blueprint flow.

> **Free tier note:** the service sleeps after ~15 minutes idle. The first
> request from the editor will take 30–60 seconds while it wakes. Subsequent
> requests are instant. Visitors never hit it.

---

## 6. Deploy the site to Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Build settings:
   - Framework preset: **Astro**
   - Root directory: `web`
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Environment variables (Production **and** Preview):
   - `MONGODB_URI`
   - `MONGODB_DB` = `abhishek`
4. Deploy. Then add your custom domain under **Custom domains** and update
   `site.config.ts` → `url` to match, exactly, with no trailing slash.

---

## 7. Wire the publish button to a rebuild

Because the site is static, saving an article is not enough — the site has to
rebuild to pick it up.

1. Pages project → **Settings → Builds & deployments → Deploy hooks → Create**.
2. Copy the URL into Render as `DEPLOY_HOOK_URL`.

Now **Publish** in the editor saves the document *and* fires the rebuild. The new
article is live in about a minute.

---

## 8. Publishing workflow

Go to `https://your-domain/admin`.

- **New** starts a fresh piece. The slug auto-fills from the title until you edit
  it, after which it stays put.
- The toolbar covers headings, bold, italic, quotes, lists, links, images and
  dividers. `Ctrl/Cmd+K` inserts a link, `Ctrl/Cmd+S` saves a draft.
- Pasting from Word or Google Docs pastes as **clean text** with paragraphs
  preserved. This is deliberate — pasted inline styles are what makes blogs look
  amateur.
- Images ask for **alt text** and will not insert without it. That is a hard
  requirement for both accessibility and image search.
- The **meta description** counter turns green between 140–160 characters, which
  is the range Google renders without truncating.
- The **Google result preview** at the bottom shows roughly how the page will
  appear in search results before you commit.
- **Save draft** stores it without publishing; drafts are never built into the
  site. **Publish** makes it live and triggers the rebuild.

---

## 9. What is already done for SEO

Built in, nothing to configure:

- Per-page `<title>`, meta description and **canonical URL**
- Open Graph + Twitter card tags on every page, per-article cover images
- **JSON-LD structured data** as a single `@graph`: `Person`, `WebSite`,
  `Blog`, `BlogPosting`, `BreadcrumbList`, `AboutPage`, `ContactPage` — all
  cross-referenced by `@id` so Google resolves one entity for you rather than
  several disconnected pages
- `sitemap-index.xml`, generated at build, with `/admin` excluded
- `robots.txt`, generated so the sitemap line can never drift from your domain
- RSS feed at `/rss.xml`
- Semantic HTML, one `h1` per page, correct heading order, skip link
- `noindex` on `/admin`
- Clean slug URLs, `datePublished` / `dateModified` that never churn
- Fonts preconnected and `display=swap`; near-zero JavaScript on public pages

### What only you can do — after launch

1. **Google Search Console** — add the domain, verify by DNS (Cloudflare makes
   this a one-click TXT record), submit `https://your-domain/sitemap-index.xml`.
2. **Bing Webmaster Tools** — same, and it imports directly from Search Console.
3. Put the domain in your **LinkedIn profile's website field**. It is a real,
   crawlable link from a high-authority domain to a brand-new one, and it
   corroborates the `sameAs` in your Person schema.
4. Replace `web/public/favicon.svg` and add `web/public/og-default.png`
   (1200×630) — a plain wordmark on the paper background is right for this site.
5. Write consistently. For a personal domain with no backlink profile, depth and
   frequency are the levers that actually move rankings; everything technical is
   already handled above.

---

## 10. Locking down the admin

You chose to launch without a login. The code supports adding one **without a
rewrite** whenever you want:

1. Set `ADMIN_TOKEN` in Render to a long random string.
2. In `web/src/pages/admin.astro`, add the header to the `api()` helper:

   ```js
   headers: { 'Content-Type': 'application/json', 'X-Admin-Token': prompt('Admin token') }
   ```

3. Set `ALLOWED_ORIGINS` in Render to your domain only.

Worth doing before the site gets any traction: the write endpoints are what is
exposed, not the page, and an open write endpoint on a public URL is found by
automated scanners within days. Spam articles injected into your database would
be built into your site on the next deploy — which is the fastest way to lose the
rankings you are trying to build.

Independently of that, the API already **sanitises all submitted HTML** against a
strict allowlist, so no script tag or event handler can reach a published page.
