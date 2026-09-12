import React, { useState } from 'react';
import { ArrowDown, Check, Copy, FileText, MapPin } from 'lucide-react';
import { PORTFOLIO_DATA } from '../../data/portfolioData';
import { Button } from '../ui/Button';
import { GithubIcon, LinkedinIcon } from '../ui/Icons';

export const Hero: React.FC<{ onSound?: () => void }> = ({ onSound }) => {
  const { profile } = PORTFOLIO_DATA;
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      onSound?.();
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <section
      id="top"
      className="relative mx-auto w-full max-w-[76rem] px-[var(--gutter)]"
      style={{
        paddingTop: 'clamp(2.5rem,1.75rem+4vw,5rem)',
        // Half a section below: the first section adds its own top padding.
        paddingBottom: 'calc(var(--section) / 2)',
      }}
    >
      <div>
        {/* ---------------------------------------------------------------- */}
        {/* Type                                                              */}
        {/* ---------------------------------------------------------------- */}
        <div className="min-w-0">
          {profile.status.available && (
            <div
              className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full mb-7"
              style={{
                backgroundColor: 'var(--live-soft)',
                border: '1px solid color-mix(in srgb, var(--live) 30%, transparent)',
                color: 'var(--text)',
                fontSize: 'var(--step--1)',
              }}
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-70 motion-safe:animate-ping"
                  style={{ backgroundColor: 'var(--live)' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: 'var(--live)' }}
                />
              </span>
              {profile.status.text}
            </div>
          )}

          <h1
            className="font-extrabold"
            style={{ fontSize: 'var(--step-5)', color: 'var(--text)' }}
          >
            {profile.headline}
          </h1>

          <p
            className="measure mt-6"
            style={{ fontSize: 'var(--step-1)', color: 'var(--text-2)', lineHeight: 1.55 }}
          >
            {profile.summary}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-2.5">
            <Button as="a" href="#projects" variant="primary">
              View my work
              <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>

            <Button variant="secondary" onClick={copyEmail}>
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Email copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  Copy email
                </>
              )}
            </Button>

            {profile.resumeUrl && (
              <Button as="a" href={profile.resumeUrl} variant="ghost" external>
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                Résumé
              </Button>
            )}
          </div>

          {/* Meta row */}
          <div
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"
            style={{ fontSize: 'var(--step--1)', color: 'var(--text-3)' }}
          >
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              {profile.location}
            </span>

            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[var(--text)] transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                GitHub
              </a>
            )}

            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[var(--text)] transition-colors"
              >
                <LinkedinIcon className="w-3.5 h-3.5" />
                LinkedIn
              </a>
            )}
          </div>

          {PORTFOLIO_DATA.stats.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">
              {PORTFOLIO_DATA.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="label mb-1.5">{stat.label}</dt>
                  <dd
                    className="font-mono font-semibold"
                    style={{ fontSize: 'var(--step-2)', color: 'var(--text)' }}
                  >
                    {stat.value}
                  </dd>
                  <dd style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}>
                    {stat.note}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

      </div>
    </section>
  );
};

