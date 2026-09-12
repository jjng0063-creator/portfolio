import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Braces,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Globe,
  GraduationCap,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  Sparkles,
  User,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Login } from './Login';
import { EditorProvider } from './state';
import { inputStyle } from './styles';
import { MediaContext } from './context';

import {
  ContactPanel,
  EducationPanel,
  ExperiencePanel,
  MetaPanel,
  PlaygroundPanel,
  ProfilePanel,
  ProjectsPanel,
  SkillsPanel,
} from './panels';
import {
  encodeBytes,
  encodeText,
  getFile,
  getFileSha,
  latestRun,
  putFile,
  type Credentials,
  type WorkflowRun,
} from './github';

const CONTENT_PATH = 'src/data/content.json';
const STORAGE_KEY = 'portfolio-admin-credentials';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User, Panel: ProfilePanel },
  { id: 'education', label: 'Studies', icon: GraduationCap, Panel: EducationPanel },
  { id: 'experience', label: 'Career', icon: Briefcase, Panel: ExperiencePanel },
  { id: 'projects', label: 'Projects', icon: FolderGit2, Panel: ProjectsPanel },
  { id: 'skills', label: 'Skills', icon: Sparkles, Panel: SkillsPanel },
  { id: 'playground', label: 'Playground', icon: Braces, Panel: PlaygroundPanel },
  { id: 'contact', label: 'Contact', icon: Mail, Panel: ContactPanel },
  { id: 'meta', label: 'Page & sharing', icon: Globe, Panel: MetaPanel },
];

/**
 * Prefill the repository from wherever this page is being served.
 * On <owner>.github.io/<repo>/ both parts are in the URL; in local dev they are
 * not, so fall back to the base path Vite was built with.
 *
 * Segments containing a dot are filenames, not path segments: served from the
 * root, `/admin.html` would otherwise offer "admin.html" as the repository name.
 */
function guessRepo() {
  const { hostname, pathname } = window.location;
  const owner = hostname.endsWith('.github.io') ? hostname.replace('.github.io', '') : '';
  const fromPath = pathname.split('/').filter((s) => s && !s.includes('.'))[0];
  const fromBase = import.meta.env.BASE_URL.split('/').filter(Boolean)[0];
  return { owner, repo: fromPath || fromBase || '' };
}

const loadCredentials = (): Credentials | null => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
  } catch {
    return null;
  }
};

interface Deploy {
  commitSha: string;
  commitUrl: string;
  run: WorkflowRun | null;
  unavailable?: boolean;
  gaveUp?: boolean;
}

export default function Admin() {
  const [credentials, setCredentials] = useState<Credentials | null>(loadCredentials);
  const [tab, setTab] = useState('profile');

  const [data, setData] = useState<any>(null);
  const [baseline, setBaseline] = useState<any>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deploy, setDeploy] = useState<Deploy | null>(null);
  const [message, setMessage] = useState('');

  const dirty = useMemo(
    () => Boolean(data) && JSON.stringify(data) !== JSON.stringify(baseline),
    [data, baseline]
  );

  /* --- load --------------------------------------------------------------- */

  const load = useCallback(async () => {
    if (!credentials) return;
    try {
      const file = await getFile({
        ...credentials,
        path: CONTENT_PATH,
        ref: credentials.branch,
      });
      const parsed = JSON.parse(file.text);
      setData(parsed);
      setBaseline(parsed);
      setSha(file.sha);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    }
  }, [credentials]);

  useEffect(() => {
    // Fetching the document from GitHub is exactly the external-system case an
    // effect is for; every setState in load() happens after an await, so none
    // of them run synchronously during this effect.
    // oxlint-disable-next-line react/set-state-in-effect
    load();
  }, [load]);

  // Closing the tab mid-edit would lose the changes silently; nothing is on the
  // server until Publish.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  /* --- save --------------------------------------------------------------- */

  const save = async () => {
    if (!credentials) return;
    setSaving(true);
    setSaveError(null);
    try {
      const text = JSON.stringify(data, null, 2) + '\n';
      const result = await putFile({
        ...credentials,
        path: CONTENT_PATH,
        contentBase64: encodeText(text),
        sha: sha ?? undefined,
        message: message.trim() || 'Update site content',
      });
      setSha(result.sha);
      setBaseline(data);
      setMessage('');
      setDeploy({ commitSha: result.commitSha, commitUrl: result.commitUrl, run: null });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const uploadMedia = useCallback(
    async (path: string, bytes: ArrayBuffer) => {
      if (!credentials) return;
      const target = `public/${path}`;
      // Replacing a file needs the sha of the one already there; a new upload
      // must not send one at all.
      const existing = await getFileSha({
        ...credentials,
        path: target,
        ref: credentials.branch,
      });
      await putFile({
        ...credentials,
        path: target,
        contentBase64: encodeBytes(bytes),
        sha: existing ?? undefined,
        message: `Upload ${path}`,
      });
    },
    [credentials]
  );

  const media = useMemo(
    () => ({ upload: credentials ? uploadMedia : null }),
    [credentials, uploadMedia]
  );

  const signOut = () => {
    if (dirty && !confirm('You have unpublished changes. Sign out and lose them?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setCredentials(null);
    setData(null);
    setBaseline(null);
  };

  /* --- render ------------------------------------------------------------- */

  if (!credentials) {
    return (
      <Login
        defaults={guessRepo()}
        onConnect={({ remember, ...creds }) => {
          if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
          setCredentials(creds);
        }}
      />
    );
  }

  if (loadError) {
    return (
      <Centered
        title="Could not load the content file"
        body={loadError}
        detail={`Looked for ${CONTENT_PATH} on ${credentials.owner}/${credentials.repo}@${credentials.branch}.`}
        actions={
          <>
            <Button onClick={load}>
              <RefreshCw className="size-4" /> Try again
            </Button>
            <Button variant="secondary" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </>
        }
      />
    );
  }

  if (!data) {
    return (
      <Centered
        title="Loading…"
        body={`Reading ${CONTENT_PATH} from ${credentials.owner}/${credentials.repo}.`}
      />
    );
  }

  const { Panel } = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <EditorProvider data={data} onChange={setData}>
      <MediaContext.Provider value={media}>
        <div className="min-h-svh" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
          <header
            className="sticky top-0 z-30"
            style={{
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'color-mix(in srgb, var(--bg) 90%, transparent)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
              <div className="min-w-0 flex-1">
                <h1 className="truncate font-semibold" style={{ fontSize: 'var(--step--1)' }}>
                  Site editor
                </h1>
                <p
                  className="truncate font-mono"
                  style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}
                >
                  {credentials.owner}/{credentials.repo} · {credentials.branch}
                </p>
              </div>

              <input
                className="hidden lg:block"
                style={{ ...inputStyle, width: '15rem', padding: '0.4rem 0.7rem' }}
                placeholder="Commit message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <Button as="a" href={import.meta.env.BASE_URL} variant="ghost" external>
                View site <ExternalLink className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (!dirty || confirm('Discard your unpublished changes?')) load();
                }}
              >
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="ghost" onClick={signOut}>
                <LogOut className="size-4" />
              </Button>
              <Button disabled={!dirty || saving} onClick={save}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {saving ? 'Publishing…' : dirty ? 'Publish' : 'Published'}
              </Button>
            </div>

            {saveError && (
              <div
                className="px-6 py-2"
                style={{
                  borderTop: '1px solid var(--border-accent)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent-text)',
                  fontSize: 'var(--step--1)',
                }}
              >
                {saveError}
              </div>
            )}
            {deploy && !saveError && (
              <DeployStatus credentials={credentials} deploy={deploy} onUpdate={setDeploy} />
            )}
          </header>

          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 md:flex-row">
            <nav className="md:w-48 md:shrink-0">
              <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setTab(id)}
                      className="flex w-full items-center gap-2 whitespace-nowrap rounded-[8px] px-3 py-2 transition-colors"
                      style={{
                        fontSize: 'var(--step--1)',
                        backgroundColor: id === tab ? 'var(--bg-elev-2)' : 'transparent',
                        color: id === tab ? 'var(--text)' : 'var(--text-3)',
                        fontWeight: id === tab ? 500 : 400,
                      }}
                    >
                      <Icon className="size-4 shrink-0" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <main className="min-w-0 flex-1 pb-16">
              <Panel />
            </main>
          </div>
        </div>
      </MediaContext.Provider>
    </EditorProvider>
  );
}

/**
 * Publishing only commits the file — a deploy then rebuilds the site, which
 * takes a minute or so. Without this you would save, refresh the site, see no
 * change, and reasonably assume it had not worked.
 */
const DeployStatus: React.FC<{
  credentials: Credentials;
  deploy: Deploy;
  onUpdate: React.Dispatch<React.SetStateAction<Deploy | null>>;
}> = ({ credentials, deploy, onUpdate }) => {
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: number;

    const poll = async () => {
      if (cancelled) return;
      if (attempts++ > 60) {
        onUpdate((current) => (current ? { ...current, gaveUp: true } : current));
        return;
      }

      const result = await latestRun(credentials);
      if (cancelled) return;

      // No point asking again — the token will not grow the Actions scope while
      // the page is open.
      if (result.state === 'unavailable') {
        onUpdate((current) => (current ? { ...current, unavailable: true } : current));
        return;
      }

      // Ignore runs from before this commit — the workflow takes a few seconds
      // to be queued, and until then the newest run is still the previous one.
      if (result.state === 'found' && result.run.sha === deploy.commitSha) {
        onUpdate((current) => (current ? { ...current, run: result.run } : current));
        if (result.run.status === 'completed') return;
      }
      timer = window.setTimeout(poll, 5000);
    };

    timer = window.setTimeout(poll, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [credentials, deploy.commitSha, onUpdate]);

  const { run, unavailable, gaveUp } = deploy;
  const done = run?.status === 'completed';
  const failed = done && run.conclusion !== 'success';
  // Nothing is still in flight once we have stopped watching.
  const settled = done || unavailable || gaveUp;

  const text = unavailable
    ? 'Saved and committed. The deploy is running, but this token cannot read Actions — add "Actions: Read-only" to track it here.'
    : gaveUp
      ? 'Saved and committed, but the deploy is taking longer than expected. Check the run on GitHub.'
      : !run
        ? 'Saved. Waiting for the deploy to start…'
        : done
          ? failed
            ? `Deploy ${run.conclusion}. The change is committed but not live.`
            : 'Deployed. Your changes are live — hard-refresh the site to see them.'
          : 'Saved. Building and deploying…';

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-6 py-2"
      style={{
        borderTop: '1px solid var(--border)',
        backgroundColor: failed ? 'var(--accent-soft)' : 'var(--bg-elev)',
        color: failed ? 'var(--accent-text)' : 'var(--text-3)',
        fontSize: 'var(--step--1)',
      }}
    >
      {failed || (settled && !done) ? (
        <AlertCircle className="size-4 shrink-0" />
      ) : done ? (
        <CheckCircle2 className="size-4 shrink-0" style={{ color: 'var(--live)' }} />
      ) : (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      )}
      <span>{text}</span>
      <a
        href={run?.url ?? deploy.commitUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 underline underline-offset-4"
      >
        {run ? 'View run' : 'View commit'}
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
};

const Centered: React.FC<{
  title: string;
  body: string;
  detail?: string;
  actions?: React.ReactNode;
}> = ({ title, body, detail, actions }) => (
  <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 text-center">
    <h1 className="font-semibold" style={{ fontSize: 'var(--step-1)', color: 'var(--text)' }}>
      {title}
    </h1>
    <p className="mt-2" style={{ fontSize: 'var(--step--1)', color: 'var(--text-2)' }}>
      {body}
    </p>
    {detail && (
      <p className="mt-2 font-mono" style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}>
        {detail}
      </p>
    )}
    {actions && <div className="mt-6 flex justify-center gap-3">{actions}</div>}
  </div>
);
