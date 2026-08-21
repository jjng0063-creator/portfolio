// ============================================================================
//  Everything the site displays comes from src/data/site.json, which the admin
//  panel at /admin.html reads and writes over the GitHub API.
//
//  This file is the adapter between that JSON and the components. Editing it by
//  hand is fine, but src/data/site.json is the one the admin panel commits, so
//  prefer changing content there (or through the panel) — anything added here
//  will be invisible to the panel.
// ============================================================================

import site from './site.json'

const withBase = path => {
  if (!path) return null
  // Absolute URLs (an externally hosted photo, say) are left alone. Everything
  // else is a path inside public/, which needs the /portfolio/ base prefix —
  // a bare '/me.jpg' would 404, since the site is served from a subpath.
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '')
}

export const profile = {
  ...site.profile,
  photo: withBase(site.profile.photo),
  resumeUrl: withBase(site.profile.resumeUrl),
}

export const contact = site.contact
export const education = site.education
export const experience = site.experience
export const projects = site.projects
export const skills = site.skills
export const theme = site.theme

/** Visible sections, in the order the admin panel put them. */
export const sections = site.sections.filter(s => s.visible !== false)
