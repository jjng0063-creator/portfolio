import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'
import { Button } from '@/components/ui/button'
import { contact, profile } from '@/data/profile'

export default function Contact({ id, eyebrow, title, subtitle }) {
  return (
    <Section id={id}>
      <SectionHeading eyebrow={eyebrow} title={title}>
        {subtitle}
      </SectionHeading>

      <a
        href={`mailto:${contact.email}`}
        className="inline-block break-all text-2xl font-medium underline decoration-primary/40 underline-offset-8 transition-colors hover:decoration-primary sm:text-3xl">
        {contact.email}
      </a>

      {contact.links.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          {contact.links.map(l => (
            <Button key={l.href} variant="outline" asChild>
              <a href={l.href} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            </Button>
          ))}
        </div>
      )}

      <p className="mt-16 font-mono text-xs text-muted-foreground">
        © {new Date().getFullYear()} {profile.name}
      </p>
    </Section>
  )
}
