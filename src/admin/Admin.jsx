import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Globe,
  GraduationCap,
  LayoutList,
  Loader2,
  LogOut,
  Mail,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { applyThemePreview } from '@/lib/theme'
import Login from './Login'
import { EditorProvider } from './state'
import { MediaContext } from './context'
import {
  ContactPanel,
  EducationPanel,
  ExperiencePanel,
  MetaPanel,
  ProfilePanel,
  ProjectsPanel,
  SectionsPanel,
  SkillsPanel,
  ThemePanel,
} from './panels'
import { encodeBytes, encodeText, getFile, getFileSha, latestRun, putFile } from './github'

const CONTENT_PATH = 'src/data/site.json'
const STORAGE_KEY = 'portfolio-admin-credentials'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User, Panel: ProfilePanel },
  { id: 'sections', label: 'Sections', icon: LayoutList, Panel: SectionsPanel },
  { id: 'education', label: 'Education', icon: GraduationCap, Panel: EducationPanel },
  { id: 'experience', label: 'Experience', icon: Briefcase, Panel: ExperiencePanel },
  { id: 'projects', label: 'Projects', icon: FolderGit2, Panel: ProjectsPanel },
  { id: 'skills', label: 'Skills', icon: Sparkles, Panel: SkillsPanel },
  { id: 'contact', label: 'Contact', icon: Mail, Panel: ContactPanel },
  { id: 'theme', label: 'Theme', icon: Palette, Panel: ThemePanel },
  { id: 'meta', label: 'Page & sharing', icon: Globe, Panel: MetaPanel },
]

/**
 * Prefill the repository from wherever this page is being served.
 * On <owner>.github.io/<repo>/ both parts are in the URL; in local dev they are
 * not, so fall back to the base path Vite was built with.
 */
function guessRepo() {
  const { hostname, pathname } = window.location
  const owner = hostname.endsWith('.github.io') ? hostname.replace('.github.io', '') : ''
  const fromPath = pathname.split('/').filter(Boolean)[0]
  const fromBase = import.meta.env.BASE_URL.split('/').filter(Boolean)[0]
  return { owner, repo: fromPath || fromBase || '' }
}

const loadCredentials = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? null
  } catch {
    return null
  }
}

export default function Admin() {
  const [credentials, setCredentials] = useState(loadCredentials)
  const [tab, setTab] = useState('profile')

  const [data, setData] = useState(null)
  const [baseline, setBaseline] = useState(null)
  const [sha, setSha] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [deploy, setDeploy] = useState(null)
  const [message, setMessage] = useState('')

  const dirty = useMemo(
    () => Boolean(data) && JSON.stringify(data) !== JSON.stringify(baseline),
    [data, baseline]
  )

  // --- load ----------------------------------------------------------------

  const load = useCallback(async () => {
    if (!credentials) return
    try {
      const file = await getFile({
        ...credentials,
        path: CONTENT_PATH,
        ref: credentials.branch,
      })
      const parsed = JSON.parse(file.text)
      setData(parsed)
      setBaseline(parsed)
      setSha(file.sha)
      setLoadError(null)
    } catch (error) {
      setLoadError(error.message)
    }
  }, [credentials])

  useEffect(() => {
    // Fetching the document from GitHub is exactly the external-system case an
    // effect is for; every setState in load() happens after an await, so none
    // of them run synchronously during this effect.
    // oxlint-disable-next-line react/set-state-in-effect
    load()
  }, [load])

  // Preview the theme on the editor itself, so colour changes are visible while
  // you make them rather than only after publishing.
  useEffect(() => {
    if (data?.theme) applyThemePreview(data.theme)
  }, [data?.theme])

  // Closing the tab mid-edit would lose the changes silently; nothing is on the
  // server until Publish.
  useEffect(() => {
    if (!dirty) return
    const warn = event => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // --- save ----------------------------------------------------------------

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const text = JSON.stringify(data, null, 2) + '\n'
      const result = await putFile({
        ...credentials,
        path: CONTENT_PATH,
        contentBase64: encodeText(text),
        sha,
        message: message.trim() || 'Update site content',
        branch: credentials.branch,
      })
      setSha(result.sha)
      setBaseline(data)
      setMessage('')
      setDeploy({ commitSha: result.commitSha, commitUrl: result.commitUrl, run: null })
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const uploadMedia = useCallback(
    async (path, arrayBuffer) => {
      const target = `public/${path}`
      // Replacing a file needs the sha of the one already there; a new upload
      // must not send one at all.
      const existing = await getFileSha({
        ...credentials,
        path: target,
        ref: credentials.branch,
      })
      await putFile({
        ...credentials,
        path: target,
        contentBase64: encodeBytes(arrayBuffer),
        sha: existing ?? undefined,
        message: `Upload ${path}`,
        branch: credentials.branch,
      })
    },
    [credentials]
  )

  const media = useMemo(() => ({ upload: credentials ? uploadMedia : null }), [
    credentials,
    uploadMedia,
  ])

  const signOut = () => {
    if (dirty && !confirm('You have unpublished changes. Sign out and lose them?')) return
    localStorage.removeItem(STORAGE_KEY)
    setCredentials(null)
    setData(null)
    setBaseline(null)
  }

  // --- render --------------------------------------------------------------

  if (!credentials) {
    return (
      <Login
        defaults={guessRepo()}
        onConnect={({ remember, ...creds }) => {
          if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify(creds))
          setCredentials(creds)
        }}
      />
    )
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
            <Button variant="outline" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </>
        }
      />
    )
  }

  if (!data) {
    return (
      <Centered
        title="Loading…"
        body={`Reading ${CONTENT_PATH} from ${credentials.owner}/${credentials.repo}.`}
      />
    )
  }

  const { Panel } = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <EditorProvider data={data} onChange={setData}>
      <MediaContext.Provider value={media}>
        <div className="min-h-svh bg-background text-foreground">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-semibold">Site editor</h1>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {credentials.owner}/{credentials.repo} · {credentials.branch}
                </p>
              </div>

              <input
                className="hidden w-56 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-ring lg:block"
                placeholder="Commit message (optional)"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />

              <Button variant="ghost" size="sm" asChild>
                <a href={import.meta.env.BASE_URL} target="_blank" rel="noreferrer">
                  View site <ExternalLink className="size-3.5" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Discard changes and reload from GitHub"
                onClick={() => {
                  if (!dirty || confirm('Discard your unpublished changes?')) load()
                }}>
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Sign out" onClick={signOut}>
                <LogOut className="size-4" />
              </Button>
              <Button size="sm" disabled={!dirty || saving} onClick={save}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {saving ? 'Publishing…' : dirty ? 'Publish' : 'Published'}
              </Button>
            </div>

            {saveError && (
              <div className="border-t border-destructive/40 bg-destructive/10 px-6 py-2 text-sm text-destructive">
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
                      className={`flex w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                        id === tab
                          ? 'bg-muted font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}>
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
  )
}

/**
 * Publishing only commits the file — GitHub Actions then rebuilds and deploys,
 * which takes a minute or so. Without this you would save, refresh the site,
 * see no change, and reasonably assume it had not worked.
 */
function DeployStatus({ credentials, deploy, onUpdate }) {
  useEffect(() => {
    let cancelled = false
    let attempts = 0

    const poll = async () => {
      if (cancelled) return
      if (attempts++ > 60) {
        onUpdate(current => ({ ...current, gaveUp: true }))
        return
      }

      const result = await latestRun({ ...credentials, branch: credentials.branch })
      if (cancelled) return

      // No point asking again — the token will not grow the Actions scope
      // while the page is open.
      if (result.state === 'unavailable') {
        onUpdate(current => ({ ...current, unavailable: true }))
        return
      }

      // Ignore runs from before this commit — the workflow takes a few seconds
      // to be queued, and until then the newest run is still the previous one.
      if (result.state === 'found' && result.run.sha === deploy.commitSha) {
        onUpdate(current => ({ ...current, run: result.run }))
        if (result.run.status === 'completed') return
      }
      timer = setTimeout(poll, 5000)
    }

    let timer = setTimeout(poll, 3000)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [credentials, deploy.commitSha, onUpdate])

  const { run, unavailable, gaveUp } = deploy
  const done = run?.status === 'completed'
  const failed = done && run.conclusion !== 'success'
  // Nothing is still in flight once we have stopped watching.
  const settled = done || unavailable || gaveUp

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
          : 'Saved. Building and deploying…'

  const tone = failed
    ? 'border-destructive/40 bg-destructive/10 text-destructive'
    : 'border-border bg-muted/50 text-muted-foreground'

  return (
    <div className={`flex flex-wrap items-center gap-2 border-t px-6 py-2 text-sm ${tone}`}>
      {failed ? (
        <AlertCircle className="size-4 shrink-0" />
      ) : done ? (
        <CheckCircle2 className="size-4 shrink-0" />
      ) : settled ? (
        <AlertCircle className="size-4 shrink-0" />
      ) : (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      )}
      <span>{text}</span>
      <a
        href={run?.url ?? deploy.commitUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 underline underline-offset-4">
        {run ? 'View run' : 'View commit'}
        <ExternalLink className="size-3" />
      </a>
    </div>
  )
}

function Centered({ title, body, detail, actions }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 text-center">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {detail && <p className="mt-2 font-mono text-xs text-muted-foreground">{detail}</p>}
      {actions && <div className="mt-6 flex justify-center gap-3">{actions}</div>}
    </div>
  )
}
