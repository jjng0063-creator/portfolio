# Changelog

Notable changes to this portfolio. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**What belongs here:** anything that changes what the site does or how it is
run — a new section, a field added to `content.json`, a build or deploy change.
**What does not:** edits to your own content. Rewording a project or swapping a
photo is a commit, not a release; `content.json` changes on its own schedule,
usually from the admin panel, and logging every one would bury the entries that
matter.

## [Unreleased]

### Changed

- The site moved to <https://jjng0063-creator.github.io/portfolio/>, taking over
  the previous portfolio's address; that site now lives at `/portfolio-v1/`.
  The repository was renamed from `portfolio-v2` to `portfolio` and the Vite
  base is now `/portfolio/`. The old `/portfolio-v2/` address no longer resolves.
- The project showcase is a compact 3D cover gallery: angled neighbouring covers
  that stay inside the stage, category-based fallback covers, and one flat
  detail panel below that keeps its height as the selection changes.

### Fixed

- Long playground JSON now scrolls within its panel instead of widening the
  page at phone widths. Header navigation collapses before its controls crowd.
- An empty Playground endpoint list now shows an empty state instead of crashing
  the portfolio after the last endpoint is deleted in the editor.
- JSON response editors refresh when their underlying response changes, including
  after reordering, deleting entries, or reloading content, preventing stale text
  from overwriting another endpoint's response.
- Project cabinet folders now follow the selected category filter, so every
  folder points to a project currently on the page. Selecting All restores them.

### Added

- The selected project cover opens a full-size image viewer with zoom: the
  Zoom button doubles the image, and clicking the image zooms into that spot.
  Neighbouring covers are blurred so the selection stands out.
- Expandable project files using the existing problem, approach, and result copy,
  with optional role, decisions, challenges, and lessons editable in the admin.
- Numbered screenshot galleries and a native full-size dialog with Escape,
  keyboard focus containment, and previous/next controls. Existing cover images
  remain supported; additional images and descriptions can be uploaded in admin.
- Skill evidence links derived from matching project stack tags. Following one
  clears the project filter so its destination is visible.
- Cabinet guidance with a dismissible session hint, full project-name hover
  labels, and a keyboard-accessible file index in the cabinet column.
- Mobile Projects, Résumé, and Contact shortcuts with safe-area spacing, plus
  the profile role and location beside the hero actions.
- A saved motion preference, initially following the OS. Reduced motion uses
  the cabinet poster and removes card motion and interface animations.
- Editable POST request bodies in the playground, with clearly labelled local
  simulations of successful requests and invalid-JSON errors; nothing is sent.
- Component regression checks for empty endpoints, response editing after
  reordering, deleting, and reloading, and cabinet folders after filtering.
  Run with `npm test`; the deployment workflow also runs them before building.

## [1.0.0] — 2026-09-13

First public release. Live at
<https://jjng0063-creator.github.io/portfolio-v2/>.

### Added

**The site**

- Seven sections — About, Studies, Career, Projects, Skills, Playground,
  Contact — with the section names carried over from the previous portfolio.
- A scroll-driven 3D archive cabinet (three.js via React Three Fiber) in its own
  column. The drawer for the section you are reading opens and the previous one
  closes; each drawer is filed with one labelled folder per item on the page, and
  clicking a folder jumps to that exact item.
- Cabinet geometry derives from `NAV_SECTIONS`, so the drawer count, drawer
  height, label plates, eyebrow numbers and loading placeholder all follow the
  section list. Nothing is sized for a particular number of drawers.
- "Emerge" motion — cards lift out of the open drawer and tip into focus —
  driven by one shared rAF loop and one IntersectionObserver for the whole page,
  with transforms dropped entirely once a card settles.
- Projects written as **problem → approach → result**. `featured` decides the
  shape: featured projects get the full card with a screenshot, the rest drop to
  a one-line row in an "Also built" list.
- An API playground, so a technical reader has something to poke at.
- A contact form that posts to a configured endpoint, or composes a prefilled
  message in the visitor's mail client when there is none — rather than posting
  into the void.
- Light/dark theme following the OS until you choose, applied before first paint.
  Sound effects, off by default and attached only to deliberate actions.
- Unfilled fields starting with `TODO` render visibly flagged, so a
  half-finished site cannot be quietly handed to a recruiter.

**Content**

- All content in [`src/data/content.json`](src/data/content.json);
  [`portfolioData.ts`](src/data/portfolioData.ts) holds the types and the derived
  anchors, drawer contents and nav over it.
- Content migrated from the previous portfolio: bio, education, three roles, five
  projects, four skill groups, contact details, résumé and photo.
- Page `<title>`, description and `og:` tags injected into the HTML at build time
  from the same file, so editing your name updates the browser tab too.

**Admin panel**

- A content editor at `/admin.html`, built as its own bundle (~12 kB gzipped) so
  visitors to the portfolio never download it.
- No server: the browser talks to the GitHub API directly with a fine-grained
  token you paste in, reads `content.json`, and commits it back.
- Eight tabs — Profile, Studies, Career, Projects, Skills, Playground, Contact,
  Page & sharing — with reorderable repeaters for every list.
- Image and PDF upload, committed into `public/` with the field set to the path
  the site serves.
- Commits carry the sha of the file they read, so two tabs cannot silently
  overwrite each other.
- Deploy status after publishing, which distinguishes "this token cannot read
  Actions" from "the run has not started yet".
- Carries `noindex, nofollow`; holds no secrets and does nothing until a token is
  entered.

**Tooling and deployment**

- `npm run check` validates `content.json` — duplicate project ids, categories
  and skill levels outside their unions, images missing alt text, wrong types.
  That file is written from a browser and is the one build input nobody reviews.
- GitHub Actions deploy to Pages, running `check` and `lint` before the build so
  a malformed publish fails the workflow instead of deploying a broken site.
- Two-entry Vite build (site and admin), served from the `/portfolio-v2/`
  subpath. Asset paths inside `content.json` are resolved through
  `import.meta.env.BASE_URL` at render time — Vite rewrites paths it can see in
  HTML and CSS, but not strings inside a JSON file, which would otherwise work in
  development and 404 in production.
