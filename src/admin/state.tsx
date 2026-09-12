import React, { useCallback, useMemo } from 'react';
import { EditorContext } from './context';
import { setIn, type Path } from './immutable';

/**
 * One immutable object holds the whole content document; every field addresses
 * its own slice by path, so no panel needs to know how the rest is shaped.
 */
export const EditorProvider: React.FC<{
  data: any;
  onChange: (updater: (current: any) => any) => void;
  children: React.ReactNode;
}> = ({ data, onChange, children }) => {
  const set = useCallback(
    (path: Path, value: any) => onChange((current) => setIn(current, path, value)),
    [onChange]
  );

  const value = useMemo(() => ({ data, set }), [data, set]);
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};
