import { PORTFOLIO_DATA } from '../../data/portfolioData';

export function MobileShortcuts() {
  return <nav className="mobile-shortcuts" aria-label="Quick links">
    <a href="#projects">Projects</a>
    {PORTFOLIO_DATA.profile.resumeUrl && <a href={PORTFOLIO_DATA.profile.resumeUrl} target="_blank" rel="noopener noreferrer">Résumé ↗</a>}
    <a href="#contact">Contact</a>
  </nav>;
}
