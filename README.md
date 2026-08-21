# Personal Portfolio — Ng Jun Jie

A single-page portfolio site covering my studies, work experience and projects.

Built with React 19, Vite and Tailwind CSS v4, with [shadcn/ui](https://ui.shadcn.com)
components. The projects section uses a custom coverflow-style carousel written
for this site ([`SkewedCarousel.jsx`](src/components/SkewedCarousel.jsx)) — cards
sit on a shallow arc and are rotated relative to the viewing ray, so every
off-centre card is foreshortened by the same amount however far out it sits.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

## Editing the site

Everything the site displays — text, projects, colours, section order, page
metadata — lives in one file: [`src/data/site.json`](src/data/site.json). There
are two ways to change it.

### The admin panel

Open `/admin.html` on the live site (or http://localhost:5173/portfolio/admin.html
in dev) and sign in with a GitHub token. Editing there commits `site.json` back
to this repository, which triggers the normal Actions deploy, so changes are live
about a minute later. There is no server involved: the page talks to the GitHub
API directly from your browser.

The token is a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new)
limited to this one repository, needing only:

- **Contents** — Read and write (required, this is what commits the file)
- **Actions** — Read-only (optional, lets the panel report when the deploy finishes)

It is stored in your browser's local storage and sent only to `api.github.com`.
Nothing secret is baked into the build, so `/admin.html` being publicly reachable
is harmless — without a token it does nothing. It carries a `noindex` tag so it
stays out of search results.

Photo and résumé uploads are committed straight to `public/uploads/` as soon as
you pick the file, separately from the Publish button.

### By hand

Edit [`src/data/site.json`](src/data/site.json) directly and commit. The admin
panel reads and writes the same file, so the two approaches are interchangeable.
[`src/data/profile.js`](src/data/profile.js) is a thin adapter over that JSON and
is what the components import.

One constraint: a section's `component` field must match a key in
[`src/components/sections/index.js`](src/components/sections/index.js). Sections
can be reordered, renamed and hidden freely, but adding a genuinely new *kind* of
section means writing a component and registering it there.

## How the theme is applied

Colours, fonts, corner radius and light/dark mode are read from `site.json` at
build time and written into `index.html` as an inline `<style>` block by
`siteHtmlPlugin` in [`vite.config.js`](vite.config.js) — so the page never
flashes the wrong colours before React loads. The same plugin injects the
`<title>` and `og:` tags, which is why editing them in `index.html` has no
effect.

## Layout

```
index.html                 the portfolio
admin.html                 the editor (separate bundle)
src/
  data/site.json           all content, theme and section config
  data/profile.js          adapter over site.json, what components import
  lib/theme.js             theme tokens -> CSS, shared with vite.config.js
  App.jsx                  renders the sections site.json lists, in order
  components/
    SkewedCarousel.jsx     3D projects carousel
    Nav.jsx                sticky header, links follow site.json
    Section.jsx            section shell
    SectionHeading.jsx     section headings
    sections/              Hero, About, Education, ... + index.js registry
    ui/                    shadcn/ui components
  admin/
    Admin.jsx              editor shell, save and deploy status
    Login.jsx              token entry
    github.js              GitHub REST client
    panels.jsx             one panel per tab
    fields.jsx             form primitives
    media.jsx              photo and résumé upload
    context.js             editor context and hooks
    immutable.js           path-addressed immutable updates
```

The admin is a second Vite entry point, so its code is in its own bundle and
visitors to the portfolio never download it.
