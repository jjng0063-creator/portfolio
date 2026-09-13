import React, { useEffect, useRef, useState } from 'react';
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
  const matches = filter === 'All'
    ? PORTFOLIO_DATA.projects
    : PORTFOLIO_DATA.projects.filter((project) => project.category === filter);
  const projects = [
    ...matches.filter((project) => project.featured),
    ...matches.filter((project) => !project.featured),
  ];
  const available = CATEGORIES.filter(
    (category) => category === 'All' || PORTFOLIO_DATA.projects.some((project) => project.category === category)
  );
  const [selection, setSelection] = useState({ filter, index: 0 });
  const activeIndex = selection.filter === filter
    ? Math.min(selection.index, Math.max(0, projects.length - 1))
    : 0;
  const trackRef = useRef<HTMLOListElement>(null);
  const slideRefs = useRef<(HTMLLIElement | null)[]>([]);
  const indexRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const goTo = (index: number, playSound = true) => {
    const next = Math.max(0, Math.min(index, projects.length - 1));
    setSelection({ filter, index: next });
    slideRefs.current[next]?.scrollIntoView({
      behavior: document.documentElement.dataset.motion === 'off' ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'start',
    });
    if (playSound) onSound?.();
  };

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [filter]);

  useEffect(() => {
    const index = indexRef.current;
    const tab = tabRefs.current[activeIndex];
    if (!index || !tab) return;
    index.scrollTo({
      left: tab.offsetLeft - (index.clientWidth - tab.offsetWidth) / 2,
      behavior: document.documentElement.dataset.motion === 'off' ? 'auto' : 'smooth',
    });
  }, [activeIndex, filter]);

  const syncActiveSlide = () => {
    const track = trackRef.current;
    if (!track) return;
    const trackLeft = track.getBoundingClientRect().left;
    const next = slideRefs.current.reduce((nearest, slide, index) => {
      if (!slide) return nearest;
      const distance = Math.abs(slide.getBoundingClientRect().left - trackLeft);
      return distance < nearest.distance ? { index, distance } : nearest;
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
    setSelection({ filter, index: next });
  };

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
          ref={trackRef}
          id="projects-carousel"
          className="project-carousel-track"
          aria-label="Project showcase"
          onScroll={syncActiveSlide}
        >
          {projects.map((project, index) => (
            <li
              key={project.id}
              ref={(node) => { slideRefs.current[index] = node; }}
              className="project-carousel-slide"
            >
              <article
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
            </li>
          ))}
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
