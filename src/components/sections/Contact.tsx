import React, { useState } from 'react';
import { Check, Copy, Mail, Send } from 'lucide-react';
import { PORTFOLIO_DATA, itemId } from '../../data/portfolioData';
import { Section } from '../ui/Section';
import { Button } from '../ui/Button';
import { Emerge } from '../ui/Emerge';
import { GithubIcon, LinkedinIcon } from '../ui/Icons';

type SendState = 'idle' | 'sending' | 'sent' | 'error';

export const Contact: React.FC = () => {
  const { profile } = PORTFOLIO_DATA;
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<SendState>('idle');
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const endpoint = profile.contactFormEndpoint;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // No endpoint configured: hand the message to the visitor's mail client
    // rather than pretending to deliver it.
    if (!endpoint) {
      const subject = encodeURIComponent(`Portfolio enquiry from ${form.name || 'someone'}`);
      const body = encodeURIComponent(`${form.message}\n\n— ${form.name}\n${form.email}`);
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      return;
    }

    setState('sending');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('sent');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setState('error');
    }
  };

  const field: React.CSSProperties = {
    backgroundColor: 'var(--bg-sunken)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: 'var(--step-0)',
    borderRadius: '10px',
    padding: '0.7rem 0.85rem',
    width: '100%',
  };

  return (
    <Section
      id="contact"
      label="Contact"
      title="Let's talk."
      lead="The quickest way to reach me is email. I read everything."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Direct routes */}
        <Emerge index={0}>
        <div className="surface p-6 flex flex-col gap-5 h-fit">
          <div id={itemId.contact('email')}>
            <h3 className="label mb-2.5">Email</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`mailto:${profile.email}`}
                className="font-mono break-all hover:underline"
                style={{ fontSize: 'var(--step-0)', color: 'var(--text)' }}
              >
                {profile.email}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                aria-label="Copy email address"
                className="grid place-items-center w-8 h-8 rounded-lg shrink-0 transition-colors"
                style={{
                  border: '1px solid var(--border)',
                  color: copied ? 'var(--live)' : 'var(--text-3)',
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {profile.whatsapp && (
            <div>
              <h3 className="label mb-2.5">WhatsApp</h3>
              <a
                href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono hover:underline"
                style={{ fontSize: 'var(--step-0)', color: 'var(--text)' }}
              >
                {profile.whatsapp}
              </a>
            </div>
          )}

          {(profile.github || profile.linkedin) && (
            <div id={itemId.contact('links')}>
              <h3 className="label mb-2.5">Elsewhere</h3>
              <div className="flex flex-wrap gap-2">
                {profile.github && (
                  <Button as="a" href={profile.github} variant="secondary" external>
                    <GithubIcon className="w-3.5 h-3.5" />
                    GitHub
                  </Button>
                )}
                {profile.linkedin && (
                  <Button as="a" href={profile.linkedin} variant="secondary" external>
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    LinkedIn
                  </Button>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="label mb-2.5">Based in</h3>
            <p style={{ fontSize: 'var(--step-0)', color: 'var(--text-2)' }}>{profile.location}</p>
          </div>
        </div>
        </Emerge>

        {/* Message */}
        <Emerge index={1}>
        <form
          id={itemId.contact('form')}
          onSubmit={handleSubmit}
          className="surface p-6 flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="label">Name</span>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={field}
                placeholder="Your name"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="label">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={field}
                placeholder="you@company.com"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="label">Message</span>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              style={{ ...field, resize: 'vertical' }}
              placeholder="What's on your mind?"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={state === 'sending'}>
              {endpoint ? (
                <>
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  {state === 'sending' ? 'Sending…' : 'Send message'}
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  Compose email
                </>
              )}
            </Button>

            <p aria-live="polite" style={{ fontSize: 'var(--step--1)', color: 'var(--text-3)' }}>
              {state === 'sent' && (
                <span style={{ color: 'var(--live)' }}>Thanks — I'll get back to you.</span>
              )}
              {state === 'error' && (
                <span style={{ color: 'var(--accent-text)' }}>
                  That didn't send. Email me directly instead.
                </span>
              )}
              {state === 'idle' && !endpoint && 'Opens in your mail app.'}
            </p>
          </div>
        </form>
        </Emerge>
      </div>
    </Section>
  );
};
