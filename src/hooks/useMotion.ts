import { createContext, useEffect, useState } from 'react';

export const MotionContext = createContext(true);
const KEY = 'portfolio-motion';
function stored(): boolean | null {
  try { const value = localStorage.getItem(KEY); return value === 'on' ? true : value === 'off' ? false : null; }
  catch { return null; }
}
export function useMotion() {
  const [enabled, setEnabled] = useState(() => stored() ?? !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    document.documentElement.setAttribute('data-motion', enabled ? 'on' : 'off');
  }, [enabled]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { if (stored() === null) setEnabled(!media.matches); };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  const toggle = () => {
    const next = !enabled;
    try { localStorage.setItem(KEY, next ? 'on' : 'off'); } catch { /* preference still works for this visit */ }
    setEnabled(next);
  };
  return { enabled, toggle };
}
