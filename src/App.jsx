import Nav from '@/components/Nav'
import Hero from '@/components/sections/Hero'
import { SECTION_COMPONENTS } from '@/components/sections'
import { sections } from '@/data/profile'

/** '01 — About'. Numbered by position, so reordering renumbers automatically. */
const eyebrowFor = (label, index) =>
  label ? `${String(index + 1).padStart(2, '0')} — ${label}` : ''

export default function App() {
  return (
    <div className="min-h-svh bg-background text-foreground antialiased">
      <Nav />
      <main>
        <Hero />
        {sections.map((section, i) => {
          const Component = SECTION_COMPONENTS[section.component]
          if (!Component) return null
          return (
            <Component
              key={section.id}
              id={section.id}
              eyebrow={eyebrowFor(section.eyebrow, i)}
              title={section.title}
              subtitle={section.subtitle}
            />
          )
        })}
      </main>
    </div>
  )
}
