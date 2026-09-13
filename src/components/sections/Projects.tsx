import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Activity, AppWindow, ArrowLeft, ArrowRight, ArrowUpRight, Cloud, Palette, Server } from 'lucide-react';
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

const COVER_ICONS = {
  'Full-Stack': AppWindow,
  'Backend / API': Server,
  'Creative Web': Palette,
  'Cloud / DevOps': Cloud,
} as const;

type CarouselPosition = 'previous' | 'active' | 'next' | 'hidden';

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
  const activeProject = projects[activeIndex];
  const pointerStart = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const indexRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const viewer = useRef<HTMLDialogElement>(null);
  const viewerImage = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState<{ width: number; x: number; y: number } | null>(null);

  const goTo = (index: number, playSound = true) => {
    const next = Math.max(0, Math.min(index, projects.length - 1));
    if (next === activeIndex && selection.filter === filter) return;
    setSelection({ filter, index: next });
    if (window.location.hash.startsWith('#project-')) {
      window.history.replaceState(null, '', `#${itemId.project(projects[next].id)}`);
    }
    if (playSound) onSound?.();
  };

  useEffect(() => {
    const reveal = () => {
      const target = window.location.hash.slice(1);
      const index = projects.findIndex((project) => itemId.project(project.id) === target);
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

  // Zooming doubles the fitted image, then scrolls so the point that was clicked is centred.
  useLayoutEffect(() => {
    const frame = viewerImage.current?.parentElement;
    if (!zoom || !frame) return;
    frame.scrollTo({
      left: frame.scrollWidth * zoom.x - frame.clientWidth / 2,
      top: frame.scrollHeight * zoom.y - frame.clientHeight / 2,
    });
  }, [zoom]);

  if (!activeProject) {
    return (
      <Section id="projects" label="Projects" title="Things I've built.">
        <p style={{ color: 'var(--text-2)' }}>No projects match this filter.</p>
      </Section>
    );
  }

  const activeShot = coverShot(activeProject);

  const selectCover = (index: number) => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    if (index === activeIndex && activeShot) {
      setZoom(null);
      viewer.current?.showModal();
      return;
    }
    goTo(index);
  };

  const toggleZoom = (clientX?: number, clientY?: number) => {
    const image = viewerImage.current;
    if (zoom || !image) {
      setZoom(null);
      return;
    }
    const box = image.getBoundingClientRect();
    setZoom({
      width: box.width * 2,
      x: clientX === undefined ? 0.5 : (clientX - box.left) / box.width,
      y: clientY === undefined ? 0.5 : (clientY - box.top) / box.height,
    });
  };

  return (
    <Section
      id="projects"
      label="Projects"
      title="Things I've built."
      lead="Each one is written as problem, approach and result. It is the same way I would walk you through it in an interview."
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
        <div className="project-showcase">
          <div className="project-anchor-list" aria-hidden="true">
            {projects.map((project) => (
              <span key={project.id} id={itemId.project(project.id)} data-project-anchor />
            ))}
          </div>
          <div
            className="project-carousel-stage"
            data-project-stage
            role="region"
            aria-roledescription="carousel"
            aria-label="Project covers"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                goTo(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1));
              }
            }}
            onPointerDown={(event) => {
              pointerStart.current = event.clientX;
              didSwipe.current = false;
            }}
            onPointerCancel={() => { pointerStart.current = null; }}
            onPointerUp={(event) => {
              if (pointerStart.current !== null && Math.abs(event.clientX - pointerStart.current) > 48) {
                didSwipe.current = true;
                goTo(activeIndex + (event.clientX < pointerStart.current ? 1 : -1));
              }
              pointerStart.current = null;
            }}
          >
            <ol id="projects-carousel" className="project-carousel-track">
              {projects.map((project, index) => {
                const position = getCarouselPosition(index - activeIndex);
                const visible = position !== 'hidden';
                const selected = position === 'active';

                return (
                  <li
                    key={project.id}
                    className="project-carousel-slide"
                    data-project-id={project.id}
                    data-position={position}
                    data-active={selected}
                    aria-hidden={!visible || undefined}
                    inert={!visible}
                  >
                    <button
                      type="button"
                      className="project-carousel-cover"
                      data-project-cover
                      aria-current={selected ? 'true' : undefined}
                      aria-label={selected && activeShot ? `View full size: ${project.title}` : `Select project: ${project.title}`}
                      tabIndex={visible ? 0 : -1}
                      onClick={() => selectCover(index)}
                    >
                      <ProjectCover project={project} index={index} />
                      {selected && activeShot && (
                        <span className="gallery-enlarge label" aria-hidden="true">View full size ↗</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {projects.length > 1 && (
            <div className="project-carousel-navigation" data-project-navigation>
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
                <span
                  className="label ml-2"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  aria-label={`Project ${activeIndex + 1} of ${projects.length}: ${activeProject.title}`}
                >
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

          <ProjectDetails projects={projects} active={activeProject} />

          {activeShot && (
            <dialog
              ref={viewer}
              className="image-dialog"
              aria-label={`${activeProject.title} image viewer`}
              onClick={(event) => { if (event.target === event.currentTarget) viewer.current?.close(); }}
              onClose={() => setZoom(null)}
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <p>{activeShot.alt}</p>
                <div className="flex gap-2">
                  <button type="button" className="file-button" onClick={() => toggleZoom()}>
                    {zoom ? 'Zoom out' : 'Zoom in'}
                  </button>
                  <button type="button" className="file-button" autoFocus onClick={() => viewer.current?.close()}>
                    Close
                  </button>
                </div>
              </div>
              <div className="project-image-zoom" data-zoomed={zoom !== null}>
                <img
                  ref={viewerImage}
                  src={activeShot.src}
                  alt={activeShot.alt}
                  style={zoom ? { width: zoom.width, maxWidth: 'none', maxHeight: 'none' } : undefined}
                  onClick={(event) => toggleZoom(event.clientX, event.clientY)}
                />
              </div>
            </dialog>
          )}
        </div>
      </Emerge>
    </Section>
  );
};

function getCarouselPosition(offset: number): CarouselPosition {
  if (offset === 0) return 'active';
  if (offset === -1) return 'previous';
  if (offset === 1) return 'next';
  return 'hidden';
}

function coverShot(project: ProjectItem) {
  return project.image
    ? { src: project.image, alt: project.imageAlt || project.title }
    : project.screenshots?.find((screenshot) => screenshot.src);
}

function ProjectCover({ project, index }: { project: ProjectItem; index: number }) {
  const shot = coverShot(project);

  if (shot) {
    return (
      <img
        className="project-cover-image"
        src={shot.src}
        alt={shot.alt}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    );
  }

  const Icon = COVER_ICONS[project.category];
  return (
    <span className="project-cover-fallback" aria-hidden="true">
      <Icon className="project-cover-icon" strokeWidth={1.5} />
      <span className="project-cover-metadata">
        <span className="label">{project.category}</span>
        {project.year && <span className="label">{project.year}</span>}
      </span>
      <span className="project-cover-number">{String(index + 1).padStart(2, '0')}</span>
    </span>
  );
}

function ProjectDetails({ projects, active }: { projects: ProjectItem[]; active: ProjectItem }) {
  return (
    <article data-project-summary className="project-detail-panel">
      {/* All headings share one grid cell, so the panel keeps the tallest height and nothing below it jumps. */}
      <div className="project-detail-stack">
        {projects.map((project) => (
          <ProjectHeading key={project.id} project={project} active={project === active} />
        ))}
      </div>

      <ProjectFile key={active.id} project={active} compact />

      {active.tags.length > 0 && (
        <ul className="project-detail-tags" aria-label={`${active.title} technologies`}>
          {active.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

function ProjectHeading({ project, active }: { project: ProjectItem; active: boolean }) {
  return (
    <div className="project-detail-heading" data-active={active} aria-hidden={!active || undefined} inert={!active}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-2.5">
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
        <h3 className="project-detail-title">{project.title}</h3>
        <Field
          value={project.tagline}
          className="measure mt-2"
          style={{ fontSize: 'var(--step-0)', color: 'var(--text-2)' }}
        />
      </div>

      {(project.githubUrl || project.demoUrl) && (
        <div className="project-detail-actions">
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
      )}
    </div>
  );
}
