import { useEffect, useState } from 'react';

/**
 * Tracks which section is currently in view so the header can highlight it.
 *
 * Uses IntersectionObserver rather than a scroll handler: the browser does the
 * work off the main thread, and there is no per-frame React state churn.
 */
export function useScrollSpy(sectionIds: readonly string[], offset = 96) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        }

        if (visible.size === 0) return;

        // Whichever visible section occupies the most viewport wins.
        let best: string | null = null;
        let bestRatio = -1;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        }
        setActiveId(best);
      },
      {
        rootMargin: `-${offset}px 0px -45% 0px`,
        threshold: [0.1, 0.25, 0.5, 0.75],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionIds, offset]);

  return activeId;
}
