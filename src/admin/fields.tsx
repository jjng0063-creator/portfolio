/* Form primitives. Each one addresses a slice of content.json by path, so a
 * panel is just a list of these pointed at the right places. */
import React, { useId, useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEditor, useField } from './context';
import { addItem, getIn, moveItem, removeItem, type Path } from './immutable';
import { inputStyle } from './styles';

export const Label: React.FC<{
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ htmlFor, children, hint }) => (
  <div className="mb-1.5">
    <label
      htmlFor={htmlFor}
      className="font-medium"
      style={{ fontSize: 'var(--step--1)', color: 'var(--text)' }}
    >
      {children}
    </label>
    {hint && (
      <p className="mt-0.5" style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}>
        {hint}
      </p>
    )}
  </div>
);

interface FieldProps {
  path: Path;
  label: string;
  hint?: string;
  placeholder?: string;
}

export const TextField: React.FC<
  FieldProps & { type?: string; mono?: boolean; required?: boolean | Path }
> = ({ path, label, hint, placeholder, type = 'text', mono, required }) => {
  const [value, setValue] = useField<string>(path);
  const { data } = useEditor();
  const id = useId();
  // A path means "required only while that other field has a value".
  const isRequired = Array.isArray(required) ? Boolean(getIn(data, required)) : Boolean(required);
  const missing = isRequired && !value?.trim();
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
        {isRequired && <span style={{ color: 'var(--accent-text)' }}> *</span>}
      </Label>
      <input
        id={id}
        type={type}
        className={mono ? 'font-mono' : undefined}
        style={missing ? { ...inputStyle, borderColor: 'var(--accent)' } : inputStyle}
        value={value ?? ''}
        placeholder={placeholder}
        required={isRequired}
        aria-invalid={missing || undefined}
        aria-describedby={missing ? `${id}-required` : undefined}
        onChange={(e) => setValue(e.target.value)}
      />
      {missing && (
        <p
          id={`${id}-required`}
          role="alert"
          className="mt-1"
          style={{ fontSize: 'var(--step--2)', color: 'var(--accent-text)' }}
        >
          Required before you can publish.
        </p>
      )}
    </div>
  );
};

export const TextAreaField: React.FC<FieldProps & { rows?: number }> = ({
  path,
  label,
  hint,
  placeholder,
  rows = 4,
}) => {
  const [value, setValue] = useField<string>(path);
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rows}
        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};

export const SelectField: React.FC<FieldProps & { options: string[] }> = ({
  path,
  label,
  hint,
  options,
}) => {
  const [value, setValue] = useField<string>(path);
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <select
        id={id}
        style={inputStyle}
        value={value ?? ''}
        onChange={(e) => setValue(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
};

export const ToggleField: React.FC<{ path: Path; label: string; hint?: string }> = ({
  path,
  label,
  hint,
}) => {
  const [value, setValue] = useField<boolean>(path);
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4"
        style={{ accentColor: 'var(--accent)' }}
        checked={value === true}
        onChange={(e) => setValue(e.target.checked)}
      />
      <span>
        <span
          className="font-medium"
          style={{ fontSize: 'var(--step--1)', color: 'var(--text)' }}
        >
          {label}
        </span>
        {hint && (
          <span
            className="block"
            style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}
          >
            {hint}
          </span>
        )}
      </span>
    </label>
  );
};

/** An array of plain strings — bullet points, tags, paragraphs. */
export const StringListField: React.FC<
  FieldProps & { multiline?: boolean; addLabel?: string }
> = ({ path, label, hint, placeholder, multiline = false, addLabel = 'Add' }) => {
  const { data, set } = useEditor();
  const list: string[] = (getIn(data, path) ?? []).slice();

  const update = (next: string[]) => set(path, next);

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex flex-col gap-2">
        {list.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            {multiline ? (
              <textarea
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                value={item ?? ''}
                placeholder={placeholder}
                onChange={(e) =>
                  update(list.map((v, j) => (j === i ? e.target.value : v)))
                }
              />
            ) : (
              <input
                style={inputStyle}
                value={item ?? ''}
                placeholder={placeholder}
                onChange={(e) =>
                  update(list.map((v, j) => (j === i ? e.target.value : v)))
                }
              />
            )}
            <div className="flex shrink-0 gap-1">
              <IconButton
                title="Move up"
                disabled={i === 0}
                onClick={() => update(moveItem(list, i, i - 1))}
              >
                <ChevronUp className="size-4" />
              </IconButton>
              <IconButton
                title="Move down"
                disabled={i === list.length - 1}
                onClick={() => update(moveItem(list, i, i + 1))}
              >
                <ChevronDown className="size-4" />
              </IconButton>
              <IconButton title="Remove" onClick={() => update(removeItem(list, i))}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
      <SmallButton className="mt-2" onClick={() => update(addItem(list, ''))}>
        <Plus className="size-3.5" /> {addLabel}
      </SmallButton>
    </div>
  );
};

/**
 * An array of objects — jobs, projects, degrees. Renders each entry as a
 * collapsible card and hands its path back to `children` so the caller can put
 * whatever fields it likes inside.
 */
export function Repeater<T>({
  path,
  label,
  hint,
  title,
  blank,
  addLabel = 'Add entry',
  children,
}: {
  path: Path;
  label?: string;
  hint?: string;
  title?: (item: T, index: number) => string;
  blank: () => T;
  addLabel?: string;
  children: (itemPath: Path, item: T, index: number) => React.ReactNode;
}) {
  const { data, set } = useEditor();
  const list: T[] = getIn(data, path) ?? [];
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));

  const update = (next: T[]) => set(path, next);
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div>
      {label && <Label hint={hint}>{label}</Label>}
      <div className="flex flex-col gap-3">
        {list.map((item, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-[12px]"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-elev)' }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{
                borderBottom: open.has(i) ? '1px solid var(--border)' : 'none',
                backgroundColor: 'var(--bg-elev-2)',
              }}
            >
              <GripVertical className="size-4 shrink-0" style={{ color: 'var(--text-3)' }} />
              <button
                type="button"
                onClick={() => toggle(i)}
                className="min-w-0 flex-1 truncate text-left font-medium"
                style={{ fontSize: 'var(--step--1)', color: 'var(--text)' }}
              >
                {title?.(item, i) || `Entry ${i + 1}`}
              </button>
              <IconButton
                title="Move up"
                disabled={i === 0}
                onClick={() => update(moveItem(list, i, i - 1))}
              >
                <ChevronUp className="size-4" />
              </IconButton>
              <IconButton
                title="Move down"
                disabled={i === list.length - 1}
                onClick={() => update(moveItem(list, i, i + 1))}
              >
                <ChevronDown className="size-4" />
              </IconButton>
              <IconButton
                title="Delete"
                onClick={() => {
                  if (confirm(`Delete "${title?.(item, i) || `entry ${i + 1}`}"?`)) {
                    update(removeItem(list, i));
                  }
                }}
              >
                <Trash2 className="size-4" />
              </IconButton>
              <IconButton
                title={open.has(i) ? 'Collapse' : 'Expand'}
                onClick={() => toggle(i)}
              >
                {open.has(i) ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </IconButton>
            </div>
            {open.has(i) && (
              <div className="flex flex-col gap-4 p-4">{children([...path, i], item, i)}</div>
            )}
          </div>
        ))}
      </div>
      <SmallButton
        className="mt-3"
        onClick={() => {
          update(addItem(list, blank()));
          setOpen((prev) => new Set(prev).add(list.length));
        }}
      >
        <Plus className="size-3.5" /> {addLabel}
      </SmallButton>
    </div>
  );
}

export const IconButton: React.FC<{
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ children, title, onClick, disabled }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    disabled={disabled}
    onClick={onClick}
    className="rounded-md p-1.5 transition-colors hover:opacity-80 disabled:pointer-events-none disabled:opacity-30"
    style={{ color: 'var(--text-3)' }}
  >
    {children}
  </button>
);

export const SmallButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}> = ({ children, onClick, disabled, className = '', type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 font-medium transition-opacity hover:opacity-85 disabled:opacity-40 disabled:pointer-events-none ${className}`}
    style={{
      fontSize: 'var(--step--1)',
      backgroundColor: 'var(--bg-elev-2)',
      color: 'var(--text)',
      border: '1px solid var(--border-strong)',
    }}
  >
    {children}
  </button>
);
