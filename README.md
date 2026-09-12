# Portfolio

A scroll-driven 3D portfolio for an early-career software engineer.

An archive cabinet stands in its own column down the right-hand edge, one drawer
per section.
The drawer for whichever section you are reading slides open and the previous one
closes behind it; the cards for that section lift out of the open drawer and tip
into focus. Each drawer is filed with one labelled folder per item in that
section, and clicking a folder jumps to that exact item.

> **Content lives in [`src/data/content.json`](src/data/content.json)**, edited
> by hand or through the admin panel at `/admin.html`. Fields still starting
> with `TODO` render highlighted on the page — see [Filling it in](#filling-it-in).

---

## Running it

```bash
npm install
```

```bash
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:5173 |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | oxlint |
| `npm run check` | Validates `src/data/content.json` |
| `npm test` | Runs component regression tests |
| `npm run test:browser` | Runs browser interaction checks using installed Chrome (`CHROME_PATH` can override its location) |

Changes worth knowing about are recorded in [CHANGELOG.md](CHANGELOG.md).

---

## Filling it in

Everything you edit lives in one file:
**[`src/data/content.json`](src/data/content.json)**

Its neighbour [`portfolioData.ts`](src/data/portfolioData.ts) holds the types
and the derived helpers over that JSON — the section anchors, the drawer
contents, the nav. You only touch it to change how the site works, not what it
says.

Edit the JSON by hand, or open **`/admin.html`** and edit it in a browser — see
[The admin panel](#the-admin-panel).

Unfilled strings start with `TODO` and render highlighted on the page, so a
half-finished site is obvious at a glance rather than quietly shipping "Project
One" to a recruiter. `npm run check` validates the file.

Work through it in this order:

1. **`profile`** — name, headline, summary, email, links, location.
2. **`projects`** — three good ones beat six thin ones. Each is written as
   **problem → approach → result**, which is the same shape you'd use to talk
   through it in an interview. If you can't write the `result`, the project
   probably isn't ready to show.

   Each project also takes a **screenshot** — drop the file in `public/work/`
   and set `image: '/work/whatever.png'` plus an `imageAlt`. Recruiters scan
   before they read, so this is the first thing that says whether you build
   things that look finished. The slot is aspect-locked at 16:9 (the shape
   screenshots are already captured in, so your images crop cleanly) and
   anchored to the top, so lead with the interesting part.

   A card with no image shows a compact flagged strip rather than a full-size
   empty banner — at card width an empty 16:9 slot is ~576px of nothing per
   project, which dominated the section and added 1,200px to the page. The
   height is fixed at render, so there is no layout shift; cards simply differ
   in height until the screenshots land.

   **`featured`** decides how a project renders. Featured ones get the full
   card; the rest collapse to a one-line row in an "Also built" list underneath,
   which is what stops the section being five equally loud cards. Flag two or
   three — if everything is featured, nothing is. (Flag none and everything
   renders full, so you can't end up with a section of thin rows and no anchor.)
   **`year`** is optional and shows next to the category.
3. **`skillCategories`** — grouped by confidence (`Core` / `Working` /
   `Learning`) rather than by a percentage nobody believes.
4. **`apiEndpoints`** — the responses in the playground section. Keep them
   honest; visitors read them as claims about you.
5. **`education`** and **`experience`** — reverse-chronological. Both are
   rendered by the same `Timeline` component, as the Studies and Career
   sections.
6. **`stats`** — optional, and **empty is the correct default**. Only add a
   number you could walk someone through measuring.
7. Update the `<title>`, description, and Open Graph tags in
   [`index.html`](index.html), and add a 1200×630 `public/og.png`.
8. Set `IS_PLACEHOLDER = false`.

### A note on invented numbers

An earlier version of this site shipped the template's fabricated metrics —
`98.4% test coverage`, `1,400+ commits`, `20k events/sec`. Claims like those are
the first thing an interviewer probes and the fastest way to lose a room. Every
metric field here is optional and empty by default. Fewer real numbers beat more
fake ones.

### Project files and galleries

Project cards now open inline files containing their problem, approach, and
result. Optional `role`, `decisions`, `challenges`, and `lessons` fields add depth;
empty fields and unfinished TODO detail text are omitted. These fields are
available in the Projects admin tab.

The existing `image` / `imageAlt` pair is the gallery cover. Add more images with
`screenshots: [{ "src": "work/detail.png", "alt": "Description of the screen" }]`,
or upload them through the gallery repeater in admin. Every screenshot requires
a description. Clicking an image opens a native dialog; Escape closes it.

Skills with an exact, case-insensitive match in project stack tags expand to
show evidence links. These links reset the project filter before navigation.

The header motion toggle follows the OS initially and remembers an explicit
choice in this browser. Mobile visitors also have fixed quick links to Projects,
Résumé (when provided), and Contact. The API playground only simulates requests
locally; use the Contact section to send a real enquiry.

### Contact form

By default the form composes a prefilled email in the visitor's mail client, so
a message can never be silently lost. To collect submissions instead, set
`profile.contactFormEndpoint` to a POST endpoint (Formspree, Basin, your own
handler) and the form will post JSON to it.

---

## How it's built

- **React 19** + **Vite 8** + **TypeScript**
- **Tailwind CSS v4** for layout; design tokens are plain CSS custom properties
  in [`src/index.css`](src/index.css)
- **three.js** + **@react-three/fiber** for the cabinet, lazy-loaded
- **lucide-react** for icons

### Structure

```
src/
├── components/
│   ├── cabinet/
│   │   ├── CabinetScene.tsx   # The 3D cabinet + drawer choreography
│   │   └── CabinetStage.tsx   # Fixed viewport layer (lazy-loaded)
│   ├── hero/Hero.tsx          # Headline and CTAs
│   ├── layout/                # Header, Footer, PlaceholderBanner
│   ├── sections/              # About, Timeline, Projects, Skills, Playground, Contact
│   └── ui/                    # Section, Button, Emerge, Placeholder, Icons
├── hooks/
│   ├── useSectionBands.ts     # Cached section positions for the render loop
│   ├── useEmerge.ts           # Opts an element into the lift-out motion
│   ├── useScrollSpy.ts        # IntersectionObserver-based nav highlighting
│   ├── useTheme.ts            # Light/dark, follows the OS until you choose
│   └── useSoundEffects.ts     # Web Audio synth, off by default
├── lib/emerge.ts              # Shared rAF scheduler for the card motion
├── data/
│   ├── content.json           # ← all content (what the admin panel writes)
│   └── portfolioData.ts       # Types + derived anchors, drawers, nav
├── admin/                     # The editor at /admin.html, its own bundle
│   ├── Admin.tsx              # Shell: tabs, publish, deploy status
│   ├── Login.tsx              # Token entry, kept in this browser only
│   ├── github.ts              # The four REST calls the editor makes
│   ├── fields.tsx             # Form primitives addressed by JSON path
│   ├── panels.tsx             # One panel per tab
│   └── media.tsx              # Image / PDF upload, committed to public/
└── index.css                  # Design tokens and primitives
```

### How the drawers are wired

`NAV_SECTIONS` in `portfolioData.ts` is the single source of truth: each entry
becomes a nav link, a page section, **and** a numbered drawer. Add or reorder a
section there and the cabinet follows — drawer count, drawer height, the label
plates, the eyebrow numbers on the page and the loading placeholder are all
derived from that list. Nothing is sized for five.

**To add a section:**

1. Add an entry to `NAV_SECTIONS` in the position you want it.
2. Add a `case` to `drawerFiles()` returning one folder per item in it (return
   `[]` for a section with no individual items — the drawer then renders empty).
3. Write the section component, give it `<Section id="…">` with the same id, and
   render it from `App.tsx` in the same order.

Do step 1 without step 3 and nothing breaks: the drawer is there but never
opens, because the cabinet resolves the open drawer by section id rather than by
position. The cabinet body stays the same size at any count — the drawers divide
it — so the camera framing holds. Past roughly eight drawers the folder tabs
start to crowd; a dev-only assertion in `CabinetScene.tsx` fires before anything
visibly collides.

The contents of each drawer come from `drawerFiles()` in the same file — one
folder per project, per skill group, per endpoint, per milestone. Both the
folders and the elements they point at get their ids from the shared `itemId`
helper, so a folder can never aim at an id that no longer exists. Clicking sets
`location.hash`, which means the browser does the scrolling (honouring
`scroll-padding-top`), `:target` highlights what you landed on, and the back
button works.

If a section's item does not render, its folder must not exist either — see the
"Elsewhere" case in `drawerFiles`, which is omitted when there is no GitHub or
LinkedIn link to show. A folder that goes nowhere is worse than no folder.

All labels — drawer plates and folder tabs — are drawn to canvas textures, so
there is no 3D font to load.

### The admin panel

`/admin.html` is a content editor for the site, served from the same build as
its own bundle — 12 kB gzipped, and visitors to the portfolio never download it.

There is no server anywhere in it. The browser talks to api.github.com directly
with a fine-grained token you paste in, reads `src/data/content.json`, and
commits it back. That is why the site can stay on static hosting and still be
editable from a phone.

| | |
| --- | --- |
| **Sign in** | Owner, repository, and a fine-grained token with *Contents: Read and write*. Add *Actions: Read-only* and the panel also tracks the deploy. |
| **Where the token lives** | `localStorage` in that browser, only if you tick "stay signed in". It is sent to github.com and nowhere else. |
| **Publish** | Commits `content.json`. Your deploy then rebuilds the site, which takes a minute — the status bar says where it has got to rather than leaving you to guess. |
| **Uploads** | Images and the résumé are committed into `public/` and the field is set to the path the site serves. Under 8 MB: the whole commit goes up in one request. |
| **Conflicts** | The commit carries the sha of the file it read. If the file changed on GitHub since, GitHub rejects it and the panel says to reload — two tabs cannot silently overwrite each other. |

`admin.html` is publicly reachable and holds no secrets; it does nothing at all
until a token is pasted in. It carries `noindex, nofollow` so it stays out of
search results.

**Not editable from the panel, on purpose:** the theme (the palette is a
designed system, not content) and the section list (each id is wired to a
`drawerFiles` case and a component in `App.tsx`, so reordering there would
desync the page from the cabinet).

### Design tokens

Colour, type scale, and spacing are CSS custom properties on `:root`, with a
`[data-theme="light"]` block overriding them. To restyle the site, change the
tokens rather than hunting through components. The type scale is fluid
(`--step--2` through `--step-5`), so nothing needs per-breakpoint font sizes.

The theme is applied by a small inline script in `index.html` before first
paint, so there is no flash of the wrong palette.

---

## Things worth preserving

These are load-bearing decisions rather than incidental choices:

**The split layout only applies above 1280px.** The reserved column is what
lets the canvas take pointer events without covering the content, but at 1024px
it squeezed the text measure to ~570px and stretched the page past 13,000px.
Below the breakpoint the cabinet drops behind the page, dims, and stops taking
clicks.

**The cabinet is lazy.** It loads from a dynamic import after
`requestIdleCallback`, so the headline never waits on three.js. The number to
watch in `npm run build` output is the **entry** chunk (~239 kB / 74 kB gzipped);
the ~900 kB `CabinetScene` chunk is expected and is not on the critical path. If
the entry chunk jumps, something started importing three.js eagerly.

**The page scrolls normally.** No wheel hijacking, no scroll-jacked carousel.
Sections are real `<section id>` elements, so `#work`, `#playground` and the rest
are linkable, the back button works, and browser find works.

**No per-frame React state.** Drawers animate through refs inside `useFrame`,
card motion runs on one shared rAF loop in `lib/emerge.ts`, and nav highlighting
uses `IntersectionObserver`. Nothing re-renders the tree on scroll.

**Section positions are measured once, not every frame.** `useSectionBands`
caches them on mount and resize. Reading `getBoundingClientRect` for five
sections inside the render loop would force layout five times a frame.

**Clicking a drawer front forces it open immediately.** The click sets the hash
and the browser scrolls, but a smooth scroll takes time — so the clicked drawer
is held open by an override until the scroll catches up, with a 2.5s deadline so
a blocked or interrupted scroll can never wedge it. That override is only safe
because of the selection rule below; if landing on a section did not select it,
the drawer would snap shut the moment the override expired.

**The camera looks down into the open drawer.** At a level camera angle a
drawer's own front face hides its contents, which is why `FOCUS_Y` and the
raised camera exist, and why the cabinet cranes vertically to keep the open
drawer framed. If you move the camera, check that the folders are still visible.

**Exactly one drawer is open at any scroll position, and none at the hero.** The selection rule was
Selection is "the last section that has started above the focal line". Two
earlier rules failed: `distance < height * 0.85` let a tall section reach back
past the hero and hold its drawer open before any scrolling; nearest-centre fixed
that but broke click-to-open, because landing on a tall section's top edge left
the focal line far above its centre and selected the previous section instead.

If you change this rule, check all three properties across a range of viewport
heights — they were verified at 600/721/800/900/1080:

1. no drawer open at the hero,
2. no scroll position where nothing is open,
3. scrolling to any section's top makes that section active.

**Metalness is theme-dependent.** At high metalness a surface shows almost none
of its base colour and almost all of the environment, so the light theme lowers
metalness *and* darkens the base — otherwise the cabinet blows out to white and
disappears against the page. Both themes are tuned by eye; if you change one
value, look at both.

**Cards settle to no transform at all.** Once a card finishes emerging, every
transform is removed rather than left at `scale(1)`, so text renders on the pixel
grid instead of through a composited layer.

**Sound is off by default** and attached only to deliberate actions — never to
hover or scroll.

---

## Deploying

Any static host works. Build output is `dist/`.

**Vercel / Netlify** — connect the repo; both detect Vite. Build command
`npm run build`, publish directory `dist`.

Before you deploy, check that `IS_PLACEHOLDER` is `false` and that the meta tags
in `index.html` are yours.
