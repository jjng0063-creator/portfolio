import { useState } from 'react'
import { ExternalLink, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { verifyAccess } from './github'

const inputClass =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ' +
  'transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30'

/**
 * The token needs exactly these, and nothing else — worth spelling out, because
 * the temptation with GitHub tokens is always to over-grant.
 */
const TOKEN_URL =
  'https://github.com/settings/personal-access-tokens/new'

export default function Login({ defaults, onConnect }) {
  const [owner, setOwner] = useState(defaults.owner)
  const [repo, setRepo] = useState(defaults.repo)
  const [token, setToken] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const trimmed = token.trim()
      const { defaultBranch } = await verifyAccess({ token: trimmed, owner, repo })
      onConnect({ owner, repo, token: trimmed, branch: defaultBranch, remember })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-6 py-16">
      <div className="mb-8">
        <div className="mb-4 grid size-11 place-items-center rounded-xl border border-border bg-card">
          <KeyRound className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Site editor</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Edits are saved as commits to your repository, which redeploys the site. To
          do that, this page needs a GitHub token — it is kept in this browser and
          sent only to github.com.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="owner" className="mb-1.5 block text-sm font-medium">
              Owner
            </label>
            <input
              id="owner"
              className={inputClass}
              value={owner}
              onChange={e => setOwner(e.target.value.trim())}
              required
            />
          </div>
          <div>
            <label htmlFor="repo" className="mb-1.5 block text-sm font-medium">
              Repository
            </label>
            <input
              id="repo"
              className={inputClass}
              value={repo}
              onChange={e => setRepo(e.target.value.trim())}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="token" className="mb-1.5 block text-sm font-medium">
            Access token
          </label>
          <input
            id="token"
            type="password"
            className={`${inputClass} font-mono`}
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="github_pat_…"
            autoComplete="off"
            required
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-[var(--primary)]"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
          />
          <span>
            <span className="text-sm font-medium">Stay signed in on this device</span>
            <span className="block text-xs text-muted-foreground">
              Stores the token in this browser. Leave it off on a shared or public
              computer — you will then be asked for it again each time.
            </span>
          </span>
        </label>

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? 'Checking…' : 'Connect'}
        </Button>
      </form>

      <div className="mt-8 rounded-lg border border-border bg-card p-4 text-sm">
        <p className="font-medium">Creating the token</p>
        <ol className="mt-2 space-y-1.5 text-muted-foreground">
          <li>
            1. Open{' '}
            <a
              href={TOKEN_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground">
              fine-grained tokens
              <ExternalLink className="size-3" />
            </a>
          </li>
          <li>2. Repository access → Only select repositories → {repo || 'your repo'}</li>
          <li>
            3. Permissions → Repository permissions → set <strong>Contents</strong> to
            Read and write
          </li>
          <li>
            4. Optional: set <strong>Actions</strong> to Read-only, and this page can
            show you when the deploy finishes
          </li>
          <li>5. Generate, copy, paste above</li>
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          Give it an expiry date. When it lapses, make another — nothing else changes.
        </p>
      </div>
    </div>
  )
}
