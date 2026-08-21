// One panel per tab in the editor. These are almost entirely declarative — the
// interesting logic lives in fields.jsx and github.js.
import { Badge } from '@/components/ui/badge'
import { COLOR_TOKENS, FONTS } from '@/lib/theme'
import {
  ColorField,
  NumberField,
  Repeater,
  SelectField,
  StringListField,
  TextAreaField,
  TextField,
  ToggleField,
} from './fields'
import { MediaField } from './media'
import { useEditor } from './context'
import { moveItem } from './immutable'
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

const Stack = ({ children }) => <div className="space-y-6">{children}</div>
const Row = ({ children }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>

export function ProfilePanel() {
  return (
    <Stack>
      <Row>
        <TextField path={['profile', 'name']} label="Name" />
        <TextField path={['profile', 'role']} label="Role" hint="Shown under your name in the hero." />
      </Row>
      <Row>
        <TextField path={['profile', 'location']} label="Location" />
        <TextField
          path={['profile', 'availability']}
          label="Availability"
          hint="The pill with the pulsing green dot. Leave empty to hide it."
        />
      </Row>
      <TextAreaField
        path={['profile', 'tagline']}
        label="Tagline"
        rows={3}
        hint="The one-paragraph summary in the hero."
      />
      <StringListField
        path={['profile', 'about']}
        label="About paragraphs"
        multiline
        addLabel="Add paragraph"
        hint="Laid out in two columns, so an even number reads best."
      />
      <Row>
        <MediaField
          path={['profile', 'photo']}
          label="Photo"
          accept="image/*"
          preview
          hint="Square works best. Without one, the hero shows your initials."
        />
        <MediaField
          path={['profile', 'resumeUrl']}
          label="Résumé"
          accept="application/pdf"
          hint="Adds a Résumé button to the hero."
        />
      </Row>
    </Stack>
  )
}

export function MetaPanel() {
  return (
    <Stack>
      <p className="text-sm text-muted-foreground">
        What search engines and link previews show. None of this appears on the page
        itself.
      </p>
      <TextField path={['meta', 'title']} label="Page title" hint="The browser tab, and the headline in search results." />
      <TextAreaField
        path={['meta', 'description']}
        label="Description"
        rows={3}
        hint="The grey text under the title in search results. Aim for 150–160 characters."
      />
      <TextField path={['meta', 'siteUrl']} label="Site URL" />
      <TextField path={['meta', 'ogTitle']} label="Share title" hint="Used when the link is pasted into a chat. Falls back to the page title." />
      <TextAreaField path={['meta', 'ogDescription']} label="Share description" rows={2} />
      <MediaField
        path={['meta', 'ogImage']}
        label="Share image"
        accept="image/*"
        preview
        hint="1200×630 gives the large preview card. Without one, previews stay small."
      />
    </Stack>
  )
}

export function ContactPanel() {
  return (
    <Stack>
      <TextField path={['contact', 'email']} label="Email" type="email" />
      <Repeater
        path={['contact', 'links']}
        label="Links"
        hint="GitHub, LinkedIn, anywhere else worth sending people."
        addLabel="Add link"
        title={item => item.label || 'New link'}
        blank={() => ({ label: '', href: '' })}>
        {itemPath => (
          <Row>
            <TextField path={[...itemPath, 'label']} label="Label" placeholder="LinkedIn" />
            <TextField path={[...itemPath, 'href']} label="URL" placeholder="https://…" />
          </Row>
        )}
      </Repeater>
    </Stack>
  )
}

export function EducationPanel() {
  return (
    <Repeater
      path={['education']}
      addLabel="Add qualification"
      title={item => item.school || 'New entry'}
      blank={() => ({ school: '', degree: '', period: '', grade: '', details: [] })}>
      {itemPath => (
        <>
          <Row>
            <TextField path={[...itemPath, 'school']} label="Institution" />
            <TextField path={[...itemPath, 'degree']} label="Qualification" />
          </Row>
          <Row>
            <TextField path={[...itemPath, 'period']} label="Period" placeholder="2024 — Present" />
            <TextField path={[...itemPath, 'grade']} label="Grade" hint="Hidden when empty." />
          </Row>
          <StringListField
            path={[...itemPath, 'details']}
            label="Details"
            addLabel="Add detail"
            multiline
          />
        </>
      )}
    </Repeater>
  )
}

export function ExperiencePanel() {
  return (
    <Repeater
      path={['experience']}
      addLabel="Add role"
      title={item => [item.role, item.company].filter(Boolean).join(' · ') || 'New role'}
      blank={() => ({
        company: '',
        role: '',
        period: '',
        location: '',
        summary: '',
        highlights: [],
        stack: [],
      })}>
      {itemPath => (
        <>
          <Row>
            <TextField path={[...itemPath, 'role']} label="Job title" />
            <TextField path={[...itemPath, 'company']} label="Company" />
          </Row>
          <Row>
            <TextField path={[...itemPath, 'period']} label="Period" placeholder="Jan 2026 — Feb 2026" />
            <TextField path={[...itemPath, 'location']} label="Location" />
          </Row>
          <TextAreaField path={[...itemPath, 'summary']} label="Summary" rows={2} />
          <StringListField
            path={[...itemPath, 'highlights']}
            label="Highlights"
            addLabel="Add highlight"
            multiline
          />
          <StringListField
            path={[...itemPath, 'stack']}
            label="Tools used"
            addLabel="Add tool"
            placeholder="React Native"
            hint="Rendered as small outlined tags."
          />
        </>
      )}
    </Repeater>
  )
}

export function ProjectsPanel() {
  return (
    <Stack>
      <p className="text-sm text-muted-foreground">
        These are the cards in the 3D carousel, in this order. The first three tools
        and the two accent colours appear on the card itself; everything else shows in
        the detail panel underneath.
      </p>
      <Repeater
        path={['projects']}
        addLabel="Add project"
        title={item => item.title || 'New project'}
        blank={() => ({
          title: '',
          kind: '',
          blurb: '',
          description: '',
          stack: [],
          year: '',
          links: [],
          accent: ['#6366f1', '#0ea5e9'],
        })}>
        {itemPath => (
          <>
            <Row>
              <TextField path={[...itemPath, 'title']} label="Title" />
              <TextField path={[...itemPath, 'kind']} label="Kind" placeholder="Final Year Project" />
            </Row>
            <Row>
              <TextField path={[...itemPath, 'year']} label="Year" placeholder="2025 — 2026" />
              <div>
                <p className="mb-1.5 text-sm font-medium">Card gradient</p>
                <div className="flex gap-4">
                  <ColorField path={[...itemPath, 'accent', 0]} label="From" />
                  <ColorField path={[...itemPath, 'accent', 1]} label="To" />
                </div>
              </div>
            </Row>
            <TextAreaField
              path={[...itemPath, 'blurb']}
              label="Blurb"
              rows={2}
              hint="The short line on the card. Keep it to one sentence."
            />
            <TextAreaField
              path={[...itemPath, 'description']}
              label="Description"
              rows={5}
              hint="The full write-up below the carousel."
            />
            <StringListField
              path={[...itemPath, 'stack']}
              label="Tech stack"
              addLabel="Add technology"
            />
            <Repeater
              path={[...itemPath, 'links']}
              label="Links"
              addLabel="Add link"
              title={item => item.label || 'New link'}
              blank={() => ({ label: '', href: '' })}>
              {linkPath => (
                <Row>
                  <TextField path={[...linkPath, 'label']} label="Label" placeholder="Source" />
                  <TextField path={[...linkPath, 'href']} label="URL" placeholder="https://…" />
                </Row>
              )}
            </Repeater>
          </>
        )}
      </Repeater>
    </Stack>
  )
}

export function SkillsPanel() {
  return (
    <Repeater
      path={['skills']}
      addLabel="Add group"
      title={item => item.group || 'New group'}
      blank={() => ({ group: '', items: [] })}>
      {itemPath => (
        <>
          <TextField path={[...itemPath, 'group']} label="Group name" placeholder="Databases & Tools" />
          <StringListField path={[...itemPath, 'items']} label="Skills" addLabel="Add skill" />
        </>
      )}
    </Repeater>
  )
}

export function ThemePanel() {
  return (
    <Stack>
      <p className="text-sm text-muted-foreground">
        Changes here preview live in this editor, so you can see what you are doing
        before you publish.
      </p>
      <Row>
        <SelectField
          path={['theme', 'mode']}
          label="Colour mode"
          hint="“Follow device” uses the visitor's own light or dark setting."
          options={[
            { value: 'system', label: 'Follow device' },
            { value: 'light', label: 'Always light' },
            { value: 'dark', label: 'Always dark' },
          ]}
        />
        <SelectField
          path={['theme', 'font']}
          label="Font"
          hint="All bundled or system faces — none of them cost a download."
          options={Object.entries(FONTS).map(([value, f]) => ({ value, label: f.label }))}
        />
      </Row>
      <NumberField
        path={['theme', 'radius']}
        label="Corner rounding (rem)"
        hint="0 is square, 0.625 is the current look, 1.5 is very round."
        min={0}
        max={3}
        step={0.125}
      />

      {['light', 'dark'].map(mode => (
        <div key={mode}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-medium capitalize">{mode} palette</h3>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {mode === 'light' ? ':root' : '.dark'}
            </Badge>
          </div>
          <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
            {COLOR_TOKENS.map(token => (
              <ColorField
                key={token.key}
                path={['theme', 'colors', mode, token.key]}
                label={token.label}
              />
            ))}
          </div>
        </div>
      ))}
    </Stack>
  )
}

export function SectionsPanel() {
  const { data, set } = useEditor()
  const sections = data.sections ?? []

  return (
    <Stack>
      <p className="text-sm text-muted-foreground">
        Reorder, rename or hide the page's sections. The numbering in each heading
        (“01 —”, “02 —”) follows this order automatically. The hero is always first and
        is edited under Profile.
      </p>

      <div className="space-y-3">
        {sections.map((section, i) => {
          const visible = section.visible !== false
          return (
            <div
              key={section.id}
              className={`rounded-lg border border-border bg-card p-4 ${visible ? '' : 'opacity-60'}`}>
              <div className="mb-4 flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 truncate text-sm font-medium">{section.title}</span>

                <button
                  type="button"
                  title={visible ? 'Hide this section' : 'Show this section'}
                  aria-label={visible ? 'Hide this section' : 'Show this section'}
                  onClick={() => set(['sections', i, 'visible'], !visible)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                  {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                <button
                  type="button"
                  title="Move up"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => set(['sections'], moveItem(sections, i, i - 1))}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30">
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  title="Move down"
                  aria-label="Move down"
                  disabled={i === sections.length - 1}
                  onClick={() => set(['sections'], moveItem(sections, i, i + 1))}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30">
                  <ChevronDown className="size-4" />
                </button>
              </div>

              <div className="space-y-4">
                <Row>
                  <TextField path={['sections', i, 'navLabel']} label="Nav label" />
                  <TextField
                    path={['sections', i, 'eyebrow']}
                    label="Eyebrow"
                    hint="The small caps line above the heading."
                  />
                </Row>
                <TextField path={['sections', i, 'title']} label="Heading" />
                <TextAreaField path={['sections', i, 'subtitle']} label="Intro line" rows={2} />
                <ToggleField
                  path={['sections', i, 'visible']}
                  label="Show this section"
                  hint="Hiding it removes the section and its nav link, keeping the content for later."
                />
              </div>
            </div>
          )
        })}
      </div>
    </Stack>
  )
}
