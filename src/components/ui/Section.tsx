import React from 'react';
import { NAV_SECTIONS } from '../../data/portfolioData';
import { Emerge } from './Emerge';

interface SectionProps {
  id: string;
  label: string;
  title: React.ReactNode;
  /** Optional lead paragraph under the title. */
  lead?: string;
  children: React.ReactNode;
  /** Renders the hairline index divider above the section. */
  divider?: boolean;
}

/**
 * The single layout unit for every content section.
 *
 * One component owning section rhythm is what keeps vertical spacing, heading
 * scale and the eyebrow treatment consistent — previously each section invented
 * its own.
 */
export const Section: React.FC<SectionProps> = ({
  id,
  label,
  title,
  lead,
  children,
  divider = true,
}) => {
  // The eyebrow number is the number stamped on this section's drawer, so it is
  // read off the same list the cabinet builds its drawers from. Hardcoding it
  // per section meant inserting one section silently renumbered none of the
  // others, and the page and the cabinet then disagreed.
  const position = NAV_SECTIONS.findIndex((s) => s.id === id);
  const index = position >= 0 ? String(position + 1).padStart(2, '0') : null;

  return (
    <>
      {divider && (
        <div className="mx-auto w-full max-w-[76rem] px-[var(--gutter)]">
          <div className="sprocket-rule" aria-hidden="true" />
        </div>
      )}

      <section
        id={id}
        aria-labelledby={`${id}-heading`}
        className="mx-auto w-full max-w-[76rem] px-[var(--gutter)]"
        style={{ paddingTop: 'var(--section)', paddingBottom: 'var(--section)' }}
      >
        {/* The cabinet has its own reserved column (`.page` is padded to match),
            so content only needs a readable upper bound, not the tight cap this
            had while the cabinet was a full-viewport backdrop — that was leaving
            ~480px of dead space between the cards and the cabinet. */}
        <div className="max-w-[64rem]">
        <Emerge className="mb-[clamp(2rem,1.4rem+2vw,3.5rem)]">
          <div className="flex items-baseline gap-3">
            {index && (
              <span className="label" style={{ color: 'var(--accent-text)' }}>
                {index}
              </span>
            )}
            <span className="label">{label}</span>
          </div>

          <h2
            id={`${id}-heading`}
            className="mt-4 font-extrabold"
            style={{ fontSize: 'var(--step-3)', color: 'var(--text)' }}
          >
            {title}
          </h2>

          {lead && (
            <p
              className="measure mt-4"
              style={{ fontSize: 'var(--step-0)', color: 'var(--text-2)' }}
            >
              {lead}
            </p>
          )}
        </Emerge>

          {children}
        </div>
      </section>
    </>
  );
};
