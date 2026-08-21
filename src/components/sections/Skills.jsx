import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'
import { Badge } from '@/components/ui/badge'
import { skills } from '@/data/profile'

export default function Skills({ id, eyebrow, title, subtitle }) {
  return (
    <Section id={id}>
      <SectionHeading eyebrow={eyebrow} title={title}>
        {subtitle}
      </SectionHeading>

      <div className="grid gap-8 sm:grid-cols-2">
        {skills.map(g => (
          <div key={g.group}>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {g.group}
            </h3>
            <div className="flex flex-wrap gap-2">
              {g.items.map((s, i) => (
                <Badge key={`${s}-${i}`} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
