import { useEffect, useState } from 'react'
import { profile, sections } from '@/data/profile'

// Mirrors the visible sections from src/data/site.json, so hiding or
// reordering a section in the admin panel moves its nav link with it.
const LINKS = sections.map(s => ({ href: `#${s.id}`, label: s.navLabel || s.title }))

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'border-b border-border/60 bg-background/80 backdrop-blur-md' : ''
      }`}>
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <a href="#top" className="font-mono text-sm font-medium tracking-tight">
          {profile.name}
        </a>
        <ul className="hidden gap-6 sm:flex">
          {LINKS.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
