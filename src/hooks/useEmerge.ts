import { useContext, useEffect, useRef } from 'react';
import { MotionContext } from './useMotion';
import { registerEmerge, type EmergeOptions } from '../lib/emerge';

/**
 * Attach to any element that should lift out of the open drawer into focus.
 *
 * Pass `index` to stagger siblings so a row of cards comes off the strip one
 * after another rather than all at once.
 */
export function useEmerge<T extends HTMLElement = HTMLDivElement>(
  options: EmergeOptions = {}
) {
  const ref = useRef<T>(null);
  const enabled = useContext(MotionContext);
  const { index = 0, strength = 1 } = options;

  useEffect(() => {
    if (!ref.current || !enabled) return;
    return registerEmerge(ref.current, { index, strength });
  }, [index, strength, enabled]);

  return ref;
}
