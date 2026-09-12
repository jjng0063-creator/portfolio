import { useEffect, useRef } from 'react';

export interface Band {
  id: string;
  /** Document-space top edge of the section. */
  top: number;
  /** Document-space centre of the section. */
  center: number;
  height: number;
}

/**
 * Measures where each section sits in the document, once, and again on resize.
 *
 * The cabinet needs to know which section is in focus on every frame. Measuring
 * with getBoundingClientRect inside the render loop would force layout 5 times
 * a frame, so positions are cached here and the loop only reads scrollY.
 */
export function useSectionBands(ids: readonly string[]) {
  const bands = useRef<Band[]>([]);

  useEffect(() => {
    const measure = () => {
      const scrollY = window.scrollY;
      bands.current = ids
        .map((id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          const top = rect.top + scrollY;
          return { id, top, center: top + rect.height / 2, height: rect.height };
        })
        .filter((b): b is Band => b !== null);
    };

    measure();

    // Fonts and images change section heights after first paint.
    const raf = requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 800);

    window.addEventListener('resize', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, [ids]);

  return bands;
}
