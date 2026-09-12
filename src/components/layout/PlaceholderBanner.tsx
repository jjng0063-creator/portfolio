import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Shown whenever `IS_PLACEHOLDER` is true in portfolioData.ts.
 *
 * The point is that a site full of "Project One" and "you@example.com" can
 * never be quietly sent to a recruiter. It is deliberately not dismissible —
 * the way to make it go away is to fill the content in and flip the flag.
 */
export const PlaceholderBanner: React.FC = () => (
  <div
    role="status"
    className="w-full px-[var(--gutter)] py-2.5 flex items-center justify-center gap-2.5 text-center"
    style={{
      backgroundColor: 'var(--accent-soft)',
      borderBottom: '1px solid var(--border-accent)',
      color: 'var(--accent-text)',
      fontSize: 'var(--step--1)',
    }}
  >
    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    <span>
      <strong className="font-semibold">Placeholder content.</strong>{' '}
      Fill in <code className="font-mono">src/data/portfolioData.ts</code>, then set{' '}
      <code className="font-mono">IS_PLACEHOLDER</code> to <code className="font-mono">false</code>.
    </span>
  </div>
);
