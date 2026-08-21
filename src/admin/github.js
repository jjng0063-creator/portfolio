// ============================================================================
//  Minimal GitHub REST client — just the four things the editor does: check a
//  token, read a file, commit a file, and watch the deploy that follows.
//
//  There is no server anywhere in this. The browser talks to api.github.com
//  directly using a token you paste in, which is why the site can stay on
//  GitHub Pages and still be editable.
// ============================================================================

const API = 'https://api.github.com'

export class GitHubError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'GitHubError'
    this.status = status
  }
}

async function request(token, path, options = {}) {
  let res
  try {
    res = await fetch(API + path, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })
  } catch {
    throw new GitHubError('Could not reach GitHub. Check your internet connection.', 0)
  }

  if (res.status === 204) return null

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const detail = body?.message ?? res.statusText
    if (res.status === 401) {
      throw new GitHubError('Token rejected — it is wrong, expired, or revoked.', 401)
    }
    if (res.status === 403) {
      throw new GitHubError(
        `Token lacks permission for this. Give it "Contents: Read and write" on this repository. (${detail})`,
        403
      )
    }
    if (res.status === 409) {
      throw new GitHubError(
        'The file changed on GitHub since you loaded it. Reload the editor before saving, or your changes will overwrite the newer version.',
        409
      )
    }
    throw new GitHubError(detail, res.status)
  }

  return body
}

// --- base64, unicode-safe ---------------------------------------------------
// btoa() only handles Latin-1, and this content is full of em dashes and
// accented characters, so the string has to go through UTF-8 bytes first.

const CHUNK = 0x8000

function bytesToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

export const encodeText = text => bytesToBase64(new TextEncoder().encode(text))

export const decodeText = base64 =>
  new TextDecoder().decode(
    Uint8Array.from(atob(base64.replace(/\s/g, '')), c => c.charCodeAt(0))
  )

export const encodeBytes = arrayBuffer => bytesToBase64(new Uint8Array(arrayBuffer))

// --- operations -------------------------------------------------------------

/**
 * Confirm the token works and can actually write here. Returns the default
 * branch, since that is what everything else commits to.
 */
export async function verifyAccess({ token, owner, repo }) {
  const info = await request(token, `/repos/${owner}/${repo}`)
  if (!info.permissions?.push) {
    throw new GitHubError(
      'That token can read this repository but not write to it. It needs "Contents: Read and write".',
      403
    )
  }
  return { defaultBranch: info.default_branch, fullName: info.full_name }
}

/** Read a text file. Returns its contents and the blob sha a commit will need. */
export async function getFile({ token, owner, repo, path, ref }) {
  const query = ref ? `?ref=${encodeURIComponent(ref)}` : ''
  const file = await request(token, `/repos/${owner}/${repo}/contents/${path}${query}`)
  return { text: decodeText(file.content), sha: file.sha }
}

/**
 * Commit a file. `sha` is the version being replaced — GitHub rejects the
 * commit if it no longer matches, which is what stops two tabs silently
 * overwriting each other. Returns the new sha, for the next save.
 */
export async function putFile({
  token,
  owner,
  repo,
  path,
  contentBase64,
  sha,
  message,
  branch,
}) {
  const result = await request(token, `/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: contentBase64,
      ...(sha ? { sha } : {}),
      ...(branch ? { branch } : {}),
    }),
  })
  return {
    sha: result.content.sha,
    commitSha: result.commit.sha,
    commitUrl: result.commit.html_url,
  }
}

/** The sha of an existing file, or null if it is not there yet. */
export async function getFileSha({ token, owner, repo, path, ref }) {
  try {
    const file = await getFile({ token, owner, repo, path, ref })
    return file.sha
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
}

/**
 * The most recent Actions run on a branch — this is how the editor shows
 * whether the deploy triggered by your save has finished.
 *
 * Reading Actions is an optional permission, so the caller has to be able to
 * tell "you cannot see this" apart from "it has not started yet". Collapsing
 * both to null made a tightly-scoped token look like a hung deploy: the save
 * had worked, but the panel sat on "waiting to start" until it gave up.
 *
 * Returns one of:
 *   { state: 'unavailable' }  the token cannot read Actions — stop asking
 *   { state: 'pending' }      nothing to report yet, or a transient failure
 *   { state: 'found', run }   a run for this branch
 */
export async function latestRun({ token, owner, repo, branch }) {
  let data
  try {
    data = await request(
      token,
      `/repos/${owner}/${repo}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=1`
    )
  } catch (error) {
    // 403: the token has no Actions scope. 404: Actions is disabled, or the
    // token cannot see the repository's workflows. Neither improves by
    // retrying. Anything else (network blip, 5xx) is worth another go.
    if (error.status === 403 || error.status === 404) return { state: 'unavailable' }
    return { state: 'pending' }
  }

  const run = data.workflow_runs?.[0]
  if (!run) return { state: 'pending' }

  return {
    state: 'found',
    run: {
      id: run.id,
      status: run.status, // queued | in_progress | completed
      conclusion: run.conclusion, // success | failure | cancelled | ...
      url: run.html_url,
      sha: run.head_sha,
      createdAt: run.created_at,
    },
  }
}
