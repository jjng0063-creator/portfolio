import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'
import { profile } from '@/data/profile'

export default function About() {
  return (
    <Section id="about">
      <SectionHeading eyebrow="01 — About" title="A bit about me" />
      <div className="grid gap-6 text-pretty leading-relaxed text-muted-foreground sm:grid-cols-2">
        {profile.about.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </Section>
  )
}
