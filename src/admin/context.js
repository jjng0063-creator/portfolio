// Contexts and the hooks that read them. Kept apart from the components that
// provide them so React Fast Refresh can still hot-reload those components.
import { createContext, useContext } from 'react'
import { getIn } from './immutable'

/** Holds the whole of site.json, plus a setter that addresses it by path. */
export const EditorContext = createContext(null)

/** Supplies the upload function to MediaField; null until signed in. */
export const MediaContext = createContext({ upload: null })

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used inside an EditorProvider')
  return ctx
}

/** Read and write a single field by path, the way useState reads and writes. */
export function useField(path) {
  const { data, set } = useEditor()
  return [getIn(data, path), value => set(path, value)]
}
