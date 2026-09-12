import React from 'react';
import { PORTFOLIO_DATA, itemId } from '../../data/portfolioData';
import { Section } from '../ui/Section';
import { Field } from '../ui/Placeholder';
import { Emerge } from '../ui/Emerge';

/**
 * The longer bio, and the handful of facts a recruiter checks before reading
 * anything else: where you are, when you are free, what you are doing now.
 *
 * The facts are derived from data that already exists elsewhere in the file
 * rather than restated, so they cannot drift out of sync with it.
 */
export const About: React.FC = () => {
  const { profile, education } = PORTFOLIO_DATA;
  const current = education[0];

  const details: { term: string; value: string }[] = [
    { term: 'Based in', value: profile.location },
    { term: 'Available', value: profile.status.text },
  ];
  if (current) {
    details.push({
      term: 'Currently',
      value: `${current.title}, ${current.organization}`,
    });
  }

  return (
    <Section id="about" label="About" title="A bit about me." divider={false}>
      <div className="flex flex-col gap-5">
        <Emerge index={0}>
          <div
            id={itemId.about('bio')}
            className="surface p-[clamp(1.25rem,1rem+1.2vw,2.25rem)] grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8"
          >
            {profile.photo && (
              <img
                src={profile.photo}
                alt={profile.photoAlt || profile.name}
                loading="lazy"
                decoding="async"
                className="w-full max-w-[13rem] rounded-[10px] object-cover"
                style={{
                  aspectRatio: '4 / 5',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-sunken)',
                }}
              />
            )}

            <div className="flex flex-col gap-4 min-w-0">
              {profile.about.map((paragraph, i) => (
                <Field
                  key={i}
                  value={paragraph}
                  className="measure"
                  style={{
                    fontSize: 'var(--step-0)',
                    color: 'var(--text-2)',
                    lineHeight: 1.65,
                  }}
                />
              ))}
            </div>
          </div>
        </Emerge>

        <Emerge index={1}>
          <dl
            id={itemId.about('details')}
            className="surface p-[clamp(1.25rem,1rem+1.2vw,2.25rem)] grid gap-x-8 gap-y-5 sm:grid-cols-3"
          >
            {details.map((detail) => (
              <div key={detail.term}>
                <dt className="label mb-2">{detail.term}</dt>
                <dd style={{ fontSize: 'var(--step-0)', color: 'var(--text)' }}>
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        </Emerge>
      </div>
    </Section>
  );
};
