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
}> = ({ bands, drawers, theme }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = () => setReady(true);

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(handle);
    }

    const handle = window.setTimeout(start, 600);
    return () => window.clearTimeout(handle);
  }, []);

  return (
    <div className="cabinet-stage" aria-hidden="true">
      {ready ? (
        <Suspense fallback={<CabinetPoster count={drawers.length} />}>
          <CabinetScene bands={bands} drawers={drawers} theme={theme} />
        </Suspense>
      ) : (
        <CabinetPoster count={drawers.length} />
      )}
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
