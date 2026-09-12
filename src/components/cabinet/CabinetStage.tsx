import React, { Suspense, lazy, useEffect, useState } from 'react';
import type { Band } from '../../hooks/useSectionBands';
import type { DrawerDef, SceneTheme } from './CabinetScene';

const CabinetScene = lazy(() => import('./CabinetScene'));

/**
 * Fixed viewport layer holding the cabinet behind the page content.
 *
 * Loaded after first paint so the headline never waits on three.js, and
 * pointer-transparent so it can cover the viewport without swallowing clicks.
 */
export const CabinetStage: React.FC<{
  bands: React.RefObject<Band[]>;
  drawers: DrawerDef[];
  theme: SceneTheme;
  motionEnabled?: boolean;
}> = ({ bands, drawers, theme, motionEnabled = true }) => {
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState(() => {
    try { return sessionStorage.getItem('cabinet-hint-dismissed') !== 'yes'; } catch { return true; }
  });

  useEffect(() => {
    if (!motionEnabled) return;
    const start = () => setReady(true);

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(handle);
    }

    const handle = window.setTimeout(start, 600);
    return () => window.clearTimeout(handle);
  }, [motionEnabled]);

  return (
    <div className="cabinet-stage">
      <div aria-hidden="true">
      {ready && motionEnabled ? (
        <Suspense fallback={<CabinetPoster count={drawers.length} />}>
          <CabinetScene bands={bands} drawers={drawers} theme={theme} />
        </Suspense>
      ) : (
        <CabinetPoster count={drawers.length} />
      )}
      </div>
      <div className="cabinet-guide">
        {hint && <div className="flex items-center justify-between gap-3 mb-3">
          <p style={{ fontSize: 'var(--step--1)' }}>{motionEnabled ? 'Select a folder to explore.' : 'Explore the cabinet files below.'}</p>
          <button type="button" aria-label="Dismiss cabinet hint" className="file-button" onClick={() => {
            setHint(false);
            try { sessionStorage.setItem('cabinet-hint-dismissed', 'yes'); } catch { /* session only */ }
          }}>×</button>
        </div>}
        <details className="cabinet-index">
          <summary className="label">Browse cabinet files</summary>
          <nav aria-label="Cabinet files" className="grid gap-4 pt-4">
            {drawers.map(drawer => <div key={drawer.id}>
              <a className="label" href={`#${drawer.id}`}>{drawer.index} / {drawer.label}</a>
              <ul className="grid gap-1 mt-2">
                {drawer.files.map(file => <li key={file.targetId}>
                  <a href={`#${file.targetId}`} title={file.fullLabel || file.label} className="block py-1 underline-offset-4 hover:underline">{file.fullLabel || file.label}</a>
                </li>)}
              </ul>
            </div>)}
          </nav>
        </details>
      </div>
    </div>
  );
};

/** CSS-only cabinet shown until the canvas takes over, so the frame is never
 *  empty and nothing shifts when the real scene arrives. */
const CabinetPoster: React.FC<{ count: number }> = ({ count }) => (
  <div className="cabinet-poster">
    <div className="cabinet-poster-body">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="cabinet-poster-drawer" />
      ))}
    </div>
  </div>
);
