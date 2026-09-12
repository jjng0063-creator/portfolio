import { useCallback, useMemo, useState } from 'react';
import { IS_PLACEHOLDER, NAV_SECTIONS, PORTFOLIO_DATA, drawerFiles, itemId, type ProjectCategory } from './data/portfolioData';
import { useTheme } from './hooks/useTheme';
import { useSoundEffects } from './hooks/useSoundEffects';
import { useSectionBands } from './hooks/useSectionBands';
import { CabinetStage } from './components/cabinet/CabinetStage';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PlaceholderBanner } from './components/layout/PlaceholderBanner';
import { Hero } from './components/hero/Hero';
import { About } from './components/sections/About';
import { Timeline } from './components/sections/Timeline';
import { Projects } from './components/sections/Projects';
import { Skills } from './components/sections/Skills';
import { Playground } from './components/sections/Playground';
import { Contact } from './components/sections/Contact';
import { flushSync } from 'react-dom';
import { MotionContext, useMotion } from './hooks/useMotion';
import { MobileShortcuts } from './components/layout/MobileShortcuts';

const SECTION_IDS = NAV_SECTIONS.map((s) => s.id);

export function App() {
  const motion = useMotion();
  const [projectFilter, setProjectFilter] = useState<'All' | ProjectCategory>('All');
  const { theme, toggleTheme } = useTheme();
  const { soundEnabled, toggleSound, playPop, playSuccess } = useSoundEffects();

  // Section positions are measured once and cached, so the render loop can find
  // the focused section from scrollY alone without forcing layout every frame.
  const bands = useSectionBands(SECTION_IDS);

  // One drawer per section, numbered to match the section eyebrows, each filed
  // with one folder per real item in that section.
  const drawers = useMemo(
    () =>
      NAV_SECTIONS.map((section, i) => ({
        id: section.id,
        index: String(i + 1).padStart(2, '0'),
        label: section.label,
        files: drawerFiles(section.id).filter((file) =>
          section.id !== 'projects' || projectFilter === 'All' ||
          PORTFOLIO_DATA.projects.some((project) =>
            itemId.project(project.id) === file.targetId && project.category === projectFilter
          )
        ),
      })),
    [projectFilter]
  );

  // Sound is attached only to deliberate actions — a click, a copy, a run.
  const tick = useCallback(() => playPop(), [playPop]);
  const confirm = useCallback(() => playSuccess(), [playSuccess]);

  return (
    <MotionContext.Provider value={motion.enabled}>
      {/* The cabinet: fixed behind the page, drawers driven by scroll position */}
      <CabinetStage bands={bands} drawers={drawers} theme={theme} motionEnabled={motion.enabled} />

      <div className="page">
        <a
          href="#about"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg"
          style={{ backgroundColor: 'var(--text)', color: 'var(--bg)' }}
        >
          Skip to content
        </a>

        {IS_PLACEHOLDER && <PlaceholderBanner />}

        <Header
          motionEnabled={motion.enabled}
          onToggleMotion={motion.toggle}
          theme={theme}
          onToggleTheme={toggleTheme}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        {/* Section order and names carried over from the previous portfolio.
            NAV_SECTIONS must list these in the same order — it drives the nav,
            the drawer numbering and the eyebrow number on each section. */}
        <main>
          <Hero onSound={confirm} />
          <About />
          <Timeline
            id="studies"
            label="Studies"
            title="Education."
            lead="Where I studied and what I focused on."
            items={PORTFOLIO_DATA.education}
          />
          <Timeline
            id="career"
            label="Career"
            title="Where I've worked."
            lead="Roles, what I was responsible for, and what came out of it."
            items={PORTFOLIO_DATA.experience}
          />
          <Projects onSound={tick} filter={projectFilter} onFilterChange={setProjectFilter} />
          <Skills onRevealProject={() => flushSync(() => setProjectFilter('All'))} />
          <Playground onSound={tick} />
          <Contact onSound={confirm} />
        </main>

        <Footer />
        <MobileShortcuts />
      </div>
    </MotionContext.Provider>
  );
}

export default App;
