import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'
import { profile } from '@/data/profile'

export default function About({ id, eyebrow, title, subtitle }) {
  return (
    <Section id={id}>
      <SectionHeading eyebrow={eyebrow} title={title}>
        {subtitle}
      </SectionHeading>
      <div className="grid gap-6 text-pretty leading-relaxed text-muted-foreground sm:grid-cols-2">
        {profile.about.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </Section>
  )
}
