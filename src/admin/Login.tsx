import React, { useState } from 'react';
import { ExternalLink, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { inputStyle } from './styles';
import { verifyAccess } from './github';

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

export const Login: React.FC<{
  defaults: { owner: string; repo: string };
  onConnect: (creds: {
    owner: string;
    repo: string;
    token: string;
    branch: string;
    remember: boolean;
  }) => void;
}> = ({ defaults, onConnect }) => {
  const [owner, setOwner] = useState(defaults.owner);
  const [repo, setRepo] = useState(defaults.repo);
  const [token, setToken] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const trimmed = token.trim();
      const { defaultBranch } = await verifyAccess({ token: trimmed, owner, repo });
      onConnect({ owner, repo, token: trimmed, branch: defaultBranch, remember });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-6 py-16">
      <div className="mb-8">
        <div
          className="mb-4 grid size-11 place-items-center rounded-[12px]"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-elev)' }}
        >
          <KeyRound className="size-5" style={{ color: 'var(--accent-text)' }} />
        </div>
        <h1 className="font-bold" style={{ fontSize: 'var(--step-2)', color: 'var(--text)' }}>
          Site editor
        </h1>
        <p
          className="mt-2 measure"
          style={{ fontSize: 'var(--step--1)', color: 'var(--text-2)', lineHeight: 1.6 }}
        >
          Edits are saved as commits to your repository, which redeploys the site.
          To do that, this page needs a GitHub token — it is kept in this browser
          and sent only to github.com.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="owner"
              className="mb-1.5 block font-medium"
              style={{ fontSize: 'var(--step--1)', color: 'var(--text)' }}
            >
              Owner
            </label>
            <input
              id="owner"
              style={inputStyle}
              value={owner}
              onChange={(e) => setOwner(e.target.value.trim())}
              required
            />
          </div>
          <div>
            <label
              htmlFor="repo"
              className="mb-1.5 block font-medium"
              style={{ fontSize: 'var(--step--1)', color: 'var(--text)' }}
            >
              Repository
            </label>
            <input
              id="repo"
              style={inputStyle}
              value={repo}
              onChange={(e) => setRepo(e.target.value.trim())}
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="token"
            className="mb-1.5 block font-medium"
            style={{ fontSize: 'var(--step--1)', color: 'var(--text)' }}
          >
            Access token
          </label>
          <input
            id="token"
            type="password"
            className="font-mono"
            style={inputStyle}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="github_pat_…"
            autoComplete="off"
            required
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4"
            style={{ accentColor: 'var(--accent)' }}
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>
            <span
              className="font-medium"
              style={{ fontSize: 'var(--step--1)', color: 'var(--text)' }}
            >
              Stay signed in on this device
            </span>
            <span
              className="block"
              style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}
            >
              Stores the token in this browser. Leave it off on a shared or public
              computer — you will then be asked for it again each time.
            </span>
          </span>
        </label>

        {error && (
          <p
            className="rounded-[10px] px-3 py-2"
            style={{
              fontSize: 'var(--step--1)',
              border: '1px solid var(--border-accent)',
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-text)',
            }}
          >
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? 'Checking…' : 'Connect'}
        </Button>
      </form>

      <div
        className="mt-8 rounded-[12px] p-4"
        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-elev)' }}
      >
        <p className="font-medium" style={{ fontSize: 'var(--step--1)', color: 'var(--text)' }}>
          Creating the token
        </p>
        <ol
          className="mt-2 flex flex-col gap-1.5"
          style={{ fontSize: 'var(--step--1)', color: 'var(--text-2)' }}
        >
          <li>
            1. Open{' '}
            <a
              href={TOKEN_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-4"
              style={{ color: 'var(--text)' }}
            >
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
        <p className="mt-3" style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}>
          Give it an expiry date. When it lapses, make another — nothing else changes.
        </p>
      </div>
    </div>
  );
};
