import { useCallback, useMemo } from 'react'
import { EditorContext } from './context'
import { setIn } from './immutable'

/**
 * One immutable object holds the whole content document; every field addresses
 * its own slice by path, so no panel needs to know how the rest is shaped.
 */
export function EditorProvider({ data, onChange, children }) {
  const set = useCallback(
    (path, value) => onChange(current => setIn(current, path, value)),
    [onChange]
  )

  const value = useMemo(() => ({ data, set }), [data, set])
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}
