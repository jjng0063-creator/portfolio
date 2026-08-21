// ============================================================================
//  Theme tokens -> CSS.
//
//  Shared by three callers, which is why it lives outside the React tree and
//  imports nothing:
//    - vite.config.js, to inline the theme into index.html at build time so
//      the page never paints with the wrong colours;
//    - the admin panel, to preview a theme live while you drag a colour picker;
//    - src/main.jsx, to follow the OS setting when mode is 'system'.
// ============================================================================

/**
 * Font stacks offered in the admin panel. Only Geist (bundled via
 * @fontsource-variable/geist) and system faces — nothing here costs a network
 * request, so switching fonts can never slow the site down or fail offline.
 */
export const FONTS = {
  geist: { label: 'Geist', stack: "'Geist Variable', sans-serif" },
  system: {
    label: 'System sans',
    stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  serif: { label: 'Serif', stack: 'ui-serif, Georgia, Cambria, "Times New Roman", serif' },
  mono: {
    label: 'Monospace',
    stack: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
}

/**
 * Editable colour tokens, in the order the admin panel lists them.
 * `key` is the JSON field; `cssVar` is the custom property it drives.
 */
export const COLOR_TOKENS = [
  { key: 'background', cssVar: '--background', label: 'Page background' },
  { key: 'foreground', cssVar: '--foreground', label: 'Body text' },
  { key: 'primary', cssVar: '--primary', label: 'Accent' },
  { key: 'primaryForeground', cssVar: '--primary-foreground', label: 'Text on accent' },
  { key: 'card', cssVar: '--card', label: 'Card background' },
  { key: 'border', cssVar: '--border', label: 'Borders' },
  { key: 'muted', cssVar: '--muted', label: 'Muted background' },
  { key: 'mutedForeground', cssVar: '--muted-foreground', label: 'Muted text' },
]

/**
 * A few tokens are not worth a separate control but look wrong if left at the
 * stylesheet default once the palette moves. Each is derived from an edited
 * token, so the theme stays internally consistent.
 */
const DERIVED = [
  ['card', '--popover'],
  ['foreground', '--card-foreground'],
  ['foreground', '--popover-foreground'],
  ['foreground', '--secondary-foreground'],
  ['foreground', '--accent-foreground'],
  ['muted', '--secondary'],
  ['muted', '--accent'],
  ['border', '--input'],
  ['mutedForeground', '--ring'],
]

const declarations = colors => {
  const out = COLOR_TOKENS.filter(t => colors?.[t.key]).map(
    t => `${t.cssVar}:${colors[t.key]}`
  )
  for (const [from, cssVar] of DERIVED) {
    if (colors?.[from]) out.push(`${cssVar}:${colors[from]}`)
  }
  return out
}

/**
 * The theme as a stylesheet. Written into <head> at build time, and re-used by
 * the admin preview.
 *
 * The doubled-up selectors are deliberate. src/index.css already defines every
 * one of these tokens under `:root` and `.dark`, and Tailwind's stylesheet is
 * appended after this block — in dev it is injected by JS at runtime, later
 * still. At equal specificity the last rule wins, so a plain `:root` here loses
 * and the theme silently has no effect. `:root:root` and `:root:root.dark` beat
 * the originals on specificity, which does not depend on load order.
 */
export function buildThemeCss(theme) {
  if (!theme) return ''
  const font = FONTS[theme.font]?.stack ?? FONTS.geist.stack
  const light = declarations(theme.colors?.light)
  const dark = declarations(theme.colors?.dark)

  if (typeof theme.radius === 'number') light.push(`--radius:${theme.radius}rem`)

  return [
    light.length ? `:root:root{${light.join(';')}}` : '',
    dark.length ? `:root:root.dark{${dark.join(';')}}` : '',
    // --font-sans is declared literally in @theme inline, so Tailwind bakes it
    // into .font-sans and a variable override would not reach it. Setting the
    // family on <html> works instead: everything inherits, and the font-mono
    // utility still overrides it where the design wants monospace.
    `html:root{font-family:${font}}`,
  ]
    .filter(Boolean)
    .join('')
}

/**
 * The <script> that picks light or dark before first paint. Inlined into
 * index.html ahead of the stylesheet, so the page never flashes the wrong mode.
 */
export function buildModeScript(mode) {
  return `(function(){try{var m=${JSON.stringify(mode ?? 'system')};var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`
}

/**
 * Keep the .dark class in step with the OS while the page is open.
 * Only does anything in 'system' mode. Returns an unsubscribe function.
 */
export function watchColorScheme(mode) {
  const root = document.documentElement
  if (mode !== 'system') {
    root.classList.toggle('dark', mode === 'dark')
    return () => {}
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const sync = () => root.classList.toggle('dark', mq.matches)
  sync()
  mq.addEventListener('change', sync)
  return () => mq.removeEventListener('change', sync)
}

/**
 * Swap a theme in on a live document by rewriting one <style> tag.
 * Used by the admin panel's preview; the site itself gets its theme at build
 * time and never calls this.
 */
export function applyThemePreview(theme, styleId = 'theme-preview') {
  let el = document.getElementById(styleId)
  if (!el) {
    el = document.createElement('style')
    el.id = styleId
    document.head.append(el)
  }
  el.textContent = buildThemeCss(theme)
  document.documentElement.classList.toggle(
    'dark',
    theme.mode === 'dark' ||
      (theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
}
