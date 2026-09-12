/* Contexts and the hooks that read them. Kept apart from the components that
 * provide them so React Fast Refresh can still hot-reload those components. */
import { createContext, useContext } from 'react';
import { getIn, type Path } from './immutable';

interface EditorValue {
  data: any;
  set: (path: Path, value: any) => void;
}

/** Holds the whole of content.json, plus a setter that addresses it by path. */
export const EditorContext = createContext<EditorValue | null>(null);

/** Supplies the upload function to MediaField; null until signed in. */
export const MediaContext = createContext<{
  upload: ((path: string, bytes: ArrayBuffer) => Promise<void>) | null;
}>({ upload: null });

export function useEditor(): EditorValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used inside an EditorProvider');
  return ctx;
}

/** Read and write a single field by path, the way useState reads and writes. */
export function useField<T = any>(path: Path): [T, (value: T) => void] {
  const { data, set } = useEditor();
  return [getIn(data, path), (value: T) => set(path, value)];
}
