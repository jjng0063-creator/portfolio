// Maps the `component` field in src/data/site.json to the React component that
// renders it. The admin panel can reorder, retitle and hide these, but it
// cannot invent new keys — a section whose component is missing from this
// registry is skipped rather than crashing the page.
import About from './About'
import Education from './Education'
import Experience from './Experience'
import Projects from './Projects'
import Skills from './Skills'
import Contact from './Contact'

export const SECTION_COMPONENTS = {
  About,
  Education,
  Experience,
  Projects,
  Skills,
  Contact,
}
