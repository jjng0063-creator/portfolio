import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { buildThemeCss, buildModeScript } from './src/lib/theme.js'

const SITE_JSON = path.resolve(import.meta.dirname, 'src/data/site.json')
const readSite = () => JSON.parse(fs.readFileSync(SITE_JSON, 'utf8'))

/**
 * Resolve a possibly-relative URL against the site's base, or null if it cannot
 * be resolved. Returning null matters: siteUrl is a free-text field in the
 * admin panel, and letting `new URL()` throw here would turn an ordinary
 * metadata edit into a failed build and a failed deploy.
 */
const absoluteUrl = (value, base) => {
  if (!value) return null
  try {
    return new URL(value, base || undefined).href
  } catch {
    return null
  }
}

/**
 * Vite writes injected tag children verbatim, which is right for <style> and
 * <script> but means a title containing markup would break out of the element.
 * Escaping the two characters that matter is enough for RCDATA content.
 */
const escapeText = value =>
  String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')

/**
 * Writes the theme and the page metadata from src/data/site.json into the HTML
 * at build time.
 *
 * Doing it here rather than from React matters for two reasons: the colours and
 * light/dark mode are settled before the first paint, so changing the theme in
 * the admin panel can never cause a flash of the old one; and the <title> and
 * og: tags end up in the served HTML, where crawlers and link previews will
 * actually see them.
 */
function siteHtmlPlugin() {
  return {
    name: 'site-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const site = readSite()
        const { meta = {}, theme } = site
        const isAdmin = ctx.filename.endsWith('admin.html')

        const tags = [
          { tag: 'script', children: buildModeScript(theme?.mode), injectTo: 'head-prepend' },
          { tag: 'style', children: buildThemeCss(theme), injectTo: 'head' },
        ]

        // The admin panel is a private tool: it borrows the theme so previews
        // look right, but gets none of the public metadata, and asks not to be
        // indexed.
        if (isAdmin) {
          tags.push({
            tag: 'meta',
            attrs: { name: 'robots', content: 'noindex, nofollow' },
            injectTo: 'head',
          })
          return { html, tags }
        }

        const siteUrl = absoluteUrl(meta.siteUrl)
        const ogImage = absoluteUrl(meta.ogImage, meta.siteUrl)

        if (meta.ogImage && !ogImage) {
          this.warn(
            `Ignoring og:image "${meta.ogImage}": it is a relative path and meta.siteUrl ` +
              `(${JSON.stringify(meta.siteUrl)}) is not a valid absolute URL. Set the Site URL ` +
              `in the admin panel's "Page & sharing" tab.`
          )
        }

        const og = [
          ['og:type', 'website'],
          ['og:title', meta.ogTitle || meta.title],
          ['og:description', meta.ogDescription || meta.description],
          ['og:url', siteUrl],
          ['og:image', ogImage],
        ]

        for (const [property, content] of og) {
          if (content) {
            tags.push({ tag: 'meta', attrs: { property, content }, injectTo: 'head' })
          }
        }

        tags.push({
          tag: 'meta',
          // Keyed off the resolved image, not the raw field: claiming a large
          // card with no usable image gives a broken preview.
          attrs: { name: 'twitter:card', content: ogImage ? 'summary_large_image' : 'summary' },
          injectTo: 'head',
        })

        if (meta.description) {
          tags.push({
            tag: 'meta',
            attrs: { name: 'description', content: meta.description },
            injectTo: 'head',
          })
        }

        // Injected as a tag rather than substituted into the HTML: a regex
        // over the source would also match anything inside a comment.
        tags.push({
          tag: 'title',
          children: escapeText(meta.title || 'Portfolio'),
          injectTo: 'head-prepend',
        })

        return { html, tags }
      },
    },
    configureServer(server) {
      // site.json is imported by the app (so edits hot-reload on their own) but
      // also read here for the HTML, which Vite does not track. Force a reload.
      server.watcher.add(SITE_JSON)
      server.watcher.on('change', file => {
        if (path.resolve(file) === SITE_JSON) {
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Served from https://jjng0063-creator.github.io/portfolio/, so every asset
  // URL needs the repo name prefixed. Use import.meta.env.BASE_URL to build
  // paths to files in public/ rather than hardcoding a leading slash.
  base: '/portfolio/',
  plugins: [react(), tailwindcss(), siteHtmlPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
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
  },
})
