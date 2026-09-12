/* ============================================================================
 * PORTFOLIO CONTENT — types and derived helpers
 * ----------------------------------------------------------------------------
 * The content itself lives in `content.json`, NOT in this file.
 *
 * That split exists so the admin panel at /admin.html can edit the site: it
 * commits `content.json` through the GitHub API, and rewriting a TypeScript
 * module — types, comments, `as const`, the functions below — from a browser
 * would be a source-code rewriter and a bug farm. JSON is data; this file is
 * the code and the contract over it.
 *
 * Edit either way. `content.json` by hand is fine; the admin panel writes the
 * same file. `npm run check` validates it against the shapes below.
 *
 * A note on numbers: leave `metric` empty unless you can walk someone through
 * how you measured it. Invented numbers are the first thing an interviewer
 * probes. Anything still starting with "TODO" renders highlighted on the page,
 * so an unfinished field reads as unfinished rather than as a claim.
 * ========================================================================== */

import content from './content.json';

export const IS_PLACEHOLDER = false;

export interface ProjectItem {
  id: string;
  title: string;
  category: ProjectCategory;
  /** When you built it — "2025", or "2025 – 2026" for something long-running.
   *  Shown beside the category. Omitted cleanly when empty. */
  year?: string;
  /** One line. What it is, for someone who has 3 seconds. */
  tagline: string;
  /** The problem you set out to solve. */
  problem: string;
  /** What you built and the interesting decision you made. */
  approach: string;
  /** What happened. A real outcome, or honest scope ("shipped to 40 users"). */
  result: string;
  tags: string[];
  /** Optional. Leave empty unless you can defend the number. */
  metric?: string;
  /** Screenshot, e.g. "/work/attendance.png". Uploads from the admin panel land
   *  in `public/work/` and this is set for you. 16:9 crops best. */
  image?: string;
  /** Required whenever `image` is set: say what the screenshot actually shows. */
  imageAlt?: string;
  demoUrl?: string;
  githubUrl?: string;
  /**
   * Featured projects get the full card — screenshot, problem/approach/result,
   * tags. Everything else drops to a one-line row in an "Also built" list
   * underneath, so the section has a shape instead of five identical cards.
   *
   * Two or three featured is the right number: if everything is featured,
   * nothing is. With none flagged, every project renders full — the section can
   * never come out as a list of thin rows with nothing to anchor it.
   */
  featured: boolean;
}

export type ProjectCategory =
  | 'Full-Stack'
  | 'Backend / API'
  | 'Creative Web'
  | 'Cloud / DevOps';

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  'Full-Stack',
  'Backend / API',
  'Creative Web',
  'Cloud / DevOps',
];

export interface SkillCategory {
  title: string;
  description: string;
  skills: { name: string; level: SkillLevel }[];
}

export type SkillLevel = 'Core' | 'Working' | 'Learning';

export const SKILL_LEVELS: SkillLevel[] = ['Core', 'Working', 'Learning'];

export interface MilestoneItem {
  period: string;
  title: string;
  organization: string;
  description: string;
  highlights: string[];
}

export interface ApiEndpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  response: Record<string, unknown>;
}

export interface SiteMeta {
  /** The browser tab, and the headline in search results. */
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  /** Absolute URL, or a path resolved against `siteUrl`. */
  ogImage: string;
  siteUrl: string;
}

export interface Profile {
  name: string;
  role: string;
  headline: string;
  summary: string;
  /** The longer bio, one string per paragraph. Shown in the About section. */
  about: string[];
  photo: string;
  photoAlt: string;
  location: string;
  email: string;
  whatsapp: string;
  github: string;
  linkedin: string;
  resumeUrl: string;
  /** Optional POST endpoint for the contact form. Empty and the form composes
   *  a prefilled email in the visitor's mail client instead — which always
   *  works and never silently loses a message. */
  contactFormEndpoint: string;
  status: { available: boolean; text: string };
}

export interface SiteContent {
  meta: SiteMeta;
  profile: Profile;
  /** Headline stats. EMPTY IS THE CORRECT STATE until you have real ones — the
   *  row simply does not render. */
  stats: { value: string; label: string; note: string }[];
  skillCategories: SkillCategory[];
  apiEndpoints: ApiEndpoint[];
  projects: ProjectItem[];
  /** Studies, reverse-chronological. */
  education: MilestoneItem[];
  /** Career, reverse-chronological. */
  experience: MilestoneItem[];
}

/**
 * JSON has no literal types, so TypeScript reads `level` as `string` rather
 * than `SkillLevel`. The assertion is where the JSON becomes typed data;
 * `npm run check` is what actually verifies the file matches, since a cast
 * proves nothing on its own.
 */
const raw = content as unknown as SiteContent;

/**
 * Prefix a path inside `public/` with the site's base.
 *
 * The site is served from a subpath (`/portfolio-v2/`), and Vite rewrites asset
 * URLs it can see in HTML and CSS — but not strings inside a JSON file, which is
 * where these live. Without this, "me.jpeg" would resolve against the domain
 * root and 404 in production while working perfectly in dev, which is the worst
 * shape a bug can take.
 *
 * Externally hosted URLs and data: URIs are left alone. A stray leading slash is
 * tolerated so a hand-edit cannot break the site.
 */
const withBase = (path: string | undefined): string => {
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '');
};

export const PORTFOLIO_DATA: SiteContent = {
  ...raw,
  profile: {
    ...raw.profile,
    photo: withBase(raw.profile.photo),
    resumeUrl: withBase(raw.profile.resumeUrl),
  },
  projects: raw.projects.map((project) => ({
    ...project,
    image: withBase(project.image),
  })),
};

/* ----------------------------------------------------------------------------
 * Anchor ids for individual items.
 *
 * Shared by the sections that render the elements and by the cabinet that
 * navigates to them, so a file in a drawer can never point at an id that no
 * longer exists.
 * -------------------------------------------------------------------------- */

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const itemId = {
  about: (key: string) => `about-${key}`,
  project: (id: string) => `project-${id}`,
  skill: (title: string) => `skills-${slugify(title)}`,
  endpoint: (path: string) => `endpoint-${slugify(path)}`,
  /** The timeline is rendered twice — Studies and Career — so the section id is
   *  part of the anchor. Without it both lists would claim "milestone-1". */
  milestone: (section: string, index: number) => `${section}-${index + 1}`,
  contact: (key: string) => `contact-${key}`,
};

/** Short enough to stay readable on a folder tab in the 3D scene. */
const tab = (value: string, max = 16) =>
  value.length <= max ? value : value.slice(0, max - 1).trimEnd() + '…';

export interface DrawerFile {
  label: string;
  targetId: string;
}

/**
 * The contents of each drawer: one folder per real item in that section, so the
 * cabinet reads as an index of the page rather than seven identical shortcuts.
 */
export function drawerFiles(sectionId: string): DrawerFile[] {
  switch (sectionId) {
    case 'about':
      return [
        { label: 'Bio', targetId: itemId.about('bio') },
        { label: 'Details', targetId: itemId.about('details') },
      ];
    case 'studies':
      return PORTFOLIO_DATA.education.map((m, i) => ({
        label: tab(m.period),
        targetId: itemId.milestone('studies', i),
      }));
    case 'career':
      return PORTFOLIO_DATA.experience.map((m, i) => ({
        label: tab(m.period),
        targetId: itemId.milestone('career', i),
      }));
    case 'projects':
      return PORTFOLIO_DATA.projects.map((p) => ({
        label: tab(p.title),
        targetId: itemId.project(p.id),
      }));
    case 'skills':
      return PORTFOLIO_DATA.skillCategories.map((c) => ({
        label: tab(c.title),
        targetId: itemId.skill(c.title),
      }));
    case 'playground':
      return PORTFOLIO_DATA.apiEndpoints.map((e) => ({
        label: tab(e.path.replace(/^\/api\//, '')),
        targetId: itemId.endpoint(e.path),
      }));
    case 'contact': {
      const files: DrawerFile[] = [
        { label: 'Email', targetId: itemId.contact('email') },
      ];
      // The "Elsewhere" block only renders when there is a link to show, so the
      // folder for it must not exist either — a folder that goes nowhere is
      // worse than no folder.
      if (PORTFOLIO_DATA.profile.github || PORTFOLIO_DATA.profile.linkedin) {
        files.push({ label: 'Elsewhere', targetId: itemId.contact('links') });
      }
      files.push({ label: 'Message', targetId: itemId.contact('form') });
      return files;
    }
    default:
      return [];
  }
}

/**
 * Every section, in page order. Single source of truth: each entry becomes a
 * nav link, a numbered drawer on the cabinet, and the eyebrow number on the
 * section itself. The names are carried over from the previous portfolio.
 *
 * Deliberately NOT in content.json: each id is wired to a `drawerFiles` case
 * and to a component in App.tsx, so this is code, not content. Adding one is
 * three steps — see the README.
 */
export const NAV_SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'studies', label: 'Studies' },
  { id: 'career', label: 'Career' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'playground', label: 'Playground' },
  { id: 'contact', label: 'Contact' },
] as const;
