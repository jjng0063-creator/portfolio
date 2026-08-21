import { useEffect, useMemo, useState } from 'react'
import SkewedCarousel from '@/components/SkewedCarousel'
import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { projects } from '@/data/profile'

function ProjectCard({ project, index }) {
  const [from, to] = project.accent ?? ['#6366f1', '#0ea5e9']

  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden p-5 text-white"
      style={{ backgroundImage: `linear-gradient(155deg, ${from} 0%, ${to} 100%)` }}>
      <span
        aria-hidden
        className="absolute -bottom-6 -right-3 text-[7rem] font-semibold leading-none text-white/10">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
          {project.kind}
        </p>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-white/90">
          {project.blurb}
        </p>
      </div>

      <div className="relative">
        <div className="flex flex-wrap gap-1.5">
          {project.stack?.slice(0, 3).map(t => (
            <span
              key={t}
              className="rounded-full bg-black/25 px-2 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur-sm">
              {t}
            </span>
          ))}
        </div>
        <p className="mt-3 font-mono text-[11px] text-white/60">{project.year}</p>
      </div>
    </div>
  )
}

/** Carousel geometry per breakpoint — cards and arc shrink on narrow screens. */
const SIZES = [
  { max: 640, cardWidth: 150, cardHeight: 210, spread: 300, visibleCards: 2 },
  { max: 1024, cardWidth: 180, cardHeight: 250, spread: 480, visibleCards: 3 },
  { max: Infinity, cardWidth: 200, cardHeight: 280, spread: 720, visibleCards: 3 },
]

function useCarouselSize() {
  const [size, setSize] = useState(SIZES[SIZES.length - 1])

  useEffect(() => {
    const sync = () =>
      setSize(SIZES.find(s => window.innerWidth <= s.max) ?? SIZES[SIZES.length - 1])
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  return size
}

export default function Projects({ id, eyebrow, title, subtitle }) {
  const [active, setActive] = useState(0)
  const size = useCarouselSize()

  const items = useMemo(
    () =>
      projects.map((p, i) => ({
        alt: p.title,
        caption: p.title,
        content: <ProjectCard project={p} index={i} />,
      })),
    []
  )

  const current = projects[active] ?? projects[0]

  return (
    <Section id={id}>
      <SectionHeading eyebrow={eyebrow} title={title}>
        {subtitle}
      </SectionHeading>

      <div className="-mx-6 sm:mx-0">
        <SkewedCarousel
          items={items}
          cardWidth={size.cardWidth}
          cardHeight={size.cardHeight}
          spread={size.spread}
          visibleCards={size.visibleCards}
          rotation={60}
          inactiveScale={0.85}
          arc={18}
          loop
          onChange={setActive}
        />
      </div>

      {current && (
        <div className="mt-10 rounded-xl border border-border bg-card/50 p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-xl font-medium">{current.title}</h3>
            <span className="font-mono text-xs text-muted-foreground">
              {current.kind} · {current.year}
            </span>
          </div>

          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {current.description}
          </p>

          {current.stack?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {current.stack.map(t => (
                <Badge key={t} variant="outline" className="font-mono text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          )}

          {current.links?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {current.links.map(l => (
                <Button key={l.href} size="sm" variant="outline" asChild>
                  <a href={l.href} target="_blank" rel="noreferrer">
                    {l.label} ↗
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  )
}
