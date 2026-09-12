import React from 'react';
import { ArrowUp } from 'lucide-react';
import { PORTFOLIO_DATA } from '../../data/portfolioData';
import { GithubIcon, LinkedinIcon } from '../ui/Icons';

export const Footer: React.FC = () => {
  const { profile } = PORTFOLIO_DATA;
  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: '1px solid var(--border)' }}>
      <div className="mx-auto w-full max-w-[76rem] px-[var(--gutter)] py-10">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p style={{ fontSize: 'var(--step-0)', color: 'var(--text)' }}>{profile.name}</p>
            <p className="label mt-1">
              © {year} · Built with React, Three.js &amp; Tailwind
            </p>
          </div>

          <div className="flex items-center gap-2">
            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="grid place-items-center w-9 h-9 rounded-lg transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
              >
                <GithubIcon className="w-4 h-4" />
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="grid place-items-center w-9 h-9 rounded-lg transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
              >
                <LinkedinIcon className="w-4 h-4" />
              </a>
            )}
            <a
              href="#top"
              aria-label="Back to top"
              className="grid place-items-center w-9 h-9 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
            >
              <ArrowUp className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
