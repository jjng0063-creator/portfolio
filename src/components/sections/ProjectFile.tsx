import { useRef, useState } from 'react';
import type { ProjectItem } from '../../data/portfolioData';

export function ProjectFile({ project, compact = false }: { project: ProjectItem; compact?: boolean }) {
  const shots = [
    ...(project.image ? [{ src: project.image, alt: project.imageAlt || project.title }] : []),
    ...(project.screenshots ?? []).filter(shot => shot.src),
  ];
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const shot = shots[index] ?? shots[0];
  const sections = [
    ['My role', project.role], ['Key decisions', project.decisions],
    ['Challenges', project.challenges], ['Lessons learned', project.lessons],
    ['Problem', project.problem], ['Approach', project.approach], ['Result', project.result],
  ].filter(([, text]) => text && !text.startsWith('TODO'));

  const gallery = shot && (
    <div className="project-gallery">
      <button type="button" className="gallery-image" aria-label={`Enlarge screenshot: ${shot.alt}`}
        onClick={() => dialog.current?.showModal()}>
        <img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />
        <span className="gallery-enlarge label">View full size ↗</span>
      </button>
      {shots.length > 1 && <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label={`${project.title} screenshots`}>
        {shots.map((s, i) => <button key={`${s.src}-${i}`} type="button" className="file-button"
          aria-label={`Screenshot ${i + 1}: ${s.alt}`} aria-pressed={index === i}
          onClick={() => setIndex(i)}>{String(i + 1).padStart(2, '0')}</button>)}
      </div>}
      <dialog ref={dialog} className="image-dialog" aria-label={`${project.title} screenshot viewer`}
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <p>{shot.alt}</p>
          <button type="button" className="file-button" autoFocus onClick={() => dialog.current?.close()}>Close</button>
        </div>
        <img src={shot.src} alt={shot.alt} />
        {shots.length > 1 && <div className="flex justify-between gap-3 mt-4">
          <button type="button" className="file-button" onClick={() => setIndex((index - 1 + shots.length) % shots.length)}>← Previous</button>
          <span aria-live="polite">{index + 1} / {shots.length}</span>
          <button type="button" className="file-button" onClick={() => setIndex((index + 1) % shots.length)}>Next →</button>
        </div>}
      </dialog>
    </div>
  );

  return <div className={compact ? 'w-full' : 'mb-6'}>
    {!compact && gallery}
    {sections.length > 0 && <details className="project-file">
      <summary>Open project file <span className="label"> / {project.year || project.category}</span></summary>
      <div className="grid gap-5 pt-5">
        {compact && gallery}
        {sections.map(([title, text]) => <div key={title}>
          <h4 className="label mb-2">{title}</h4>
          <p style={{ color: 'var(--text-2)', whiteSpace: 'pre-line' }}>{text}</p>
        </div>)}
      </div>
    </details>}

  </div>;
}
