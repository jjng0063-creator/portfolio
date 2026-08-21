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

## Editing the content

All text on the site comes from a single file: [`src/data/profile.js`](src/data/profile.js).
Nothing else needs touching to update the bio, education, jobs, projects or skills.

## Layout

```
src/
  data/profile.js          all site content
  App.jsx                  composes the sections
  components/
    SkewedCarousel.jsx     3D projects carousel
    Nav.jsx                sticky header
    Section.jsx            section shell
    SectionHeading.jsx     section headings
    sections/              Hero, About, Education, Experience, Projects, Skills, Contact
    ui/                    shadcn/ui components
```
