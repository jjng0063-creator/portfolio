/* ============================================================================
 * EMERGE
 *
 * Drives the "card lifts out of the open drawer and tips into focus" motion.
 *
 * Every animated element shares ONE rAF loop and ONE IntersectionObserver, and
 * only elements actually near the viewport are touched each frame. The previous
 * version of this site ran six React setState calls per frame; this writes
 * compositor-friendly properties straight onto the nodes and never re-renders.
 * ========================================================================== */

export interface EmergeOptions {
  /** Order within a group — staggers siblings so they peel off one after another. */
  index?: number;
  /** Scales how far the element starts from its resting place. */
  strength?: number;
}

interface Entry {
  el: HTMLElement;
  options: Required<EmergeOptions>;
  visible: boolean;
  /** Eased progress, so the motion lags the scroll slightly instead of snapping. */
  current: number;
  settled: boolean;
}

const entries = new Map<HTMLElement, Entry>();
let observer: IntersectionObserver | null = null;
let frame = 0;
let running = false;

function ensureSetup() {
  if (observer) return;

  // Bound once for the whole module. Registering these per element would leak a
  // listener for every card on the page.
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick, { passive: true });

  observer = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        const entry = entries.get(record.target as HTMLElement);
        if (entry) entry.visible = record.isIntersecting;
      }
      tick();
    },
    // Generous margin so an element is already being animated before it is seen.
    { rootMargin: '25% 0px 25% 0px', threshold: 0 }
  );
}

/**
 * How far through its entrance an element is.
 * 0 while its top is still below the fold, 1 once it has risen to the focal band.
 */
function progressFor(el: HTMLElement, index: number): number {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;

  const start = vh * 0.94;
  const end = vh * 0.52;
  const stagger = index * 0.06;

  const raw = (start - rect.top) / (start - end);
  return Math.min(1, Math.max(0, raw - stagger));
}

function apply(entry: Entry, p: number) {
  const { el, options } = entry;
  const s = options.strength;
  const inv = 1 - p;

  // Hinged at its lower edge and drifting in from the cabinet side, so the card
  // reads as a file lifted out of the open drawer and tipped up to face you.
  const scale = 0.52 + p * 0.48;
  const x = inv * 9 * s;
  const y = inv * 7 * s;
  const rotX = -inv * 26 * s;
  const rotY = -inv * 7 * s;
  const blur = inv * 4.5;

  el.style.transform =
    `translate3d(${x}%, ${y}%, 0) ` +
    `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
  el.style.opacity = String(Math.min(1, p * 1.4));
  el.style.filter = blur > 0.12 ? `blur(${blur.toFixed(2)}px)` : '';
}

function settle(entry: Entry) {
  // Once an element is fully in, drop every transform so text renders on the
  // pixel grid instead of through a composited layer.
  entry.el.style.transform = '';
  entry.el.style.opacity = '';
  entry.el.style.filter = '';
  entry.el.style.willChange = '';
  entry.settled = true;
}

function tick() {
  if (running) return;
  running = true;

  frame = requestAnimationFrame(() => {
    running = false;
    let active = false;

    for (const entry of entries.values()) {
      if (!entry.visible) continue;

      const target = progressFor(entry.el, entry.options.index);

      // Ease toward the target so fast scrolling still looks fluid.
      entry.current += (target - entry.current) * 0.16;
      const p = entry.current;

      if (p > 0.995 && target > 0.995) {
        if (!entry.settled) settle(entry);
        continue;
      }

      entry.settled = false;
      entry.el.style.willChange = 'transform, opacity';
      apply(entry, p);
      active = true;
    }

    if (active) tick();
  });
}

export function registerEmerge(el: HTMLElement, options: EmergeOptions = {}): () => void {
  ensureSetup();

  const resolved: Required<EmergeOptions> = {
    index: options.index ?? 0,
    strength: options.strength ?? 1,
  };


  const entry: Entry = { el, options: resolved, visible: false, current: 0, settled: false };
  entries.set(el, entry);

  // Paint the starting state immediately so nothing flashes at full size first.
  apply(entry, progressFor(el, resolved.index));
  observer!.observe(el);
  tick();

  return () => {
    settle(entry);
    observer!.unobserve(el);
    entries.delete(el);
    if (entries.size === 0) { cancelAnimationFrame(frame); running = false; }
  };
}
