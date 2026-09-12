/* Pure helpers for updating the content document. No React, so any of it can be
 * used from a component, a hook or a plain callback. */

export type Path = (string | number)[];

export const getIn = (obj: any, path: Path): any =>
  path.reduce((acc, key) => acc?.[key], obj);

export function setIn(obj: any, path: Path, value: any): any {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  const base = obj ?? (typeof key === 'number' ? [] : {});
  const clone = Array.isArray(base) ? [...base] : { ...base };
  clone[key as any] = setIn(base[key as any], rest, value);
  return clone;
}

export const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export const removeItem = <T,>(list: T[], index: number): T[] =>
  list.filter((_, i) => i !== index);

export const addItem = <T,>(list: T[], item: T): T[] => [...list, item];
