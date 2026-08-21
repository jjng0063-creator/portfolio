import { Button } from '@/components/ui/button'
import { profile, contact } from '@/data/profile'

const initials = name =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('')

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_22%,transparent),transparent_70%)]"
      />
      <div className="mx-auto w-full max-w-5xl px-6 pb-20 pt-28 sm:pb-28 sm:pt-36">
        <div className="flex flex-col-reverse items-start gap-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            {profile.availability && (
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                </span>
                {profile.availability}
              </p>
            )}
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              {profile.name}
            </h1>
            <p className="mt-3 text-xl text-primary sm:text-2xl">{profile.role}</p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {profile.location}
            </p>
            <p className="mt-6 max-w-xl text-pretty leading-relaxed text-muted-foreground">
              {profile.tagline}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild>
                <a href="#projects">View projects</a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`mailto:${contact.email}`}>Get in touch</a>
              </Button>
              {profile.resumeUrl && (
                <Button variant="ghost" asChild>
                  <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
                    Résumé
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="size-32 rounded-2xl object-cover ring-1 ring-border sm:size-40"
              />
            ) : (
              <div className="grid size-32 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 text-3xl font-semibold ring-1 ring-border sm:size-40 sm:text-4xl">
                {initials(profile.name) || '—'}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
