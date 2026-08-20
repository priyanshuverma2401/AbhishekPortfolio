/**
 * Single source of truth for everything personal about this site.
 * Every value marked TODO must be filled in before you go live —
 * they feed the SEO tags, the structured data and the footer.
 */

export const site = {
  // ---- Identity -----------------------------------------------------------
  /** TODO: your full name, exactly as you want Google to show it. */
  name: 'Abhishek',
  /** TODO: your current title. Keep it factual — this feeds Person schema. */
  jobTitle: 'Vice President, Engineering',
  /** TODO: your employer, or leave empty if you would rather not name it. */
  company: '',
  /** One line under your name. Positioning, not a slogan. */
  tagline:
    'Notes on building engineering organisations, the systems inside them, and the judgement calls that do not fit in a framework.',

  // ---- Domain -------------------------------------------------------------
  /** TODO: final production URL, no trailing slash. Canonicals + sitemap use this. */
  url: 'https://example.com',
  /** Shown in the <title> suffix and the WebSite schema. */
  shortName: 'Abhishek',

  // ---- Contact ------------------------------------------------------------
  email: 'abhishek.prasar1@gmail.com',
  linkedin: 'https://www.linkedin.com/in/YOUR-HANDLE', // TODO
  location: '', // TODO e.g. 'Bengaluru, India' — helps entity resolution

  // ---- SEO defaults -------------------------------------------------------
  /** 150–160 chars. Used when a page does not set its own. */
  description:
    'Long-form writing on engineering leadership, organisational design and technology strategy by Abhishek, an engineering executive.',
  /** Absolute or site-relative path to the default social share image (1200x630). */
  defaultOgImage: '/og-default.png',
  locale: 'en_IN',
  lang: 'en',

  // ---- Backend ------------------------------------------------------------
  /** TODO: your Render service URL. Used only by /admin, never by public pages. */
  apiBase: 'https://your-api.onrender.com',
} as const;

/**
 * Homepage hero. The h1 stays as your name for entity clarity in search;
 * this statement is the large line that sits under it.
 */
export const hero = {
  statement:
    'I build engineering organisations that keep their judgement as they scale.',
  intro:
    'Two decades in engineering — first building systems, then building the teams that build them. I write here about the parts of the job that resist frameworks: how decisions actually get made, where organisations quietly lose speed, and what it costs to change direction.',
  /** Small facts under the hero. Keep to three or four. */
  facts: [
    { label: 'Role', value: 'VP, Engineering' }, // TODO
    { label: 'Based in', value: 'Bengaluru, India' }, // TODO
    { label: 'Writing since', value: '2026' }, // TODO
  ],
} as const;

/**
 * The numbered index on the homepage. Three or four reads best —
 * a fourth is fine, a fifth starts to dilute.
 */
export const focusAreas = [
  {
    title: 'Organisational design',
    body: 'How teams are bounded, where ownership sits, and why most delivery problems turn out to be structural rather than technical.',
  },
  {
    title: 'Technical strategy',
    body: 'Platform direction that survives contact with a roadmap — choosing what to standardise, what to leave alone, and what to retire.',
  },
  {
    title: 'Leadership practice',
    body: 'Developing the people who will do this job next, and being honest about the decisions that did not work out.',
  },
] as const;

/** Closing call to action on the homepage. */
export const closing = {
  heading: 'Working on the same problems?',
  body: 'I am glad to hear from engineering leaders, founders and anyone who disagrees with something I have written.',
} as const;

export const nav = [
  { label: 'Writing', href: '/writeups' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;
