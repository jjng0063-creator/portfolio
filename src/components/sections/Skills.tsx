import React from 'react';
import { PORTFOLIO_DATA, itemId, type SkillLevel } from '../../data/portfolioData';
import { Section } from '../ui/Section';
import { Field } from '../ui/Placeholder';
import { Emerge } from '../ui/Emerge';

/** Levels are stated honestly rather than as a bar chart. Nobody believes
 *  "TypeScript 92%", and a recruiter can read these three words instantly. */
const LEVEL_HINT: Record<SkillLevel, string> = {
  Core: 'Happy to be tested on it',
  Working: 'Comfortable with docs open',
  Learning: 'Actively picking it up',
};

export const Skills: React.FC = () => (
  <Section
    id="skills"
    label="Skills"
    title="What I work with."
    lead="Grouped by how confident I am, not by how impressive the list looks."
  >
    <div className="grid gap-4 sm:grid-cols-2">
      {PORTFOLIO_DATA.skillCategories.map((category, i) => (
        <Emerge key={category.title} index={i}>
          <div id={itemId.skill(category.title)} className="surface p-6 h-full">
          <h3
            className="font-semibold mb-1.5"
            style={{ fontSize: 'var(--step-1)', color: 'var(--text)' }}
          >
            {category.title}
          </h3>

          <Field
            value={category.description}
            className="mb-5"
            style={{ fontSize: 'var(--step--1)', color: 'var(--text-3)' }}
          />

          <ul className="flex flex-col gap-2.5">
            {category.skills.map((skill) => (
              <li key={skill.name} className="flex items-center justify-between gap-3">
                <span style={{ fontSize: 'var(--step-0)', color: 'var(--text)' }}>
                  {skill.name}
                </span>
                <span
                  className="label shrink-0"
                  title={LEVEL_HINT[skill.level]}
                  style={{
                    color: skill.level === 'Core' ? 'var(--accent-text)' : 'var(--text-3)',
                  }}
                >
                  {skill.level}
                </span>
              </li>
            ))}
            </ul>
          </div>
        </Emerge>
      ))}
    </div>

    <dl
      className="flex flex-wrap gap-x-8 gap-y-2 mt-6"
      style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}
    >
      {(Object.keys(LEVEL_HINT) as SkillLevel[]).map((level) => (
        <div key={level} className="flex items-center gap-2">
          <dt className="label" style={{ color: level === 'Core' ? 'var(--accent-text)' : undefined }}>
            {level}
          </dt>
          <dd>{LEVEL_HINT[level]}</dd>
        </div>
      ))}
    </dl>
  </Section>
);
