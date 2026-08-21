import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { education } from '@/data/profile'

export default function Education({ id, eyebrow, title, subtitle }) {
  return (
    <Section id={id}>
      <SectionHeading eyebrow={eyebrow} title={title}>
        {subtitle}
      </SectionHeading>

      <div className="grid gap-5 sm:grid-cols-2">
        {education.map((ed, i) => (
          <Card key={i} className="bg-card/50">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-lg font-medium">{ed.school}</h3>
                <span className="font-mono text-xs text-muted-foreground">
                  {ed.period}
                </span>
              </div>
              <p className="mt-1 text-primary">{ed.degree}</p>
              {ed.grade && (
                <Badge variant="secondary" className="mt-3">
                  {ed.grade}
                </Badge>
              )}
              {ed.details?.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {ed.details.map((d, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/70" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
