import React from 'react';

/** True for any content string still carrying its TODO marker. */
const isTodo = (value: string | undefined): boolean =>
  typeof value === 'string' && value.trimStart().startsWith('TODO');

interface FieldProps {
  value: string;
  className?: string;
  style?: React.CSSProperties;
  as?: 'p' | 'span' | 'h3' | 'div';
}

/**
 * Renders a content string, visually flagging it while it is still a TODO.
 *
 * Unfilled copy reads as deliberately unfinished rather than as a real claim,
 * which is the whole reason the placeholders are safe to have on screen.
 */
export const Field: React.FC<FieldProps> = ({
  value,
  className = '',
  style,
  as: Tag = 'p',
}) => {
  if (!isTodo(value)) {
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      className={`${className} rounded-[6px]`}
      style={{
        ...style,
        color: 'var(--accent-text)',
        backgroundColor: 'var(--accent-soft)',
        boxShadow: 'inset 0 0 0 1px var(--border-accent)',
        padding: '0.35em 0.6em',
        fontStyle: 'italic',
      }}
      data-placeholder="true"
    >
      {value}
    </Tag>
  );
};
