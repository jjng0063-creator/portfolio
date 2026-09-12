import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface BaseProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

interface ButtonProps extends BaseProps {
  as?: 'button';
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

interface AnchorProps extends BaseProps {
  as: 'a';
  href: string;
  external?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-medium ' +
  'transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ' +
  'disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

const sizing = 'px-4 py-2.5';

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { backgroundColor: 'var(--text)', color: 'var(--bg)' },
  secondary: {
    backgroundColor: 'var(--bg-elev)',
    color: 'var(--text)',
    border: '1px solid var(--border-strong)',
  },
  ghost: { backgroundColor: 'transparent', color: 'var(--text-2)' },
};

export const Button: React.FC<ButtonProps | AnchorProps> = (props) => {
  const { variant = 'primary', children, className = '' } = props;

  const style: React.CSSProperties = {
    ...variantStyles[variant],
    fontSize: 'var(--step--1)',
  };

  const cls = `${base} ${sizing} ${className} hover:opacity-90`;

  if (props.as === 'a') {
    const { href, external } = props;
    return (
      <a
        href={href}
        style={style}
        className={cls}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      style={style}
      className={cls}
    >
      {children}
    </button>
  );
};
