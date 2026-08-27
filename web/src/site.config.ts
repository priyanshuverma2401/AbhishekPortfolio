/**
 * Single source of truth for everything personal about this site.
 * These values feed the SEO tags, the structured data and the footer.
 */

export const site = {
  // ---- Identity -----------------------------------------------------------
  /** Full name, exactly as you want Google to show it. */
  name: 'Abhishek Prasar',
  /** Current title. Keep it factual — this feeds Person schema. */
  jobTitle: 'Enterprise AI Transformation Leader',
  /** Compact form of the title. Used in the header wordmark, which cannot wrap. */
  jobTitleShort: 'AI Transformation',
  /** Employer, or leave empty if you would rather not name it. */
  company: 'WNS Global Services (now Capgemini)',
  /** One line under your name. Positioning, not a slogan. */
  tagline:
    'Notes on building production AI inside enterprises — the architecture, the governance, and the adoption work that decides whether any of it survives contact with the business.',

  // ---- Domain -------------------------------------------------------------
  /** TODO: final production URL, no trailing slash. Canonicals + sitemap use this. */
  url: 'https://example.com',
  /** Shown in the <title> suffix and the WebSite schema. */
  shortName: 'Abhishek Prasar',

  // ---- Contact ------------------------------------------------------------
  email: 'abhishek.prasar11@gmail.com',
  linkedin: 'https://www.linkedin.com/in/abhishek-prasar-0889b160',
  location: 'Gurugram, India',

  // ---- SEO defaults -------------------------------------------------------
  /** 150–160 chars. Used when a page does not set its own. */
  description:
    'Abhishek Prasar is an enterprise AI transformation leader — 15+ years across ML, GenAI and agentic platforms, building commercial AI and GTM intelligence at scale.',
  /** Absolute or site-relative path to the default social share image (1200x630). */
  defaultOgImage: '/og-default.png',
  locale: 'en_IN',
  lang: 'en',

  /**
   * Feeds Person.knowsAbout in the structured data — how search engines
   * resolve what this person is an authority on.
   */
  knowsAbout: [
    'Enterprise AI transformation',
    'Agentic AI and multi-agent platforms',
    'Large language models',
    'Retrieval-augmented generation',
    'Machine learning',
    'Deep learning',
    'Natural language processing',
    'MLOps and LLMOps',
    'AI governance and responsible AI',
    'EU AI Act compliance',
    'Commercial AI and GTM intelligence',
    'Azure AI and Microsoft AI stack',
  ],

  /** Feeds Person.alumniOf. */
  education: [
    'Indian Institute of Management (IIM) Indore',
    'Dr. MGR Educational and Research Institute, Chennai',
  ],

  // ---- Backend ------------------------------------------------------------
  /** Render service URL. Used only by /admin, never by public pages. */
  apiBase: 'https://abhishekportfolio-mtfz.onrender.com',
} as const;

/**
 * Homepage hero. The h1 stays as your name for entity clarity in search;
 * this statement is the large line that sits under it.
 */
export const hero = {
  statement:
    'The model is a commodity. Everything that decides the outcome sits around it.',
  intro:
    'Fifteen years building AI from zero to scale — classical machine learning and NLP through to LLMs, RAG pipelines and multi-agent platforms. Most recently a GTM intelligence layer running across a $570M+ active deal portfolio, and before that a 20-person AI practice built from nothing. I write here about the part nobody demos: system design, data quality, governance, and getting people to actually use the thing.',
  /** Small facts under the hero. Keep to three or four. */
  facts: [
    { label: 'Now', value: 'Enterprise AI & Sales Transformation, WNS (Capgemini)' },
    { label: 'Based in', value: 'Gurugram, India — open to EU / global' },
    { label: 'In AI since', value: '2011' },
  ],
} as const;

/**
 * The numbered index on the homepage. The grid is three columns —
 * keep this list at three.
 */
export const focusAreas = [
  {
    title: 'Enterprise AI architecture',
    body: 'Agentic platforms, RAG pipelines and LLM systems designed to hold up in production — grounded, source-cited, regression-tested after every prompt change, and audit-ready rather than demo-ready.',
  },
  {
    title: 'Commercial AI & GTM intelligence',
    body: 'AI pointed at revenue rather than at cost lines: buyer-intent signals, account prioritisation, pursuit strategy. Signal to priority to plan to pursuit, as one loop rather than four tools.',
  },
  {
    title: 'Governance & adoption',
    body: 'Responsible AI, DLP and data-boundary design built in from day one, not retrofitted — and the behavioural work that moves an organisation from a launch announcement to a default operating model.',
  },
] as const;

/** Logos row above the evidence groups. Order is chronological. */
export const builtAt = ['Ericsson', 'TCS', 'Dell', 'LTIM', 'Capgemini'] as const;

/**
 * Headline evidence, grouped by where the work landed. Each group is a
 * three-column row — keep every group at exactly three entries so the
 * grid stays even. Figures should be things you would be comfortable
 * being asked to defend in an interview.
 */
export const evidence = [
  {
    group: 'Foundation',
    items: [
      { value: '50+', label: 'AI/ML solutions across classical ML, deep learning and NLP' },
      { value: '20+', label: 'Enterprise-grade GenAI and agentic systems in production' },
      { value: '0 → 20', label: 'AI practice built from nothing' },
    ],
  },
  {
    group: 'HR and talent',
    items: [
      { value: '100K', label: 'Users on an agentic talent marketplace' },
      { value: '90%', label: 'Match accuracy, explainable and auditable' },
      { value: '35%', label: 'HR helpdesk load reduced through self-service AI' },
    ],
  },
  {
    group: 'Sales and GTM',
    items: [
      {
        value: 'Sales intelligence',
        label: 'Buyer-intent scoring built from public signals — filings, news, executive movement',
      },
      { value: '94%', label: 'Cut in a core sales planning workflow' },
      { value: '300+', label: 'Sales professionals using my agents daily' },
    ],
  },
  {
    group: 'Governance and adoption',
    items: [
      {
        value: 'Governance',
        label: 'DLP, PII protection and EU AI Act alignment — built in from day one, now the enterprise standard',
      },
      { value: '4×', label: 'Active adoption growth within six months' },
      {
        value: 'Audit-ready',
        label: 'Source-cited outputs, human-review gates and regression discipline on every release',
      },
    ],
  },
] as const;

/** One-line footnote under the evidence grid. */
export const evidenceNote = [
  '15+ years across HR, sales and commercial functions',
  'Large-deal RFP pursuits supported end to end',
  'Replaced commercial vendor tools with in-house, auditable platforms',
  'Microsoft and Google partnerships',
] as const;

/** Closing call to action on the homepage. */
export const closing = {
  heading: 'Working on the same problems?',
  body: 'I am glad to hear from AI and engineering leaders, founders, and anyone who disagrees with something I have written here.',
} as const;

export const nav = [
  { label: 'Writing', href: '/writeups' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;
