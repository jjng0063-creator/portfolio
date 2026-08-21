// Pure helpers for updating the content document. No React, so any of it can
// be used from a component, a hook or a plain callback.

export const getIn = (obj, path) => path.reduce((acc, key) => acc?.[key], obj)

export function setIn(obj, path, value) {
  if (path.length === 0) return value
  const [key, ...rest] = path
  const base = obj ?? (typeof key === 'number' ? [] : {})
  const clone = Array.isArray(base) ? [...base] : { ...base }
  clone[key] = setIn(base[key], rest, value)
  return clone
}

export const moveItem = (list, from, to) => {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export const removeItem = (list, index) => list.filter((_, i) => i !== index)

export const addItem = (list, item) => [...list, item]
