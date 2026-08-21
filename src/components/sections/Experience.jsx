import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'
import { Badge } from '@/components/ui/badge'
import { experience } from '@/data/profile'

export default function Experience({ id, eyebrow, title, subtitle }) {
  return (
    <Section id={id}>
      <SectionHeading eyebrow={eyebrow} title={title}>
        {subtitle}
      </SectionHeading>

      <ol className="relative border-l border-border pl-8">
        {experience.map((job, i) => (
          <li key={i} className="pb-12 last:pb-0">
            <span className="absolute -left-[6.5px] mt-2 size-3 rounded-full border-2 border-background bg-primary" />

            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-lg font-medium">
                {job.role}
                <span className="text-muted-foreground"> · {job.company}</span>
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {job.period}
              </span>
            </div>

            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {job.location}
            </p>

            {job.summary && (
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                {job.summary}
              </p>
            )}

            {job.highlights?.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {job.highlights.map((h, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/70" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}

            {job.stack?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {job.stack.map(t => (
                  <Badge key={t} variant="outline" className="font-mono text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </Section>
  )
}
