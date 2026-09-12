import React, { useState } from 'react';
import { ArrowUpRight, Activity, ImageOff } from 'lucide-react';
import {
  PORTFOLIO_DATA,
  itemId,
  type ProjectCategory,
  type ProjectItem,
} from '../../data/portfolioData';
import { Section } from '../ui/Section';
import { Field } from '../ui/Placeholder';
import { Emerge } from '../ui/Emerge';
import { GithubIcon } from '../ui/Icons';

const CATEGORIES: ('All' | ProjectCategory)[] = [
  'All',
  'Full-Stack',
  'Backend / API',
  'Creative Web',
  'Cloud / DevOps',
];

export const Projects: React.FC<{ onSound?: () => void }> = ({ onSound }) => {
  const [filter, setFilter] = useState<'All' | ProjectCategory>('All');

  const projects =
    filter === 'All'
      ? PORTFOLIO_DATA.projects
      : PORTFOLIO_DATA.projects.filter((p) => p.category === filter);

  // Only offer filters that would actually return something.
  const available = CATEGORIES.filter(
    (c) => c === 'All' || PORTFOLIO_DATA.projects.some((p) => p.category === c)
  );

  // Featured projects carry the section; the rest are listed underneath, so the
  // scroll has a shape instead of five equally loud full-height cards.
  //
  // With nothing flagged in the current filter, everything renders full. The
  // degenerate case matters: a section made only of thin rows, with no card to
  // anchor it, reads as broken rather than as a deliberate index.
  const anyFeatured = projects.some((p) => p.featured);
  const full = anyFeatured ? projects.filter((p) => p.featured) : projects;
  const compact = anyFeatured ? projects.filter((p) => !p.featured) : [];

  return (
    <Section
      id="projects"
      label="Projects"
      title="Things I've built."
      lead="Each one is written as problem, approach and result — the same way I'd walk you through it in an interview."
    >
      {available.length > 2 && (
        <div className="flex flex-wrap gap-1.5 mb-8" role="group" aria-label="Filter projects">
          {available.map((cat) => {
            const isActive = filter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setFilter(cat);
                  onSound?.();
                }}
                aria-pressed={isActive}
                className="px-3 py-1.5 rounded-full transition-colors duration-200"
                style={{
                  fontSize: 'var(--step--1)',
                  backgroundColor: isActive ? 'var(--text)' : 'transparent',
                  color: isActive ? 'var(--bg)' : 'var(--text-3)',
                  border: `1px solid ${isActive ? 'var(--text)' : 'var(--border)'}`,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {full.map((project, i) => (
          <Emerge key={project.id} index={i}>
            <article
              id={itemId.project(project.id)}
              className="surface surface-interactive p-[clamp(1.25rem,1rem+1.2vw,2.25rem)]"
            >
            <ProjectMedia project={project} />

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="label">
                    {project.category}
                    {project.year ? ` · ${project.year}` : ''}
                  </span>
                  {project.metric && (
                    <span
                      className="inline-flex items-center gap-1.5 font-mono"
                      style={{ fontSize: 'var(--step--2)', color: 'var(--accent-text)' }}
                    >
                      <Activity className="w-3 h-3" aria-hidden="true" />
                      {project.metric}
                    </span>
                  )}
                </div>

                <h3
                  className="font-bold"
                  style={{ fontSize: 'var(--step-2)', color: 'var(--text)' }}
                >
                  {project.title}
                </h3>

                <Field
                  value={project.tagline}
                  className="measure mt-2"
                  style={{ fontSize: 'var(--step-0)', color: 'var(--text-2)' }}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${project.title} source on GitHub`}
                    className="grid place-items-center w-9 h-9 rounded-lg transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
                  >
                    <GithubIcon className="w-4 h-4" />
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--text)',
                      color: 'var(--bg)',
                      fontSize: 'var(--step--1)',
                    }}
                  >
                    Live
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            {/* The pitch */}
            <div className="grid gap-5 md:grid-cols-3 md:gap-7">
              {(
                [
                  ['Problem', project.problem],
                  ['Approach', project.approach],
                  ['Result', project.result],
                ] as const
              ).map(([heading, body]) => (
                <div key={heading}>
                  <h4 className="label mb-2.5">{heading}</h4>
                  <Field
                    value={body}
                    style={{ fontSize: 'var(--step--1)', color: 'var(--text-2)', lineHeight: 1.6 }}
                  />
                </div>
              ))}
            </div>

            {/* Stack */}
            {project.tags.length > 0 && (
              <ul
                className="flex flex-wrap gap-1.5 mt-6 pt-5"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                {project.tags.map((tag) => (
                  <li
                    key={tag}
                    className="px-2.5 py-1 rounded-md font-mono"
                    style={{
                      fontSize: 'var(--step--2)',
                      backgroundColor: 'var(--bg-elev-2)',
                      color: 'var(--text-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
            </article>
          </Emerge>
        ))}
      </div>

      {compact.length > 0 && (
        <div className="mt-10">
          <Emerge index={full.length}>
            <h3 className="label mb-3">Also built</h3>

            <ul className="surface px-[clamp(1.25rem,1rem+1.2vw,2.25rem)]">
              {compact.map((project, i) => (
                <CompactRow key={project.id} project={project} first={i === 0} />
              ))}
            </ul>
          </Emerge>
        </div>
      )}
    </Section>
  );
};

/**
 * One line for a project that is worth listing but not worth a full card.
 *
 * It keeps the same anchor id as a full card, because the cabinet files one
 * folder per project regardless of how that project renders — a folder that
 * scrolls nowhere is worse than no folder.
 */
const CompactRow: React.FC<{ project: ProjectItem; first: boolean }> = ({
  project,
  first,
}) => (
  <li
    id={itemId.project(project.id)}
    className="py-5 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2"
    style={{ borderTop: first ? 'none' : '1px solid var(--border)' }}
  >
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h4 className="font-semibold" style={{ fontSize: 'var(--step-0)', color: 'var(--text)' }}>
          {project.title}
        </h4>
        <span className="label">
          {project.category}
          {project.year ? ` · ${project.year}` : ''}
        </span>
      </div>

      <Field
        value={project.tagline}
        className="measure mt-1.5"
        style={{ fontSize: 'var(--step--1)', color: 'var(--text-2)' }}
      />

      {/* Interpuncts rather than pills: the stack is still scannable, at a
          fraction of the vertical weight a full-card tag row would add. */}
      {project.tags.length > 0 && (
        <p
          className="font-mono mt-2"
          style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}
        >
          {project.tags.join(' · ')}
        </p>
      )}
    </div>

    <div className="flex items-center gap-4 shrink-0">
      {project.githubUrl && (
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${project.title} source on GitHub`}
          style={{ color: 'var(--text-2)' }}
        >
          <GithubIcon className="w-4 h-4" />
        </a>
      )}
      {project.demoUrl && (
        <a
          href={project.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium"
          style={{ fontSize: 'var(--step--1)', color: 'var(--text)' }}
        >
          Live
          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  </li>
);

/**
 * The project's screenshot.
 *
 * Aspect-locked so the card never reflows when the image arrives — the slot is
 * the same size whether or not there is a file yet. With no image it renders a
 * flagged empty state rather than collapsing, so a missing screenshot reads as
 * unfinished instead of silently absent.
 */
const ProjectMedia: React.FC<{ project: ProjectItem }> = ({ project }) => {
  const frame = 'relative w-full overflow-hidden rounded-[10px] mb-6';
  const frameStyle: React.CSSProperties = {
    aspectRatio: '16 / 9',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-sunken)',
  };

  // The empty state is deliberately NOT aspect-locked. A real screenshot earns
  // a full 16:9 banner, but an empty placeholder at card width would be ~576px
  // of nothing per project. The height is fixed per render, so there is no
  // layout shift — cards simply differ in height until the images land.
  if (!project.image) {
    return (
      <div
        className={frame}
        style={{
          ...frameStyle,
          aspectRatio: 'auto',
          height: '8.5rem',
          borderStyle: 'dashed',
          borderColor: 'var(--border-accent)',
          backgroundColor: 'var(--accent-soft)',
        }}
        data-placeholder="true"
      >
        <div className="absolute inset-0 flex items-center justify-center gap-3 px-6">
          <ImageOff
            className="w-4 h-4 shrink-0 opacity-70"
            style={{ color: 'var(--accent-text)' }}
            aria-hidden="true"
          />
          <p className="label" style={{ color: 'var(--accent-text)' }}>
            No screenshot yet
          </p>
          <span
            className="font-mono opacity-80"
            style={{ fontSize: 'var(--step--2)', color: 'var(--accent-text)' }}
          >
            add to public/work/ and set `image`
          </span>
        </div>
      </div>
    );
  }

  const img = (
    <img
      src={project.image}
      alt={project.imageAlt || `Screenshot of ${project.title}`}
      loading="lazy"
      decoding="async"
      className="absolute inset-0 w-full h-full object-cover object-top"
    />
  );

  // When there is a live demo the screenshot is the obvious thing to click.
  return project.demoUrl ? (
    <a
      href={project.demoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${frame} block group`}
      style={frameStyle}
      aria-label={`Open the live demo of ${project.title}`}
    >
      {img}
    </a>
  ) : (
    <div className={frame} style={frameStyle}>
      {img}
    </div>
  );
};
