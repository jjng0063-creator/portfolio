import React from 'react';
import { useEmerge } from '../../hooks/useEmerge';

interface EmergeProps {
  children: React.ReactNode;
  /** Staggers siblings so cards peel off the strip one after another. */
  index?: number;
  /** How far the element starts from its resting place. */
  strength?: number;
  className?: string;
  as?: 'div' | 'article' | 'li';
}

/**
 * Wraps content that should lift out of the open drawer and tip into focus.
 *
 * The wrapper carries the perspective; the inner node is what actually moves,
 * so the 3D rotation reads as depth rather than a flat skew.
 */
export const Emerge: React.FC<EmergeProps> = ({
  children,
  index = 0,
  strength = 1,
  className = '',
  as: Tag = 'div',
}) => {
  const ref = useEmerge<HTMLDivElement>({ index, strength });

  return (
    <Tag className="emerge-stage">
      <div ref={ref} className={`emerge ${className}`}>
        {children}
      </div>
    </Tag>
  );
};
