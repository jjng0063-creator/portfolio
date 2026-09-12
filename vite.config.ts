import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const CONTENT_JSON = path.resolve(import.meta.dirname, 'src/data/content.json');
const readContent = () => JSON.parse(fs.readFileSync(CONTENT_JSON, 'utf8'));

/**
 * Resolve a possibly-relative URL against the site's base, or null if it cannot
 * be resolved. Returning null matters: siteUrl is a free-text field in the admin
 * panel, and letting `new URL()` throw here would turn an ordinary metadata edit
 * into a failed build and a failed deploy.
 */
const absoluteUrl = (value?: string, base?: string): string | null => {
  if (!value) return null;
  try {
    return new URL(value, base || undefined).href;
  } catch {
    return null;
  }
};

/**
 * Vite writes injected tag children verbatim, which is right for <style> and
 * <script> but means a title containing markup would break out of the element.
 * Escaping the two characters that matter is enough for RCDATA content.
 */
const escapeText = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;');

/**
 * Writes the page metadata from src/data/content.json into index.html.
 *
 * Doing it here rather than from React is what puts the <title> and og: tags in
 * the served HTML, where crawlers and link previews actually see them — and it
 * means editing your name in the admin panel updates the browser tab too,
 * rather than leaving the two to drift apart.
 */
function siteMetaPlugin(): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // The admin panel is a private tool: it gets none of the public
        // metadata and carries its own noindex.
        if (ctx.filename.endsWith('admin.html')) return html;

        const { meta = {} } = readContent();
        const tags: any[] = [];

        const siteUrl = absoluteUrl(meta.siteUrl);
        const ogImage = absoluteUrl(meta.ogImage, meta.siteUrl);

        if (meta.ogImage && !ogImage) {
          this.warn(
            `Ignoring og:image "${meta.ogImage}": it is a relative path and meta.siteUrl ` +
              `(${JSON.stringify(meta.siteUrl)}) is not a valid absolute URL. Set the Site URL ` +
              `in the admin panel's "Page & sharing" tab.`
          );
        }

        const og: [string, string | null][] = [
          ['og:type', 'website'],
          ['og:title', meta.ogTitle || meta.title],
          ['og:description', meta.ogDescription || meta.description],
          ['og:url', siteUrl],
          ['og:image', ogImage],
        ];

        for (const [property, content] of og) {
          if (content) {
            tags.push({ tag: 'meta', attrs: { property, content }, injectTo: 'head' });
          }
        }

        tags.push({
          tag: 'meta',
          // Keyed off the resolved image, not the raw field: claiming a large
          // card with no usable image gives a broken preview.
          attrs: {
            name: 'twitter:card',
            content: ogImage ? 'summary_large_image' : 'summary',
          },
          injectTo: 'head',
        });

        if (meta.description) {
          tags.push({
            tag: 'meta',
            attrs: { name: 'description', content: meta.description },
            injectTo: 'head',
          });
        }

        // Injected as a tag rather than substituted into the HTML: a regex over
        // the source would also match anything inside a comment.
        tags.push({
          tag: 'title',
          children: escapeText(meta.title || 'Portfolio'),
          injectTo: 'head-prepend',
        });

        return { html, tags };
      },
    },
    configureServer(server) {
      // content.json is imported by the app (so edits hot-reload on their own)
      // but also read here for the HTML, which Vite does not track.
      server.watcher.add(CONTENT_JSON);
      server.watcher.on('change', (file) => {
        if (path.resolve(file) === CONTENT_JSON) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  // Served from https://jjng0063-creator.github.io/portfolio-v2/, so every asset
  // URL needs the repo name prefixed. Vite rewrites paths it can see in HTML and
  // CSS; paths that live in content.json go through withBase() in
  // portfolioData.ts instead, since Vite cannot see inside a JSON string.
  base: '/portfolio-v2/',

  plugins: [react(), tailwindcss(), siteMetaPlugin()],

  resolve: {
    // `three/examples/jsm/*` resolves `three` separately from the pre-bundled
    // copy, which loads the library twice: instanceof checks across the two
    // copies fail and the bundle carries three megabytes it does not need.
    dedupe: ['three', 'react', 'react-dom'],
  },

  build: {
    rollupOptions: {
      input: {
        // Two separate bundles. The admin panel is a good deal of code and
        // almost nobody loads it, so keeping it out of the portfolio's entry
        // point means visitors never download it.
        main: path.resolve(import.meta.dirname, 'index.html'),
        admin: path.resolve(import.meta.dirname, 'admin.html'),
      },
    },

    // three.js is reached only through the cabinet's lazy import, so Rollup
    // gives it its own ~900 kB chunk. That is expected and is never fetched on
    // mobile or before the page is idle, so the warning is raised above it
    // rather than firing on every build.
    //
    // The number to actually watch in the build output is the ENTRY chunk:
    // it should stay under ~300 kB (~90 kB gzipped). If it jumps, something
    // imported three.js, framer-motion, or drei eagerly.
    chunkSizeWarningLimit: 1000,
  },
});
