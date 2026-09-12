/* One panel per tab in the editor. These are almost entirely declarative — the
 * interesting logic lives in fields.tsx and github.ts. */
import React from 'react';
import {
  PROJECT_CATEGORIES,
  SKILL_LEVELS,
  type ApiEndpoint,
  type MilestoneItem,
  type ProjectItem,
  type SkillCategory,
} from '../data/portfolioData';
import {
  Label,
  Repeater,
  SelectField,
  StringListField,
  TextAreaField,
  TextField,
  ToggleField,
} from './fields';
import { inputStyle } from './styles';
import { MediaField } from './media';
import { useField } from './context';

const Stack: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col gap-6">{children}</div>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid gap-4 sm:grid-cols-2">{children}</div>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ fontSize: 'var(--step--1)', color: 'var(--text-3)' }}>{children}</p>
);

export const ProfilePanel: React.FC = () => (
  <Stack>
    <Row>
      <TextField path={['profile', 'name']} label="Name" />
      <TextField
        path={['profile', 'role']}
        label="Role"
        hint="Shown beside the location and availability near the headline."
      />
    </Row>

    <TextAreaField
      path={['profile', 'headline']}
      label="Headline"
      rows={2}
      hint="The huge line at the top. Short — it is set very large. Say what you build, not what you are."
    />
    <TextAreaField
      path={['profile', 'summary']}
      label="Summary"
      rows={3}
      hint="The paragraph under the headline."
    />

    <StringListField
      path={['profile', 'about']}
      label="About paragraphs"
      multiline
      addLabel="Add paragraph"
      hint="The longer bio, shown in the About section. One box per paragraph."
    />

    <Row>
      <TextField path={['profile', 'location']} label="Location" />
      <TextField
        path={['profile', 'status', 'text']}
        label="Availability"
        hint="The pill with the green dot at the top of the page."
      />
    </Row>

    <ToggleField
      path={['profile', 'status', 'available']}
      label="Show the availability pill"
      hint="Turn off when you are no longer looking. A stale date reads worse than none."
    />

    <Row>
      <MediaField
        path={['profile', 'photo']}
        label="Photo"
        accept="image/*"
        preview
        hint="Shown in the About section. Portrait crops best."
      />
      <MediaField
        path={['profile', 'resumeUrl']}
        label="Résumé"
        accept="application/pdf"
        hint="Adds a Résumé button next to the headline."
      />
    </Row>

    <TextField
      path={['profile', 'photoAlt']}
      label="Photo description"
      hint="What a screen reader announces in place of the photo."
    />
  </Stack>
);

export const ContactPanel: React.FC = () => (
  <Stack>
    <Note>
      These fill the Contact section, and the email is what the contact form
      composes to.
    </Note>
    <Row>
      <TextField path={['profile', 'email']} label="Email" type="email" />
      <TextField
        path={['profile', 'whatsapp']}
        label="WhatsApp"
        type="tel"
        placeholder="+60 12-345 6789"
        hint="International format with the country code. Empty hides the channel."
      />
    </Row>
    <Row>
      <TextField path={['profile', 'github']} label="GitHub URL" placeholder="https://github.com/…" />
      <TextField
        path={['profile', 'linkedin']}
        label="LinkedIn URL"
        placeholder="https://linkedin.com/in/…"
      />
    </Row>
    <TextField
      path={['profile', 'contactFormEndpoint']}
      label="Contact form endpoint"
      placeholder="https://formspree.io/f/…"
      hint="Optional. Empty and the form opens the visitor's mail client instead — which always works, and never silently loses a message."
    />
  </Stack>
);

export const ProjectsPanel: React.FC = () => (
  <Stack>
    <Note>
      Featured projects get the full card. Everything else drops to a one-line
      row underneath. Two or three featured is the right number.
    </Note>
    <Repeater<ProjectItem>
      path={['projects']}
      addLabel="Add project"
      title={(item) => item.title || 'New project'}
      blank={() => ({
        id: `project-${Date.now().toString(36)}`,
        title: '',
        category: 'Full-Stack',
        year: '',
        tagline: '',
        problem: '',
        approach: '',
        result: '',
        tags: [],
        image: '',
        imageAlt: '',
        demoUrl: '',
        githubUrl: '',
        featured: false,
      })}
    >
      {(p) => (
        <>
          <Row>
            <TextField path={[...p, 'title']} label="Title" />
            <TextField
              path={[...p, 'id']}
              label="Anchor id"
              mono
              hint="Used in the URL and by the cabinet drawer. Changing it breaks old links."
            />
          </Row>
          <Row>
            <SelectField path={[...p, 'category']} label="Category" options={PROJECT_CATEGORIES} />
            <TextField path={[...p, 'year']} label="Year" placeholder="2025 – 2026" />
          </Row>

          <TextAreaField
            path={[...p, 'tagline']}
            label="Tagline"
            rows={2}
            hint="One line a non-engineer would understand."
          />
          <TextAreaField path={[...p, 'problem']} label="Problem" rows={3} />
          <TextAreaField
            path={[...p, 'approach']}
            label="Approach"
            rows={4}
            hint="What you built, and the one decision an interviewer would ask about."
          />
          <TextAreaField
            path={[...p, 'result']}
            label="Result"
            rows={3}
            hint="What actually happened. Real scope beats an invented percentage. If you cannot write this, the project may not be ready to show."
          />

          <StringListField path={[...p, 'tags']} label="Stack" addLabel="Add tag" />

          <TextField path={[...p, 'role']} label="My role" hint="Optional. Describe your own contribution." />
          <TextAreaField path={[...p, 'decisions']} label="Key decisions" rows={3} />
          <TextAreaField path={[...p, 'challenges']} label="Challenges" rows={3} />
          <TextAreaField path={[...p, 'lessons']} label="Lessons learned" rows={3} />
          <Repeater<{ src: string; alt: string }> path={[...p, 'screenshots']} addLabel="Add gallery screenshot"
            title={(shot) => shot.alt || 'Screenshot'} blank={() => ({ src: '', alt: '' })}>
            {(shot) => <>
              <MediaField path={[...shot, 'src']} label="Gallery image" folder="work" accept="image/*" preview />
              <TextField path={[...shot, 'alt']} label="Image description" hint="Required. Describe what this screen shows." />
            </>}
          </Repeater>

          <MediaField
            path={[...p, 'image']}
            label="Screenshot"
            accept="image/*"
            folder="work"
            preview
            hint="16:9 crops best, anchored to the top — lead with the interesting part."
          />
          <TextField
            path={[...p, 'imageAlt']}
            label="Screenshot description"
            hint="Required whenever there is a screenshot: say what it actually shows."
          />

          <Row>
            <TextField path={[...p, 'demoUrl']} label="Live demo URL" />
            <TextField path={[...p, 'githubUrl']} label="Source URL" />
          </Row>

          <TextField
            path={[...p, 'metric']}
            label="Metric"
            hint="Optional. Leave empty unless you can walk someone through how you measured it."
          />

          <ToggleField path={[...p, 'featured']} label="Featured" />
        </>
      )}
    </Repeater>
  </Stack>
);

/** Studies and Career are the same shape, so they share one panel. */
const MilestonePanel: React.FC<{ path: string; addLabel: string; note: string }> = ({
  path,
  addLabel,
  note,
}) => (
  <Stack>
    <Note>{note}</Note>
    <Repeater<MilestoneItem>
      path={[path]}
      addLabel={addLabel}
      title={(item) => item.title || 'New entry'}
      blank={() => ({
        period: '',
        title: '',
        organization: '',
        description: '',
        highlights: [],
      })}
    >
      {(m) => (
        <>
          <Row>
            <TextField path={[...m, 'period']} label="Period" placeholder="2024 – Present" />
            <TextField path={[...m, 'title']} label="Title" />
          </Row>
          <TextField
            path={[...m, 'organization']}
            label="Organization"
            hint="Institution or company. Add the place after an em dash if you want it shown."
          />
          <TextAreaField path={[...m, 'description']} label="Description" rows={3} />
          <StringListField
            path={[...m, 'highlights']}
            label="Highlights"
            addLabel="Add highlight"
            hint="One concrete thing per line."
          />
        </>
      )}
    </Repeater>
  </Stack>
);

export const EducationPanel: React.FC = () => (
  <MilestonePanel
    path="education"
    addLabel="Add qualification"
    note="The Studies section. Keep it reverse-chronological — newest first."
  />
);

export const ExperiencePanel: React.FC = () => (
  <MilestonePanel
    path="experience"
    addLabel="Add role"
    note="The Career section. Keep it reverse-chronological — newest first."
  />
);

export const SkillsPanel: React.FC = () => (
  <Stack>
    <Note>
      Grouped by confidence rather than by a percentage nobody believes. You will
      be tested on whatever says Core.
    </Note>
    <Repeater<SkillCategory>
      path={['skillCategories']}
      addLabel="Add group"
      title={(item) => item.title || 'New group'}
      blank={() => ({ title: '', description: '', skills: [] })}
    >
      {(c) => (
        <>
          <TextField path={[...c, 'title']} label="Group" />
          <TextField path={[...c, 'description']} label="Description" />
          <Repeater<{ name: string; level: string }>
            path={[...c, 'skills']}
            label="Skills"
            addLabel="Add skill"
            title={(item) => item.name || 'New skill'}
            blank={() => ({ name: '', level: 'Working' })}
          >
            {(s) => (
              <Row>
                <TextField path={[...s, 'name']} label="Name" />
                <SelectField path={[...s, 'level']} label="Level" options={SKILL_LEVELS} />
              </Row>
            )}
          </Repeater>
        </>
      )}
    </Repeater>
  </Stack>
);

export const PlaygroundPanel: React.FC = () => (
  <Stack>
    <Note>
      The fake API in the Playground section. Visitors read these as claims about
      you, so keep them true. The response is raw JSON.
    </Note>
    <Repeater<ApiEndpoint>
      path={['apiEndpoints']}
      addLabel="Add endpoint"
      title={(item) => (item.path ? `${item.method} ${item.path}` : 'New endpoint')}
      blank={() => ({ method: 'GET', path: '/api/', description: '', response: {} })}
    >
      {(e, item) => (
        <>
          <Row>
            <SelectField path={[...e, 'method']} label="Method" options={['GET', 'POST']} />
            <TextField path={[...e, 'path']} label="Path" mono placeholder="/api/profile" />
          </Row>
          <TextField path={[...e, 'description']} label="Description" />
          <JsonField path={[...e, 'response']} label="Response" value={item.response} />
        </>
      )}
    </Repeater>
  </Stack>
);

/**
 * A raw JSON object, edited as text.
 *
 * The parsed value is only written back when the text actually parses, so a
 * half-typed object cannot corrupt content.json — but the text itself is kept
 * in local state meanwhile, or every keystroke that broke the JSON would be
 * thrown away and the field would fight you.
 */
const JsonField: React.FC<{
  path: (string | number)[];
  label: string;
  value: unknown;
}> = ({ path, label, value }) => {
  const [, setValue] = useField(path);
  const [draft, setDraft] = React.useState(() => ({
    value,
    text: JSON.stringify(value ?? {}, null, 2),
    error: null as string | null,
  }));
  // Rows can move, be deleted, or be replaced by a reload. Reset local text
  // before rendering a different response at this path, including invalid drafts.
  if (draft.value !== value) {
    setDraft({ value, text: JSON.stringify(value ?? {}, null, 2), error: null });
  }
  const { text, error } = draft;

  const onChange = (next: string) => {
    try {
      const parsed = JSON.parse(next);
      setDraft({ value: parsed, text: next, error: null });
      setValue(parsed);
    } catch (err) {
      setDraft({ value, text: next, error: err instanceof Error ? err.message : 'Invalid JSON' });
    }
  };

  return (
    <div>
      <Label hint="Valid JSON. Changes are only saved while this parses.">{label}</Label>
      <textarea
        rows={10}
        spellCheck={false}
        className="font-mono"
        style={{
          ...inputStyle,
          resize: 'vertical',
          lineHeight: 1.6,
          fontSize: 'var(--step--2)',
          borderColor: error ? 'var(--border-accent)' : 'var(--border)',
        }}
        value={text}
        onChange={(ev) => onChange(ev.target.value)}
      />
      {error && (
        <p className="mt-1.5" style={{ fontSize: 'var(--step--2)', color: 'var(--accent-text)' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export const MetaPanel: React.FC = () => (
  <Stack>
    <Note>
      What search engines and link previews show. None of this appears on the
      page itself.
    </Note>
    <TextField
      path={['meta', 'title']}
      label="Page title"
      hint="The browser tab, and the headline in search results."
    />
    <TextAreaField
      path={['meta', 'description']}
      label="Description"
      rows={3}
      hint="The grey text under the title in search results. Aim for 150–160 characters."
    />
    <TextField
      path={['meta', 'siteUrl']}
      label="Site URL"
      placeholder="https://you.github.io/portfolio/"
      hint="Needed to turn a share image path into the absolute URL previews require."
    />
    <TextField
      path={['meta', 'ogTitle']}
      label="Share title"
      hint="Used when the link is pasted into a chat. Falls back to the page title."
    />
    <TextAreaField path={['meta', 'ogDescription']} label="Share description" rows={2} />
    <MediaField
      path={['meta', 'ogImage']}
      label="Share image"
      accept="image/*"
      preview
      hint="1200×630 gives the large preview card. Without one, previews stay small."
    />
  </Stack>
);
