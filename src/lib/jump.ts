import { revealBetween } from './emerge';

/**
 * Jumps to an item on the page without scrolling past the end of its section.
 *
 * A plain hash jump puts the item's top under the header. For the last item in a
 * short section that left the next section filling the rest of the screen — its
 * heading half-emerged, and its drawer opened instead of the one you clicked.
 */
export function jumpTo(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;

  // The hash still does the rest: :target highlights the item, Projects listens
  // for hashchange, and the back button works. The scroll is then corrected.
  window.location.hash = id;

  const section = el.closest('section');
  if (!section) return true;

  const root = getComputedStyle(document.documentElement);
  const padTop = parseFloat(root.scrollPaddingTop) || 0;
  const padBottom = parseFloat(root.scrollPaddingBottom) || 0;
  const box = section.getBoundingClientRect();

  const itemTop = el.getBoundingClientRect().top + window.scrollY - padTop;
  const sectionTop = box.top + window.scrollY - padTop;
  const sectionEnd = box.bottom + window.scrollY - window.innerHeight + padBottom;

  const y = Math.min(itemTop, Math.max(sectionEnd, sectionTop));
  // Capping the scroll can leave the item low on the screen, where its entrance
  // animation would hold it half-faded. Show what the jump lands on outright.
  revealBetween(y, y + window.innerHeight);
  window.scrollTo({ top: y });
  return true;
}
