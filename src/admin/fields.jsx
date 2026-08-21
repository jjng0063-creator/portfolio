// Form primitives. Each one addresses a slice of site.json by path, so a panel
// is just a list of these pointed at the right places.
import { useId, useState } from 'react'
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditor, useField } from './context'
import { addItem, getIn, moveItem, removeItem } from './immutable'

const inputClass =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ' +
  'transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30'

export function Label({ htmlFor, children, hint }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {children}
      </label>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function TextField({ path, label, hint, placeholder, type = 'text' }) {
  const [value, setValue] = useField(path)
  const id = useId()
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <input
        id={id}
        type={type}
        className={inputClass}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => setValue(e.target.value)}
      />
    </div>
  )
}

export function TextAreaField({ path, label, hint, rows = 4, placeholder }) {
  const [value, setValue] = useField(path)
  const id = useId()
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rows}
        className={`${inputClass} resize-y leading-relaxed`}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => setValue(e.target.value)}
      />
    </div>
  )
}

export function SelectField({ path, label, hint, options }) {
  const [value, setValue] = useField(path)
  const id = useId()
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <select
        id={id}
        className={inputClass}
        value={value ?? ''}
        onChange={e => setValue(e.target.value)}>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function NumberField({ path, label, hint, min, max, step = 1 }) {
  const [value, setValue] = useField(path)
  const id = useId()
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <input
        id={id}
        type="number"
        className={inputClass}
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        onChange={e => setValue(e.target.value === '' ? null : Number(e.target.value))}
      />
    </div>
  )
}

export function ToggleField({ path, label, hint }) {
  const [value, setValue] = useField(path)
  const id = useId()
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 accent-[var(--primary)]"
        checked={value !== false}
        onChange={e => setValue(e.target.checked)}
      />
      <span>
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  )
}

export function ColorField({ path, label }) {
  const [value, setValue] = useField(path)
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="color"
        // Colours are stored as hex so this native picker can drive them
        // directly; the site's stylesheet is happy with either hex or oklch.
        value={/^#[0-9a-f]{6}$/i.test(value ?? '') ? value : '#000000'}
        onChange={e => setValue(e.target.value)}
        className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
      />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block truncate text-sm">
          {label}
        </label>
        <input
          className="w-28 bg-transparent font-mono text-xs text-muted-foreground outline-none"
          value={value ?? ''}
          onChange={e => setValue(e.target.value)}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  )
}

/** An array of plain strings — bullet points, skill names, paragraphs. */
export function StringListField({ path, label, hint, placeholder, multiline = false, addLabel = 'Add' }) {
  const { data, set } = useEditor()
  const list = (getIn(data, path) ?? []).slice()

  const update = next => set(path, next)
  const Control = multiline ? 'textarea' : 'input'

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="space-y-2">
        {list.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <Control
              className={`${inputClass} ${multiline ? 'resize-y leading-relaxed' : ''}`}
              rows={multiline ? 4 : undefined}
              value={item ?? ''}
              placeholder={placeholder}
              onChange={e => update(list.map((v, j) => (j === i ? e.target.value : v)))}
            />
            <div className="flex shrink-0 gap-1">
              <IconButton
                title="Move up"
                disabled={i === 0}
                onClick={() => update(moveItem(list, i, i - 1))}>
                <ChevronUp className="size-4" />
              </IconButton>
              <IconButton
                title="Move down"
                disabled={i === list.length - 1}
                onClick={() => update(moveItem(list, i, i + 1))}>
                <ChevronDown className="size-4" />
              </IconButton>
              <IconButton title="Remove" onClick={() => update(removeItem(list, i))}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => update(addItem(list, ''))}>
        <Plus className="size-4" /> {addLabel}
      </Button>
    </div>
  )
}

/**
 * An array of objects — jobs, projects, degrees. Renders each entry as a
 * collapsible card and hands its path back to `children` so the caller can put
 * whatever fields it likes inside.
 */
export function Repeater({ path, label, hint, title, blank, addLabel = 'Add entry', children }) {
  const { data, set } = useEditor()
  const list = getIn(data, path) ?? []
  const [open, setOpen] = useState(() => new Set([0]))

  const update = next => set(path, next)
  const toggle = i =>
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <div>
      {label && <Label hint={hint}>{label}</Label>}
      <div className="space-y-3">
        {list.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-3 py-2">
              <GripVertical className="size-4 shrink-0 text-muted-foreground" />
              <button
                type="button"
                onClick={() => toggle(i)}
                className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                {title?.(item, i) || `Entry ${i + 1}`}
              </button>
              <IconButton
                title="Move up"
                disabled={i === 0}
                onClick={() => update(moveItem(list, i, i - 1))}>
                <ChevronUp className="size-4" />
              </IconButton>
              <IconButton
                title="Move down"
                disabled={i === list.length - 1}
                onClick={() => update(moveItem(list, i, i + 1))}>
                <ChevronDown className="size-4" />
              </IconButton>
              <IconButton
                title="Delete"
                onClick={() => {
                  if (confirm(`Delete "${title?.(item, i) || `entry ${i + 1}`}"?`)) {
                    update(removeItem(list, i))
                  }
                }}>
                <Trash2 className="size-4" />
              </IconButton>
              <IconButton title={open.has(i) ? 'Collapse' : 'Expand'} onClick={() => toggle(i)}>
                {open.has(i) ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </IconButton>
            </div>
            {open.has(i) && (
              <div className="space-y-4 p-4">{children([...path, i], item, i)}</div>
            )}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => {
          update(addItem(list, blank()))
          setOpen(prev => new Set(prev).add(list.length))
        }}>
        <Plus className="size-4" /> {addLabel}
      </Button>
    </div>
  )
}

function IconButton({ children, title, onClick, disabled }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30">
      {children}
    </button>
  )
}
