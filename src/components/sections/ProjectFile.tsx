import { useRef, useState } from 'react';
import type { ProjectItem } from '../../data/portfolioData';

export function ProjectFile({ project, compact = false }: { project: ProjectItem; compact?: boolean }) {
  const shots = [
    ...(project.image ? [{ src: project.image, alt: project.imageAlt || project.title }] : []),
    ...(project.screenshots ?? []).filter(shot => shot.src),
  ];
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const pointerStart = useRef<number | null>(null);
  const swiped = useRef(false);
  const shot = shots[index] ?? shots[0];
  const activeIndex = shots[index] ? index : 0;
  const move = (direction: number) => setIndex((activeIndex + direction + shots.length) % shots.length);
  const sections = [
    ['My role', project.role], ['Key decisions', project.decisions],
    ['Challenges', project.challenges], ['Lessons learned', project.lessons],
    ['Problem', project.problem], ['Approach', project.approach], ['Result', project.result],
  ].filter(([, text]) => text && !text.startsWith('TODO'));

  const gallery = shot && (
    <div className="project-gallery" role="region" aria-roledescription="carousel" aria-label={`${project.title} gallery`}
      onKeyDown={(event) => {
        if (dialog.current?.open || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      }}>
      <div className={`gallery-stage${shots.length === 1 ? ' gallery-stage-single' : ''}`}
        onPointerDown={(event) => { pointerStart.current = event.clientX; swiped.current = false; }}
        onPointerCancel={() => { pointerStart.current = null; }}
        onPointerUp={(event) => {
          if (pointerStart.current !== null && Math.abs(event.clientX - pointerStart.current) > 45) {
            swiped.current = true;
            move(event.clientX < pointerStart.current ? 1 : -1);
          }
          pointerStart.current = null;
        }}>
        {shots.map((s, i) => {
          let offset = (i - activeIndex + shots.length) % shots.length;
          if (offset > shots.length / 2) offset -= shots.length;
          const active = offset === 0;
          return <button key={`${s.src}-${i}`} type="button"
            className="gallery-image gallery-card" data-active={active}
            aria-hidden={Math.abs(offset) > 1 || undefined} tabIndex={active ? 0 : -1}
            aria-label={active ? `Enlarge screenshot: ${s.alt}` : `Select image ${i + 1}: ${s.alt}`}
            style={{
              transform: `translate(-50%, -50%) translateX(${offset * 77}%) translateZ(${active ? 0 : -140}px) rotateY(${offset * -38}deg) scale(${active ? 1 : .86})`,
              zIndex: shots.length - Math.abs(offset), opacity: Math.abs(offset) > 1 ? 0 : 1,
              pointerEvents: Math.abs(offset) > 1 ? 'none' : 'auto',
            }}
            onClick={() => {
              if (swiped.current) { swiped.current = false; return; }
              if (active) dialog.current?.showModal(); else setIndex(i);
            }}>
            <img src={s.src} alt={s.alt} loading="lazy" decoding="async" draggable={false} />
            {active && <span className="gallery-enlarge label">View full size ↗</span>}
          </button>;
        })}
      </div>
      <div className="gallery-caption"><p aria-live="polite">{shot.alt}</p><span className="label">{String(activeIndex + 1).padStart(2, '0')} / {String(shots.length).padStart(2, '0')}</span></div>
      {shots.length > 1 && <div className="gallery-controls" role="group" aria-label={`${project.title} screenshots`}>
        <button type="button" className="file-button" aria-label="Previous screenshot" onClick={() => move(-1)}>←</button>
        {shots.map((s, i) => <button key={`${s.src}-${i}`} type="button" className="file-button"
          aria-label={`Screenshot ${i + 1}: ${s.alt}`} aria-pressed={activeIndex === i}
          onClick={() => setIndex(i)}>{String(i + 1).padStart(2, '0')}</button>)}
        <button type="button" className="file-button" aria-label="Next screenshot" onClick={() => move(1)}>→</button>
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
