# Progress — Personal Portfolio

**Project:** `about-me` — single-page portfolio site for Ng Jun Jie
**Last updated:** 21 August 2026
**Status:** Deployed and live at https://jjng0063-creator.github.io/portfolio/

---

## Where things stand

The site is fully assembled and builds cleanly. All seven sections render from a
single content file, and the custom projects carousel is finished. It is live on
GitHub Pages and redeploys on every push to `main`.

It now has an admin panel at `/admin.html`: content, theme, section order and
page metadata are all editable in a browser and saved as commits, with no
hardcoded strings left in any component. What remains is content polish — photo,
résumé, project links, and an OG image, all of which can now be done through the
panel rather than in code.

| Area | State |
| --- | --- |
| Scaffold (Vite 8 + React 19 + Tailwind v4) | Done |
| Content layer (`src/data/site.json`) | Done — populated from the Jan 2027 résumé |
| Admin panel (`/admin.html`) | Done — content, theme, sections, metadata, uploads |
| Page sections (Hero → Contact) | Done — all 7 built |
| `SkewedCarousel` 3D projects carousel | Done — 429 lines, GSAP-driven |
| shadcn/ui component set | Done — badge, button, card, separator |
| Lint (`npm run lint`) | Passing — 2 known warnings, see below |
| Production build (`npm run build`) | Working — output in `dist/` |
| Deployment | Live on GitHub Pages, auto-deploys from `main` |

---

## Completed

**Scaffold and tooling**
- Vite 8 with `@vitejs/plugin-react`, path alias `@/` → `src/`
- Tailwind CSS v4 via `@tailwindcss/vite`, theme tokens in `src/index.css`
- oxlint configured (`.oxlintrc.json`)
- Geist variable font via `@fontsource-variable/geist`

**Content architecture**
- Every string on the site lives in `src/data/site.json` — bio, education,
  experience, projects, skills, contact, plus `theme`, `sections` and `meta`.
  No other file needs editing to update content.
- `src/data/profile.js` is now a thin adapter over that JSON, so the section
  components' imports were left untouched.
- Section headings, nav labels, order and visibility come from `sections[]`;
  `App.jsx` maps over it and the eyebrow numbering (`01 —`, `02 —`) follows
  position, so reordering renumbers automatically.
- Sections degrade gracefully on missing data: the Hero falls back to initials
  when `photo` is `null`, hides the résumé button when `resumeUrl` is `null`,
  and Contact hides the links row when `contact.links` is empty.

**Sections built** — Hero, About, Education, Experience, Projects, Skills,
Contact, plus a sticky `Nav`, and shared `Section` / `SectionHeading` shells.

**Projects carousel** — `src/components/SkewedCarousel.jsx`, the largest piece
of original work here. Cards sit on a shallow arc and are rotated relative to
the viewing ray so every off-centre card is foreshortened by the same amount
regardless of how far out it sits.

**Content loaded** — 2 education entries, 3 work experiences, 5 projects
(Face Recognition Attendance System, CharityLink, Student Co-curricular
Management System, Stock Management System, Student Exam System), 4 skill groups.

---

## Outstanding

**Content gaps** (all in `src/data/profile.js`)
- [ ] `profile.photo` is `null` — Hero shows initials. Drop an image in `public/`
      and set the path.
- [ ] `profile.resumeUrl` is `null` — the Résumé button is hidden entirely.
      Add `resume.pdf` to `public/` and point at it.
- [ ] LinkedIn URL — placeholder is commented out in `contact.links`; only
      GitHub is live.
- [ ] Every project has `links: []`. No repo or demo links are reachable from
      any card.
- [ ] `public/` has no OG image (1200x630). The favicon is an inline SVG in
      `index.html` and needs nothing.

**Deployment**
- [x] Live at https://jjng0063-creator.github.io/portfolio/ — GitHub Pages,
      published by `.github/workflows/deploy.yml` on every push to `main`.
      The workflow runs lint and build, then uploads `dist/` via the Pages
      OIDC deploy action. `dist/` stays gitignored; nothing is committed.
- [ ] No custom domain. Adding one means a `CNAME` in `public/`, a DNS record,
      and dropping `base` back to `'/'` in `vite.config.js`.
- [ ] `og:url` and `og:image` in `index.html` are still unset. The URL is now
      known, so `og:url` can be filled in; `og:image` needs a 1200x630 asset.

**Polish / not yet addressed**
- [x] SEO and social metadata in `index.html` — title, description, `og:type`,
      `og:title`, `og:description`, `twitter:card`. `og:url` and `og:image` are
      left for deploy time, when there is a domain and an image to point at.
- [x] Responsive pass on the carousel — verified at 375px and 768px. The `SIZES`
      tiers in `Projects.jsx` apply correctly (150x210 and 180x250) and the page
      has no horizontal overflow at either width.
- [x] Keyboard navigation through the carousel — the root is focusable with a
      visible focus ring, arrow keys step and wrap, and the detail panel below
      follows the selection.
- [x] `npm run check` covers the admin's non-UI logic and runs in CI. There is
      still no component-level or end-to-end test runner.

**Admin panel** — the largest addition since deployment.
- Second Vite entry point (`admin.html` -> `src/admin/`), so the ~39 kB of
  editor code is in its own bundle and portfolio visitors never download it.
  Verified: `api.github.com` appears only in the admin chunk.
- Talks to the GitHub Contents API straight from the browser using a
  fine-grained PAT the user pastes in. No server, so the site stays on Pages.
- Nine panels: Profile, Sections, Education, Experience, Projects, Skills,
  Contact, Theme, Page & sharing. Arrays are reorderable and deletable.
- Saves send the file's blob `sha`, so a stale tab gets a 409 rather than
  silently overwriting a newer version.
- After a save it polls the Actions API and reports when the deploy lands —
  without that the site looks unchanged for a minute and the save looks broken.
- Theme changes preview live in the editor itself.
- Photo/résumé upload commits into `public/uploads/` and previews the local file
  immediately, since the committed one is not served until the deploy finishes.

**Theme system**
- `src/lib/theme.js` turns the `theme` block into CSS. Shared by three callers:
  `vite.config.js` (build-time injection), the admin (live preview) and
  `main.jsx` (following the OS setting in `system` mode).
- Injected into `index.html` at build time, so there is no flash of the wrong
  colours, and `<title>`/`og:` tags are injected the same way — they are in the
  served HTML where crawlers see them.

---

## Verification

- `npm run lint` — passes, still only the two known shadcn warnings.
- `npm run build` — clean, both entry points emit.
- `npm run check` — 15 logic checks against `immutable.js`, `github.js` and
  `theme.js`, now also run in CI ahead of the build:
  immutable updates, unicode-safe base64 round-tripping of the real content
  file, 3 MB binary encoding, theme CSS generation, and that every section's
  `component` resolves in the registry.
- Browser: all nine panels render with no console errors; edit -> Publish was
  driven end to end against a stubbed GitHub API, and the committed payload
  decodes back to valid JSON with the edit applied and unicode intact.
- Editing `site.json` directly was confirmed to move sections, hide them,
  renumber eyebrows, drop nav links and restyle the page, with no component
  changes.

---

## Known issues

- **Two lint warnings**, both pre-existing and both benign — `button.jsx:63` and
  `badge.jsx:47` export variants alongside components, which breaks React Fast
  Refresh for those two files. This is how shadcn/ui ships them. Fixing means
  splitting the variant objects into separate files.
- ~~`shadcn` is a runtime dependency~~ — moved to `devDependencies`.

---

## Suggested next steps

1. Create the GitHub token and open `/admin.html` on the live site.
2. Upload the photo and résumé PDF through the Profile panel — highest value for
   least effort, and the Hero already handles both.
3. Add repo links to the projects that have public repos (Projects panel).
4. Add a 1200x630 share image through the Page & sharing panel, so shared links
   render a card instead of bare text. `og:url` is already set.

---

## Repository

Branch `main`, tracking `origin/main`. Deploys are driven by pushes to `main`.

```
e41a333  Deploy to GitHub Pages via Actions
e7572ae  Add page metadata, move shadcn to devDependencies
37b477a  Add GitHub profile link to contact section
451c587  Add personal portfolio site
```
