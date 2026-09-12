/**
 * Validates src/data/content.json.
 *
 * The admin panel writes this file from a browser, so it is the one input to
 * the build that is not hand-reviewed. A TypeScript cast in portfolioData.ts
 * proves nothing about it at runtime; this does. Run by `npm run check`.
 */
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.resolve(import.meta.dirname, '../src/data/content.json');

const CATEGORIES = ['Full-Stack', 'Backend / API', 'Creative Web', 'Cloud / DevOps'];
const LEVELS = ['Core', 'Working', 'Learning'];
const METHODS = ['GET', 'POST'];

const problems = [];
const fail = (where, message) => problems.push(`${where}: ${message}`);

const isString = (v) => typeof v === 'string';
const isStringArray = (v) => Array.isArray(v) && v.every(isString);

function requireStrings(obj, where, keys) {
  for (const key of keys) {
    if (!isString(obj?.[key])) fail(`${where}.${key}`, 'must be a string');
  }
}

let content;
try {
  content = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch (error) {
  console.error(`content.json is not valid JSON: ${error.message}`);
  process.exit(1);
}

/* --- meta ----------------------------------------------------------------- */
requireStrings(content.meta, 'meta', [
  'title',
  'description',
  'ogTitle',
  'ogDescription',
  'ogImage',
  'siteUrl',
]);

/* --- profile -------------------------------------------------------------- */
const profile = content.profile ?? {};
requireStrings(profile, 'profile', [
  'name',
  'role',
  'headline',
  'summary',
  'photo',
  'photoAlt',
  'location',
  'email',
  'whatsapp',
  'github',
  'linkedin',
  'resumeUrl',
  'contactFormEndpoint',
]);
if (!isStringArray(profile.about)) fail('profile.about', 'must be an array of strings');
if (typeof profile.status?.available !== 'boolean') {
  fail('profile.status.available', 'must be true or false');
}
if (!isString(profile.status?.text)) fail('profile.status.text', 'must be a string');
if (profile.email && !profile.email.includes('@')) {
  fail('profile.email', `"${profile.email}" does not look like an email address`);
}

/* --- projects ------------------------------------------------------------- */
const projects = content.projects ?? [];
if (!Array.isArray(projects)) fail('projects', 'must be an array');

const seen = new Set();
projects.forEach((p, i) => {
  const where = `projects[${i}]`;
  requireStrings(p, where, ['id', 'title', 'tagline', 'problem', 'approach', 'result']);

  // Anchor ids are built from this, and the cabinet files one folder per
  // project — two projects sharing an id means one folder scrolls to the other.
  if (isString(p.id)) {
    if (seen.has(p.id)) fail(`${where}.id`, `"${p.id}" is already used by another project`);
    seen.add(p.id);
  }

  if (!CATEGORIES.includes(p.category)) {
    fail(`${where}.category`, `"${p.category}" is not one of ${CATEGORIES.join(', ')}`);
  }
  if (!isStringArray(p.tags)) fail(`${where}.tags`, 'must be an array of strings');
  if (typeof p.featured !== 'boolean') fail(`${where}.featured`, 'must be true or false');

  // An image with no alt text is the one accessibility failure this file can
  // introduce on its own.
  if (p.image && !p.imageAlt) {
    fail(`${where}.imageAlt`, 'is required whenever `image` is set');
  }
  for (const key of ['role', 'decisions', 'challenges', 'lessons']) {
    if (p[key] !== undefined && !isString(p[key])) fail(`${where}.${key}`, 'must be a string');
  }
  if (p.screenshots !== undefined) {
    if (!Array.isArray(p.screenshots)) fail(`${where}.screenshots`, 'must be an array');
    else p.screenshots.forEach((shot, j) => {
      if (!isString(shot?.src) || !shot.src.trim() || !isString(shot?.alt) || !shot.alt.trim()) {
        fail(`${where}.screenshots[${j}]`, 'needs an image path and description');
      }
    });
  }
});

/* --- skills --------------------------------------------------------------- */
(content.skillCategories ?? []).forEach((c, i) => {
  const where = `skillCategories[${i}]`;
  requireStrings(c, where, ['title', 'description']);
  if (!Array.isArray(c.skills)) {
    fail(`${where}.skills`, 'must be an array');
    return;
  }
  c.skills.forEach((s, j) => {
    if (!isString(s.name)) fail(`${where}.skills[${j}].name`, 'must be a string');
    if (!LEVELS.includes(s.level)) {
      fail(`${where}.skills[${j}].level`, `"${s.level}" is not one of ${LEVELS.join(', ')}`);
    }
  });
});

/* --- api endpoints -------------------------------------------------------- */
(content.apiEndpoints ?? []).forEach((e, i) => {
  const where = `apiEndpoints[${i}]`;
  requireStrings(e, where, ['path', 'description']);
  if (!METHODS.includes(e.method)) {
    fail(`${where}.method`, `"${e.method}" is not one of ${METHODS.join(', ')}`);
  }
  if (e.response === null || typeof e.response !== 'object' || Array.isArray(e.response)) {
    fail(`${where}.response`, 'must be a JSON object');
  }
});

/* --- timelines ------------------------------------------------------------ */
for (const key of ['education', 'experience']) {
  const list = content[key];
  if (!Array.isArray(list)) {
    fail(key, 'must be an array');
    continue;
  }
  list.forEach((m, i) => {
    const where = `${key}[${i}]`;
    requireStrings(m, where, ['period', 'title', 'organization', 'description']);
    if (!isStringArray(m.highlights)) {
      fail(`${where}.highlights`, 'must be an array of strings');
    }
  });
}

/* --- report --------------------------------------------------------------- */
if (problems.length) {
  console.error(`content.json has ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const todos = JSON.stringify(content).match(/TODO/g)?.length ?? 0;
console.log(
  `content.json is valid — ${projects.length} projects, ` +
    `${(content.education ?? []).length + (content.experience ?? []).length} timeline entries` +
    (todos ? `, ${todos} TODO field(s) still to fill in.` : '.')
);
