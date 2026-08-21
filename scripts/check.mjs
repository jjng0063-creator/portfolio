// Checks the parts of the admin panel that a click-through in the browser
// cannot easily reach: immutable updates, unicode-safe base64 encoding, and
// theme CSS generation. Run with `npm run check`.
//
// These modules are all deliberately free of React and DOM access at import
// time, which is what makes them testable from plain Node with no tooling.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { setIn, getIn, moveItem, removeItem, addItem } from '../src/admin/immutable.js'
import { encodeText, decodeText, encodeBytes } from '../src/admin/github.js'
import { buildThemeCss, buildModeScript } from '../src/lib/theme.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = p => readFileSync(join(root, p), 'utf8')
const site = JSON.parse(read('src/data/site.json'))
let passed = 0
const check = (name, fn) => {
  fn()
  passed++
  console.log('  ok  ' + name)
}

console.log('\nimmutable updates')

check('setIn writes a nested field without mutating the original', () => {
  const original = site.profile.name
  const next = setIn(site, ['profile', 'name'], 'Changed')
  assert.equal(next.profile.name, 'Changed')
  assert.equal(site.profile.name, original, 'original must be untouched')
  assert.notEqual(next.profile, site.profile)
  assert.equal(next.education, site.education, 'untouched branches should be shared')
})

check('setIn writes into an array element', () => {
  const original = site.projects[1].accent[0]
  const next = setIn(site, ['projects', 1, 'accent', 0], '#ff0000')
  assert.equal(next.projects[1].accent[0], '#ff0000')
  assert.equal(site.projects[1].accent[0], original)
  assert.ok(Array.isArray(next.projects), 'arrays must stay arrays')
  assert.equal(next.projects.length, site.projects.length)
})

check('setIn creates missing containers', () => {
  const next = setIn({}, ['theme', 'colors', 'light', 'primary'], '#123456')
  assert.deepEqual(next, { theme: { colors: { light: { primary: '#123456' } } } })
})

check('getIn survives a missing path', () => {
  assert.equal(getIn(site, ['nope', 'missing', 'deep']), undefined)
})

check('moveItem reorders and refuses to run off either end', () => {
  const list = ['a', 'b', 'c']
  assert.deepEqual(moveItem(list, 0, 1), ['b', 'a', 'c'])
  assert.deepEqual(moveItem(list, 2, 1), ['a', 'c', 'b'])
  assert.deepEqual(moveItem(list, 0, -1), list, 'moving the first item up is a no-op')
  assert.deepEqual(moveItem(list, 2, 3), list, 'moving the last item down is a no-op')
  assert.deepEqual(list, ['a', 'b', 'c'], 'input must not be mutated')
})

check('removeItem and addItem', () => {
  assert.deepEqual(removeItem(['a', 'b', 'c'], 1), ['a', 'c'])
  assert.deepEqual(addItem(['a'], 'b'), ['a', 'b'])
})

console.log('\nbase64 encoding')

check('round-trips the real content file byte for byte', () => {
  const text = JSON.stringify(site, null, 2) + '\n'
  assert.equal(decodeText(encodeText(text)), text)
})

check('survives the characters actually in this content', () => {
  // Em dashes, middots and accents are all over the résumé text, and btoa()
  // alone throws on every one of them.
  const tricky = 'Résumé · 19 Oct 2026 — 16 Jan 2027 · 中文 · emoji 🎓'
  assert.equal(decodeText(encodeText(tricky)), tricky)
})

check('encodes binary without blowing the call stack', () => {
  // A 3 MB upload is a realistic photo; String.fromCharCode(...bytes) would
  // throw on an array this size, which is why the encoder chunks.
  const bytes = new Uint8Array(3 * 1024 * 1024)
  for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256
  const b64 = encodeBytes(bytes.buffer)
  const back = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  assert.equal(back.length, bytes.length)
  assert.deepEqual(back.slice(0, 512), bytes.slice(0, 512))
  assert.deepEqual(back.slice(-512), bytes.slice(-512))
})

console.log('\ntheme generation')

check('emits both palettes and the font', () => {
  const css = buildThemeCss(site.theme)
  // Doubled selectors: these must out-specify the :root/.dark blocks that
  // src/index.css already defines, regardless of which stylesheet loads last.
  assert.ok(css.includes(`--background:${site.theme.colors.light.background}`))
  assert.ok(css.includes(`--background:${site.theme.colors.dark.background}`))
  assert.match(css, /:root:root\{/)
  assert.match(css, /:root:root\.dark\{/)
  assert.match(css, new RegExp(`--radius:${site.theme.radius}rem`))
  assert.match(css, /html:root\{font-family:/)
})

check('derived tokens follow the edited ones', () => {
  const custom = setIn(site.theme, ['colors', 'light', 'muted'], '#abcdef')
  const css = buildThemeCss(custom)
  // --secondary and --accent are derived from muted, so a changed muted must
  // carry through or the palette ends up half-updated.
  assert.match(css, /--secondary:#abcdef/)
  assert.match(css, /--accent:#abcdef/)
})

check('an unknown font falls back rather than emitting nothing', () => {
  assert.match(buildThemeCss({ ...site.theme, font: 'bogus' }), /font-family:'Geist Variable'/)
})

check('the mode script is valid JS for each mode', () => {
  for (const mode of ['light', 'dark', 'system']) {
    const src = buildModeScript(mode)
    assert.doesNotThrow(() => new Function(src), `mode ${mode}`)
    assert.ok(src.includes(JSON.stringify(mode)))
  }
})

console.log('\ncontent file')

check('every section maps to a component the site registers', () => {
  const registry = read('src/components/sections/index.js')
  for (const section of site.sections) {
    assert.ok(
      new RegExp(`\\b${section.component}\\b`).test(registry),
      `${section.component} is missing from SECTION_COMPONENTS`
    )
    assert.ok(section.id, 'every section needs an id for its anchor link')
  }
})

check('section ids are unique', () => {
  const ids = site.sections.map(s => s.id)
  assert.equal(new Set(ids).size, ids.length)
})

console.log(`\n${passed} checks passed\n`)
