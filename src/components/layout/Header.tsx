import React, { useEffect, useState } from 'react';
import { Menu, X, Sun, Moon, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { NAV_SECTIONS, PORTFOLIO_DATA } from '../../data/portfolioData';
import { useScrollSpy } from '../../hooks/useScrollSpy';
import type { ThemeMode } from '../../hooks/useTheme';

interface HeaderProps {
  motionEnabled: boolean;
  onToggleMotion: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const SECTION_IDS = NAV_SECTIONS.map((s) => s.id);

export const Header: React.FC<HeaderProps> = ({
  motionEnabled, onToggleMotion,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
}) => {
  const activeId = useScrollSpy(SECTION_IDS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on Escape, and lock scroll while it is open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const initials = PORTFOLIO_DATA.profile.name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  return (
    <header
      className="sticky top-0 z-50 transition-colors duration-300"
      style={{
        backgroundColor: scrolled ? 'color-mix(in srgb, var(--bg) 82%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      }}
    >
      <div className="mx-auto w-full max-w-[76rem] px-[var(--gutter)]">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Identity */}
          <a
            href="#top"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label={`${PORTFOLIO_DATA.profile.name} — back to top`}
          >
            <span
              className="grid place-items-center w-8 h-8 rounded-lg font-mono font-semibold shrink-0"
              style={{
                backgroundColor: 'var(--bg-elev-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 'var(--step--2)',
              }}
            >
              {initials || '—'}
            </span>
            <span
              className="hidden sm:block font-semibold tracking-tight"
              style={{ fontSize: 'var(--step--1)', color: 'var(--text)' }}
            >
              {PORTFOLIO_DATA.profile.name}
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden min-[1800px]:flex items-center gap-1" aria-label="Sections">
            {NAV_SECTIONS.map((section) => {
              const isActive = activeId === section.id;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className="px-3 py-1.5 rounded-lg transition-colors duration-200"
                  style={{
                    fontSize: 'var(--step--1)',
                    color: isActive ? 'var(--text)' : 'var(--text-3)',
                    backgroundColor: isActive ? 'var(--bg-elev-2)' : 'transparent',
                  }}
                >
                  {section.label}
                </a>
              );
            })}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <IconButton onClick={onToggleMotion} label={motionEnabled ? 'Reduce motion' : 'Enable motion'} active={!motionEnabled}>
              {motionEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </IconButton>
            <IconButton
              onClick={onToggleSound}
              label={soundEnabled ? 'Mute interface sounds' : 'Enable interface sounds'}
              active={soundEnabled}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </IconButton>

            <IconButton
              onClick={onToggleTheme}
              label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </IconButton>

            <a
              href="#contact"
              className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-[10px] font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: 'var(--text)',
                color: 'var(--bg)',
                fontSize: 'var(--step--1)',
              }}
            >
              Get in touch
            </a>

            <button
              type="button"
              className="min-[1800px]:hidden grid place-items-center w-9 h-9 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          className="min-[1800px]:hidden px-[var(--gutter)] pb-4 pt-1"
          aria-label="Sections"
          style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
        >
          <ul className="flex flex-col">
            {NAV_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 border-b"
                  style={{
                    borderColor: 'var(--border)',
                    color: activeId === section.id ? 'var(--text)' : 'var(--text-2)',
                    fontSize: 'var(--step-0)',
                  }}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#contact"
            onClick={() => setMenuOpen(false)}
            className="mt-4 flex items-center justify-center px-4 py-2.5 rounded-[10px] font-medium"
            style={{ backgroundColor: 'var(--text)', color: 'var(--bg)', fontSize: 'var(--step--1)' }}
          >
            Get in touch
          </a>
        </nav>
      )}
    </header>
  );
};

const IconButton: React.FC<{
  onClick: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, label, active, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    title={label}
    className="grid place-items-center w-9 h-9 rounded-lg transition-colors duration-200"
    style={{
      border: '1px solid var(--border)',
      color: active ? 'var(--accent-text)' : 'var(--text-3)',
      backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
    }}
  >
    {children}
  </button>
);
