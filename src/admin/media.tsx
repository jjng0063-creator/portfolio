/* Image and résumé upload. The file is committed straight into public/ on the
 * repo, and the field stores the path the site will serve it from. */
import React, { useContext, useId, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Label, SmallButton } from './fields';
import { MediaContext, useField } from './context';
import type { Path } from './immutable';

/** Committed as-is into the repo, so keep it to characters a URL is happy with. */
const safeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

// Base64 inflates by a third and the whole commit goes up in one request, so
// large files are refused rather than left to fail slowly.
const MAX_BYTES = 8 * 1024 * 1024;

export const MediaField: React.FC<{
  path: Path;
  label: string;
  hint?: string;
  accept?: string;
  /** Subfolder of public/ to commit into. */
  folder?: string;
  preview?: boolean;
}> = ({ path, label, hint, accept, folder = 'uploads', preview = false }) => {
  const [value, setValue] = useField<string>(path);
  const { upload } = useContext(MediaContext);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The committed file is not served until the deploy finishes a minute or so
  // later, so the preview would 404 until then. Show the local file instead.
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // let the same file be picked again after a failure
    if (!file || !upload) return;

    if (file.size > MAX_BYTES) {
      setError(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Keep it under 8 MB — resize the image first.`
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const name = `${Date.now().toString(36)}-${safeName(file.name)}`;
      const target = `${folder}/${name}`;
      await upload(target, await file.arrayBuffer());
      // Stored relative to public/, with no leading slash: the site is served
      // from a subpath, and portfolioData.ts prefixes these with BASE_URL at
      // render time. A stored "/work/x.png" would 404.
      setValue(target);
      setLocalPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>

      {value && (
        <div
          className="mb-2 flex items-center gap-3 rounded-[10px] p-2"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-elev-2)' }}
        >
          {preview && (
            <img
              src={localPreview ?? import.meta.env.BASE_URL + value.replace(/^\/+/, '')}
              alt=""
              className="size-12 shrink-0 rounded object-cover"
              style={{ backgroundColor: 'var(--bg-sunken)' }}
            />
          )}
          <code
            className="min-w-0 flex-1 truncate font-mono"
            style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}
          >
            {value}
          </code>
          <button
            type="button"
            title="Remove"
            aria-label="Remove"
            onClick={() => {
              setValue('');
              setLocalPreview((current) => {
                if (current) URL.revokeObjectURL(current);
                return null;
              });
            }}
            className="rounded p-1 transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-3)' }}
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onPick}
      />
      <SmallButton disabled={busy || !upload} onClick={() => inputRef.current?.click()}>
        <Upload className="size-3.5" />
        {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
      </SmallButton>

      {error && (
        <p className="mt-2" style={{ fontSize: 'var(--step--2)', color: 'var(--accent-text)' }}>
          {error}
        </p>
      )}
    </div>
  );
};
