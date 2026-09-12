import React from 'react';
import { itemId, type MilestoneItem } from '../../data/portfolioData';
import { Section } from '../ui/Section';
import { Field } from '../ui/Placeholder';
import { Emerge } from '../ui/Emerge';

interface TimelineProps {
  /** Section id — also the anchor prefix for each entry, so Studies and Career
   *  never hand out the same item id. */
  id: string;
  label: string;
  title: string;
  lead?: string;
  items: MilestoneItem[];
  divider?: boolean;
}

/**
 * A reverse-chronological list of periods — used for both Studies and Career.
 *
 * One component rather than two near-identical ones: the sections differ only
 * in their heading and which array they are handed.
 */
export const Timeline: React.FC<TimelineProps> = ({
  id,
  label,
  title,
  lead,
  items,
  divider,
}) => (
  <Section id={id} label={label} title={title} lead={lead} divider={divider}>
    <ol className="flex flex-col">
      {items.map((milestone, i) => (
        <Emerge as="li" key={`${milestone.period}-${milestone.title}`} index={i}>
          <div
            id={itemId.milestone(id, i)}
            className="grid gap-x-8 gap-y-3 py-7 md:grid-cols-[10rem_minmax(0,1fr)]"
            style={{
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            }}
          >
            <div className="label pt-1">{milestone.period}</div>

            <div className="min-w-0">
              <h3
                className="font-semibold"
                style={{ fontSize: 'var(--step-1)', color: 'var(--text)' }}
              >
                {milestone.title}
              </h3>

              <p
                className="mt-0.5 mb-3"
                style={{ fontSize: 'var(--step--1)', color: 'var(--text-3)' }}
              >
                {milestone.organization}
              </p>

              <Field
                value={milestone.description}
                className="measure"
                style={{ fontSize: 'var(--step-0)', color: 'var(--text-2)' }}
              />

              {milestone.highlights.length > 0 && (
                <ul className="flex flex-col gap-1.5 mt-4 measure">
                  {milestone.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="px-2.5 py-1.5 rounded-md"
                      style={{
                        fontSize: 'var(--step--1)',
                        backgroundColor: 'var(--bg-elev-2)',
                        color: 'var(--text-2)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Emerge>
      ))}
    </ol>
  </Section>
);
