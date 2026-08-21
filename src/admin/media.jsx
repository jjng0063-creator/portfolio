// Photo and résumé upload. The file is committed straight into public/uploads/
// on the repo, and the field stores the path relative to public/ — the site
// prefixes it with the /portfolio/ base at render time.
import { useContext, useId, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from './fields'
import { MediaContext, useField } from './context'

/** Committed as-is into the repo, so keep it to characters a URL is happy with. */
const safeName = name =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

// Base64 inflates by a third and the whole commit goes up in one request, so
// large files are refused rather than left to fail slowly.
const MAX_BYTES = 8 * 1024 * 1024

export function MediaField({ path, label, hint, accept, preview = false }) {
  const [value, setValue] = useField(path)
  const { upload } = useContext(MediaContext)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  // The committed file is not served until the deploy finishes a minute or so
  // later, so the preview would 404 until then. Show the local file instead.
  const [localPreview, setLocalPreview] = useState(null)
  const inputRef = useRef(null)
  const id = useId()

  const onPick = async event => {
    const file = event.target.files?.[0]
    event.target.value = '' // let the same file be picked again after a failure
    if (!file) return

    if (file.size > MAX_BYTES) {
      setError(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Keep it under 8 MB — resize the image first.`
      )
      return
    }

    setBusy(true)
    setError(null)
    try {
      const target = `uploads/${Date.now().toString(36)}-${safeName(file.name)}`
      await upload(target, await file.arrayBuffer())
      setValue(target)
      setLocalPreview(current => {
        if (current) URL.revokeObjectURL(current)
        return file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>

      {value && (
        <div className="mb-2 flex items-center gap-3 rounded-md border border-border bg-muted/40 p-2">
          {preview && (
            <img
              src={localPreview ?? `${import.meta.env.BASE_URL}${value}`}
              alt=""
              className="size-12 shrink-0 rounded object-cover"
            />
          )}
          <code className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{value}</code>
          <button
            type="button"
            title="Remove"
            aria-label="Remove"
            onClick={() => {
              setValue(null)
              setLocalPreview(current => {
                if (current) URL.revokeObjectURL(current)
                return null
              })
            }}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || !upload}
        onClick={() => inputRef.current?.click()}>
        <Upload className="size-4" />
        {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
      </Button>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
