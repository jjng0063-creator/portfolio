import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
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
import { ProjectFile } from './ProjectFile';

const CATEGORIES: ('All' | ProjectCategory)[] = [
  'All',
  'Full-Stack',
  'Backend / API',
  'Creative Web',
  'Cloud / DevOps',
];

export const Projects: React.FC<{
  onSound?: () => void;
  filter: 'All' | ProjectCategory;
  onFilterChange: (filter: 'All' | ProjectCategory) => void;
}> = ({ onSound, filter, onFilterChange }) => {
  const projects = useMemo(() => {
    const matches = filter === 'All'
    ? PORTFOLIO_DATA.projects
    : PORTFOLIO_DATA.projects.filter((project) => project.category === filter);
    return [
    ...matches.filter((project) => project.featured),
    ...matches.filter((project) => !project.featured),
  ];
  }, [filter]);
  const available = CATEGORIES.filter(
    (category) => category === 'All' || PORTFOLIO_DATA.projects.some((project) => project.category === category)
  );
  const [selection, setSelection] = useState({ filter, index: 0 });
  const activeIndex = selection.filter === filter
    ? Math.min(selection.index, Math.max(0, projects.length - 1))
    : 0;
  const pointerStart = useRef<number | null>(null);
  const indexRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const goTo = (index: number, playSound = true) => {
    const next = Math.max(0, Math.min(index, projects.length - 1));
    setSelection({ filter, index: next });
    if (playSound) onSound?.();
  };

  useEffect(() => {
    const reveal = () => {
      const target = window.location.hash.slice(1);
      const index = projects.findIndex(project => itemId.project(project.id) === target);
      if (index >= 0) setSelection({ filter, index });
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, [filter, projects]);

  useEffect(() => {
    const index = indexRef.current;
    const tab = tabRefs.current[activeIndex];
    if (!index || !tab) return;
    index.scrollTo({
      left: tab.offsetLeft - (index.clientWidth - tab.offsetWidth) / 2,
      behavior: document.documentElement.dataset.motion === 'off' ? 'auto' : 'smooth',
    });
  }, [activeIndex, filter]);

  return (
    <Section
      id="projects"
      label="Projects"
      title="Things I've built."
      lead="Each one is written as problem, approach and result — the same way I'd walk you through it in an interview."
    >
      {available.length > 2 && (
        <div className="flex flex-wrap gap-1.5 mb-8" role="group" aria-label="Filter projects">
          {available.map((category) => {
            const isActive = filter === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  onFilterChange(category);
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
                {category}
              </button>
            );
          })}
        </div>
      )}

      <Emerge>
        <ol
          id="projects-carousel"
          className="project-carousel-track"
          aria-label="Project showcase"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.target instanceof HTMLElement && event.target.closest('dialog')) return;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              goTo(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1));
            }
          }}
          onPointerDown={(event) => { pointerStart.current = event.clientX; }}
          onPointerCancel={() => { pointerStart.current = null; }}
          onPointerUp={(event) => {
            if (pointerStart.current !== null && Math.abs(event.clientX - pointerStart.current) > 55) {
              goTo(activeIndex + (event.clientX < pointerStart.current ? 1 : -1));
            }
            pointerStart.current = null;
          }}
        >
          {projects.map((project, index) => {
            const offset = index - activeIndex;
            return <li
              key={project.id}
              data-active={offset === 0}
              style={{
                transform: `translateX(${offset * 79}%) translateZ(${offset === 0 ? 0 : -160}px) rotateY(${offset === 0 ? 0 : offset < 0 ? 42 : -42}deg) scale(${offset === 0 ? 1 : .88})`,
                zIndex: projects.length - Math.abs(offset),
                visibility: Math.abs(offset) > 1 ? 'hidden' : 'visible',
              }}
              className="project-carousel-slide"
            >
              {offset !== 0 && <button type="button" className="project-side-select"
                aria-label={`Select project: ${project.title}`} onClick={() => goTo(index)} />}
              <article
                inert={offset !== 0}
                id={itemId.project(project.id)}
                className="surface surface-interactive project-card"
                aria-label={`${project.title}, project ${index + 1} of ${projects.length}`}
                onFocus={() => activeIndex !== index && goTo(index, false)}
              >
                <ProjectCover project={project} index={index} />

                <div className="project-card-body">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
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

                      <h3 className="font-bold" style={{ fontSize: 'var(--step-2)', color: 'var(--text)' }}>
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
                          style={{ backgroundColor: 'var(--text)', color: 'var(--bg)', fontSize: 'var(--step--1)' }}
                        >
                          Live
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>

                  <ProjectFile project={project} compact />

                  {project.tags.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
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
                </div>
              </article>
            </li>;
          })}
        </ol>

        {projects.length > 1 && (
          <div className="project-carousel-footer">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="file-button project-carousel-arrow"
                aria-label="Previous project"
                aria-controls="projects-carousel"
                disabled={activeIndex === 0}
                onClick={() => goTo(activeIndex - 1)}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="file-button project-carousel-arrow"
                aria-label="Next project"
                aria-controls="projects-carousel"
                disabled={activeIndex === projects.length - 1}
                onClick={() => goTo(activeIndex + 1)}
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="label ml-2" aria-live="polite" aria-atomic="true">
                {String(activeIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
              </span>
            </div>

            <div ref={indexRef} className="project-carousel-index" role="group" aria-label="Choose a project">
              {projects.map((project, index) => (
                <button
                  key={project.id}
                  ref={(node) => { tabRefs.current[index] = node; }}
                  type="button"
                  className="project-carousel-tab"
                  aria-current={activeIndex === index ? 'true' : undefined}
                  onClick={() => goTo(index)}
                >
                  {project.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </Emerge>
    </Section>
  );
};

function ProjectCover({ project, index }: { project: ProjectItem; index: number }) {
  const shot = project.image
    ? { src: project.image, alt: project.imageAlt || project.title }
    : project.screenshots?.find((screenshot) => screenshot.src);

  if (shot) {
    return <img className="project-cover" src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />;
  }

  return (
    <div className="project-cover project-cover-fallback" aria-hidden="true">
      <span>{String(index + 1).padStart(2, '0')} / PROJECT FILE</span>
      <strong>{project.title}</strong>
      <span>{project.category}</span>
    </div>
  );
}
