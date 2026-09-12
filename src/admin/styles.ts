/* Shared form styling. In its own module so fields.tsx exports only components
 * and React Fast Refresh keeps working there. */
import type React from 'react';

export const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bg-sunken)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--text)',
  fontSize: 'var(--step--1)',
  padding: '0.6rem 0.8rem',
  outline: 'none',
};
